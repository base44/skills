# base44 site dev

Run the site's `serveCommand` exactly as written, with **no local backend**. The frontend reaches its backend same-origin — the shape a hosted sandbox needs.

## Syntax

```bash
npx base44 site dev [-- args...]
```

## Options

| Argument | Description | Required |
|----------|-------------|----------|
| `[args...]` | Arguments appended to the `serveCommand`, after `--` | No |

## Authentication

**Not required.**

## Requirements

- Needs an app context: a linked local project (`base44/.app.jsonc`) or `--app-id`/`BASE44_APP_ID` with a local project present
- Typically run from a hosted sandbox, where the project exists but may have no `.app.jsonc`

## What It Does

1. Reads `site.serveCommand` from `base44/config.jsonc` (defaults to `npm run dev` if the project has a `site` block but no `serveCommand`, or no `site` block at all)
2. Runs it as written in the project root, with no local backend started
3. The app id is injected via `VITE_BASE44_APP_ID`, so the frontend reaches its own backend same-origin (in a sandbox, `@base44/vite-plugin` binds Base44 apps to `0.0.0.0:5173`)

## How `site dev` Differs from `base44 dev`

| Command | Backend | Target machine |
|---------|---------|-----------------|
| `base44 dev` | Starts a **local** backend | Developer machine |
| `base44 dev --remote` | None — frontend only, against **production** | Developer machine |
| `base44 site dev` | None — frontend only, same-origin to wherever it's served | Hosted sandbox |

`base44 site dev` appends nothing of its own: anything you put after `--` is passed through as given. Because the command itself needs no `--`, a script that takes its own `--` needs a second one to reach it:

```bash
# Forward "-- --config wrapper.mjs" to `npm run dev`
npx base44 site dev -- -- --config wrapper.mjs
```

## Examples

```bash
# Run the configured serveCommand as-is
npx base44 site dev

# Forward extra args to the serveCommand
npx base44 site dev -- --host
```

## Notes

- Where the dev server binds is the `serveCommand`'s own business — `site dev` does not control it
- Falls back to `npm run dev` only when the project's `site` block names no `serveCommand`
- Use `base44 dev` instead on a developer machine that needs a local backend too
