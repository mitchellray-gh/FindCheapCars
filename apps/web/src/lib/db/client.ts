import { drizzle } from 'drizzle-orm/libsql';
import { createClient, type Client } from '@libsql/client';
import * as schema from './schema';
import { ensureSchema, seedReferenceData } from './bootstrap';

let _client: Client | null = null;
let _db: ReturnType<typeof drizzle> | null = null;
let _initPromise: Promise<ReturnType<typeof drizzle>> | null = null;

function resolveUrl(): { url: string; authToken?: string } {
  // Production / hosted: Turso (libSQL over HTTP). Set these on Vercel.
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  if (tursoUrl) {
    return { url: tursoUrl, authToken: process.env.TURSO_AUTH_TOKEN };
  }

  // Local dev: a plain SQLite file via libSQL's file: protocol.
  const rawPath = process.env.DATABASE_PATH
    ? process.env.DATABASE_PATH
    : `${process.cwd()}/data/autofind.db`;
  // libSQL file URLs use forward slashes even on Windows.
  const normalized = rawPath.replace(/\\/g, '/');
  return { url: `file:${normalized}` };
}

export async function initDatabase() {
  if (_db) return _db;
  if (_initPromise) return _initPromise;

  _initPromise = (async () => {
    const { url, authToken } = resolveUrl();
    _client = createClient({ url, authToken });
    _db = drizzle(_client, { schema });
    await ensureSchema(_client);
    await seedReferenceData(_db);
    return _db;
  })();

  return _initPromise;
}

export function getDb() {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  return _db;
}

export function getClient() {
  if (!_client) throw new Error('Database not initialized. Call initDatabase() first.');
  return _client;
}

/**
 * No-op retained for API compatibility. libSQL writes are persisted immediately
 * (to the local file or Turso), so there is nothing to flush.
 */
export function saveDb() {}
