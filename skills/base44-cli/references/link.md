# base44 link

Links an existing local Base44 project to a Base44 app in the cloud. Use this when you have a `base44/config.jsonc` but haven't connected it to a Base44 app yet.

## Critical: When to Use Link vs Create

| Scenario | Command |
|----------|---------|
| Starting fresh, no `base44/` folder | `npx base44 create` |
| Have `base44/config.jsonc` but no `.app.jsonc` | `npx base44 link` |
| Project already linked (has `.app.jsonc`) | Already done, use `deploy` |

## Syntax

```bash
npx base44 link [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `-c, --create` | Create a new project (skip selection prompt) | No |
| `-n, --name <name>` | Project name (required when `--create` is used) | With `--create` |
| `-d, --description <description>` | Project description | No |
| `-w, --workspace <id>` | Workspace (organization) ID. Scopes the existing-app picker to that workspace, or (with `--create`) the workspace to create the app in. Defaults to your personal workspace | No |
| `--app-id <id>` | App ID to link to an existing project (global flag, skips selection prompt) | No |

## Workspaces

When linking an **existing** app interactively, if you belong to more than one workspace the CLI first asks which workspace, then lists apps scoped to it (apps are listed per workspace). Pass `--workspace <id>` to skip the workspace prompt.

`--app-id` links any app you can access regardless of its workspace — no workspace selection needed. Managed-source apps can't be linked.

## Non-Interactive Mode

For CI/CD or agent use:

**Create a new project:**
```bash
npx base44 link --create --name my-app
```

**Link to an existing app:**
```bash
npx base44 link --app-id <app-id>
```

WRONG: `npx base44 link --create` (missing --name)
WRONG: `npx base44 link --create --app-id <id>` (cannot use both)
RIGHT: `npx base44 link --create --name my-app`
RIGHT: `npx base44 link --app-id <id>`

## Examples

```bash
# Interactive mode - prompts for project details
npx base44 link

# Non-interactive - create and link in one step
npx base44 link --create --name my-app

# With description
npx base44 link --create --name my-app --description "My awesome app"

# Create the new app in a specific workspace
npx base44 link --create --name my-app --workspace 507f1f77bcf86cd799439011

# Link to a specific existing project by ID
npx base44 link --app-id abc123
```

## What It Does

1. Finds the `base44/config.jsonc` in the current directory (or parent directories)
2. Verifies no `.app.jsonc` exists (project not already linked)
3. Either:
   - Creates a new Base44 app in the cloud (with `--create`), OR
   - Links to an existing app (with `--app-id` or interactive selection)
4. Writes the app ID to `base44/.app.jsonc`

## Requirements

- Must have `base44/config.jsonc` in the project
- Must NOT have `base44/.app.jsonc` (use `deploy` if already linked)
- Must be authenticated (run `npx base44 login` first)

## Notes

- After linking, you can deploy resources with `npx base44 deploy`
- The `.app.jsonc` file should be git-ignored (contains your app ID)
