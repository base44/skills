# base44 workspace move

Moves an app from its current workspace (organization) into another one. The app keeps its ID, data, and owner — only its owning workspace changes.

The app is resolved from the linked project (`base44/.app.jsonc`), the global `--app-id` flag, or the `BASE44_APP_ID` environment variable.

## Syntax

```bash
npx base44 workspace move [workspace-id] [options]
```

## Arguments & Options

| Argument/Option | Description | Required |
|-----------------|-------------|----------|
| `workspace-id` | Target workspace (organization) ID | Yes (non-interactive) |
| `--disconnect-integrations` | Disconnect the app's OAuth integrations as part of the move | No |
| `-y, --yes` | Skip the confirmation prompt | No |

In interactive mode you can omit `workspace-id` to pick the target from a list and confirm. In non-interactive mode (CI, `--json`), the target workspace ID is required.

## Examples

```bash
# Move the linked app to a workspace
npx base44 workspace move 507f191e810c19729de860ea

# Move a specific app without prompts (for scripts)
npx base44 workspace move 507f191e810c19729de860ea --app-id your-app-id --yes
```

## Requirements

- Must be authenticated (`npx base44 login`).
- You must be an owner, admin, or editor of the **target** workspace, and your role in the **source** workspace must permit transferring apps out.
- Purchased (marketplace) apps cannot be moved.

## Related

- [workspace-list.md](workspace-list.md) — find workspace IDs
- [create.md](create.md) — create an app directly in a workspace
