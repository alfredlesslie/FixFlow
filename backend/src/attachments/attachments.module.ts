import { Module } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { DemoAttachmentsController } from './demo-attachments.controller';
import { AttachmentsService } from './attachments.service';
import { LocalStorageAdapter } from './storage/local-storage.adapter';
import { S3StorageAdapter } from './storage/s3-storage.adapter';
import { PrismaModule } from '../prisma/prisma.module';
import { AuditModule } from '../audit/audit.module';

@Module({
  imports: [PrismaModule, AuditModule],
  controllers: [AttachmentsController, DemoAttachmentsController],
  providers: [LocalStorageAdapter, S3StorageAdapter, AttachmentsService],
  exports: [AttachmentsService],
})
export class AttachmentsModule {}
