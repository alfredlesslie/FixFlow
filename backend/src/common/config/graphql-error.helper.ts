import { isDevOrTestEnvironment } from './environment.helper';

export const GENERIC_INTERNAL_ERROR_MESSAGE =
  'An internal server error occurred. Please contact institutional support.';

export const PERMITTED_CLIENT_ERROR_CODES = Object.freeze([
  'BAD_USER_INPUT',
  'UNAUTHENTICATED',
  'FORBIDDEN',
  'NOT_FOUND',
  'TOO_MANY_REQUESTS',
  'GRAPHQL_VALIDATION_FAILED',
  'GRAPHQL_PARSE_FAILED',
  'PERSISTED_QUERY_NOT_FOUND',
  'PERSISTED_QUERY_NOT_SUPPORTED',
]);

const SENSITIVE_INTERNAL_PATTERNS = [
  /prisma/i,
  /database\s+(?:connection|error|query|disk|driver)/i,
  /connection\s+refused/i,
  /cannot\s+read\s+properties/i,
  /typeerror/i,
  /syntaxerror/i,
  /referenceerror/i,
  /rangeerror/i,
  /enotfound|econnrefused|econnreset|eacces|enoent|etimedout/i,
  /relation\s+".*"\s+does\s+not\s+exist/i,
  /syntax\s+error\s+at\s+or\s+near/i,
  /unique\s+constraint\s+failed/i,
  /foreign\s+key\s+constraint/i,
  /column\s+".*"\s+does\s+not\s+exist/i,
  /\$2[aby]\$\d+\$[./A-Za-z0-9]{20,}/,
  /(?:jwt|api|signing)[_-]?secret/i,
  /(?:at\s+[a-zA-Z0-9_.]+\s+\()?[\\/].*\.(?:js|ts):\d+:\d+/i,
  /node_modules/i,
];

/**
 * Checks whether an error message or string contains sensitive internal diagnostic details
 * such as database queries, Prisma traces, system errors, or file paths.
 */
export function containsSensitiveInternalDetails(str?: string | null): boolean {
  if (!str || typeof str !== 'string') return false;
  return SENSITIVE_INTERNAL_PATTERNS.some((pattern) => pattern.test(str));
}

/**
 * Hardens GraphQL error formatting for production, staging, and unconfigured environments.
 * Fails closed: only explicit development and test environments preserve stack traces and raw internals.
 */
export function formatGraphQLError(formattedError: any, nodeEnv?: string | null): any {
  if (isDevOrTestEnvironment(nodeEnv)) {
    // Preserve full diagnostics in permitted development / test environments
    return formattedError;
  }

  const extensions = { ...(formattedError.extensions || {}) };

  // Strip stack trace, exception object, and nested originalError in non-dev environments
  delete extensions.stacktrace;
  delete extensions.exception;

  const originalError = extensions.originalError;
  delete extensions.originalError;

  const code = extensions.code;
  const rawMessage = formattedError.message || '';

  // Determine if code is an authorized client-safe code
  const isSafeCode = typeof code === 'string' && PERMITTED_CLIENT_ERROR_CODES.includes(code);

  // Check if message itself or original error leaks internal information
  const messageIsSensitive = containsSensitiveInternalDetails(rawMessage);

  if (!isSafeCode || messageIsSensitive || code === 'INTERNAL_SERVER_ERROR') {
    return {
      message: GENERIC_INTERNAL_ERROR_MESSAGE,
      locations: formattedError.locations,
      path: formattedError.path,
      extensions: {
        ...extensions,
        code: 'INTERNAL_SERVER_ERROR',
      },
    };
  }

  // For validation errors (class-validator) where formattedError.message is generic "Bad Request Exception",
  // safely extract validation messages from originalError if clean
  let clientMessage = rawMessage;
  if (
    originalError &&
    Array.isArray(originalError.message) &&
    originalError.message.length > 0 &&
    (rawMessage === 'Bad Request Exception' || rawMessage === 'Bad Request')
  ) {
    const allMessagesSafe = originalError.message.every(
      (m: any) => typeof m === 'string' && !containsSensitiveInternalDetails(m),
    );
    if (allMessagesSafe) {
      clientMessage = originalError.message.join('; ');
    }
  }

  return {
    message: clientMessage,
    locations: formattedError.locations,
    path: formattedError.path,
    extensions,
  };
}
