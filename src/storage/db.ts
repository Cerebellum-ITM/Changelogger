import Database from "better-sqlite3";
import fs from "fs";
import path from "path";
import { CONFIG_DIR } from "../config/prompt";

export const DB_PATH = path.join(CONFIG_DIR, "history.db");

let cached: Database.Database | null = null;

export function getDb(): Database.Database {
  if (cached) return cached;
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  const db = new Database(DB_PATH);
  db.pragma("journal_mode = WAL");
  migrate(db);
  cached = db;
  return db;
}

function migrate(db: Database.Database): void {
  db.exec(`
    CREATE TABLE IF NOT EXISTS changelogs (
      id             INTEGER PRIMARY KEY AUTOINCREMENT,
      created_at     TEXT    NOT NULL,
      repo_full_name TEXT    NOT NULL,
      commit_shas    TEXT    NOT NULL,
      prompt_used    TEXT    NOT NULL,
      output         TEXT    NOT NULL,
      model          TEXT,
      ext_version    TEXT    NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_changelogs_created ON changelogs(created_at DESC);
  `);
}
