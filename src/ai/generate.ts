import { AI } from "@raycast/api";
import { Commit } from "../types";

export interface GenerateInput {
  prompt: string;
  repoFullName: string;
  commits: Commit[];
  model?: string;
  outputLanguage?: string;
}

const LANGUAGE_LABELS: Record<string, string> = {
  "es-MX": "Spanish as spoken in Mexico (es-MX)",
  "es-ES": "Spanish as spoken in Spain (es-ES)",
  "es-419": "Latin American Spanish (es-419)",
  "en-US": "American English (en-US)",
  "en-GB": "British English (en-GB)",
  "pt-BR": "Brazilian Portuguese (pt-BR)",
  "pt-PT": "European Portuguese (pt-PT)",
  fr: "French",
  de: "German",
  it: "Italian",
};

export const DEFAULT_OUTPUT_LANGUAGE = "es-MX";

function languageDirective(code: string): string {
  const label = LANGUAGE_LABELS[code] ?? code;
  return `Write the entire output in ${label}. Translate any English wording from the source commits as needed. Preserve technical identifiers (function names, file names, library names) verbatim.`;
}

function buildUserMessage(input: GenerateInput): string {
  const lines: string[] = [];
  lines.push(`Repository: ${input.repoFullName}`);
  lines.push(`Commits (${input.commits.length}):`);
  lines.push("");
  for (const c of input.commits) {
    lines.push(`- ${c.shortSha} ${c.subject}`);
    if (c.body) {
      for (const bodyLine of c.body.split("\n")) {
        lines.push(`    ${bodyLine}`);
      }
    }
  }
  return lines.join("\n");
}

export const DEFAULT_AI_MODEL = "openai-gpt-4o-mini";

export function generate(input: GenerateInput): {
  promise: Promise<string>;
  onData: (cb: (chunk: string) => void) => void;
} {
  const userMessage = buildUserMessage(input);
  const language = input.outputLanguage ?? DEFAULT_OUTPUT_LANGUAGE;
  const fullPrompt = `${input.prompt.trim()}\n\n${languageDirective(language)}\n\n---\n\n${userMessage}`;

  const model = (input.model ?? DEFAULT_AI_MODEL) as AI.Model;
  const answer = AI.ask(fullPrompt, { model });
  const listeners: Array<(chunk: string) => void> = [];
  answer.on("data", (chunk: string) => {
    for (const fn of listeners) fn(chunk);
  });

  return {
    promise: answer,
    onData: (cb) => {
      listeners.push(cb);
    },
  };
}
