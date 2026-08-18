import { drizzle } from 'drizzle-orm/sql-js';
import initSqlJs from 'sql.js';
import * as schema from './schema';
import path from 'path';
import fs from 'fs';

const dbPath = process.env.DATABASE_PATH || path.join(process.cwd(), 'data', 'autofind.db');

const dir = path.dirname(dbPath);
if (!fs.existsSync(dir)) {
  fs.mkdirSync(dir, { recursive: true });
}

let _sqlite: any = null;
let _db: any = null;

export async function initDatabase() {
  if (_db) return _db;
  const SQL = await initSqlJs();
  if (fs.existsSync(dbPath)) {
    const buffer = fs.readFileSync(dbPath);
    _sqlite = new SQL.Database(buffer);
  } else {
    _sqlite = new SQL.Database();
  }
  _db = drizzle(_sqlite, { schema });
  return _db;
}

export function getDb(): ReturnType<typeof drizzle<typeof schema>> {
  if (!_db) throw new Error('Database not initialized. Call initDatabase() first.');
  return _db;
}

export function saveDb() {
  if (_sqlite) {
    const data = _sqlite.export();
    fs.writeFileSync(dbPath, Buffer.from(data));
  }
}

process.on('exit', () => saveDb());
process.on('SIGINT', () => { saveDb(); process.exit(); });
process.on('SIGTERM', () => { saveDb(); process.exit(); });
