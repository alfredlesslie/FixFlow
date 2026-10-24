/**
 * Database target verification helper.
 * Strictly prevents any migration or test cleanup from running against fixflow_db.
 */
export function assertTestDatabase(databaseUrl: string): string {
  if (!databaseUrl) {
    throw new Error('[CRITICAL DATABASE SAFETY] DATABASE_URL is not set.');
  }
  const parsed = new URL(databaseUrl.replace('postgresql://', 'http://'));
  const dbName = parsed.pathname.replace(/^\//, '');

  if (dbName === 'fixflow_db') {
    throw new Error(
      `[CRITICAL DATABASE SAFETY VIOLATION] Attempted to run test/disposable operation against production/demo database "${dbName}"! Operation blocked.`
    );
  }

  if (!dbName.includes('test')) {
    throw new Error(
      `[CRITICAL DATABASE SAFETY VIOLATION] Target database "${dbName}" does not contain "test" in its name! Operation blocked.`
    );
  }

  return dbName;
}
