# base44 exec

Run a script with the Base44 SDK pre-authenticated as the current user. Reads the script from stdin.

## Syntax

```bash
cat ./script.ts | npx base44 exec
echo "<code>" | npx base44 exec
```

## How It Works

The `exec` command reads a script from stdin and runs it server-side with the Base44 SDK pre-authenticated as the currently logged-in user. This allows you to run one-off scripts against your app's data without writing a full function.

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
```

## Requirements

- Must be authenticated (`npx base44 login`)
- Must run in one of these contexts:
  - from a linked Base44 project directory, or
  - with `--app-id <id>`, or
  - with `BASE44_APP_ID` set
- Script must be piped via stdin (non-interactive mode)

## Notes

- The script runs with the Base44 SDK pre-authenticated — you can use `base44.entities`, `base44.functions`, etc. directly
- `--app-id` is useful when you want to inspect app data without switching into a linked local project
- Exit code from the script is forwarded as the CLI process exit code
- This command requires stdin to be piped (it does not accept input in interactive TTY mode)
