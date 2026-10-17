// ==========================================================================
// طبقة قاعدة البيانات — تعتمد على node:sqlite المدمج (Node 22.5+).
// لا تحتاج أي حزمة خارجية أو بناء أصلي.
// ==========================================================================
import { DatabaseSync } from 'node:sqlite';
import { DB_PATH } from '../config.mjs';

let db;
try {
  db = new DatabaseSync(DB_PATH);
} catch (error) {
  throw new Error(
    `تعذر فتح قاعدة البيانات في ${DB_PATH}. تأكد من استخدام Node.js 22.5 أو أحدث. (${error.message})`,
  );
}

db.exec('PRAGMA journal_mode = WAL;');
db.exec('PRAGMA foreign_keys = ON;');
db.exec('PRAGMA busy_timeout = 5000;');

db.exec(`
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT NOT NULL UNIQUE COLLATE NOCASE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'editor' CHECK(role IN ('admin','editor','publisher')),
  active INTEGER NOT NULL DEFAULT 1,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  last_login_at TEXT
);

CREATE TABLE IF NOT EXISTS sessions (
  id TEXT PRIMARY KEY,
  admin_id INTEGER,
  csrf_token TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  expires_at INTEGER NOT NULL,
  FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE CASCADE
);
CREATE INDEX IF NOT EXISTS idx_sessions_expires ON sessions(expires_at);

CREATE TABLE IF NOT EXISTS schedules (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester TEXT NOT NULL DEFAULT 'S3',
  track TEXT NOT NULL DEFAULT '',
  day TEXT NOT NULL DEFAULT '',
  time TEXT NOT NULL DEFAULT '',
  subject TEXT NOT NULL DEFAULT '',
  professor TEXT NOT NULL DEFAULT '',
  room TEXT NOT NULL DEFAULT '',
  group_name TEXT NOT NULL DEFAULT '',
  subgroups TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  source_note TEXT NOT NULL DEFAULT '',
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX IF NOT EXISTS idx_schedules_lookup ON schedules(semester, track, group_name, status);

CREATE TABLE IF NOT EXISTS courses (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  semester TEXT NOT NULL DEFAULT 'S5',
  track TEXT NOT NULL DEFAULT '',
  name TEXT NOT NULL DEFAULT '',
  professors TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS professors (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  email TEXT NOT NULL DEFAULT '',
  office TEXT NOT NULL DEFAULT '',
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS rooms (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  building TEXT NOT NULL DEFAULT '',
  capacity INTEGER,
  notes TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS announcements (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  kind TEXT NOT NULL DEFAULT 'info' CHECK(kind IN ('info','warning','urgent','event')),
  starts_at TEXT NOT NULL DEFAULT '',
  ends_at TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft','published','archived')),
  created_by INTEGER,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(created_by) REFERENCES admins(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_announcements_status ON announcements(status, updated_at);

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  admin_id INTEGER,
  action TEXT NOT NULL,
  entity TEXT NOT NULL,
  entity_id INTEGER,
  details TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(admin_id) REFERENCES admins(id) ON DELETE SET NULL
);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
`);

export function get(sqlOrStatement, ...params) {
  return prepare(sqlOrStatement).get(...params);
}
export function all(sqlOrStatement, ...params) {
  return prepare(sqlOrStatement).all(...params);
}
export function run(sqlOrStatement, ...params) {
  return prepare(sqlOrStatement).run(...params);
}

function prepare(sqlOrStatement) {
  const sql = typeof sqlOrStatement === 'string' ? sqlOrStatement : sqlOrStatement.source;
  const cached = statementCache.get(sql);
  if (cached) return cached;
  const stmt = db.prepare(sql);
  statementCache.set(sql, stmt);
  return stmt;
}
const statementCache = new Map();

/** تنفيذ مجموعة عمليات في معاملة واحدة. */
export function transaction(fn) {
  db.exec('BEGIN');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }
}

export function cleanupExpiredSessions() {
  run('DELETE FROM sessions WHERE expires_at < ?', Date.now());
}

export default db;
