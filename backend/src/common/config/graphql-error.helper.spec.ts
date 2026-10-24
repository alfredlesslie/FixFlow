import {
  formatGraphQLError,
  GENERIC_INTERNAL_ERROR_MESSAGE,
} from './graphql-error.helper';

describe('formatGraphQLError Security Suite', () => {
  const mockLocations = [{ line: 2, column: 3 }];
  const mockPath = ['user'];

  describe('Non-Development Environments (Production, Staging, Unset)', () => {
    it('masks internal server errors and deletes stacktrace/exception in production', () => {
      const error = {
        message: 'Something broke inside the service',
        locations: mockLocations,
        path: mockPath,
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          stacktrace: ['Error: Something broke', '  at Object.<anonymous> (/app/dist/main.js:10:5)'],
          exception: { stack: '...' },
        },
      };

      const result = formatGraphQLError(error, 'production');

      expect(result.message).toBe(GENERIC_INTERNAL_ERROR_MESSAGE);
      expect(result.extensions.code).toBe('INTERNAL_SERVER_ERROR');
      expect(result.extensions.stacktrace).toBeUndefined();
      expect(result.extensions.exception).toBeUndefined();
      expect(result.extensions.originalError).toBeUndefined();
    });

    it('fails closed in staging environment: masks internal database errors', () => {
      const error = {
        message: 'Invalid `prisma.user.findUnique()` invocation: database connection dropped',
        locations: mockLocations,
        path: mockPath,
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          stacktrace: ['PrismaClientKnownRequestError: ...'],
        },
      };

      const result = formatGraphQLError(error, 'staging');

      expect(result.message).toBe(GENERIC_INTERNAL_ERROR_MESSAGE);
      expect(result.extensions.code).toBe('INTERNAL_SERVER_ERROR');
      expect(result.extensions.stacktrace).toBeUndefined();
    });

    it('fails closed when NODE_ENV is undefined or empty string', () => {
      const error = {
        message: 'syntax error at or near "SELECT"',
        locations: mockLocations,
        path: mockPath,
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          stacktrace: ['...'],
        },
      };

      const resultUndefined = formatGraphQLError(error, undefined);
      expect(resultUndefined.message).toBe(GENERIC_INTERNAL_ERROR_MESSAGE);
      expect(resultUndefined.extensions.stacktrace).toBeUndefined();

      const resultEmpty = formatGraphQLError(error, '');
      expect(resultEmpty.message).toBe(GENERIC_INTERNAL_ERROR_MESSAGE);
      expect(resultEmpty.extensions.stacktrace).toBeUndefined();
    });

    it('masks message even if code is BAD_USER_INPUT when message contains Prisma or database details', () => {
      const error = {
        message: 'Unique constraint failed on the fields: (`email`) in prisma.user',
        locations: mockLocations,
        path: mockPath,
        extensions: {
          code: 'BAD_USER_INPUT',
          stacktrace: ['...'],
        },
      };

      const result = formatGraphQLError(error, 'production');

      // Must not trust the code alone when message contains database internals
      expect(result.message).toBe(GENERIC_INTERNAL_ERROR_MESSAGE);
      expect(result.extensions.code).toBe('INTERNAL_SERVER_ERROR');
      expect(result.extensions.stacktrace).toBeUndefined();
    });

    it('masks message if message contains filesystem or system error signatures', () => {
      const error = {
        message: 'ENOENT: no such file or directory, open "C:\\projects\\FixFlow\\secret.key"',
        locations: mockLocations,
        path: mockPath,
        extensions: {
          code: 'BAD_USER_INPUT',
        },
      };

      const result = formatGraphQLError(error, 'production');

      expect(result.message).toBe(GENERIC_INTERNAL_ERROR_MESSAGE);
      expect(result.extensions.code).toBe('INTERNAL_SERVER_ERROR');
    });

    it('preserves safe client validation error messages while stripping originalError', () => {
      const error = {
        message: 'Bad Request Exception',
        locations: mockLocations,
        path: mockPath,
        extensions: {
          code: 'BAD_USER_INPUT',
          originalError: {
            statusCode: 400,
            message: ['email must be an email', 'password must be longer than 8 characters'],
            error: 'Bad Request',
          },
          stacktrace: ['...'],
        },
      };

      const result = formatGraphQLError(error, 'production');

      expect(result.message).toBe('email must be an email; password must be longer than 8 characters');
      expect(result.extensions.code).toBe('BAD_USER_INPUT');
      expect(result.extensions.originalError).toBeUndefined();
      expect(result.extensions.stacktrace).toBeUndefined();
    });

    it('preserves clean client error messages for UNAUTHENTICATED and FORBIDDEN', () => {
      const unauthError = {
        message: 'Invalid email or password credentials',
        extensions: {
          code: 'UNAUTHENTICATED',
          stacktrace: ['Error: Unauthorized...'],
        },
      };

      const resUnauth = formatGraphQLError(unauthError, 'production');
      expect(resUnauth.message).toBe('Invalid email or password credentials');
      expect(resUnauth.extensions.code).toBe('UNAUTHENTICATED');
      expect(resUnauth.extensions.stacktrace).toBeUndefined();

      const forbiddenError = {
        message: 'Self-approval prohibited: Faculty or staff cannot approve their own registration application',
        extensions: {
          code: 'FORBIDDEN',
          stacktrace: ['Error: Forbidden...'],
        },
      };

      const resForbidden = formatGraphQLError(forbiddenError, 'production');
      expect(resForbidden.message).toBe(
        'Self-approval prohibited: Faculty or staff cannot approve their own registration application',
      );
      expect(resForbidden.extensions.code).toBe('FORBIDDEN');
      expect(resForbidden.extensions.stacktrace).toBeUndefined();
    });
  });

  describe('Development and Test Environments', () => {
    it('preserves full error diagnostics and stack traces in development', () => {
      const devError = {
        message: 'Detailed developer debug error message',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          stacktrace: ['Error at Resolver line 50'],
          exception: { details: 'debug-payload' },
        },
      };

      const result = formatGraphQLError(devError, 'development');

      expect(result).toBe(devError);
      expect(result.message).toBe('Detailed developer debug error message');
      expect(result.extensions.stacktrace).toBeDefined();
      expect(result.extensions.exception).toBeDefined();
    });

    it('preserves full error diagnostics in test environment', () => {
      const testError = {
        message: 'Test debug error',
        extensions: {
          code: 'INTERNAL_SERVER_ERROR',
          stacktrace: ['at test'],
        },
      };

      const result = formatGraphQLError(testError, 'test');
      expect(result).toBe(testError);
    });
  });
});
