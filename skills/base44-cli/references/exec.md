# base44 exec

Run a script with the Base44 SDK pre-authenticated as the current user. Reads the script from stdin.

## Syntax

```bash
cat ./script.ts | npx base44 exec [options]
echo "<code>" | npx base44 exec [options]
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `--local` | Run against the local `base44 dev` server instead of the deployed app | No | `false` |
| `--port <number>` | Port the local dev server is on. Only valid with `--local` | No | `4400` |
| `--privileged` | Run with admin privileges (bypass RLS). Requires app owner/editor role | No | `false` |
| `--data-env <environment>` | Data environment to run against (e.g. `dev`, `prod`) | No | - |

## How It Works

The `exec` command reads a script from stdin and runs it server-side with the Base44 SDK pre-authenticated as the currently logged-in user. This allows you to run one-off scripts against your app's data without writing a full function.

By default the script runs against your deployed app. Pass `--local` to run it against a `base44 dev` server running on your machine instead — useful for testing scripts before they touch production data.

## Available Globals

> **`base44`** — a preinitialized SDK client, available as a global variable in every exec script. You do not need to import or configure it — it is ready to use immediately.

Use it to interact with your app's resources:

- `base44.entities.<EntityName>` — CRUD operations on entities (`.list()`, `.get(id)`, `.create(data)`, `.update(id, data)`, `.delete(id)`)
- `base44.functions.invoke(name, data?)` — call a backend function
- `base44.agents.<AgentName>` — invoke AI agents
- For more available resources and methods, see the [Base44 SDK reference](../../base44-sdk/SKILL.md)

## Examples

```bash
# Run a script file
cat ./script.ts | npx base44 exec

# Inline script
echo "const users = await base44.entities.User.list(); console.log(users)" | npx base44 exec

# Run against a specific app without a local project checkout
cat ./script.ts | npx base44 exec --app-id app_123

# Or resolve the app from the environment
BASE44_APP_ID=app_123 npx base44 exec < ./script.ts

# Against the local dev server (base44 dev must already be running)
echo "await base44.entities.Task.create({ title: 'seed' })" | npx base44 exec --local

# Against a local dev server on a non-default port
echo "..." | npx base44 exec --local --port 4500

# With privileged access (bypass RLS)
echo "const all = await base44.entities.Task.list()" | npx base44 exec --privileged

# Against a specific data environment
echo "..." | npx base44 exec --data-env prod
```

## Requirements

- Must be authenticated (`npx base44 login`)
- Must run in one of these contexts:
  - from a linked Base44 project directory, or
  - with `--app-id <id>`, or
  - with `BASE44_APP_ID` set
- Script must be piped via stdin (non-interactive mode)
- `--port` requires `--local` to also be set

## Running Against the Local Dev Server

`--local` targets a `base44 dev` server already running on your machine instead of the deployed app:

- The SDK authenticates as your current user via a locally-minted token — the dev server decodes it and seeds your user as an admin, so this matches your local session
- Defaults to port `4400` (the same default `base44 dev` binds to); pass `--port` if you started `base44 dev` on a different port
- `base44 dev` must already be running in another terminal — `exec --local` does not start it for you

## Notes

- The script runs with the Base44 SDK pre-authenticated — you can use `base44.entities`, `base44.functions`, etc. directly
- `--app-id` is useful when you want to inspect app data without switching into a linked local project
- `--privileged` bypasses row-level security (RLS); requires the app owner or editor role
- Exit code from the script is forwarded as the CLI process exit code
- This command requires stdin to be piped (it does not accept input in interactive TTY mode)
