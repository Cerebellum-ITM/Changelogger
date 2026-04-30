import { promises as fs } from "fs";
import path from "path";
import { CONFIG_DIR } from "../config/prompt";
import { ChangelogRecord } from "../types";

export const HISTORY_PATH = path.join(CONFIG_DIR, "history.json");

export const CURRENT_HISTORY_VERSION = 2;

export interface HistoryFile {
  version: typeof CURRENT_HISTORY_VERSION;
  nextId: number;
  records: ChangelogRecord[];
}

const EMPTY: HistoryFile = { version: CURRENT_HISTORY_VERSION, nextId: 1, records: [] };

async function ensureDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function readStore(): Promise<HistoryFile> {
  await ensureDir();
  try {
    const raw = await fs.readFile(HISTORY_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<HistoryFile> & { version?: number };
    const records = Array.isArray(parsed.records) ? (parsed.records as ChangelogRecord[]) : [];
    return {
      version: CURRENT_HISTORY_VERSION,
      nextId: typeof parsed.nextId === "number" ? parsed.nextId : 1,
      records,
    };
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") return { ...EMPTY };
    throw err;
  }
}

export async function writeStore(store: HistoryFile): Promise<void> {
  await ensureDir();
  const tmp = `${HISTORY_PATH}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(store, null, 2), "utf8");
  await fs.rename(tmp, HISTORY_PATH);
}
