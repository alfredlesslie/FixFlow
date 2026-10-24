import { Injectable, Logger } from '@nestjs/common';
import { StorageAdapter } from './storage-adapter.interface';
import { Readable } from 'stream';
import { join } from 'path';
import { existsSync, mkdirSync, createReadStream, promises as fsPromises } from 'fs';

@Injectable()
export class LocalStorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(LocalStorageAdapter.name);
  private readonly uploadDir: string;

  constructor() {
    this.uploadDir = process.env.STORAGE_LOCAL_DIR
      ? join(process.cwd(), process.env.STORAGE_LOCAL_DIR)
      : join(process.cwd(), 'uploads', 'attachments');

    if (!existsSync(this.uploadDir)) {
      mkdirSync(this.uploadDir, { recursive: true });
      this.logger.log(`Initialized local attachment storage directory: ${this.uploadDir}`);
    }
  }

  async save(storageKey: string, buffer: Buffer, _mimeType: string): Promise<string> {
    const filePath = join(this.uploadDir, storageKey);
    await fsPromises.writeFile(filePath, buffer);
    return filePath;
  }

  async getStream(storageKey: string): Promise<Readable> {
    const filePath = join(this.uploadDir, storageKey);
    if (!existsSync(filePath)) {
      throw new Error(`Storage file not found: ${storageKey}`);
    }
    return createReadStream(filePath);
  }

  async delete(storageKey: string): Promise<void> {
    const filePath = join(this.uploadDir, storageKey);
    if (existsSync(filePath)) {
      await fsPromises.unlink(filePath);
    }
  }

  async exists(storageKey: string): Promise<boolean> {
    const filePath = join(this.uploadDir, storageKey);
    return existsSync(filePath);
  }
}
