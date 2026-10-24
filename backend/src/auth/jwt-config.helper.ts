import { ConfigService } from '@nestjs/config';

export const MIN_JWT_SECRET_LENGTH = 32;

/**
 * Validates and retrieves the JWT signing secret from ConfigService.
 * Fails safely at application startup if JWT_SECRET is missing, empty, or insecurely short.
 */
export function getValidatedJwtSecret(configService: ConfigService): string {
  const secret = configService.get<string>('JWT_SECRET');

  if (!secret || secret.trim().length === 0) {
    throw new Error(
      '[Security Configuration Error] Missing required environment variable: JWT_SECRET. ' +
        'FixFlow cannot start without a securely configured JWT signing key. ' +
        'Provide a secret of at least 32 characters via the repository root .env or environment.',
    );
  }

  const trimmedSecret = secret.trim();
  if (trimmedSecret.length < MIN_JWT_SECRET_LENGTH) {
    throw new Error(
      `[Security Configuration Error] Insecure JWT_SECRET: provided secret is only ${trimmedSecret.length} characters long. ` +
        `Institutional security standards require at least ${MIN_JWT_SECRET_LENGTH} characters.`,
    );
  }

  return trimmedSecret;
}
