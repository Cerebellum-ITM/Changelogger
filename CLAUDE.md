# Changelogger — Project Context for Claude

This file gives future Claude sessions the context they need to work on this repo.

## What this is

A **Raycast extension** (https://developers.raycast.com/) that turns selected GitHub commits into an AI-generated changelog entry, using a user-editable prompt and a local JSON history file.

## Goal

Let a developer:
1. Open the "New Changelog" command in Raycast.
2. Browse their GitHub repositories (read-only via Personal Access Token).
3. Pick a single repository, then multi-select one or more commits from a list (commit subject on the left, body preview on the right).
4. Send that selection to **Raycast AI** together with a user-editable system prompt.
5. Read the generated changelog as Markdown, optionally save it to a local JSON history, copy it, or regenerate.
6. Browse and manage past records via the "Changelog History" command.

## Hard requirements (do not violate)

- **All user-facing text, code comments, commit messages, and documentation must be in English.** The user prompts in Spanish but the artifact is English.
- **Versioning is first-class.** `package.json` carries the semver version, `src/version.ts` re-exports it, and every saved changelog record stores the `ext_version` that produced it.
- **`CHANGELOG.md` is maintained from `0.1.0` onward** in the [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) format. Add an entry for every user-visible change.
- **GitHub access is read-only.** Never call write endpoints (no create/update/delete on repos, issues, PRs, etc.).
- **AI provider is Raycast AI** via `AI.ask` from `@raycast/api`. Do not add OpenAI / Anthropic SDKs unless the user explicitly asks. The model is selected via the `aiModel` extension preference (dropdown) and passed through to `AI.ask({ model })`.
- **No native Node modules.** Raycast's runtime cannot load `.node` binaries shipped in `node_modules` (e.g. `better-sqlite3`, `sharp`). Use pure-JS alternatives or plain `fs` for persistence.
- **Single git provider for now: GitHub.** GitLab/Bitbucket are explicitly out of scope until requested.

## File layout

```
src/
├── version.ts            # exports VERSION from package.json
├── types.ts              # Repo, Commit, ChangelogRecord
├── new-changelog.tsx     # repos → commits (multi-select) → generate
├── history.tsx           # saved records browser
├── api/github.ts         # Octokit client; listRepos, listCommits
├── ai/generate.ts        # Raycast AI wrapper
├── config/prompt.ts      # ~/.config/changelog/prompt.md loader (scaffolds default)
└── storage/
    ├── db.ts             # readStore/writeStore for ~/.config/changelog/history.json
    └── history.ts        # insertRecord, listRecords, deleteRecord (all async)
```

## External state (lives outside the repo)

- `~/.config/changelog/prompt.md` — user-editable system prompt. Auto-scaffolded with a default on first run. Treat the file as the source of truth; the snapshot in each saved record is for forensics.
- `~/.config/changelog/history.json` — JSON history file. Shape: `{ version: 1, nextId, records: ChangelogRecord[] }`. Loaded/persisted by `src/storage/db.ts`. Treat the `version` field as a forward-compatible migration hook: bump it and add a migration step in `readStore` rather than silently changing the schema, so older files stay readable.

The `~/.config/changelog/` path is set in `src/config/prompt.ts` (`CONFIG_DIR`). Do not duplicate this constant elsewhere.

## Key UX details (don't regress)

- Repo list is sorted by `pushed_at` desc.
- Commit list uses `<List isShowingDetail>` with the body in the right pane.
- Multi-select is implemented client-side via a `Set<string>` of SHAs (Raycast has no built-in multi-select). Toggle with `Ctrl+A`. Generate with `Cmd+Enter`.
- The Generate view streams output via the `data` event from `AI.ask`. Save is a separate explicit action — generation alone does not persist.

## Adding a feature: workflow

1. Read this file plus `CHANGELOG.md` first.
2. Bump `version` in `package.json` (patch for fixes, minor for features, major for breaking schema or UX changes).
3. If the history JSON shape changes, bump the `version` field in `src/storage/db.ts` and migrate inside `readStore` rather than overwriting fields. Saved records from older versions must remain readable.
4. Add a `## [X.Y.Z] - YYYY-MM-DD` section to `CHANGELOG.md` with `Added` / `Changed` / `Fixed` / `Removed` subsections as needed.
5. `npm run lint && npm run build` before declaring done.

## Out of scope (do not add unless asked)

- GitLab / Bitbucket support
- Multiple prompt templates (a `prompts/` folder)
- Branch picker (currently uses repo default branch)
- History export commands (Markdown / JSON dump)
- Telemetry or analytics of any kind
