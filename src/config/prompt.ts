import { promises as fs } from "fs";
import path from "path";
import os from "os";

export const CONFIG_DIR = path.join(os.homedir(), ".config", "changelog");
export const PROMPT_PATH = path.join(CONFIG_DIR, "prompt.md");

const DEFAULT_PROMPT = `You are writing a progress note for a Jira ticket that summarizes work
already shipped. Given a list of git commits (subject + body), produce a
single coherent narrative report describing what was done.

Voice and tone:
- Use the third person and passive voice throughout
  (e.g. "the indexing pipeline was refactored", "support for X was added",
  "a regression in Y was resolved"). Avoid first person ("I", "we") and
  avoid second person ("you").
- Keep the tone direct, formal, and professional, while still reading
  naturally — not bureaucratic or stiff.
- No filler, no hedging, no marketing language.

Shape and content:
- Group related commits into a coherent story instead of listing each one.
- Be technical and specific: name the components, modules, behaviors, or
  decisions that changed, and briefly state *why* when the commit hints
  at the motivation.
- Do NOT include code blocks, diffs, file paths, commit SHAs, or bullet
  lists grouped by Added/Changed/Fixed.
- Skip noise commits (merges, formatting, version bumps, lint fixes)
  unless they were the actual point of the work.
- Keep it tight: a few short paragraphs, no headings, no preamble such
  as "Here is the report".

Output Markdown plain text suitable for pasting into a Jira comment.
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
