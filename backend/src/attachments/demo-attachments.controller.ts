import {
  Controller,
  Get,
  Param,
  Res,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';
import { join, basename, extname } from 'path';
import { existsSync, createReadStream } from 'fs';

const ALLOWED_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg', '.svg', '.webp']);
const MIME_TYPES: Record<string, string> = {
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.webp': 'image/webp',
};

/**
 * Controller to serve local static demo attachments in development/testing.
 * Isolated from future production cloud/object storage.
 */
@Controller('attachments')
export class DemoAttachmentsController {
  private readonly demoAssetsDir = join(process.cwd(), 'assets', 'demo-attachments');

  @Get('demo/:filename')
  serveDemoAttachment(@Param('filename') filename: string, @Res() res: Response): void {
    // Prevent directory traversal
    const safeName = basename(filename);
    if (!safeName || safeName !== filename || safeName.includes('..')) {
      throw new BadRequestException('Invalid attachment filename');
    }

    const ext = extname(safeName).toLowerCase();
    if (!ALLOWED_EXTENSIONS.has(ext)) {
      throw new BadRequestException('Unsupported attachment format');
    }

    const filePath = join(this.demoAssetsDir, safeName);
    if (!existsSync(filePath)) {
      throw new NotFoundException(`Demo attachment ${safeName} not found`);
    }

    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.setHeader('Content-Type', contentType);
    res.setHeader('Cache-Control', 'public, max-age=3600');
    createReadStream(filePath).pipe(res);
  }
}
