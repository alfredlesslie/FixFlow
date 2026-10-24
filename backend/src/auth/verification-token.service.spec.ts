import { BadRequestException } from '@nestjs/common';
import { VerificationTokenService } from './verification-token.service';
import { PrismaService } from '../prisma/prisma.service';

describe('VerificationTokenService', () => {
  let service: VerificationTokenService;
  let prisma: Partial<PrismaService>;

  beforeEach(() => {
    prisma = {
      emailVerificationToken: {
        create: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
        updateMany: jest.fn(),
      } as any,
    };

    service = new VerificationTokenService(prisma as PrismaService);
  });

  describe('generateToken', () => {
    it('generates high entropy 64-character raw hex token and its SHA-256 hash', () => {
      const result = service.generateToken(24);
      expect(result.rawToken).toHaveLength(64);
      expect(result.tokenHash).toHaveLength(64);
      expect(result.tokenHash).toBe(VerificationTokenService.hashToken(result.rawToken));
      expect(result.tokenMasked).toContain('...');
      expect(result.expiresAt.getTime()).toBeGreaterThan(Date.now());
    });
  });

  describe('validateToken', () => {
    it('throws BadRequestException if token is missing or empty', async () => {
      await expect(service.validateToken('')).rejects.toThrow(BadRequestException);
      await expect(service.validateToken('   ')).rejects.toThrow(BadRequestException);
    });

    it('throws BadRequestException if token hash is not found in database', async () => {
      (prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(service.validateToken('nonexistent-raw-token')).rejects.toThrow(
        'Invalid or expired verification token',
      );
    });

    it('throws BadRequestException if token has already been consumed (single-use check)', async () => {
      (prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'tok-1',
        tokenHash: 'hash',
        userId: 'u-1',
        usedAt: new Date(Date.now() - 60000), // Already consumed
        expiresAt: new Date(Date.now() + 86400000),
      });

      await expect(service.validateToken('raw-token')).rejects.toThrow(
        'Verification token has already been used',
      );
    });

    it('throws BadRequestException if token has expired', async () => {
      (prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue({
        id: 'tok-2',
        tokenHash: 'hash',
        userId: 'u-1',
        usedAt: null,
        expiresAt: new Date(Date.now() - 1000), // Expired 1 second ago
      });

      await expect(service.validateToken('raw-token')).rejects.toThrow(
        'Verification token has expired',
      );
    });

    it('successfully returns token record when valid and active', async () => {
      const mockRecord = {
        id: 'tok-3',
        tokenHash: VerificationTokenService.hashToken('valid-raw-token'),
        userId: 'u-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'u-1', email: 'student@fixflow.edu' },
      };
      (prisma.emailVerificationToken.findUnique as jest.Mock).mockResolvedValue(mockRecord);

      const result = await service.validateToken('valid-raw-token');
      expect(result.id).toBe('tok-3');
      expect(result.userId).toBe('u-1');
    });
  });

  describe('consumeToken', () => {
    it('updates usedAt timestamp on token consumption atomically', async () => {
      (prisma.emailVerificationToken.updateMany as jest.Mock).mockResolvedValue({
        count: 1,
      });

      const res = await service.consumeToken('tok-3');
      expect(res.count).toBe(1);
      expect(prisma.emailVerificationToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'tok-3', usedAt: null }),
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        }),
      );
    });

    it('throws BadRequestException if token was already consumed or expired', async () => {
      (prisma.emailVerificationToken.updateMany as jest.Mock).mockResolvedValue({
        count: 0,
      });

      await expect(service.consumeToken('tok-consumed')).rejects.toThrow(
        'Verification token has already been used or expired',
      );
    });
  });

  describe('validateAndConsumeToken', () => {
    it('validates and atomically consumes an active token', async () => {
      const mockRecord = {
        id: 'tok-valid',
        tokenHash: VerificationTokenService.hashToken('valid-raw'),
        userId: 'u-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'u-1', email: 'student@fixflow.edu' },
      };

      const mockTx = {
        emailVerificationToken: {
          findUnique: jest.fn().mockResolvedValue(mockRecord),
          updateMany: jest.fn().mockResolvedValue({ count: 1 }),
        },
      };

      const result = await service.validateAndConsumeToken('valid-raw', mockTx as any);
      expect(result.id).toBe('tok-valid');
      expect(mockTx.emailVerificationToken.updateMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ id: 'tok-valid', usedAt: null }),
          data: expect.objectContaining({ usedAt: expect.any(Date) }),
        }),
      );
    });

    it('rejects concurrent consumption if another request consumed the token first', async () => {
      const mockRecord = {
        id: 'tok-race',
        tokenHash: VerificationTokenService.hashToken('race-raw'),
        userId: 'u-1',
        usedAt: null,
        expiresAt: new Date(Date.now() + 86400000),
        user: { id: 'u-1', email: 'student@fixflow.edu' },
      };

      const mockTx = {
        emailVerificationToken: {
          findUnique: jest.fn().mockResolvedValue(mockRecord),
          updateMany: jest.fn().mockResolvedValue({ count: 0 }), // 0 updated means race lost!
        },
      };

      await expect(service.validateAndConsumeToken('race-raw', mockTx as any)).rejects.toThrow(
        'Verification token has already been used or expired',
      );
    });
  });
});
