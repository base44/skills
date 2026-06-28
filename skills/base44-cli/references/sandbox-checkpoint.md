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

# Create a checkpoint with a descriptive name
npx base44 sandbox checkpoint --name "before refactor"

# Checkpoint against a specific app
npx base44 sandbox checkpoint --app-id app_123 --name "pre-migration"
```

## Output

Returns a JSON document with the checkpoint details (ID, name, timestamp).

## Notes

- Requires app context (`--app-id`, `BASE44_APP_ID`, or a linked project)
- Use checkpoints before making risky edits (e.g., large refactors, schema migrations)
- Checkpoints can be restored from the Base44 dashboard

## Related Commands

- [sandbox-run.md](sandbox-run.md) - Run commands in the sandbox
- [sandbox-edit.md](sandbox-edit.md) - Edit files in the sandbox
- [sandbox-write.md](sandbox-write.md) - Write files in the sandbox
