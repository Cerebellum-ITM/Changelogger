# Changelog

All notable changes to this extension will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [0.1.0] - 2026-04-27

### Added
- Initial scaffold of the Changelogger Raycast extension.
- "New Changelog" command: browse GitHub repositories, multi-select commits, and generate a changelog with Raycast AI.
- "Changelog History" command: browse, copy, and delete previously generated changelogs.
- User-editable AI prompt at `~/.config/changelog/prompt.md`, scaffolded on first run.
- Local SQLite history at `~/.config/changelog/history.db` storing prompt snapshot, commit SHAs, output, and the extension version that produced each record.
