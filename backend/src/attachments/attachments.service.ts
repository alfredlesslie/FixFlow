import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { S3StorageAdapter } from './storage/s3-storage.adapter';
import { validateImageBuffer } from './image-validator.helper';
import { randomUUID } from 'crypto';
import { Role } from '../common/enums';
import { User } from '../users/models/user.model';
import { Readable } from 'stream';

export interface AttachmentResponse {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  mimeType?: string | null;
  requestId?: string | null;
  workOrderId?: string | null;
  uploaderId: string;
  createdAt: Date;
}

export interface UploadedFilePayload {
  fieldname?: string;
  originalname: string;
  encoding?: string;
  mimetype?: string;
  size: number;
  buffer: Buffer;
  [key: string]: any;
}

@Injectable()
export class AttachmentsService {
  private readonly logger = new Logger(AttachmentsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly auditService: AuditService,
    private readonly storageAdapter: S3StorageAdapter,
  ) {}

  /**
   * Validates, stores, and registers a new real image attachment.
   */
  async uploadAttachment(
    file: UploadedFilePayload,
    uploader: User,
    requestId?: string,
    workOrderId?: string,
  ): Promise<AttachmentResponse> {
    if (!file || !file.buffer) {
      throw new BadRequestException('No file payload was provided in upload request.');
    }

    // 1. Validate real image content via magic bytes & inspect dimensions
    const validation = validateImageBuffer(file.buffer, file.originalname);

    // 2. Validate associations if provided
    if (requestId) {
      const request = await this.prisma.maintenanceRequest.findUnique({ where: { id: requestId } });
      if (!request) {
        throw new NotFoundException(`Maintenance request with ID "${requestId}" does not exist.`);
      }
    }

    if (workOrderId) {
      const workOrder = await this.prisma.workOrder.findUnique({ where: { id: workOrderId } });
      if (!workOrder) {
        throw new NotFoundException(`Work order with ID "${workOrderId}" does not exist.`);
      }
    }

    // 3. Generate safe server-side storage filename
    const storageKey = `${randomUUID()}${validation.extension}`;

    // 4. Persist to storage adapter
    await this.storageAdapter.save(storageKey, file.buffer, validation.mimeType);

    // 5. Persist record in PostgreSQL with orphaned-file rollback protection
    try {
      const attachment = await this.prisma.attachment.create({
        data: {
          uploaderId: uploader.id,
          fileName: file.originalname.slice(0, 255),
          fileUrl: `/api/attachments/${storageKey}`,
          fileType: validation.extension.replace('.', ''),
          fileSize: file.size,
          storageKey,
          mimeType: validation.mimeType,
          requestId: requestId || null,
          workOrderId: workOrderId || null,
        },
      });

      // Update fileUrl with canonical attachment ID route
      const canonicalUrl = `/api/attachments/${attachment.id}`;
      const updated = await this.prisma.attachment.update({
        where: { id: attachment.id },
        data: { fileUrl: canonicalUrl },
      });

      // 6. Institutional audit logging
      await this.auditService.logAction(
        uploader.id,
        'ATTACHMENT_UPLOADED',
        'ATTACHMENT',
        attachment.id,
        {
          fileName: file.originalname,
          fileSize: file.size,
          mimeType: validation.mimeType,
          requestId,
          workOrderId,
        },
      );

      return updated as AttachmentResponse;
    } catch (err: any) {
      // Safe orphaned-file cleanup if database transaction fails
      this.logger.error(`Database record creation failed for ${storageKey}. Cleaning up file from storage.`, err.stack);
      await this.storageAdapter.delete(storageKey).catch((cleanupErr) => {
        this.logger.error(`Failed to delete orphaned file ${storageKey}`, cleanupErr);
      });
      throw err;
    }
  }

  /**
   * Retrieves an attachment read stream after verifying authorization.
   */
  async getAttachmentStream(
    id: string,
    currentUser: User,
  ): Promise<{ stream: Readable; attachment: any; mimeType: string; fileName: string }> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
      include: {
        request: true,
        workOrder: true,
      },
    });

    if (!attachment) {
      throw new NotFoundException(`Attachment with ID "${id}" not found.`);
    }

    // Authorization check: Staff, Admins, or uploader can view;
    // Requesters can view attachments on their own requests or general requests
    if (
      currentUser.role !== Role.ADMIN &&
      currentUser.role !== Role.FACILITY_MANAGER &&
      currentUser.role !== Role.TECHNICIAN &&
      attachment.uploaderId !== currentUser.id &&
      attachment.request?.requesterId !== currentUser.id
    ) {
      // Allow requester visibility on open community requests unless marked internal
      if (attachment.workOrderId && !attachment.requestId) {
        throw new ForbiddenException('You are not authorized to view this work order attachment.');
      }
    }

    const storageKey = attachment.storageKey || attachment.fileName;
    const stream = await this.storageAdapter.getStream(storageKey);
    const mimeType = attachment.mimeType || 'application/octet-stream';

    return {
      stream,
      attachment,
      mimeType,
      fileName: attachment.fileName,
    };
  }

  /**
   * Deletes an attachment and safely purges storage.
   */
  async deleteAttachment(id: string, currentUser: User): Promise<void> {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) {
      throw new NotFoundException(`Attachment with ID "${id}" not found.`);
    }

    if (
      currentUser.role !== Role.ADMIN &&
      currentUser.role !== Role.FACILITY_MANAGER &&
      attachment.uploaderId !== currentUser.id
    ) {
      throw new ForbiddenException('You are not authorized to delete this attachment.');
    }

    if (attachment.storageKey) {
      await this.storageAdapter.delete(attachment.storageKey);
    }

    await this.prisma.attachment.delete({ where: { id } });

    await this.auditService.logAction(
      currentUser.id,
      'ATTACHMENT_DELETED',
      'ATTACHMENT',
      id,
      { fileName: attachment.fileName },
    );
  }
}
