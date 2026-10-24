import { BadRequestException } from '@nestjs/common';

export interface ImageValidationResult {
  mimeType: string;
  extension: string;
  width?: number;
  height?: number;
}

export const MAX_FILE_SIZE_BYTES = 10 * 1024 * 1024; // 10MB
export const MAX_DIMENSION_PX = 6000;
export const MIN_DIMENSION_PX = 10;

/**
 * Validates file content using magic byte signatures and inspects dimensions.
 * Strictly prevents filename-only spoofing or disguised scripts.
 */
export function validateImageBuffer(buffer: Buffer, originalFilename: string): ImageValidationResult {
  if (!buffer || buffer.length === 0) {
    throw new BadRequestException('Uploaded file buffer is empty.');
  }

  if (buffer.length > MAX_FILE_SIZE_BYTES) {
    throw new BadRequestException(
      `File size (${(buffer.length / (1024 * 1024)).toFixed(2)}MB) exceeds maximum limit of 10MB.`,
    );
  }

  // 1. Check PNG (Magic Bytes: 89 50 4E 47 0D 0A 1A 0A)
  if (
    buffer.length >= 8 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47 &&
    buffer[4] === 0x0d &&
    buffer[5] === 0x0a &&
    buffer[6] === 0x1a &&
    buffer[7] === 0x0a
  ) {
    let width: number | undefined;
    let height: number | undefined;

    if (buffer.length >= 24) {
      width = buffer.readUInt32BE(16);
      height = buffer.readUInt32BE(20);
      assertValidDimensions(width, height);
    }

    return { mimeType: 'image/png', extension: '.png', width, height };
  }

  // 2. Check JPEG (Magic Bytes: FF D8 FF)
  if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    const dimensions = extractJpegDimensions(buffer);
    if (dimensions) {
      assertValidDimensions(dimensions.width, dimensions.height);
    }
    return {
      mimeType: 'image/jpeg',
      extension: '.jpg',
      width: dimensions?.width,
      height: dimensions?.height,
    };
  }

  // 3. Check WEBP (Magic Bytes: "RIFF" .... "WEBP")
  if (
    buffer.length >= 12 &&
    buffer.toString('ascii', 0, 4) === 'RIFF' &&
    buffer.toString('ascii', 8, 12) === 'WEBP'
  ) {
    return { mimeType: 'image/webp', extension: '.webp' };
  }

  // 4. Check GIF (Magic Bytes: "GIF87a" or "GIF89a")
  if (
    buffer.length >= 6 &&
    (buffer.toString('ascii', 0, 6) === 'GIF87a' || buffer.toString('ascii', 0, 6) === 'GIF89a')
  ) {
    const width = buffer.readUInt16LE(6);
    const height = buffer.readUInt16LE(8);
    assertValidDimensions(width, height);
    return { mimeType: 'image/gif', extension: '.gif', width, height };
  }

  // 5. Check SVG (XML header or <svg start)
  const prefix = buffer.slice(0, 1024).toString('utf8').trim().toLowerCase();
  if (prefix.includes('<svg') || (prefix.startsWith('<?xml') && prefix.includes('<svg'))) {
    // Prevent SVG XSS / Embedded scripts
    const fullContent = buffer.toString('utf8').toLowerCase();
    if (
      fullContent.includes('<script') ||
      fullContent.includes('javascript:') ||
      /on\w+\s*=/i.test(fullContent)
    ) {
      throw new BadRequestException('Security violation: SVG contains disallowed script or event handler elements.');
    }
    return { mimeType: 'image/svg+xml', extension: '.svg' };
  }

  throw new BadRequestException(
    `Unsupported or invalid image format for "${originalFilename}". Only valid PNG, JPEG, WEBP, GIF, and sanitized SVG images are accepted.`,
  );
}

function assertValidDimensions(width?: number, height?: number): void {
  if (width !== undefined && (width < MIN_DIMENSION_PX || width > MAX_DIMENSION_PX)) {
    throw new BadRequestException(
      `Image width (${width}px) is outside allowed bounds (${MIN_DIMENSION_PX}px - ${MAX_DIMENSION_PX}px).`,
    );
  }
  if (height !== undefined && (height < MIN_DIMENSION_PX || height > MAX_DIMENSION_PX)) {
    throw new BadRequestException(
      `Image height (${height}px) is outside allowed bounds (${MIN_DIMENSION_PX}px - ${MAX_DIMENSION_PX}px).`,
    );
  }
}

function extractJpegDimensions(buffer: Buffer): { width: number; height: number } | null {
  let offset = 2;
  while (offset < buffer.length - 8) {
    if (buffer[offset] !== 0xff) {
      offset++;
      continue;
    }
    const marker = buffer[offset + 1];
    // Baseline SOF0 (0xC0), Extended SOF1 (0xC1), Progressive SOF2 (0xC2)
    if (marker === 0xc0 || marker === 0xc1 || marker === 0xc2) {
      const height = buffer.readUInt16BE(offset + 5);
      const width = buffer.readUInt16BE(offset + 7);
      return { width, height };
    }
    // Advance to next segment
    const segmentLength = buffer.readUInt16BE(offset + 2);
    offset += 2 + segmentLength;
  }
  return null;
}
