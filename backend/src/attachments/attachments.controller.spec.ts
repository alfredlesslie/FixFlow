import { BadRequestException } from '@nestjs/common';
import { AttachmentsController } from './attachments.controller';
import { AttachmentsService } from './attachments.service';
import { Response } from 'express';
import { Readable, Writable } from 'stream';

describe('AttachmentsController', () => {
  let controller: AttachmentsController;
  let mockService: Partial<AttachmentsService>;

  beforeEach(() => {
    mockService = {
      uploadAttachment: jest.fn().mockResolvedValue({
        id: 'att-123',
        fileName: 'test.png',
        fileUrl: '/api/attachments/att-123',
        fileType: 'png',
        fileSize: 1024,
      }),
      getAttachmentStream: jest.fn().mockResolvedValue({
        stream: Readable.from(['image buffer']),
        mimeType: 'image/png',
        fileName: 'test.png',
      }),
      deleteAttachment: jest.fn().mockResolvedValue(undefined),
    };

    controller = new AttachmentsController(mockService as AttachmentsService);
  });

  it('delegates file upload to attachmentsService', async () => {
    const mockFile = { originalname: 'test.png', buffer: Buffer.from('png'), size: 1024 } as any;
    const req = { user: { id: 'u1' } };

    const result = await controller.uploadAttachment(mockFile, req, 'req-1');

    expect(result).toBeDefined();
    expect(result.id).toBe('att-123');
    expect(mockService.uploadAttachment).toHaveBeenCalledWith(mockFile, req.user, 'req-1', undefined);
  });

  it('throws BadRequestException if no file is provided in upload request', async () => {
    const req = { user: { id: 'u1' } };
    await expect(controller.uploadAttachment(null as any, req)).rejects.toThrow(BadRequestException);
  });

  it('pipes attachment stream and sets appropriate headers on serveAttachment', (done) => {
    const mockWritable = new Writable({
      write(_chunk, _encoding, callback) {
        callback();
      },
    });

    const mockRes = Object.assign(mockWritable, {
      setHeader: jest.fn(),
    }) as unknown as Response;

    mockWritable.on('finish', () => {
      expect(mockRes.setHeader).toHaveBeenCalledWith('Content-Type', 'image/png');
      expect(mockRes.setHeader).toHaveBeenCalledWith(
        'Content-Disposition',
        expect.stringContaining('test.png'),
      );
      done();
    });

    controller.serveAttachment('att-123', { user: { id: 'u1' } }, mockRes);
  });

  it('delegates deletion to attachmentsService', async () => {
    const req = { user: { id: 'u1' } };
    await controller.deleteAttachment('att-123', req);
    expect(mockService.deleteAttachment).toHaveBeenCalledWith('att-123', req.user);
  });
});
