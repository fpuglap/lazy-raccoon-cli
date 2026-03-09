# Lazy Raccoon CLI

Sync your Claude Code config across machines.

## Installation

```bash
npm install -g lazy-raccoon
```

Or for local development:

```bash
npm install
npm run build
npm link
```

## Commands

| Command | Description |
|---------|-------------|
| `lazy login` | Authenticate via browser (opens Chrome) |
| `lazy logout` | Remove stored credentials |
| `lazy push` | Upload local config to cloud |
| `lazy pull` | Download cloud config to local |
| `lazy status` | List all synced configs |
| `lazy whoami` | Show current logged-in user |

## Push & Pull

By default, `push` and `pull` use **smart merge**:

- **push**: local wins on conflicts, cloud-only fields are preserved
- **pull**: cloud wins on conflicts, local-only fields are preserved

Both commands show a diff preview and ask for confirmation before applying changes.

Use `--force` to skip merge and fully overwrite:

```bash
lazy push --force   # cloud becomes exact copy of local
lazy pull --force   # local becomes exact copy of cloud
```

Pull creates a backup (`.claude.backup.<timestamp>`) before writing.

## What gets synced

- `CLAUDE.md`
- `settings.json`
- `.mcp.json`
- `commands/`
- `agents/`
- `skills/`
- `rules/`

## What does NOT get synced

- `settings.local.json`
- `projects/`
- `plugins/`
- `.claude.json`
- History, debug, cache

## Auth flow

1. `lazy login` starts a local server on port 9876
2. Opens Chrome to the web app's `/cli-auth` page
3. User logs in via Clerk (if not already)
4. API key is generated and redirected to `localhost:9876/callback`
5. Token is saved to `~/.lazy-raccoon/credentials.json`

## Environment variables

| Variable | Description |
|----------|-------------|
| `CLAUDE_DIR` | Override `~/.claude` path (useful for testing) |

## Tech stack

TypeScript, Commander.js, chalk, ora, open, tsup
