# Changelog

## 0.3.4

- Add backup pruning (keep most recent 5) and file permission preservation on pull
- Add API retry with exponential backoff on 5xx errors
- Add Zod runtime validation for all API responses
- Bind OAuth callback server to loopback address (127.0.0.1) for security

## 0.3.3

- Fix path traversal vulnerability in config writer (directory file paths are now validated)
- Fix credentials file permissions to owner-only (0o600)
- Update README with separate demo GIFs for push, pull, and status

## 0.3.2

- Add push messages: `lazy push -m "description"` to attach a message to each version
- Auto-generate change summary from diff (e.g., "Added commands/refactor.md, Modified settings.json")
- Send message and changeSummary with push API
- Add tests for change summary generation

## 0.3.1

- Fix login to fetch real email from API instead of placeholder
- Add `withSpinner` helper to centralize error handling
- Refactor all commands to use shared helpers (`getMe`, `withSpinner`)
- Remove unused code and improve `safeJsonParse` error messages
- Add tests for merge, diff, and tool definitions
- Rewrite README with logo, demo GIF, all tools, and teams documentation
- Add MIT license
- Replace personal email with `hello@lazyraccoon.dev`
- Use system default browser for login instead of hardcoded Chrome

## 0.3.0

- Add teams support: create, invite, leave, accept invitations
- Add `--team` / `-T` flag to push and pull for team configs
- Add `lazy teams` command with subcommands

## 0.2.4

- Read version from `package.json` at runtime

## 0.2.3

- Update API URL to `lazyraccoon.dev`

## 0.2.2

- Send device hostname on login for device identification

## 0.2.0

- Add multi-tool support: Claude Code, Cursor, GitHub Copilot, Gemini CLI, Windsurf, Cline
- Add `--tool` flag to push and pull
- Add `--dir` flag to pull for custom target directory
- Add `--profile` flag for named profiles
- Strategy + Registry architecture for tool definitions

## 0.1.0

- Initial release
- Push and pull with smart merge and diff preview
- `--force` flag to skip merge
- Login via browser with OAuth callback
- `whoami`, `status`, `logout` commands
- `CLAUDE_DIR` env var override
