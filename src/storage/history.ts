import { readStore, writeStore } from "./db";
import { ChangelogRecord } from "../types";
import { VERSION } from "../version";

interface InsertInput {
  repoFullName: string;
  commitShas: string[];
  promptUsed: string;
  output: string;
  model: string | null;
}

export async function insertRecord(input: InsertInput): Promise<ChangelogRecord> {
  const store = await readStore();
  const record: ChangelogRecord = {
    id: store.nextId,
    createdAt: new Date().toISOString(),
    repoFullName: input.repoFullName,
    commitShas: input.commitShas,
    promptUsed: input.promptUsed,
    output: input.output,
    model: input.model,
    extVersion: VERSION,
  };
  store.records.push(record);
  store.nextId += 1;
  await writeStore(store);
  return record;
}

export async function listRecords(): Promise<ChangelogRecord[]> {
  const store = await readStore();
  return [...store.records].sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export async function deleteRecord(id: number): Promise<void> {
  const store = await readStore();
  store.records = store.records.filter((r) => r.id !== id);
  await writeStore(store);
}
