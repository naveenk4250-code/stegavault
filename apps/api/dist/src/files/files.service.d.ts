import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
export declare class FilesService {
    private readonly prisma;
    private readonly config;
    private readonly logger;
    private readonly s3Client;
    private readonly stegoBucket;
    private readonly encryptedBucket;
    private readonly uploadTtl;
    private readonly downloadTtl;
    constructor(prisma: PrismaService, config: ConfigService);
    getOrCreateUserByEmail(email: string): Promise<{
        email: string;
        id: string;
        passwordHash: string | null;
        displayName: string;
        avatarUrl: string | null;
        role: import("@prisma/client").$Enums.Role;
        emailVerifiedAt: Date | null;
        graphicalPasswordHash: string | null;
        mfaTotpSecret: string | null;
        mfaEnabled: boolean;
        storageQuotaBytes: bigint;
        storageUsedBytes: bigint;
        failedLoginCount: number;
        lockedUntil: Date | null;
        createdAt: Date;
        updatedAt: Date;
    }>;
    getUploadUrl(params: {
        ownerId: string;
        filename: string;
        mimeType: string;
        sizeBytes?: number;
        ivHex: string;
        authTagHex: string;
        ciphertextSha256: string;
    }): Promise<{
        fileId: string;
        uploadUrl: string;
        s3KeyStego: string;
    }>;
    confirmUpload(fileId: string, ownerId?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.FileStatus;
        originalFilename: string;
    }>;
    getDownloadUrl(fileId: string, ownerId: string): Promise<{
        downloadUrl: string;
        filename: string;
        mimeType: string;
        iv: string;
        authTag: string;
        ciphertextSha256: string;
    }>;
    listFiles(ownerId: string): Promise<{
        id: any;
        originalFilename: any;
        mimeType: any;
        sizeBytes: number;
        createdAt: any;
    }[]>;
    deleteFile(fileId: string, ownerId: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
