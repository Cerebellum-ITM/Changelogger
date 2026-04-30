# Changelog

All notable changes to this extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.4.1] - 2026-04-29

### Changed
- Commit selection toggle in the New Changelog command remapped from `Cmd+T` to `Ctrl+A`.

## [0.4.0] - 2026-04-29

### Added
- New `outputLanguage` extension preference: pick the language the generated changelog is written in (Spanish (Mexico) by default; also Spanish (Spain) / Latin America, English (US/UK), Portuguese (BR/PT), French, German, Italian). The selected language is shown in the generation metadata panel and re-runs generation when changed.

### Changed
- Default scaffolded prompt at `~/.config/changelog/prompt.md` rewritten to produce a Jira-style progress note in third person and passive voice, with a direct, formal, professional tone. Existing user prompt files are left untouched.
- `generate()` now accepts an `outputLanguage` and appends a language directive to the prompt before calling Raycast AI; technical identifiers are preserved verbatim.

## [0.3.0] - 2026-04-29

### Added
- Branch picker in the New Changelog command. Press `Cmd+B` from the commit list to switch the active branch; the commit list reloads from the chosen branch and the selection is reset.
- Saved records now store the `branch` they were generated from. The branch is shown in the generation metadata panel, the history list subtitle, and the history detail view.

### Changed
- `src/api/github.ts` exports a new `listBranches(repo)` function (read-only, paginated). `listCommits` now accepts an optional `branch` argument and falls back to the repository default branch.
- History JSON `version` bumped to `2`. The schema adds an optional `branch` field on records; older records without it remain readable, so no destructive migration is performed.

## [0.2.1] - 2026-04-29

### Changed
- Default scaffolded prompt at `~/.config/changelog/prompt.md` now produces a first-person, Jira-style narrative progress note instead of a categorized Added/Changed/Fixed changelog. Existing user prompt files are left untouched.

## [0.2.0] - 2026-04-27

### Added
- New `aiModel` extension preference: pick the Raycast AI model used to generate the changelog. The selected model is shown in the generation metadata panel and stored on each saved record.

### Changed
- History storage moved from SQLite (`history.db`) to a plain JSON file at `~/.config/changelog/history.json`. Raycast's runtime cannot load native modules such as `better-sqlite3`, which previously caused "Could not locate the bindings file" errors when saving a record.
- Removed `better-sqlite3` and `@types/better-sqlite3` dependencies.

## [0.1.0] - 2026-04-27

### Added
- Initial scaffold of the Changelogger Raycast extension.
- "New Changelog" command: browse GitHub repositories, multi-select commits, and generate a changelog with Raycast AI.
- "Changelog History" command: browse, copy, and delete previously generated changelogs.
- User-editable AI prompt at `~/.config/changelog/prompt.md`, scaffolded on first run.
- Local SQLite history at `~/.config/changelog/history.db` storing prompt snapshot, commit SHAs, output, and the extension version that produced each record.
