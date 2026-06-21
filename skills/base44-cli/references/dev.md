# base44 dev

Run and manage local development environments for a linked Base44 project.

`base44 dev` is modelled on the Docker CLI: bare `base44 dev` runs a server in
the foreground (backwards compatible), while subcommands manage **background
envs** that survive the shell/agent that started them and can be listed,
inspected, tailed, and stopped by name. This makes parallel work (git
worktrees, multiple agents) safe — each env gets its own port, its own logical
database, and its own log file.

## Syntax

```bash
npx base44 dev [run] [options]      # start (foreground, or background with -d)
npx base44 dev ps [--json]          # list envs
npx base44 dev logs <name> [-n N]   # print an env's logs
npx base44 dev inspect <name>       # url / port / pid / log path (JSON)
npx base44 dev token [options]      # mint an SDK auth token
npx base44 dev stop <name> [--rm]   # stop (and optionally remove) an env
```

## Authentication

**Required**: Yes. Run from a **linked local project** (`base44/.app.jsonc`
must exist). `base44 dev` cannot be used with `--app-id` or `BASE44_APP_ID`.

## Commands

### `dev run`

Start the dev env. This is the default subcommand, so `base44 dev` ≡
`base44 dev run`.

| Option | Description | Default |
|--------|-------------|---------|
| `-d, --detach` | Run in the background and return immediately | off (foreground) |
| `-p, --port <number>` | Port for the local Base44 backend | 4400 (or first free 4400–4500 when detached) |
| `--name <name>` | Background env name | the project directory name |
| `--json` | Print machine-readable JSON (with `--detach`) | off |

Foreground behaviour is unchanged: it starts the backend (and the frontend dev
server if `base44/config.jsonc` sets `site.serveCommand`) and streams output
until you stop it.

Detached (`-d`) spawns the env in the background, waits until it is healthy,
then prints its name, URL, and log path:

```bash
$ base44 dev run -d --json
{
  "name": "regul8",
  "appId": "abc123",
  "port": 4401,
  "url": "http://localhost:4401",
  "status": "running",
  "logPath": "~/.base44/dev-envs/regul8/dev.log"
}
```

### `dev ps`, `dev inspect`, `dev logs`, `dev stop`

```bash
base44 dev ps                 # table of envs (name, status, url, uptime, project)
base44 dev inspect regul8     # full JSON: url, port, pid, logPath, alive
base44 dev logs regul8 -n 100 # last 100 log lines (omit -n for the whole file)
base44 dev stop regul8        # SIGTERM the env (keeps its registry entry)
base44 dev stop regul8 --rm   # stop and remove from the registry
```

Envs live under `~/.base44/dev-envs/<name>/` (`env.json` metadata + `dev.log`).
`ps`/`inspect` reconcile recorded status against the live process, so a crashed
daemon shows as `stopped`/`error` rather than `running`.

### `dev token` — local auth that works with the SDK

The dev server trusts any token whose subject is a known local user, so you do
not need a browser login to get an authenticated session. `dev token` mints one:

```bash
# Token for the seeded CLI admin (default), or any seeded user:
TOKEN=$(base44 dev token)
base44 dev token --email member@example.com
base44 dev token --name regul8 --json   # also prints serverUrl + appId
```

Use it with the SDK two ways:

```js
// 1. Programmatically — pass the token to createClient:
const base44 = createClient({ appId, serverUrl: "http://localhost:4401", token });
await base44.auth.me();   // returns that user, with their role

// 2. In the browser — open the app with ?access_token=<token>.
// The SDK's getAccessToken() reads it from the URL, stores it, and auth.me()
// then returns the user. This is the local equivalent of a login redirect.
```

## Local auth model (how to get a usable session locally)

- On boot the dev server seeds the **logged-in CLI user** into the `User`
  collection as **`role: "admin"`**. That admin can log in with **any
  password** via `base44.auth.loginViaEmailPassword(<cli-email>, "anything")`,
  or you can mint a token with `dev token`.
- **OAuth / `redirectToLogin` / `loginWithProvider` do NOT work against a local
  env** — those redirect to `base44.app`, which has no local app/user (hence
  "App not found"). Use email/password login or `dev token` locally.
- To exercise **roles / RLS**, seed extra users with roles (below) and assume
  them with `dev token --email <user>` (or, for admins, email/password login).

## Env vars + client config

When `dev` runs your frontend (`site.serveCommand`), it injects:

- `VITE_BASE44_APP_ID` — the linked app id
- `VITE_BASE44_APP_BASE_URL` — the local backend URL

The app template's `createClient({ serverUrl: "" })` then talks to the local
backend through the Vite `/api` proxy. For a custom setup, either proxy `/api`
to the backend URL, or pass `serverUrl: "http://localhost:<port>"` directly to
`createClient`.

## Seeding data

The entity DB is in-memory and resets on restart. To start every boot (and
every hot-reload) with predictable data, add JSON fixtures under `base44/seed/`:

```
base44/seed/Customer.json    # array of Customer records
base44/seed/User.json        # extra users, each with email + role
```

```jsonc
// base44/seed/Customer.json
[ { "company": "Acme Inc", "contact": "Wile E. Coyote" } ]

// base44/seed/User.json  — additive; the CLI admin is preserved
[ { "email": "member@example.com", "full_name": "Reggie", "role": "user" } ]
```

Custom-entity records are validated against their schema; `User.json` records
are upserted by email (existing users, including the CLI admin, are left
untouched). A file naming an unknown entity is skipped with a warning.

## Examples

```bash
# Background env per worktree, then drive it from an agent:
base44 dev run -d --json
base44 dev ps
base44 dev logs "$(basename "$PWD")" -n 50   # read errors for self-correction
base44 dev stop "$(basename "$PWD")" --rm
```

## Notes

- Run from a linked local project, not with `--app-id`.
- When a frontend `serveCommand` is configured, its URL is printed to the env's
  log (`dev logs <name>`); the backend URL is what `inspect`/`run --json` report.
- Background envs are independent processes, so each has an isolated database —
  ideal for parallel agents and worktrees.
