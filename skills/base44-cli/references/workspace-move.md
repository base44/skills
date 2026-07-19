# base44 workspace move

Move the current app to another workspace (organization).

Requires an app context — run from a linked project directory, or pass the global `--app-id <id>` flag.

## Syntax

```bash
npx base44 workspace move [workspace-id] [options]
```

## Arguments & Options

| Argument/Option | Description | Required |
|--------|-------------|----------|
| `workspace-id` | Target workspace (organization) ID | Yes in non-interactive mode |
| `--disconnect-integrations` | Disconnect the app's OAuth integrations as part of the move | No |
| `-y, --yes` | Skip the confirmation prompt | No |

## Non-Interactive Mode

A target `workspace-id` is required — without it, the command fails with:
```
A target workspace ID is required in non-interactive mode.
```

```bash
npx base44 workspace move 507f1f77bcf86cd799439011 -y
```

## Examples

```bash
# Move the linked app (prompts for confirmation)
npx base44 workspace move 507f1f77bcf86cd799439011

# Move a specific app by ID, skipping confirmation
npx base44 workspace move --app-id <app-id> 507f1f77bcf86cd799439011 -y

# Move and disconnect OAuth integrations
npx base44 workspace move 507f1f77bcf86cd799439011 --disconnect-integrations -y

# Machine-readable output
npx base44 workspace move 507f1f77bcf86cd799439011 --json
```

## What It Does

1. Resolves the app from the linked project or `--app-id`
2. If no `workspace-id` argument is given and running interactively, prompts you to pick a destination workspace (every workspace you belong to except the app's current one)
3. Prompts for confirmation unless `-y`/`--yes` is passed
4. Calls the server to move the app; the server authorizes the move and returns a clear error if you're not allowed (e.g. "Only workspace admins and owners can move apps out of this workspace") rather than the CLI validating client-side

## Output

With `--json`, stdout is the move result: `success`, `message`, `appId`, `newWorkspaceId`.
