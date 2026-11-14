import { FilesService } from './files.service';
interface UploadUrlDto {
    filename: string;
    mimeType?: string;
    sizeBytes?: number;
    ivHex?: string;
    authTagHex?: string;
    ciphertextSha256?: string;
}
export declare class FilesController {
    private readonly filesService;
    constructor(filesService: FilesService);
    private getEmailFromHeader;
    getUploadUrl(emailHeader: string, body: UploadUrlDto): Promise<{
        fileId: any;
        uploadUrl: string;
        uploadUrlEncrypted: string | undefined;
        s3KeyStego: string;
        s3KeyEncrypted: string;
    }>;
    confirmUpload(fileId: string, emailHeader?: string): Promise<{
        id: string;
        status: import("@prisma/client").$Enums.FileStatus;
        originalFilename: string;
    }>;
    listFiles(emailHeader: string): Promise<{
        id: any;
        originalFilename: any;
        mimeType: any;
        sizeBytes: number;
        createdAt: any;
    }[]>;
    getDownloadUrl(fileId: string, emailHeader: string): Promise<{
        downloadUrl: string;
        filename: string;
        mimeType: string;
        iv: string;
        authTag: string;
        ciphertextSha256: string;
    }>;
    deleteFile(fileId: string, emailHeader: string): Promise<{
        success: boolean;
        message: string;
    }>;
    cleanResetVault(emailHeader: string): Promise<{
        success: boolean;
        message: string;
    }>;
}
export {};
