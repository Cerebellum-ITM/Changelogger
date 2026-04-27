import { getDb } from "./db";
import { ChangelogRecord } from "../types";
import { VERSION } from "../version";

interface InsertInput {
  repoFullName: string;
  commitShas: string[];
  promptUsed: string;
  output: string;
  model: string | null;
}

interface Row {
  id: number;
  created_at: string;
  repo_full_name: string;
  commit_shas: string;
  prompt_used: string;
  output: string;
  model: string | null;
  ext_version: string;
}

function rowToRecord(row: Row): ChangelogRecord {
  return {
    id: row.id,
    createdAt: row.created_at,
    repoFullName: row.repo_full_name,
    commitShas: JSON.parse(row.commit_shas) as string[],
    promptUsed: row.prompt_used,
    output: row.output,
    model: row.model,
    extVersion: row.ext_version,
  };
}

export function insertRecord(input: InsertInput): ChangelogRecord {
  const db = getDb();
  const createdAt = new Date().toISOString();
  const stmt = db.prepare(`
    INSERT INTO changelogs (created_at, repo_full_name, commit_shas, prompt_used, output, model, ext_version)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);
  const info = stmt.run(
    createdAt,
    input.repoFullName,
    JSON.stringify(input.commitShas),
    input.promptUsed,
    input.output,
    input.model,
    VERSION,
  );
  return {
    id: Number(info.lastInsertRowid),
    createdAt,
    repoFullName: input.repoFullName,
    commitShas: input.commitShas,
    promptUsed: input.promptUsed,
    output: input.output,
    model: input.model,
    extVersion: VERSION,
  };
}

export function listRecords(): ChangelogRecord[] {
  const db = getDb();
  const rows = db.prepare(`SELECT * FROM changelogs ORDER BY created_at DESC`).all() as Row[];
  return rows.map(rowToRecord);
}

export function deleteRecord(id: number): void {
  const db = getDb();
  db.prepare(`DELETE FROM changelogs WHERE id = ?`).run(id);
}
