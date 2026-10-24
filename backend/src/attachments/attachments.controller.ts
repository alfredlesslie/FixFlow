import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Body,
  UseInterceptors,
  UploadedFile,
  UseGuards,
  Req,
  Res,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { AuthGuard } from '@nestjs/passport';
import { Response } from 'express';
import { AttachmentsService } from './attachments.service';

@Controller('attachments')
export class AttachmentsController {
  constructor(private readonly attachmentsService: AttachmentsService) { }

  /**
   * Uploads and validates an image attachment.
   */
  @Post('upload')
  @UseGuards(AuthGuard('jwt'))
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB
      },
    }),
  )
  async uploadAttachment(
    @UploadedFile() file: any,
    @Req() req: any,
    @Body('requestId') requestId?: string,
    @Body('workOrderId') workOrderId?: string,
  ) {
    if (!file) {
      throw new BadRequestException('File is required in multipart/form-data upload.');
    }

    return this.attachmentsService.uploadAttachment(
      file,
      req.user,
      requestId,
      workOrderId,
    );
  }

  /**
   * Serves an authorized attachment file stream.
   */
  @Get(':id')
  @UseGuards(AuthGuard('jwt'))
  async serveAttachment(
    @Param('id') id: string,
    @Req() req: any,
    @Res() res: Response,
  ) {
    const { stream, mimeType, fileName } =
      await this.attachmentsService.getAttachmentStream(id, req.user);

    res.setHeader('Content-Type', mimeType);
    res.setHeader('Content-Disposition', `inline; filename="${encodeURIComponent(fileName)}"`);
    res.setHeader('Cache-Control', 'private, max-age=86400');
    stream.pipe(res);
  }

  /**
   * Deletes an attachment and purges local/cloud storage.
   */
  @Delete(':id')
  @UseGuards(AuthGuard('jwt'))
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteAttachment(@Param('id') id: string, @Req() req: any) {
    await this.attachmentsService.deleteAttachment(id, req.user);
  }
}
