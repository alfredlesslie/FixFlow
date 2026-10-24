import { Readable } from 'stream';

export interface StorageAdapter {
  save(storageKey: string, buffer: Buffer, mimeType: string): Promise<string>;
  getStream(storageKey: string): Promise<Readable>;
  delete(storageKey: string): Promise<void>;
  exists(storageKey: string): Promise<boolean>;
}
