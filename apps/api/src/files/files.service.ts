import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService {
  private readonly logger = new Logger(FilesService.name);
  private readonly s3Client: S3Client;
  private readonly stegoBucket: string;
  private readonly encryptedBucket: string;
  private readonly uploadTtl: number;
  private readonly downloadTtl: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {
    const region = this.config.get<string>('AWS_REGION', 'us-east-1');
    const accessKeyId =
      this.config.get<string>('AWS_ACCESS_KEY_ID') ||
      process.env.AWS_ACCESS_KEY_ID ||
      'dev-access-key';
    const secretAccessKey =
      this.config.get<string>('AWS_SECRET_ACCESS_KEY') ||
      process.env.AWS_SECRET_ACCESS_KEY ||
      'dev-secret-key';

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.stegoBucket = this.config.get<string>(
      'S3_BUCKET_STEGO',
      'stegavault-stego-keys-dev',
    );
    this.encryptedBucket = this.config.get<string>(
      'S3_BUCKET_ENCRYPTED',
      'stegavault-encrypted-files-dev',
    );
    this.uploadTtl = Number(this.config.get<number>('S3_PRESIGN_UPLOAD_TTL', 300));
    this.downloadTtl = Number(
      this.config.get<number>('S3_PRESIGN_DOWNLOAD_TTL', 120),
    );
  }

  /**
   * Temporary auth simplification:
   * Looks up or auto-creates a minimal User by email so that the ownerId Foreign Key
   * can be satisfied. In production, this should be replaced with real backend-verified
   * JWT authentication.
   */
  async getOrCreateUserByEmail(email: string) {
    const cleanEmail = email.toLowerCase().trim();
    if (!cleanEmail) {
      throw new BadRequestException('User email header is required');
    }

    let user = await this.prisma.user.findUnique({
      where: { email: cleanEmail },
    });

    if (!user) {
      user = await this.prisma.user.create({
        data: {
          email: cleanEmail,
          displayName: cleanEmail.split('@')[0] || 'StegaVault User',
        },
      });
      this.logger.log(`Created minimal user record for ${cleanEmail} (${user.id})`);
    }

    return user;
  }

  /**
   * Generates a presigned PUT URL for the S3_BUCKET_STEGO bucket,
   * creates a pending File record in Postgres via Prisma.
   */
  async getUploadUrl(params: {
    ownerId: string;
    filename: string;
    mimeType: string;
    sizeBytes?: number;
    ivHex: string;
    authTagHex: string;
    ciphertextSha256: string;
  }) {
    const {
      ownerId,
      filename,
      mimeType,
      sizeBytes = 0,
      ivHex,
      authTagHex,
      ciphertextSha256,
    } = params;

    const fileUuid = randomUUID();
    const s3KeyStego = `${ownerId}/${fileUuid}.png`;
    const s3KeyEncrypted = `${ownerId}/${fileUuid}.enc`;

    // Presign PUT request for S3_BUCKET_STEGO
    const putCommand = new PutObjectCommand({
      Bucket: this.stegoBucket,
      Key: s3KeyStego,
      ContentType: 'image/png',
    });

    const uploadUrl = await getSignedUrl(this.s3Client, putCommand, {
      expiresIn: this.uploadTtl,
    });

    // Create File row in Postgres with status: 'pending'
    const fileRecord = await this.prisma.file.create({
      data: {
        ownerId,
        originalFilename: filename,
        mimeType: mimeType || 'application/octet-stream',
        sizeBytes: BigInt(sizeBytes),
        s3KeyEncrypted,
        s3KeyStego,
        iv: ivHex,
        authTag: authTagHex,
        ciphertextSha256,
        status: 'pending',
      },
    });

    return {
      fileId: fileRecord.id,
      uploadUrl,
      s3KeyStego,
    };
  }

  /**
   * Flips File status from 'pending' to 'active' once the frontend S3 PUT succeeds.
   */
  async confirmUpload(fileId: string, ownerId?: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    if (ownerId && file.ownerId !== ownerId) {
      throw new ForbiddenException('You do not own this file');
    }

    const updated = await this.prisma.file.update({
      where: { id: fileId },
      data: { status: 'active' },
    });

    return {
      id: updated.id,
      status: updated.status,
      originalFilename: updated.originalFilename,
    };
  }

  /**
   * Verifies ownership and returns a presigned GET URL for that file's s3KeyStego.
   */
  async getDownloadUrl(fileId: string, ownerId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.isDeleted) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    if (file.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to download this file');
    }

    const getCommand = new GetObjectCommand({
      Bucket: this.stegoBucket,
      Key: file.s3KeyStego,
    });

    const downloadUrl = await getSignedUrl(this.s3Client, getCommand, {
      expiresIn: this.downloadTtl,
    });

    return {
      downloadUrl,
      filename: file.originalFilename,
      mimeType: file.mimeType,
      iv: file.iv,
      authTag: file.authTag,
      ciphertextSha256: file.ciphertextSha256,
    };
  }

  /**
   * Returns all non-deleted, active Files for that owner
   * (id, originalFilename, mimeType, sizeBytes, createdAt only — never returns S3 keys or internal secrets).
   */
  async listFiles(ownerId: string) {
    const files = await this.prisma.file.findMany({
      where: {
        ownerId,
        isDeleted: false,
        status: 'active',
      },
      select: {
        id: true,
        originalFilename: true,
        mimeType: true,
        sizeBytes: true,
        createdAt: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return files.map((f) => ({
      id: f.id,
      originalFilename: f.originalFilename,
      mimeType: f.mimeType,
      sizeBytes: Number(f.sizeBytes),
      createdAt: f.createdAt.toISOString(),
    }));
  }

  /**
   * Verifies ownership and performs a soft-delete (isDeleted = true, deletedAt = now).
   */
  async deleteFile(fileId: string, ownerId: string) {
    const file = await this.prisma.file.findUnique({
      where: { id: fileId },
    });

    if (!file || file.isDeleted) {
      throw new NotFoundException(`File ${fileId} not found`);
    }

    if (file.ownerId !== ownerId) {
      throw new ForbiddenException('You do not have permission to delete this file');
    }

    await this.prisma.file.update({
      where: { id: fileId },
      data: {
        isDeleted: true,
        deletedAt: new Date(),
      },
    });

    return { success: true, message: `File ${fileId} soft deleted` };
  }
}
