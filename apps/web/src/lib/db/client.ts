import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';
import * as schema from './schema';

let _sqlite: any = null;
let _db: any = null;
let _dbPath: string | null = null;

function getDbPath() {
  if (_dbPath) return _dbPath;
  // In Vercel serverless, fs is available but /tmp is writable
  // For local dev, use ./data/autofind.db
  const pathMod = typeof process !== 'undefined' ? require('path') : null;
  const isVercel = !!process.env.VERCEL;
  if (isVercel) {
    _dbPath = '/tmp/autofind.db';
  } else if (process.env.DATABASE_PATH) {
    _dbPath = process.env.DATABASE_PATH;
  } else if (pathMod) {
    _dbPath = pathMod.join(process.cwd(), 'data', 'autofind.db');
  } else {
    _dbPath = '/tmp/autofind.db';
  }
  return _dbPath;
}

export async function initDatabase() {
  if (_db) return _db;

  const SQL = await initSqlJs();
  const dbPath = getDbPath();

  try {
    const fs = require('fs');
    const dir = require('path').dirname(dbPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    if (fs.existsSync(dbPath)) {
      const buffer = fs.readFileSync(dbPath);
      _sqlite = new SQL.Database(buffer);
    } else {
      _sqlite = new SQL.Database();
    }
  } catch {
    // fs not available (e.g. edge runtime) — use in-memory DB
    _sqlite = new SQL.Database();
  }

  _db = drizzle(_sqlite, { schema });
  return _db;
}

export function getDb() {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  return _db;
}

export function saveDb() {
  if (_sqlite && _dbPath) {
    try {
      const fs = require('fs');
      const dir = require('path').dirname(_dbPath);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }
      const data = _sqlite.export();
      fs.writeFileSync(_dbPath, Buffer.from(data));
    } catch {
      // Silent fail in serverless environments
    }
  }
}

// Only register exit handlers in Node.js (not edge runtime)
if (typeof process !== 'undefined' && typeof process.on === 'function') {
  process.on('exit', () => saveDb());
  process.on('SIGINT', () => { saveDb(); process.exit(); });
  process.on('SIGTERM', () => { saveDb(); process.exit(); });
}
