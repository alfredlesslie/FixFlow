const EmbeddedPostgres = require('embedded-postgres').default || require('embedded-postgres');
const path = require('path');
const fs = require('fs');

async function main() {
  const dataDir = path.resolve(__dirname, '..', '.postgres-data');
  const isInitialized = fs.existsSync(path.join(dataDir, 'PG_VERSION'));

  console.log(`[FixFlow DB] Using data directory: ${dataDir}`);
  console.log(`[FixFlow DB] Initialized: ${isInitialized}`);

  const pg = new EmbeddedPostgres({
    databaseDir: dataDir,
    port: 5433,
    user: 'postgres',
    password: 'postgres',
    initialDatabase: 'fixflow_db',
    persistent: true,
  });

  if (!isInitialized) {
    console.log('[FixFlow DB] Initializing PostgreSQL cluster...');
    await pg.initialise();
    console.log('[FixFlow DB] Cluster initialized successfully.');
  }

  console.log('[FixFlow DB] Starting PostgreSQL on port 5433...');
  await pg.start();
  console.log('[FixFlow DB] PostgreSQL is now running on postgresql://postgres:postgres@localhost:5433/fixflow_db');

  // Handle termination signals
  const shutdown = async () => {
    console.log('\n[FixFlow DB] Stopping PostgreSQL...');
    try {
      await pg.stop();
      console.log('[FixFlow DB] PostgreSQL stopped.');
    } catch (err) {
      console.error('[FixFlow DB] Error stopping PostgreSQL:', err);
    }
    process.exit(0);
  };

  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Keep process running
  setInterval(() => {}, 1000 * 60 * 60);
}

main().catch((err) => {
  console.error('[FixFlow DB] Fatal error starting PostgreSQL:', err);
  process.exit(1);
});
