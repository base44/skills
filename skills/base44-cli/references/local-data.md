# Local Data & Seeding

Persistent local data for `base44 dev`, seed fixtures for deterministic test data, and commands to move records between the remote app and local fixtures.

**Requires CLI version >= 0.0.x (upcoming release).**

## Contents
- [How Persistence Works](#how-persistence-works)
- [State Directory Layout](#state-directory-layout)
- [Instance Discovery: dev.json & base44 dev status](#instance-discovery-devjson--base44-dev-status)
- [Seed Fixtures (base44/seed/)](#seed-fixtures-base44seed)
- [Idempotency Contract](#idempotency-contract)
- [base44 dev seed](#base44-dev-seed)
- [base44 dev reset](#base44-dev-reset)
- [Programmatic Seeding: base44/seed.ts](#programmatic-seeding-base44seedts)
- [base44 data pull](#base44-data-pull)
- [base44 data dump](#base44-data-dump)
- [Agent Guidance](#agent-guidance)

---

## How Persistence Works

`base44 dev` stores entity data in a file-backed database under a gitignored, project-relative `.base44/` directory:

- **Data survives restarts** — stop and restart `base44 dev` freely
- **Data survives entity-file edits** — changing a schema in `base44/entities/` reloads schemas only; records are preserved
- **`.base44/` is safe to delete at any time** — the next `base44 dev` starts clean and re-seeds
- **Every git worktree gets isolated data automatically** — state is project-relative
- Seeds auto-apply **only when the data directory is empty** (first boot, after `base44 dev reset`, or `base44 dev --fresh`); existing data is never silently re-seeded
- If seed files changed since the last apply, `dev` logs a hint to run `base44 dev seed`
- If `.base44/data/meta.json` records a different app id than the linked app (e.g. the folder was relinked), `dev` warns and refuses to start unless `--fresh` is passed

## State Directory Layout

```
.base44/                      # project root, gitignored, safe to delete
├── dev.json                  # instance descriptor (present while a dev server runs)
└── data/
    ├── meta.json             # { formatVersion: 1, appId, seed: { hash, appliedAt } | null }
    ├── <collection>.db       # one file per collection (lowercase entity name)
    └── $user.db              # private auth collection (password hashes)
```

`meta.json` records which app the data belongs to and a hash of the seed files (fixtures + `seed.ts`) at the time they were last applied — that hash powers the "seed files changed" hint.

## Instance Discovery: dev.json & base44 dev status

While `base44 dev` runs, it writes `.base44/dev.json`; the file is removed on graceful shutdown. Stale descriptors (pid no longer alive) are ignored and deleted on read.

```json
{
  "appId": "app_123",
  "url": "http://localhost:4400",
  "port": 4400,
  "pid": 12345,
  "dataDir": "/path/to/project/.base44/data",
  "adminToken": "<per-instance secret>",
  "startedAt": "2026-07-13T10:00:00Z",
  "seed": { "hash": "sha256:…", "appliedAt": "2026-07-13T10:00:01Z" }
}
```

`base44 dev status` prints the descriptor (minus `adminToken`) plus a `running` boolean:

```bash
npx base44 dev status --json
```

```json
{
  "running": true,
  "appId": "app_123",
  "url": "http://localhost:4400",
  "port": 4400,
  "pid": 12345,
  "dataDir": "/path/to/project/.base44/data",
  "startedAt": "2026-07-13T10:00:00Z",
  "seed": { "hash": "sha256:…", "appliedAt": "2026-07-13T10:00:01Z" }
}
```

When no live instance exists, `status` reports `"running": false`.

The running server also exposes local-only admin endpoints under `/_base44/dev/` (`GET status`, `POST seed`, `POST reset`), guarded by the header `x-base44-dev-admin: <adminToken>` from `dev.json`. The CLI calls them automatically when an instance is running — prefer the CLI commands.

## Seed Fixtures (base44/seed/)

Seed fixtures are plain JSONC data files in a committed `base44/seed/` directory (configurable via `seedDir` in `base44/config.jsonc`, default `"seed"`). They are reviewable, diffable, and writable without running anything.

```
base44/seed/
├── users.jsonc               # test app users, created through the real local auth path
├── Task.jsonc                # records for entity "Task" (filename = entity name)
└── Project.jsonc
```

### `users.jsonc`

An array of test users. Each user needs an `email`; everything else is optional. Extra keys are custom User entity fields, validated against the merged User schema.

```jsonc
[
  { "email": "admin@example.com", "role": "admin", "password": "admin1234", "full_name": "Ada Admin" },
  { "email": "user@example.com",  "role": "user",  "password": "user1234" }
]
```

| Field | Description | Required | Default |
|-------|-------------|----------|---------|
| `email` | User email — the upsert key | Yes | - |
| `role` | `"admin"` or `"user"` | No | `"user"` |
| `password` | Password for local login | No | - |
| `full_name` | Display name | No | - |
| *(any other key)* | Custom User entity field | No | - |

Users are created through the same code path as local registration (password hashed into the private auth collection, account verified, role respected). Seeded users can log in via the local `/login` route — this makes role-gated and RLS-driven apps usable locally. The CLI-logged-in user keeps being auto-created as admin, unchanged. Seeded users are **local-only**; they are never pushed to the remote app.

### `<Entity>.jsonc`

An array of records for one entity. The filename must match an entity name (case-insensitive), e.g. `Task.jsonc` for entity `Task`. A fixture file for an unknown entity is a warning — the file is skipped, seeding continues.

```jsonc
[
  {
    "id": "seed-task-1",                 // optional; stable id => upsert on re-seed (idempotent)
    "title": "Ship the seed feature",
    "status": "in_progress",
    "created_by": "user@example.com"     // optional; attributes the record to a seeded user (RLS testing)
  },
  {
    "id": "seed-task-2",
    "title": "Write the docs",
    "status": "todo",
    "created_by": "admin@example.com"
  }
]
```

- `id` (optional) — a stable id makes the record upsert on re-seed; see [Idempotency Contract](#idempotency-contract)
- `created_by` (optional) — the email of a seeded user; sets `created_by`/`created_by_id` on the record so RLS-shaped data works locally. An unknown email is a validation error
- Every record is validated against the entity schema; validation errors cite the fixture file and record index
- Seeded records get `created_date`/`updated_date`/`created_by` defaults exactly like normal creates

**Application order:** `users.jsonc` → entity fixtures (alphabetical by filename) → `base44/seed.ts` (if present). Seeding runs with the **service role** and bypasses RLS — it must, or you couldn't seed other users' rows.

## Idempotency Contract

| Record | Upsert mode (default) | Replace mode (`--replace`, `reset`, `--fresh`) |
|--------|----------------------|------------------------------------------------|
| Entity record **with** `id` | Upserted by id | Inserted (collection truncated first) |
| Entity record **without** `id` | Skipped (counted as `skipped`) unless the run starts from empty | Inserted |
| User (`users.jsonc`) | Upserted by email | Re-created (only previously seeded users are removed — never the CLI-logged-in user) |

- Upsert mode never deletes anything
- Replace mode truncates only collections that have a fixture file
- **Write fixtures with explicit stable ids** so `base44 dev seed` can be re-run safely at any time

## base44 dev seed

Apply seeds on demand, whether or not `base44 dev` is running.

```bash
npx base44 dev seed [--replace] [--force] [--json]
```

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--replace` | Truncate seeded collections first, then insert everything (including id-less records) | No | upsert |
| `--force` | Skip the confirmation prompt (required for `--replace` when non-interactive) | No | - |

What it does:

1. Reads and validates fixtures from `base44/seed/`
2. Applies users, then entity fixtures (alphabetical), then `base44/seed.ts` if present
3. Upserts by id/email (default), or truncates seeded collections first with `--replace`
4. Works against a **running** instance (open UIs update live via realtime events) or **offline** (data files opened directly; a temporary internal instance is booted if `seed.ts` needs to run)

JSON output (`--json`):

```json
{
  "applied": true,
  "mode": "upsert",
  "users": 2,
  "records": { "Task": { "created": 10, "updated": 2, "skipped": 0 } },
  "script": { "ran": true },
  "warnings": []
}
```

`script` is `null` when there is no `base44/seed.ts`.

```bash
# Idempotent re-seed (upsert by id/email)
npx base44 dev seed

# Truncate seeded collections and re-insert everything (non-interactive)
npx base44 dev seed --replace --force --json
```

## base44 dev reset

**The** canonical clean-slate command: wipe the local data directory, reload schemas, re-apply seeds.

```bash
npx base44 dev reset [--force] [--json]
```

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--force` | Skip the confirmation prompt (required when non-interactive) | No | - |

Destructive: prompts in a TTY, fails without `--force` otherwise. Works whether or not a dev server is running. `base44 dev --fresh` is the same semantics fused into startup.

JSON output (`--json`):

```json
{ "reset": true, "seeded": true, "dataDir": ".base44/data" }
```

```bash
# Clean slate, non-interactive
npx base44 dev reset --force --json
```

## Programmatic Seeding: base44/seed.ts

For generated or relational data that fixtures can't express, add an optional `base44/seed.ts` (sibling of the `seed/` directory). It runs **after** all fixtures, in Deno, and default-exports an async function:

```ts
export default async function seed(ctx) {
  // ctx.base44        — SDK client bound to the LOCAL dev server, service role (bypasses RLS)
  // ctx.remote(opts?) — SDK client authenticated as you against the REMOTE linked app
  //                     opts.dataEnv: "prod" (default) | "dev" — remote data environment
  // ctx.log(msg)      — logger (writes to stderr)

  // Pull open orders from the remote app's prod data, write them locally
  const orders = await ctx.remote({ dataEnv: "prod" }).entities.Order.filter({ status: "open" });
  for (const order of orders) {
    await ctx.base44.entities.Order.create(order);
  }
  ctx.log(`Seeded ${orders.length} open orders`);
}
```

- `ctx.base44` — local, service-role client; writes go to the local data directory and bypass RLS
- `ctx.remote({ dataEnv })` — factory for a remote client, authenticated as the CLI user with your real permissions; use it to filter/list/transform remote data before writing locally. **Read remote, write local** — `data pull` is the zero-code version of this pattern
- **Requires Deno** (like backend functions). If Deno is missing and `seed.ts` exists, fixtures are still applied first, then the script step fails with a clear error
- SDK types are available via the `npm:@base44/sdk` specifier

## base44 data pull

Snapshot records from the linked **remote** app into local seed fixtures. Read-only against the remote — it never writes to the remote database.

```bash
npx base44 data pull [--entity <Name>...] [--data-env prod|dev] [--query <json>] [--limit <n>] [--out <dir>] [--force] [--json]
```

**Authentication required** — if not logged in, you'll be prompted to login first.

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--entity <Name>...` | Only pull the listed entities | No | all entities |
| `--data-env <env>` | Remote data environment to read: `prod` or `dev` | No | `prod` |
| `--query <json>` | JSON filter applied to the remote list | No | - |
| `--limit <n>` | Maximum records per entity | No | 1000 |
| `--out <dir>` | Directory to write fixture files to | No | `base44/seed/` |
| `--force` | Overwrite existing fixture files without confirmation | No | - |

What it does:

1. Fetches records from the linked remote app (paginated)
2. Writes one `base44/seed/<Name>.jsonc` per entity — pretty-printed, **ids preserved**, so the resulting fixtures upsert idempotently
3. Logs "pulled N of M" per entity
4. Overwrites existing fixture files only after confirmation (TTY) or with `--force`

```bash
# Snapshot two entities from prod data
npx base44 data pull --entity Task --entity Project

# Pull the app's dev-environment data instead of prod
npx base44 data pull --data-env dev

# Filtered, capped pull
npx base44 data pull --entity Order --query '{"status": "open"}' --limit 200

# Non-interactive overwrite of existing fixtures
npx base44 data pull --entity Task --force --json
```

JSON output (`--json`):

```json
{ "entities": { "Task": { "pulled": 120, "total": 120 } }, "wrote": ["base44/seed/Task.jsonc"] }
```

## base44 data dump

Freeze **local** dev data as committed seed fixtures — "I hand-crafted good data in the local UI; make it the seed."

```bash
npx base44 data dump [--entity <Name>...] [--out <dir>] [--force] [--json]
```

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--entity <Name>...` | Only dump the listed entities | No | all entities |
| `--out <dir>` | Directory to write fixture files to | No | `base44/seed/` |
| `--force` | Overwrite existing fixture files without confirmation | No | - |

Reads local data from the running instance if one is up, otherwise directly from `.base44/data/`. Ids are preserved; internal fields are stripped. JSON output has the same shape as `data pull`.

```bash
# Freeze all local data as the committed seed
npx base44 data dump --force
```

## Agent Guidance

- **Everything honors the global `--json` flag** — stdout is one machine-readable JSON document; prompts, spinners, and logs go to stderr. Always pass `--json` when parsing output
- **Destructive operations require `--force` when non-interactive**: `dev reset`, `dev seed --replace`, and `data pull`/`data dump` over existing fixture files all prompt in a TTY and fail without `--force` otherwise
- **Discover a running instance** with `npx base44 dev status --json`, or read `.base44/dev.json` directly (present only while a dev server runs; the CLI ignores and deletes stale descriptors whose pid is no longer alive). Use `url`/`port` to reach the server
- **`dev seed` / `dev reset` work with or without a running server** — same observable result either way; no need to stop `base44 dev` first
- **Fixtures are plain data** — write or edit `base44/seed/*.jsonc` directly without running anything, and use explicit stable `id`s so re-seeding stays idempotent
- **Seeded users and roles are local-only** — nothing in `base44/seed/` is ever pushed to the remote app
