import { AI } from "@raycast/api";
import { Commit } from "../types";

export interface GenerateInput {
  prompt: string;
  repoFullName: string;
  commits: Commit[];
  model?: string;
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
  const fullPrompt = `${input.prompt.trim()}\n\n---\n\n${userMessage}`;

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
