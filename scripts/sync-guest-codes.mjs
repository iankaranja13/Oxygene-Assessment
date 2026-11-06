// Loads every valid check-in code from data/guests.json into the private guest_codes
// table, so attendees can prove they're guests without phones ever seeing the list.
// Codes are normalized exactly as the app does it (e.g. "oxy 1049" -> "OXY-1049").
// Run after apply-schema, and again whenever the guest list changes.
// Usage: node scripts/sync-guest-codes.mjs
import { readFileSync } from 'node:fs';
import pg from 'pg';
import { loadEnv } from 'vite';
import { normalizeGuests } from '../src/lib/normalizeGuests.js';

const env = { ...loadEnv('development', process.cwd(), ''), ...process.env };
const connectionString = env.POSTGRES_URL_NON_POOLING || env.POSTGRES_URL;
if (!connectionString) {
  console.error('POSTGRES_URL is not set. Run `vercel env pull .env.local` first.');
  process.exit(1);
}

const { guests } = normalizeGuests(JSON.parse(readFileSync('data/guests.json', 'utf8')));
const codes = [...new Set(guests.map((guest) => guest.checkInCode).filter(Boolean))];

const client = new pg.Client({
  connectionString: connectionString.replace(/[?&]sslmode=[^&]*/, ''),
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query('begin');
  // Replace the whole set so removed guests lose access.
  await client.query('delete from public.guest_codes');
  await client.query('insert into public.guest_codes (code) select unnest($1::text[])', [codes]);
  await client.query('commit');
  console.log(`Loaded ${codes.length} guest codes into guest_codes.`);
} catch (error) {
  await client.query('rollback').catch(() => {});
  console.error('Failed to sync guest codes:', error.message);
  process.exitCode = 1;
} finally {
  await client.end();
}
