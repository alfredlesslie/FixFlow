import { AuditService } from './audit.service';
import { PrismaService } from '../prisma/prisma.service';

describe('AuditService Security Suite', () => {
  let service: AuditService;
  let mockPrisma: any;

  beforeEach(() => {
    mockPrisma = {
      auditLog: {
        create: jest.fn().mockImplementation(({ data }) =>
          Promise.resolve({
            id: 'audit-log-1',
            ...data,
            timestamp: new Date(),
          }),
        ),
      },
    };

    service = new AuditService(mockPrisma as PrismaService);
  });

  describe('AuditService.sanitizeMetadata', () => {
    it('redacts sensitive fields (passwords, tokens, secrets, hashes) in metadata', () => {
      const rawMetadata = {
        email: 'user@fixflow.edu',
        role: 'TECHNICIAN',
        password: 'PlaintextPassword123!',
        passwordHash: '$2a$10$hashedvaluegoeshere',
        token: 'secret-token-abc',
        rawToken: 'unhashed-verification-token',
        apiSecret: 'my-jwt-secret-value',
        authorization: 'Bearer token-value',
        cookie: 'session_id=12345',
        safeProperty: 'preserved-value',
      };

      const sanitized = AuditService.sanitizeMetadata(rawMetadata);

      expect(sanitized.email).toBe('user@fixflow.edu');
      expect(sanitized.role).toBe('TECHNICIAN');
      expect(sanitized.safeProperty).toBe('preserved-value');

      expect(sanitized.password).toBe('[REDACTED]');
      expect(sanitized.passwordHash).toBe('[REDACTED]');
      expect(sanitized.token).toBe('[REDACTED]');
      expect(sanitized.rawToken).toBe('[REDACTED]');
      expect(sanitized.apiSecret).toBe('[REDACTED]');
      expect(sanitized.authorization).toBe('[REDACTED]');
      expect(sanitized.cookie).toBe('[REDACTED]');
    });

    it('recursively redacts sensitive keys in nested objects and arrays', () => {
      const nestedMetadata = {
        applicant: {
          name: 'Arun Kumar',
          userPassword: 'secret-pw',
          sessionToken: 'xyz-token',
        },
        payloadItems: [
          { key: 'public-id', value: '123' },
          { tokenHash: 'sensitive-hash-val' },
        ],
      };

      const sanitized = AuditService.sanitizeMetadata(nestedMetadata);

      expect(sanitized.applicant.name).toBe('Arun Kumar');
      expect(sanitized.applicant.userPassword).toBe('[REDACTED]');
      expect(sanitized.applicant.sessionToken).toBe('[REDACTED]');
      expect(sanitized.payloadItems[0].key).toBe('public-id');
      expect(sanitized.payloadItems[1].tokenHash).toBe('[REDACTED]');
    });

    it('returns primitive values and null/undefined safely without error', () => {
      expect(AuditService.sanitizeMetadata(null)).toBeNull();
      expect(AuditService.sanitizeMetadata(undefined)).toBeUndefined();
      expect(AuditService.sanitizeMetadata('string-val')).toBe('string-val');
      expect(AuditService.sanitizeMetadata(12345)).toBe(12345);
    });

    it('redacts API keys, private keys, bearer tokens, OTPs, and PINs with alternate casing', () => {
      const advancedMetadata = {
        apiKey: 'sk_live_123456789',
        API_KEY: 'sk_test_987654321',
        privateKey: '-----BEGIN RSA PRIVATE KEY-----...',
        private_key: 'pk_secret_value',
        accessKey: 'AKIAIOSFODNN7EXAMPLE',
        bearer: 'jwt-bearer-string',
        auth: 'Basic dXNlcjpwYXNz',
        authHeader: 'Bearer eyJhbGciOi...',
        otp: '482910',
        userOtp: '123456',
        pin: '9876',
        security_pin: '0000',
        pinCode: '4321',
      };

      const sanitized = AuditService.sanitizeMetadata(advancedMetadata);

      expect(sanitized.apiKey).toBe('[REDACTED]');
      expect(sanitized.API_KEY).toBe('[REDACTED]');
      expect(sanitized.privateKey).toBe('[REDACTED]');
      expect(sanitized.private_key).toBe('[REDACTED]');
      expect(sanitized.accessKey).toBe('[REDACTED]');
      expect(sanitized.bearer).toBe('[REDACTED]');
      expect(sanitized.auth).toBe('[REDACTED]');
      expect(sanitized.authHeader).toBe('[REDACTED]');
      expect(sanitized.otp).toBe('[REDACTED]');
      expect(sanitized.userOtp).toBe('[REDACTED]');
      expect(sanitized.pin).toBe('[REDACTED]');
      expect(sanitized.security_pin).toBe('[REDACTED]');
      expect(sanitized.pinCode).toBe('[REDACTED]');
    });

    it('safely handles non-POJO values (Date, Error) without crashing', () => {
      const testDate = new Date('2026-10-17T12:00:00Z');
      const testError = new Error('Database query timed out');

      const complexMetadata = {
        timestamp: testDate,
        failureCause: testError,
        rawString: 'normal-val',
      };

      const sanitized = AuditService.sanitizeMetadata(complexMetadata);

      expect(sanitized.timestamp).toBe('2026-10-17T12:00:00.000Z');
      expect(sanitized.failureCause).toEqual({
        name: 'Error',
        message: 'Database query timed out',
      });
      expect(sanitized.rawString).toBe('normal-val');
    });

    it('avoids over-redacting harmless domain keys like generic key, author, or role', () => {
      const domainMetadata = {
        key: 'cache-key-id-123',
        author: 'Faculty Director',
        authorId: 'usr-author-99',
        department: 'Operations',
        role: 'TECHNICIAN',
      };

      const sanitized = AuditService.sanitizeMetadata(domainMetadata);

      expect(sanitized.key).toBe('cache-key-id-123');
      expect(sanitized.author).toBe('Faculty Director');
      expect(sanitized.authorId).toBe('usr-author-99');
      expect(sanitized.department).toBe('Operations');
      expect(sanitized.role).toBe('TECHNICIAN');
    });
  });

  describe('AuditService.logAction', () => {
    it('persists sanitized metadata into database via Prisma', async () => {
      await service.logAction('user-1', 'USER_LOGIN_ATTEMPT', 'USER', 'user-1', {
        email: 'user@fixflow.edu',
        password: 'AttemptedPassword!',
      });

      expect(mockPrisma.auditLog.create).toHaveBeenCalledWith({
        data: {
          actorId: 'user-1',
          action: 'USER_LOGIN_ATTEMPT',
          entity: 'USER',
          entityId: 'user-1',
          metadata: {
            email: 'user@fixflow.edu',
            password: '[REDACTED]',
          },
        },
      });
    });

    it('does not throw or disrupt primary flow if database audit recording fails', async () => {
      mockPrisma.auditLog.create.mockRejectedValue(new Error('Database disk full or connection dropped'));

      const result = await service.logAction('user-1', 'ACTION', 'ENTITY', 'entity-1');
      expect(result).toBeNull();
    });
  });
});
