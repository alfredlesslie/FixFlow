import { DemoAttachmentsController } from './demo-attachments.controller';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { Writable } from 'stream';

describe('DemoAttachmentsController', () => {
  let controller: DemoAttachmentsController;

  beforeEach(() => {
    controller = new DemoAttachmentsController();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('should throw BadRequestException for directory traversal attempt', () => {
    const mockRes = {} as Response;
    expect(() => controller.serveDemoAttachment('../secret.png', mockRes)).toThrow(BadRequestException);
  });

  it('should throw BadRequestException for unsupported file extensions', () => {
    const mockRes = {} as Response;
    expect(() => controller.serveDemoAttachment('malicious.exe', mockRes)).toThrow(BadRequestException);
  });

  it('should throw NotFoundException for non-existent image', () => {
    const mockRes = {} as Response;
    expect(() => controller.serveDemoAttachment('nonexistent-file.png', mockRes)).toThrow(NotFoundException);
  });

  it('should serve existing demo png image with correct headers', (done) => {
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
      done();
    });

    controller.serveDemoAttachment('water-leak-evidence.png', mockRes);
  });
});
