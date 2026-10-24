import { ConfigService } from '@nestjs/config';
import { Logger } from '@nestjs/common';

const logger = new Logger('EnvironmentConfig');

/**
 * Whitelist of permitted non-production environments where internal development
 * aids (raw token inspection, GraphQL playground, schema introspection) may be activated.
 */
export const PERMITTED_DEV_ENVIRONMENTS = Object.freeze(['development', 'test']);

/**
 * Checks whether the specified environment string matches an explicitly permitted
 * development or test environment.
 *
 * Fails closed: returns false for undefined, null, empty string, 'production',
 * 'staging', 'qa', or any unrecognized value.
 */
export function isDevOrTestEnvironment(env?: string | null): boolean {
  if (!env || typeof env !== 'string') {
    return false;
  }
  const normalized = env.trim().toLowerCase();
  return PERMITTED_DEV_ENVIRONMENTS.includes(normalized);
}

/**
 * Determines whether raw email verification token inspection is permitted.
 * Fails closed in production, staging, missing, empty, or invalid environments.
 */
export function isDevTokenInspectionEnabled(
  configService?: ConfigService | { get: (key: string) => any } | null,
): boolean {
  if (configService !== undefined) {
    const env = configService ? configService.get<string>('NODE_ENV') : null;
    return isDevOrTestEnvironment(env);
  }
  return isDevOrTestEnvironment(process.env.NODE_ENV);
}

/**
 * Determines whether GraphQL Playground and introspection are permitted.
 * Fails closed: disabled by default unless explicitly in development or test.
 */
export function isGraphQLPlaygroundEnabled(
  configService?: ConfigService | { get: (key: string) => any } | null,
): boolean {
  if (configService !== undefined) {
    const env = configService ? configService.get<string>('NODE_ENV') : null;
    return isDevOrTestEnvironment(env);
  }
  return isDevOrTestEnvironment(process.env.NODE_ENV);
}

/**
 * Parsed configuration for Express 'trust proxy'.
 *
 * Expected deployment configuration:
 * 1. Direct access (no reverse proxy): Omit TRUST_PROXY or set to 'false' (Express socket address used).
 * 2. Behind single edge proxy (e.g. AWS ALB, NGINX, Cloudflare): Set TRUST_PROXY='1'.
 * 3. Behind multiple trusted proxies / specific CIDR: Set TRUST_PROXY='loopback, 10.0.0.0/8'.
 *
 * Fails closed: malformed, negative, or unrecognized values return false (untrusted).
 */
export function parseTrustProxyConfig(
  trustProxyVal?: string | null,
): boolean | number | string | undefined {
  if (!trustProxyVal || typeof trustProxyVal !== 'string') {
    return false;
  }

  const trimmed = trustProxyVal.trim();

  if (trimmed === '' || trimmed.toLowerCase() === 'false' || trimmed === '0') {
    return false;
  }

  // Negative values are invalid and rejected
  if (trimmed.startsWith('-')) {
    logger.warn(
      `[Security Warning] Negative TRUST_PROXY value encountered: "${trimmed}". ` +
        'Failing closed: reverse proxy trust disabled.',
    );
    return false;
  }

  if (trimmed.toLowerCase() === 'true') {
    logger.warn(
      '[Security Warning] TRUST_PROXY is set to "true". All upstream hops will be trusted. ' +
        'Ensure an edge reverse proxy unconditionally overwrites X-Forwarded-For headers.',
    );
    return true;
  }

  // Positive integer (hop count, e.g. "1")
  if (/^[1-9]\d*$/.test(trimmed)) {
    return parseInt(trimmed, 10);
  }

  // Predefined Express keywords or CIDR / IP lists
  const validKeywordOrSubnetRegex = /^[a-zA-Z0-9.:/,\s]+$/;
  if (validKeywordOrSubnetRegex.test(trimmed)) {
    return trimmed;
  }

  logger.warn(
    `[Security Warning] Malformed or invalid TRUST_PROXY value encountered: "${trimmed}". ` +
      'Failing closed: reverse proxy trust disabled.',
  );
  return false;
}
