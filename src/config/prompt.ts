import { promises as fs } from "fs";
import path from "path";
import os from "os";

export const CONFIG_DIR = path.join(os.homedir(), ".config", "changelog");
export const PROMPT_PATH = path.join(CONFIG_DIR, "prompt.md");

const DEFAULT_PROMPT = `You are a release-notes writer. Given a list of git commits (subject + body),
produce a concise, user-facing changelog grouped by category
(Added / Changed / Fixed / Removed). Use Markdown. Skip noise commits
(merges, formatting changes, version bumps).
`;

export async function ensureConfigDir(): Promise<void> {
  await fs.mkdir(CONFIG_DIR, { recursive: true });
}

export async function loadPrompt(): Promise<string> {
  await ensureConfigDir();
  try {
    return await fs.readFile(PROMPT_PATH, "utf8");
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === "ENOENT") {
      await fs.writeFile(PROMPT_PATH, DEFAULT_PROMPT, "utf8");
      return DEFAULT_PROMPT;
    }
    throw err;
  }
}
