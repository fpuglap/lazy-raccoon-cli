# Contributing

Thanks for your interest in contributing to Lazy Raccoon!

## Prerequisites

- Node.js 18 or higher

## Getting started

```bash
git clone https://github.com/fpuglap/lazy-raccoon-cli.git
cd lazy-raccoon-cli
npm install
npm run build
npm link
```

## Development

- `npm run build` — Build the CLI
- `npm run dev` — Build in watch mode
- `npm test` — Run tests

To test push/pull, you need a free account at [lazyraccoon.dev](https://lazyraccoon.dev). After signing up, run `lazy login` to authenticate.

Use a temporary directory to avoid overwriting your real configs:

```bash
CLAUDE_DIR=/tmp/lazy-test lazy push --tool claude
lazy pull --tool claude --dir /tmp/lazy-test
```

## Making changes

1. Create a branch from `main` (or fork the repo if you're not a collaborator)
2. Make your changes
3. Add tests if applicable
4. Run `npm test` to make sure tests pass
5. Run `npm run build` to make sure it compiles
6. Open a pull request

## Pull request rules

- **No direct pushes to `main`** — all changes go through a PR
- **1 approving review required** — another collaborator must approve before merging
- **Tests must pass** — CI runs automatically on every PR
- **Stale reviews are dismissed** — if you push new changes after approval, it needs to be re-approved

## Adding a new tool

1. Create a new file in `src/lib/tools/` (e.g. `newtool.ts`)
2. Define the tool with `id`, `label`, `getDir`, and `files`
3. Register it in `src/lib/tools/index.ts`

## Code style

- TypeScript strict mode
- ES modules
- Use `withSpinner()` for async operations with loading state
- Use `getErrorMessage()` for error formatting
- Keep commands focused — one file per command

## Reporting bugs

Open an issue or email hello@lazyraccoon.dev.
