# base44 dev

Start local development for a linked Base44 project.

This command always starts the Base44 backend locally. If `base44/config.jsonc` defines `site.serveCommand`, it also runs your frontend dev server from the project root and wires it to the local backend automatically.

## Syntax

```bash
npx base44 dev [options]
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `-p, --port <number>` | Port for the local Base44 backend | No | 4400 |
| `--fresh` | Wipe the local data directory before starting, then re-seed | No | - |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Requirements

- Must be run from a **linked local Base44 project**
- `base44/.app.jsonc` must exist
- `base44 dev` cannot be used with `--app-id` or `BASE44_APP_ID`

## What It Does

1. Reads your linked local project configuration
2. Starts the local Base44 backend for entities, functions, and auth routes
3. Opens the persistent local database in `.base44/data/` (created on first run)
4. If the data directory is empty, applies seeds from `base44/seed/` (and `base44/seed.ts` if present)
5. Writes the instance descriptor `.base44/dev.json` (read by `base44 dev status`)
6. Watches local Base44 resources and reloads them when they change — entity edits reload schemas only, data is preserved
7. If `site.serveCommand` is configured, starts your frontend dev server from the project root
8. Injects `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL` into the frontend process
9. Shuts everything down cleanly when you stop the command (removes `dev.json`)

## Local Data Persistence

**Requires CLI version >= 0.0.x (upcoming release).** Local entity data is **persistent by default**:

- Data lives in a gitignored, project-relative `.base44/` directory — it survives restarts and entity-file edits (schemas reload, data preserved)
- `.base44/` is safe to delete at any time; the next `base44 dev` starts clean and re-seeds
- Because state is project-relative, every git worktree gets isolated local data automatically
- Ephemeral is the opt-in: `npx base44 dev --fresh` wipes the data directory and re-seeds on startup
- If `.base44/` belongs to a different app than the linked one (e.g. the folder was relinked), `dev` warns and refuses to start — pass `--fresh` to wipe and continue

## Seed-on-First-Boot Lifecycle

Seeds are applied automatically **only when the data directory is empty** (first run, after `base44 dev reset`, or with `--fresh`). Existing data is never silently re-seeded.

```
base44 dev              # data dir empty? → apply seeds; else leave data alone
base44 dev --fresh      # wipe data dir → apply seeds
base44 dev seed         # apply seeds NOW (idempotent upsert; --replace to truncate first)
base44 dev reset        # wipe + re-seed — the canonical clean-slate command
```

If seed files changed since the last apply, `dev` logs a hint to run `base44 dev seed`.

See [local-data.md](local-data.md) for the full guide: state directory layout, `dev.json` and `base44 dev status`, seed fixture formats (`base44/seed/`), the programmatic `base44/seed.ts` hook, and `base44 data pull` / `base44 data dump`.

## Frontend + Backend Behavior

`base44 dev` works for **both backend and frontend**:

- **Backend**: always runs locally
- **Frontend**: runs only when `base44/config.jsonc` includes `site.serveCommand`

Before using `base44 dev` for full-stack local development, verify your config:

```jsonc
{
  "site": {
    "serveCommand": "npm run dev"
  }
}
```

If `site.serveCommand` is missing, `base44 dev` still works, but it only starts the Base44 backend.

## Examples

```bash
# Start local development on the default port
npx base44 dev

# Start the backend on a specific port
npx base44 dev --port 4500

# Start from a clean slate (wipe local data, re-seed)
npx base44 dev --fresh
```

## Notes

- Use this from a linked local project, not with `--app-id`
- When the frontend is running, the CLI streams backend and frontend output together
- If the frontend process exits, the local dev environment shuts down too
- Local data, seeding, and the related commands (`dev status`, `dev seed`, `dev reset`, `data pull`, `data dump`) are documented in [local-data.md](local-data.md)
