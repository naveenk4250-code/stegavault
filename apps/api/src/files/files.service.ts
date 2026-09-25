import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { PrismaService } from '../prisma/prisma.service';
import { randomUUID } from 'crypto';

@Injectable()
export class FilesService implements OnModuleInit {
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

  async onModuleInit() {
    // Purge legacy development/test objects from S3 bucket on initialization
    const legacyKeys = [
      '41092bc6-e077-4596-a338-fed2e05e7f70/3ff0eaae-9922-4591-836b-d80866e102b3.png',
      '41092bc6-e077-4596-a338-fed2e05e7f70/11cb9f8d-3f17-4cbd-81c2-63dd139c67e6.png',
    ];
    for (const key of legacyKeys) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.stegoBucket,
            Key: key,
          }),
        );
        this.logger.log(`Purged legacy test S3 object: ${key}`);
      } catch (err: any) {
        this.logger.debug(`Legacy S3 cleanup notice: ${err?.message}`);
      }
    }
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

    // Step 1: Generate presigned S3 PUT URL
    let uploadUrl: string;
    try {
      const putCommand = new PutObjectCommand({
        Bucket: this.stegoBucket,
        Key: s3KeyStego,
        ContentType: 'image/png',
      });
      uploadUrl = await getSignedUrl(this.s3Client, putCommand, {
        expiresIn: this.uploadTtl,
      });
      this.logger.log(`S3 presign OK — bucket="${this.stegoBucket}" key="${s3KeyStego}"`);
    } catch (s3Err: any) {
      this.logger.error('S3 presign FAILED', {
        name: s3Err?.name,
        message: s3Err?.message,
        code: s3Err?.Code || s3Err?.code,
        bucket: this.stegoBucket,
        region: this.config.get<string>('AWS_REGION', 'us-east-1'),
        hasAccessKey: !!this.config.get<string>('AWS_ACCESS_KEY_ID'),
        hasSecretKey: !!this.config.get<string>('AWS_SECRET_ACCESS_KEY'),
      });
      throw new Error(`S3 presign failed: ${s3Err?.message || 'Unknown S3 error'}`);
    }

    // Step 2: Create File row in Postgres with status: 'pending'
    let fileRecord: any;
    try {
      fileRecord = await this.prisma.file.create({
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
    } catch (dbErr: any) {
      this.logger.error('DB file.create FAILED', {
        name: dbErr?.name,
        message: dbErr?.message,
        code: dbErr?.code,
        ownerId,
        filename,
      });
      throw new Error(`DB write failed: ${dbErr?.message || 'Unknown DB error'}`);
    }

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

    return files.map((f: any) => ({
      id: f.id,
      originalFilename: f.originalFilename,
      mimeType: f.mimeType,
      sizeBytes: Number(f.sizeBytes),
      createdAt: f.createdAt.toISOString(),
    }));
  }

  /**
   * Verifies ownership, removes object from S3, and deletes the record from database.
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

    // Delete S3 object from S3 bucket
    if (file.s3KeyStego) {
      try {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: this.stegoBucket,
            Key: file.s3KeyStego,
          }),
        );
        this.logger.log(`Deleted S3 object ${file.s3KeyStego}`);
      } catch (s3Err: any) {
        this.logger.warn(`Could not delete S3 object ${file.s3KeyStego}: ${s3Err?.message}`);
      }
    }

    await this.prisma.file.delete({
      where: { id: fileId },
    });

    return { success: true, message: `File ${fileId} deleted from vault and S3` };
  }

  /**
   * Clean reset: Deletes all files and S3 objects for a user to start fresh.
   */
  async cleanResetUserVault(ownerId: string) {
    const userFiles = await this.prisma.file.findMany({
      where: { ownerId },
    });
    for (const f of userFiles) {
      if (f.s3KeyStego) {
        try {
          await this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: this.stegoBucket,
              Key: f.s3KeyStego,
            }),
          );
        } catch {}
      }
    }
    await this.prisma.share.deleteMany({ where: { ownerId } });
    await this.prisma.file.deleteMany({ where: { ownerId } });
    return { success: true, message: 'Vault cleaned and reset to clean production state' };
  }
}
