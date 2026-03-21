# Manual QA Checklist

Run before each release or major change.

## Setup

```bash
npm run build
npm link
mkdir -p /tmp/lazy-test
```

## Tests

| # | Command | Expected | Status |
|---|---------|----------|--------|
| 1 | `lazy --version` | Shows current version | |
| 2 | `lazy whoami` | Shows logged-in email | |
| 3 | `lazy status` | Lists configs with name, version, date | |
| 4 | `lazy pull --tool claude --dir /tmp/lazy-test` | Shows diff, asks for confirmation | |
| 5 | `CLAUDE_DIR=/tmp/lazy-test lazy push --tool claude` (empty dir) | Error: "No Claude Code configuration found" | |
| 6 | `lazy teams` | Lists teams with name, slug, role | |
| 7 | `lazy teams info <slug>` | Shows team members | |
| 8 | `lazy teams invitations` | Lists pending invitations or "No pending invitations" | |

## Error handling

| # | Scenario | Expected | Status |
|---|----------|----------|--------|
| 1 | Any command without login (`rm ~/.lazy-raccoon/credentials.json`) | Error: "Not logged in. Run `lazy login` first." | |
| 2 | Invalid tool (`lazy push --tool fake`) | Error about unknown tool | |
| 3 | Non-existent team (`lazy teams info non-existent`) | Error about team not found | |
| 4 | No internet (disconnect wifi) | Error: "Could not connect to server" | |

## Last run

- **Date:** 2026-03-19
- **Version:** 0.3.0
- **Result:** All passing. Found README bug (`lazy teams list` → `lazy teams`), fixed.
