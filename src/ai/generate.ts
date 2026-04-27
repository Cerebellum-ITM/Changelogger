import { AI } from "@raycast/api";
import { Commit } from "../types";

export interface GenerateInput {
  prompt: string;
  repoFullName: string;
  commits: Commit[];
}

export interface GenerateHandle {
  promise: Promise<string>;
  stream: AsyncIterable<string>;
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

export function generate(input: GenerateInput): {
  promise: Promise<string>;
  onData: (cb: (chunk: string) => void) => void;
} {
  const userMessage = buildUserMessage(input);
  const fullPrompt = `${input.prompt.trim()}\n\n---\n\n${userMessage}`;

  const answer = AI.ask(fullPrompt);
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

export const RAYCAST_AI_MODEL = "raycast-ai-default";
