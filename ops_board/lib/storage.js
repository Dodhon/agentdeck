const path = require("path");
const fs = require("fs");
const Database = require("better-sqlite3");

function ensureDir(dirPath) {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
}

function defaultDbPath() {
  return path.resolve(__dirname, "..", "ops_board.sqlite");
}

function openDb(dbPath) {
  ensureDir(path.dirname(dbPath));
  const db = new Database(dbPath);
  db.pragma("journal_mode = WAL");

  db.exec(`
    CREATE TABLE IF NOT EXISTS items (
      id TEXT PRIMARY KEY,
      source TEXT NOT NULL,
      source_path TEXT NOT NULL,
      title TEXT NOT NULL,
      status TEXT,
      kind TEXT,
      raw TEXT,
      updated_at TEXT NOT NULL
    );
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS actions (
      id TEXT PRIMARY KEY,
      type TEXT NOT NULL,
      payload TEXT,
      run_id TEXT,
      error TEXT,
      created_at TEXT NOT NULL
    );
  `);

  const actionColumns = db.prepare("PRAGMA table_info(actions)").all();
  const columnNames = new Set(actionColumns.map((column) => column.name));
  if (!columnNames.has("run_id")) {
    db.exec("ALTER TABLE actions ADD COLUMN run_id TEXT;");
  }
  if (!columnNames.has("error")) {
    db.exec("ALTER TABLE actions ADD COLUMN error TEXT;");
  }

  return db;
}

function upsertItems(db, items) {
  const stmt = db.prepare(`
    INSERT INTO items (id, source, source_path, title, status, kind, raw, updated_at)
    VALUES (@id, @source, @source_path, @title, @status, @kind, @raw, @updated_at)
    ON CONFLICT(id) DO UPDATE SET
      source=excluded.source,
      source_path=excluded.source_path,
      title=excluded.title,
      status=excluded.status,
      kind=excluded.kind,
      raw=excluded.raw,
      updated_at=excluded.updated_at;
  `);

  const now = new Date().toISOString();
  const run = db.transaction((rows) => {
    rows.forEach((row) => {
      stmt.run({ ...row, updated_at: now });
    });
  });
  run(items);
}

function upsertAction(db, action) {
  const stmt = db.prepare(`
    INSERT INTO actions (id, type, payload, run_id, error, created_at)
    VALUES (@id, @type, @payload, @run_id, @error, @created_at)
    ON CONFLICT(id) DO UPDATE SET
      type=excluded.type,
      payload=excluded.payload,
      run_id=excluded.run_id,
      error=excluded.error,
      created_at=excluded.created_at;
  `);
  stmt.run(action);
}

function fetchItems(db) {
  return db.prepare("SELECT * FROM items ORDER BY updated_at DESC").all();
}

function updateItemStatus(db, id, status) {
  const stmt = db.prepare(`
    UPDATE items
    SET status = ?, updated_at = ?
    WHERE id = ?;
  `);
  const updatedAt = new Date().toISOString();
  const info = stmt.run(status, updatedAt, id);
  return info.changes > 0;
}

function fetchActions(db) {
  return db.prepare("SELECT * FROM actions ORDER BY created_at DESC").all();
}

module.exports = {
  defaultDbPath,
  openDb,
  upsertItems,
  upsertAction,
  fetchItems,
  updateItemStatus,
  fetchActions,
};
