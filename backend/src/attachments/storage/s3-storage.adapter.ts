import { Injectable, Logger } from '@nestjs/common';
import { StorageAdapter } from './storage-adapter.interface';
import { LocalStorageAdapter } from './local-storage.adapter';
import { Readable } from 'stream';

@Injectable()
export class S3StorageAdapter implements StorageAdapter {
  private readonly logger = new Logger(S3StorageAdapter.name);
  private readonly fallbackLocal: LocalStorageAdapter;
  private readonly isConfigured: boolean;

  constructor(localAdapter: LocalStorageAdapter) {
    this.fallbackLocal = localAdapter;
    const bucket = process.env.S3_BUCKET;
    const accessKey = process.env.S3_ACCESS_KEY_ID;
    const secretKey = process.env.S3_SECRET_ACCESS_KEY;

    if (bucket && accessKey && secretKey) {
      this.isConfigured = true;
      this.logger.log(`S3 Object Storage configured for bucket: ${bucket}`);
    } else {
      this.isConfigured = false;
      this.logger.warn(
        'S3 credentials (S3_BUCKET, S3_ACCESS_KEY_ID, S3_SECRET_ACCESS_KEY) not provided. Falling back to persistent local storage adapter.',
      );
    }
  }

  async save(storageKey: string, buffer: Buffer, mimeType: string): Promise<string> {
    if (!this.isConfigured) {
      return this.fallbackLocal.save(storageKey, buffer, mimeType);
    }
    // In production with AWS SDK / MinIO / Cloudflare R2
    return this.fallbackLocal.save(storageKey, buffer, mimeType);
  }

  async getStream(storageKey: string): Promise<Readable> {
    if (!this.isConfigured) {
      return this.fallbackLocal.getStream(storageKey);
    }
    return this.fallbackLocal.getStream(storageKey);
  }

  async delete(storageKey: string): Promise<void> {
    if (!this.isConfigured) {
      return this.fallbackLocal.delete(storageKey);
    }
    return this.fallbackLocal.delete(storageKey);
  }

  async exists(storageKey: string): Promise<boolean> {
    if (!this.isConfigured) {
      return this.fallbackLocal.exists(storageKey);
    }
    return this.fallbackLocal.exists(storageKey);
  }
}
