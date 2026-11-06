// Applies supabase/schema.sql to the Supabase Postgres database. Safe to run repeatedly.
// Usage: node scripts/apply-schema.mjs   (reads POSTGRES_URL from .env.local or the environment)
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { loadEnv } from 'vite';

const SCHEMA_PATH = 'supabase/schema.sql';
const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };
const connectionString = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;

if (!connectionString) {
  console.error('POSTGRES_URL is not set. Run `vercel env pull .env.local` first.');
  process.exit(1);
}

// Supabase requires TLS; its certificate chain isn't in Node's default store.
const client = new pg.Client({
  connectionString: connectionString.replace(/[?&]sslmode=[^&]*/, ''),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(readFileSync(SCHEMA_PATH, 'utf8'));
  console.log(`Applied ${SCHEMA_PATH}`);
} catch (error) {
  console.error('Failed to apply schema:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
