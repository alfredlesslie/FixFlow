import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { AttachmentsService, UploadedFilePayload } from './attachments.service';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../audit/audit.service';
import { S3StorageAdapter } from './storage/s3-storage.adapter';
import { Role, AccountStatus } from '../common/enums';
import { User } from '../users/models/user.model';
import { Readable } from 'stream';

describe('AttachmentsService (Phase 6O Real Upload Pipeline)', () => {
  let service: AttachmentsService;
  let mockPrisma: any;
  let mockAudit: any;
  let mockStorage: any;

  const mockUser: User = {
    id: 'user-uploader-1',
    email: 'uploader@fixflow.edu',
    firstName: 'Jane',
    lastName: 'Doe',
    name: 'Jane Doe',
    role: Role.REQUESTER,
    status: AccountStatus.ACTIVE,
    emailVerified: true,
    tokenVersion: 1,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  // Valid 1x1 PNG Buffer with correct magic bytes
  const validPngBuffer = Buffer.from([
    0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, // PNG magic
    0x00, 0x00, 0x00, 0x0d, 0x49, 0x48, 0x44, 0x52, // IHDR chunk length + tag
    0x00, 0x00, 0x00, 0x64, 0x00, 0x00, 0x00, 0x64, // 100x100 px
    0x08, 0x06, 0x00, 0x00, 0x00, 0x70, 0xe1, 0xf5,
  ]);

  // Valid JPEG Buffer with SOI marker
  const validJpegBuffer = Buffer.from([
    0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  ]);

  beforeEach(() => {
    mockStorage = {
      save: jest.fn().mockResolvedValue('/uploads/attachments/test-key.png'),
      getStream: jest.fn().mockResolvedValue(Readable.from(['file content'])),
      delete: jest.fn().mockResolvedValue(undefined),
      exists: jest.fn().mockResolvedValue(true),
    };

    mockPrisma = {
      attachment: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'att-uuid-1',
            ...data,
            createdAt: new Date(),
          }),
        ),
        update: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'att-uuid-1',
            ...data,
            createdAt: new Date(),
          }),
        ),
        findUnique: jest.fn().mockResolvedValue({
          id: 'att-uuid-1',
          fileName: 'damage.png',
          fileUrl: '/api/attachments/att-uuid-1',
          storageKey: 'unique-key.png',
          mimeType: 'image/png',
          fileSize: validPngBuffer.length,
          uploaderId: mockUser.id,
          requestId: 'req-1',
          request: { requesterId: mockUser.id },
        }),
        delete: jest.fn().mockResolvedValue({ id: 'att-uuid-1' }),
      },
      maintenanceRequest: {
        findUnique: jest.fn().mockResolvedValue({ id: 'req-1' }),
      },
      workOrder: {
        findUnique: jest.fn().mockResolvedValue({ id: 'wo-1' }),
      },
    };

    mockAudit = {
      logAction: jest.fn().mockResolvedValue({ id: 'aud-1' }),
    };

    service = new AttachmentsService(
      mockPrisma as PrismaService,
      mockAudit as AuditService,
      mockStorage as S3StorageAdapter,
    );
  });

  describe('Server-Side Image Upload & Validation', () => {
    it('successfully uploads valid PNG image with magic bytes and creates attachment record', async () => {
      const mockFile: UploadedFilePayload = {
        fieldname: 'file',
        originalname: 'pipe_leak.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: validPngBuffer.length,
        buffer: validPngBuffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      const result = await service.uploadAttachment(mockFile, mockUser, 'req-1');

      expect(result).toBeDefined();
      expect(result.id).toBe('att-uuid-1');
      expect(mockStorage.save).toHaveBeenCalled();
      expect(mockPrisma.attachment.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            uploaderId: mockUser.id,
            mimeType: 'image/png',
            fileType: 'png',
            requestId: 'req-1',
          }),
        }),
      );
      expect(mockAudit.logAction).toHaveBeenCalledWith(
        mockUser.id,
        'ATTACHMENT_UPLOADED',
        'ATTACHMENT',
        'att-uuid-1',
        expect.objectContaining({ fileName: 'pipe_leak.png' }),
      );
    });

    it('rejects fake image file with disguised extension but invalid magic bytes', async () => {
      const fakeFile: UploadedFilePayload = {
        fieldname: 'file',
        originalname: 'malware.png',
        encoding: '7bit',
        mimetype: 'image/png',
        size: 25,
        buffer: Buffer.from('MZ... executable content'),
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await expect(service.uploadAttachment(fakeFile, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadAttachment(fakeFile, mockUser)).rejects.toThrow(
        /Unsupported or invalid image format/,
      );
      expect(mockStorage.save).not.toHaveBeenCalled();
      expect(mockPrisma.attachment.create).not.toHaveBeenCalled();
    });

    it('rejects SVG images containing embedded scripts or dangerous event handlers', async () => {
      const dangerousSvg = Buffer.from(
        '<svg xmlns="http://www.w3.org/2000/svg"><script>alert("xss")</script><circle cx="50" cy="50" r="40"/></svg>',
      );
      const svgFile: UploadedFilePayload = {
        fieldname: 'file',
        originalname: 'exploit.svg',
        encoding: '7bit',
        mimetype: 'image/svg+xml',
        size: dangerousSvg.length,
        buffer: dangerousSvg,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await expect(service.uploadAttachment(svgFile, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadAttachment(svgFile, mockUser)).rejects.toThrow(
        /SVG contains disallowed script/,
      );
      expect(mockStorage.save).not.toHaveBeenCalled();
    });

    it('rejects oversized files exceeding 10MB limit', async () => {
      const hugeBuffer = Buffer.alloc(11 * 1024 * 1024); // 11MB
      const hugeFile: UploadedFilePayload = {
        fieldname: 'file',
        originalname: 'huge.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: hugeBuffer.length,
        buffer: hugeBuffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      await expect(service.uploadAttachment(hugeFile, mockUser)).rejects.toThrow(
        BadRequestException,
      );
      await expect(service.uploadAttachment(hugeFile, mockUser)).rejects.toThrow(
        /exceeds maximum limit of 10MB/,
      );
    });

    it('cleans up saved file from storage if database creation fails (orphaned-file handling)', async () => {
      const mockFile: UploadedFilePayload = {
        fieldname: 'file',
        originalname: 'leak.jpg',
        encoding: '7bit',
        mimetype: 'image/jpeg',
        size: validJpegBuffer.length,
        buffer: validJpegBuffer,
        destination: '',
        filename: '',
        path: '',
        stream: null as any,
      };

      mockPrisma.attachment.create.mockRejectedValueOnce(
        new Error('Database unique or connection constraint failed'),
      );

      await expect(service.uploadAttachment(mockFile, mockUser)).rejects.toThrow(
        'Database unique or connection constraint failed',
      );
      // Verify storage delete was called to remove the orphaned file
      expect(mockStorage.delete).toHaveBeenCalled();
    });
  });

  describe('Authorized File Retrieval & Deletion', () => {
    it('retrieves attachment stream for authorized user', async () => {
      const { stream, mimeType, fileName } = await service.getAttachmentStream(
        'att-uuid-1',
        mockUser,
      );

      expect(stream).toBeDefined();
      expect(mimeType).toBe('image/png');
      expect(fileName).toBe('damage.png');
      expect(mockStorage.getStream).toHaveBeenCalledWith('unique-key.png');
    });

    it('blocks unauthorized requester from viewing private work order attachments', async () => {
      mockPrisma.attachment.findUnique.mockResolvedValueOnce({
        id: 'att-private-wo',
        fileName: 'internal_schematic.png',
        fileUrl: '/api/attachments/att-private-wo',
        storageKey: 'schematic.png',
        uploaderId: 'technician-1',
        workOrderId: 'wo-1',
        requestId: null,
      });

      const otherRequester: User = { ...mockUser, id: 'intruder-student' };
      await expect(service.getAttachmentStream('att-private-wo', otherRequester)).rejects.toThrow(
        ForbiddenException,
      );
    });

    it('allows uploader or admin to delete attachment and purges storage', async () => {
      await service.deleteAttachment('att-uuid-1', mockUser);

      expect(mockStorage.delete).toHaveBeenCalledWith('unique-key.png');
      expect(mockPrisma.attachment.delete).toHaveBeenCalledWith({
        where: { id: 'att-uuid-1' },
      });
      expect(mockAudit.logAction).toHaveBeenCalledWith(
        mockUser.id,
        'ATTACHMENT_DELETED',
        'ATTACHMENT',
        'att-uuid-1',
        expect.anything(),
      );
    });
  });
});
