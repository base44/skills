# base44 branches list

List main and active branch names for an app, for use with the global `--branch <name>` option.

## Syntax

```bash
npx base44 branches list --app-id <id>
```

## Options

This command only takes the global options — notably `--app-id` (or `BASE44_APP_ID`, or a local `.app.jsonc`) to select the app, and `--json` for machine-readable output.

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Fetches the app's active branches from Base44
2. Prints `main` plus every active branch, each with its status

## Output

```bash
$ npx base44 branches list --app-id app_123

main (active)
feature-x (active)

2 branches
```

```bash
$ npx base44 branches list --app-id app_123 --json
{"branches":[{"name":"main","status":"active"},{"name":"feature-x","status":"active"}]}
```

## Use Cases

- Discover branch names before targeting one with the global `--branch <name>` option on `base44 sandbox` commands
- Let an agent working outside Builder enumerate branches it can read or edit

## Notes

- `main` is always listed first and is not a real branch record — it represents the app's primary branch
- Only `base44 sandbox` subcommands accept `--branch`; every other command rejects it
- See the "Global `--branch` Option" section in [SKILL.md](../SKILL.md) for how `--branch` is used
