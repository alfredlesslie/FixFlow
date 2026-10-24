import { Injectable, BadRequestException } from '@nestjs/common';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';

export interface GeneratedTokenResult {
  rawToken: string;
  tokenHash: string;
  tokenMasked: string;
  expiresAt: Date;
}

@Injectable()
export class VerificationTokenService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Hashes a raw verification token with SHA-256 for persistent database storage and lookup.
   */
  static hashToken(rawToken: string): string {
    return crypto.createHash('sha256').update(rawToken.trim()).digest('hex');
  }

  /**
   * Generates a safe masked token identifier for logging and email headers.
   */
  static maskToken(tokenHash: string): string {
    if (!tokenHash || tokenHash.length < 12) return '***';
    return `${tokenHash.substring(0, 8)}...${tokenHash.substring(tokenHash.length - 4)}`;
  }

  /**
   * Generates a high-entropy 256-bit verification token and its SHA-256 hash.
   */
  generateToken(expiryHours = 24): GeneratedTokenResult {
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = VerificationTokenService.hashToken(rawToken);
    const tokenMasked = VerificationTokenService.maskToken(tokenHash);
    const expiresAt = new Date(Date.now() + expiryHours * 60 * 60 * 1000);

    return {
      rawToken,
      tokenHash,
      tokenMasked,
      expiresAt,
    };
  }

  /**
   * Creates and persists a new email verification token in database.
   */
  async createVerificationToken(
    userId: string,
    expiryHours = 24,
    tx?: any,
  ): Promise<GeneratedTokenResult> {
    const generated = this.generateToken(expiryHours);
    const client = tx || this.prisma;

    await client.emailVerificationToken.create({
      data: {
        userId,
        tokenHash: generated.tokenHash,
        expiresAt: generated.expiresAt,
      },
    });

    return generated;
  }

  /**
   * Validates a raw token against the database, enforcing existence, single-use, and expiration.
   */
  async validateToken(rawToken: string, tx?: any) {
    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) {
      throw new BadRequestException('Verification token is required');
    }

    const tokenHash = VerificationTokenService.hashToken(rawToken);
    const client = tx || this.prisma;

    const tokenRecord = await client.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (tokenRecord.usedAt !== null) {
      throw new BadRequestException('Verification token has already been used');
    }

    if (tokenRecord.expiresAt < new Date()) {
      throw new BadRequestException('Verification token has expired');
    }

    return tokenRecord;
  }

  /**
   * Atomically validates and consumes a token within a transaction.
   * Guarantees single-use under concurrent requests using atomic conditional update.
   */
  async validateAndConsumeToken(rawToken: string, tx: any) {
    if (!rawToken || typeof rawToken !== 'string' || rawToken.trim().length === 0) {
      throw new BadRequestException('Verification token is required');
    }

    const tokenHash = VerificationTokenService.hashToken(rawToken);
    const now = new Date();

    const tokenRecord = await tx.emailVerificationToken.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new BadRequestException('Invalid or expired verification token');
    }

    if (tokenRecord.usedAt !== null) {
      throw new BadRequestException('Verification token has already been used');
    }

    if (tokenRecord.expiresAt < now) {
      throw new BadRequestException('Verification token has expired');
    }

    const updateResult = await tx.emailVerificationToken.updateMany({
      where: {
        id: tokenRecord.id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: {
        usedAt: now,
      },
    });

    if (updateResult.count === 0) {
      throw new BadRequestException('Verification token has already been used or expired');
    }

    return tokenRecord;
  }

  /**
   * Marks a token as consumed / used with atomic conditional check.
   */
  async consumeToken(id: string, tx?: any) {
    const client = tx || this.prisma;
    const now = new Date();
    const updateResult = await client.emailVerificationToken.updateMany({
      where: {
        id,
        usedAt: null,
        expiresAt: { gt: now },
      },
      data: { usedAt: now },
    });

    if (updateResult.count === 0) {
      throw new BadRequestException('Verification token has already been used or expired');
    }

    return updateResult;
  }
}
