# base44 sandbox write

Create or overwrite a file in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox write <path> [options]
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `<path>` | File path relative to the app root | Yes | — |
| `--content <content>` | File content | No* | read from stdin |
| `--overwrite` | Overwrite the file if it already exists | No | off (fails if the file exists) |

\* Either `--content` or piped stdin is required; the command errors if neither is given and stdin is an interactive TTY.

This command also accepts the global `--branch <name>` option and requires an app context (`--app-id`, `BASE44_APP_ID`, or a linked project).

## Examples

```bash
# Pipe content via stdin
echo "hello" | npx base44 sandbox write notes.txt

# Pass content inline, overwriting an existing file
npx base44 sandbox write notes.txt --content "hello" --overwrite

# Write a new file on a specific branch
npx base44 sandbox write src/new-module.ts --content "export const x = 1;" --branch feature-x
```

## Output

Always a JSON document on stdout:

```json
{ "path": "notes.txt", "bytesWritten": 6, "created": true, "overwritten": false }
```

## Notes

- Without `--overwrite`, writing to a path that already exists fails — pass `--overwrite` to replace it.
- **Writes are committed but not checkpointed.** Only checkpoints appear in the builder's version history; a Restore or Revert there rolls the app back to the last checkpoint and discards everything written after it. Run `base44 sandbox checkpoint` after each unit of work and before you stop — see [sandbox-checkpoint.md](sandbox-checkpoint.md).
