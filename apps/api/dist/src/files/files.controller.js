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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FilesController = void 0;
const common_1 = require("@nestjs/common");
const files_service_1 = require("./files.service");
let FilesController = class FilesController {
    filesService;
    constructor(filesService) {
        this.filesService = filesService;
    }
    getEmailFromHeader(emailHeader) {
        if (!emailHeader || !emailHeader.trim()) {
            throw new common_1.BadRequestException('Missing required x-user-email header');
        }
        return emailHeader.trim().toLowerCase();
    }
    async getUploadUrl(emailHeader, body) {
        const email = this.getEmailFromHeader(emailHeader);
        const user = await this.filesService.getOrCreateUserByEmail(email);
        if (!body.filename) {
            throw new common_1.BadRequestException('filename is required');
        }
        return this.filesService.getUploadUrl({
            ownerId: user.id,
            filename: body.filename,
            mimeType: body.mimeType || 'application/octet-stream',
            sizeBytes: body.sizeBytes || 0,
            ivHex: body.ivHex || '000000000000000000000000',
            authTagHex: body.authTagHex || '00000000000000000000000000000000',
            ciphertextSha256: body.ciphertextSha256 || '0000000000000000000000000000000000000000000000000000000000000000',
        });
    }
    async confirmUpload(fileId, emailHeader) {
        let ownerId;
        if (emailHeader) {
            const user = await this.filesService.getOrCreateUserByEmail(this.getEmailFromHeader(emailHeader));
            ownerId = user.id;
        }
        return this.filesService.confirmUpload(fileId, ownerId);
    }
    async listFiles(emailHeader) {
        const email = this.getEmailFromHeader(emailHeader);
        const user = await this.filesService.getOrCreateUserByEmail(email);
        return this.filesService.listFiles(user.id);
    }
    async getDownloadUrl(fileId, emailHeader) {
        const email = this.getEmailFromHeader(emailHeader);
        const user = await this.filesService.getOrCreateUserByEmail(email);
        return this.filesService.getDownloadUrl(fileId, user.id);
    }
    async deleteFile(fileId, emailHeader) {
        const email = this.getEmailFromHeader(emailHeader);
        const user = await this.filesService.getOrCreateUserByEmail(email);
        return this.filesService.deleteFile(fileId, user.id);
    }
};
exports.FilesController = FilesController;
__decorate([
    (0, common_1.Post)('upload-url'),
    __param(0, (0, common_1.Headers)('x-user-email')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getUploadUrl", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('x-user-email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "confirmUpload", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Headers)('x-user-email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "listFiles", null);
__decorate([
    (0, common_1.Get)(':id/download-url'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('x-user-email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "getDownloadUrl", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Headers)('x-user-email')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", Promise)
], FilesController.prototype, "deleteFile", null);
exports.FilesController = FilesController = __decorate([
    (0, common_1.Controller)('files'),
    __metadata("design:paramtypes", [files_service_1.FilesService])
], FilesController);
//# sourceMappingURL=files.controller.js.map