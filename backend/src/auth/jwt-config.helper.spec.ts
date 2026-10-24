import { ConfigService } from '@nestjs/config';
import { getValidatedJwtSecret, MIN_JWT_SECRET_LENGTH } from './jwt-config.helper';

describe('jwt-config.helper', () => {
  let mockConfigService: Partial<ConfigService>;

  it('should throw when JWT_SECRET is missing or undefined', () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue(undefined),
    };

    expect(() => getValidatedJwtSecret(mockConfigService as ConfigService)).toThrow(
      /Missing required environment variable: JWT_SECRET/,
    );
  });

  it('should throw when JWT_SECRET is empty string or whitespace', () => {
    mockConfigService = {
      get: jest.fn().mockReturnValue('   '),
    };

    expect(() => getValidatedJwtSecret(mockConfigService as ConfigService)).toThrow(
      /Missing required environment variable: JWT_SECRET/,
    );
  });

  it('should throw when JWT_SECRET is shorter than MIN_JWT_SECRET_LENGTH', () => {
    const weakSecret = 'too-short-secret';
    mockConfigService = {
      get: jest.fn().mockReturnValue(weakSecret),
    };

    expect(() => getValidatedJwtSecret(mockConfigService as ConfigService)).toThrow(
      new RegExp(`Insecure JWT_SECRET: provided secret is only ${weakSecret.length} characters long`),
    );
  });

  it('should return trimmed secret when JWT_SECRET is valid and >= 32 characters', () => {
    const strongSecret = 'super-secret-institution-grade-jwt-key-for-testing-purposes-only';
    mockConfigService = {
      get: jest.fn().mockReturnValue(`  ${strongSecret}  `),
    };

    const result = getValidatedJwtSecret(mockConfigService as ConfigService);
    expect(result).toBe(strongSecret);
    expect(result.length).toBeGreaterThanOrEqual(MIN_JWT_SECRET_LENGTH);
  });
});
