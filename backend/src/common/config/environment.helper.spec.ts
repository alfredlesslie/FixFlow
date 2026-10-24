import { ConfigService } from '@nestjs/config';
import {
  isDevOrTestEnvironment,
  isDevTokenInspectionEnabled,
  isGraphQLPlaygroundEnabled,
  parseTrustProxyConfig,
  PERMITTED_DEV_ENVIRONMENTS,
} from './environment.helper';

describe('Environment Configuration Helper (Phase 6D.4 Hardening)', () => {
  describe('isDevOrTestEnvironment', () => {
    it('returns true explicitly for development and test environments', () => {
      expect(isDevOrTestEnvironment('development')).toBe(true);
      expect(isDevOrTestEnvironment('DEVELOPMENT')).toBe(true);
      expect(isDevOrTestEnvironment('  development  ')).toBe(true);
      expect(isDevOrTestEnvironment('test')).toBe(true);
      expect(isDevOrTestEnvironment('TEST')).toBe(true);
    });

    it('returns false for production', () => {
      expect(isDevOrTestEnvironment('production')).toBe(false);
      expect(isDevOrTestEnvironment('PRODUCTION')).toBe(false);
    });

    it('returns false for missing, null, or undefined environments', () => {
      expect(isDevOrTestEnvironment(undefined)).toBe(false);
      expect(isDevOrTestEnvironment(null)).toBe(false);
      expect(isDevOrTestEnvironment('')).toBe(false);
      expect(isDevOrTestEnvironment('   ')).toBe(false);
    });

    it('returns false for invalid, staging, or unrecognized environments', () => {
      expect(isDevOrTestEnvironment('staging')).toBe(false);
      expect(isDevOrTestEnvironment('qa')).toBe(false);
      expect(isDevOrTestEnvironment('uat')).toBe(false);
      expect(isDevOrTestEnvironment('prod')).toBe(false);
      expect(isDevOrTestEnvironment('arbitrary_value')).toBe(false);
    });
  });

  describe('isDevTokenInspectionEnabled', () => {
    const createMockConfig = (nodeEnv?: string): ConfigService => {
      return {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return nodeEnv;
          return null;
        }),
      } as unknown as ConfigService;
    };

    it('enables token inspection only for development and test', () => {
      expect(isDevTokenInspectionEnabled(createMockConfig('development'))).toBe(true);
      expect(isDevTokenInspectionEnabled(createMockConfig('test'))).toBe(true);
    });

    it('disables token inspection for production', () => {
      expect(isDevTokenInspectionEnabled(createMockConfig('production'))).toBe(false);
    });

    it('disables token inspection when NODE_ENV is missing or empty', () => {
      expect(isDevTokenInspectionEnabled(createMockConfig(undefined))).toBe(false);
      expect(isDevTokenInspectionEnabled(createMockConfig(''))).toBe(false);
      expect(isDevTokenInspectionEnabled(null)).toBe(false);
    });

    it('disables token inspection for staging and unapproved environments', () => {
      expect(isDevTokenInspectionEnabled(createMockConfig('staging'))).toBe(false);
      expect(isDevTokenInspectionEnabled(createMockConfig('qa'))).toBe(false);
      expect(isDevTokenInspectionEnabled(createMockConfig('preview'))).toBe(false);
    });
  });

  describe('isGraphQLPlaygroundEnabled', () => {
    const createMockConfig = (nodeEnv?: string): ConfigService => {
      return {
        get: jest.fn((key: string) => {
          if (key === 'NODE_ENV') return nodeEnv;
          return null;
        }),
      } as unknown as ConfigService;
    };

    it('enables playground and introspection for development and test', () => {
      expect(isGraphQLPlaygroundEnabled(createMockConfig('development'))).toBe(true);
      expect(isGraphQLPlaygroundEnabled(createMockConfig('test'))).toBe(true);
    });

    it('disables playground and introspection for production', () => {
      expect(isGraphQLPlaygroundEnabled(createMockConfig('production'))).toBe(false);
    });

    it('disables playground and introspection when NODE_ENV is missing, empty, or null', () => {
      expect(isGraphQLPlaygroundEnabled(createMockConfig(undefined))).toBe(false);
      expect(isGraphQLPlaygroundEnabled(createMockConfig(''))).toBe(false);
      expect(isGraphQLPlaygroundEnabled(null)).toBe(false);
    });

    it('disables playground and introspection for staging and invalid environments', () => {
      expect(isGraphQLPlaygroundEnabled(createMockConfig('staging'))).toBe(false);
      expect(isGraphQLPlaygroundEnabled(createMockConfig('qa'))).toBe(false);
      expect(isGraphQLPlaygroundEnabled(createMockConfig('invalid_env_123'))).toBe(false);
    });
  });

  describe('parseTrustProxyConfig', () => {
    it('returns false for missing, undefined, null, or empty string (direct connection / fail closed)', () => {
      expect(parseTrustProxyConfig(undefined)).toBe(false);
      expect(parseTrustProxyConfig(null)).toBe(false);
      expect(parseTrustProxyConfig('')).toBe(false);
      expect(parseTrustProxyConfig('   ')).toBe(false);
      expect(parseTrustProxyConfig('false')).toBe(false);
      expect(parseTrustProxyConfig('FALSE')).toBe(false);
      expect(parseTrustProxyConfig('0')).toBe(false);
    });

    it('returns true when explicitly configured to "true"', () => {
      expect(parseTrustProxyConfig('true')).toBe(true);
      expect(parseTrustProxyConfig('TRUE')).toBe(true);
    });

    it('parses positive hop numbers (e.g. 1 for single reverse proxy hop)', () => {
      expect(parseTrustProxyConfig('1')).toBe(1);
      expect(parseTrustProxyConfig('2')).toBe(2);
      expect(parseTrustProxyConfig('  3  ')).toBe(3);
    });

    it('passes through valid IP/CIDR subnets and Express proxy keywords', () => {
      expect(parseTrustProxyConfig('loopback')).toBe('loopback');
      expect(parseTrustProxyConfig('loopback, 10.0.0.0/8')).toBe('loopback, 10.0.0.0/8');
      expect(parseTrustProxyConfig('127.0.0.1')).toBe('127.0.0.1');
    });

    it('fails closed and returns false for malformed or invalid values', () => {
      expect(parseTrustProxyConfig('-1')).toBe(false);
      expect(parseTrustProxyConfig('invalid$character#value')).toBe(false);
      expect(parseTrustProxyConfig(';;drop table')).toBe(false);
    });
  });
});
