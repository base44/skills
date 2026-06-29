# base44 sandbox checkpoint

Create a restore-point checkpoint of an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox checkpoint [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--name <name>` | Optional message/title for the checkpoint (defaults to an auto-generated title) | No |

## Examples

```bash
# Create a checkpoint with an auto-generated title
npx base44 sandbox checkpoint

# Create a checkpoint with a custom name
npx base44 sandbox checkpoint --name "before refactor"

# On a specific app (no local project needed)
npx base44 sandbox checkpoint --app-id app_123 --name "stable state"
```

## JSON Output

The command always returns JSON to stdout describing the created checkpoint.

## Notes

- Works from a linked project directory or with `--app-id` / `BASE44_APP_ID`
- Use checkpoints before large edits so you can restore to a known-good state

## Related Commands

- [sandbox-read-file.md](sandbox-read-file.md) - Read files from the sandbox
- [sandbox-write-file.md](sandbox-write-file.md) - Write files to the sandbox
- [sandbox-edit-file.md](sandbox-edit-file.md) - Edit files in the sandbox
