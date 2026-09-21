"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var FilesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const prisma_service_1 = require("../prisma/prisma.service");
const crypto_1 = require("crypto");
let FilesService = FilesService_1 = class FilesService {
    prisma;
    config;
    logger = new common_1.Logger(FilesService_1.name);
    s3Client;
    stegoBucket;
    encryptedBucket;
    uploadTtl;
    downloadTtl;
    constructor(prisma, config) {
        this.prisma = prisma;
        this.config = config;
        const region = this.config.get('AWS_REGION', 'us-east-1');
        const accessKeyId = this.config.get('AWS_ACCESS_KEY_ID') ||
            process.env.AWS_ACCESS_KEY_ID ||
            'dev-access-key';
        const secretAccessKey = this.config.get('AWS_SECRET_ACCESS_KEY') ||
            process.env.AWS_SECRET_ACCESS_KEY ||
            'dev-secret-key';
        this.s3Client = new client_s3_1.S3Client({
            region,
            credentials: {
                accessKeyId,
                secretAccessKey,
            },
        });
        this.stegoBucket = this.config.get('S3_BUCKET_STEGO', 'stegavault-stego-keys-dev');
        this.encryptedBucket = this.config.get('S3_BUCKET_ENCRYPTED', 'stegavault-encrypted-files-dev');
        this.uploadTtl = Number(this.config.get('S3_PRESIGN_UPLOAD_TTL', 300));
        this.downloadTtl = Number(this.config.get('S3_PRESIGN_DOWNLOAD_TTL', 120));
    }
    async getOrCreateUserByEmail(email) {
        const cleanEmail = email.toLowerCase().trim();
        if (!cleanEmail) {
            throw new common_1.BadRequestException('User email header is required');
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
    async getUploadUrl(params) {
        const { ownerId, filename, mimeType, sizeBytes = 0, ivHex, authTagHex, ciphertextSha256, } = params;
        const fileUuid = (0, crypto_1.randomUUID)();
        const s3KeyStego = `${ownerId}/${fileUuid}.png`;
        const s3KeyEncrypted = `${ownerId}/${fileUuid}.enc`;
        const putCommand = new client_s3_1.PutObjectCommand({
            Bucket: this.stegoBucket,
            Key: s3KeyStego,
            ContentType: 'image/png',
        });
        const uploadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, putCommand, {
            expiresIn: this.uploadTtl,
        });
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
    async confirmUpload(fileId, ownerId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file) {
            throw new common_1.NotFoundException(`File ${fileId} not found`);
        }
        if (ownerId && file.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not own this file');
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
    async getDownloadUrl(fileId, ownerId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file || file.isDeleted) {
            throw new common_1.NotFoundException(`File ${fileId} not found`);
        }
        if (file.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not have permission to download this file');
        }
        const getCommand = new client_s3_1.GetObjectCommand({
            Bucket: this.stegoBucket,
            Key: file.s3KeyStego,
        });
        const downloadUrl = await (0, s3_request_presigner_1.getSignedUrl)(this.s3Client, getCommand, {
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
    async listFiles(ownerId) {
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
    async deleteFile(fileId, ownerId) {
        const file = await this.prisma.file.findUnique({
            where: { id: fileId },
        });
        if (!file || file.isDeleted) {
            throw new common_1.NotFoundException(`File ${fileId} not found`);
        }
        if (file.ownerId !== ownerId) {
            throw new common_1.ForbiddenException('You do not have permission to delete this file');
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
};
exports.FilesService = FilesService;
exports.FilesService = FilesService = FilesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        config_1.ConfigService])
], FilesService);
//# sourceMappingURL=files.service.js.map