import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  Body,
  Headers,
  BadRequestException,
} from '@nestjs/common';
import { FilesService } from './files.service';

interface UploadUrlDto {
  filename: string;
  mimeType?: string;
  sizeBytes?: number;
  ivHex?: string;
  authTagHex?: string;
  ciphertextSha256?: string;
}

@Controller('files')
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  private getEmailFromHeader(emailHeader?: string): string {
    if (!emailHeader || !emailHeader.trim()) {
      throw new BadRequestException('Missing required x-user-email header');
    }
    return emailHeader.trim().toLowerCase();
  }

  /**
   * POST /files/upload-url
   * Generates a presigned S3 PUT URL and creates a pending File database record.
   */
  @Post('upload-url')
  async getUploadUrl(
    @Headers('x-user-email') emailHeader: string,
    @Body() body: UploadUrlDto,
  ) {
    const email = this.getEmailFromHeader(emailHeader);
    const user = await this.filesService.getOrCreateUserByEmail(email);

    if (!body.filename) {
      throw new BadRequestException('filename is required');
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

  /**
   * POST /files/:id/confirm
   * Marks upload complete once browser finishes S3 PUT.
   */
  @Post(':id/confirm')
  async confirmUpload(
    @Param('id') fileId: string,
    @Headers('x-user-email') emailHeader?: string,
  ) {
    let ownerId: string | undefined;
    if (emailHeader) {
      const user = await this.filesService.getOrCreateUserByEmail(
        this.getEmailFromHeader(emailHeader),
      );
      ownerId = user.id;
    }

    return this.filesService.confirmUpload(fileId, ownerId);
  }

  /**
   * GET /files
   * Lists the current user's active, non-deleted files.
   */
  @Get()
  async listFiles(@Headers('x-user-email') emailHeader: string) {
    const email = this.getEmailFromHeader(emailHeader);
    const user = await this.filesService.getOrCreateUserByEmail(email);
    return this.filesService.listFiles(user.id);
  }

  /**
   * GET /files/:id/download-url
   * Returns a presigned S3 GET URL for the owner to download their stego container.
   */
  @Get(':id/download-url')
  async getDownloadUrl(
    @Param('id') fileId: string,
    @Headers('x-user-email') emailHeader: string,
  ) {
    const email = this.getEmailFromHeader(emailHeader);
    const user = await this.filesService.getOrCreateUserByEmail(email);
    return this.filesService.getDownloadUrl(fileId, user.id);
  }

  /**
   * DELETE /files/:id
   * Soft-deletes a file owned by the user.
   */
  @Delete(':id')
  async deleteFile(
    @Param('id') fileId: string,
    @Headers('x-user-email') emailHeader: string,
  ) {
    const email = this.getEmailFromHeader(emailHeader);
    const user = await this.filesService.getOrCreateUserByEmail(email);
    return this.filesService.deleteFile(fileId, user.id);
  }
}
