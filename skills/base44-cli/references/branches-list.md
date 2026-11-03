# base44 branches list

List an app's main and active branch names, for use with the global `--branch` option.

## Syntax

```bash
npx base44 branches list [options]
```

## Options

This command takes no command-specific options. It accepts the global `--app-id <id>` and `--json` options.

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Fetches the app's active branches from the server
2. Prepends `main` (always present, always listed first) to the fetched branches
3. Prints each branch's name and status

## Examples

```bash
# List branches for the linked local project
npx base44 branches list

# List branches for a specific app without a local checkout
npx base44 branches list --app-id app_123 --json
```

## Output

Human-readable:
```bash
$ npx base44 branches list
main (active)
feature-x (active)
└ 2 branches
```

With `--json`:
```json
{"branches":[{"name":"main","status":"active"},{"name":"feature-x","status":"active"}]}
```

## Notes

- This is a read-only, discovery-only command — it does not create, delete, or switch branches
- The names it returns are exactly what the global `--branch <name>` option accepts; `--branch` resolves names within the selected app, and an unknown or ambiguous name fails
- `--branch` only targets sandbox commands (`sandbox read/write/edit/grep/ls/run/checkpoint`) — every other command rejects it. Omitting `--branch`, or passing `--branch main`, targets `main`
- `--app-id app_123 --json` is the shape an agent working outside the Builder UI uses to resolve branch names for a given app before targeting one with `--branch`

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 sandbox read` | Read a file from the sandbox (or a branch, with `--branch`) |
| `base44 sandbox write` | Write a file in the sandbox (or a branch, with `--branch`) |
