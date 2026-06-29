# base44 sandbox write

Create or overwrite a file in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox write <path> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<path>` | File path relative to the app root | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--content <content>` | File content (if omitted, reads from stdin) | No |
| `--overwrite` | Overwrite the file if it already exists | No |

## Examples

```bash
# Write content from stdin
echo "hello world" | npx base44 sandbox write notes.txt

# Write content via flag (overwrites if exists)
npx base44 sandbox write notes.txt --content "hello" --overwrite

# Write a multi-line file from a local file
cat local-file.ts | npx base44 sandbox write src/remote-file.ts --overwrite

# On a specific app (no local project needed)
npx base44 sandbox write --app-id app_123 config.json --content "{}" --overwrite
```

## JSON Output

Returns a JSON object describing the written file (path, size, etc.).

## Notes

- Works from a linked project directory or with `--app-id` / `BASE44_APP_ID`
- If `--content` is omitted and nothing is piped, the command throws an error
- File content from stdin is preserved verbatim (trailing newlines are not stripped)
- Without `--overwrite`, writing to an existing file will fail

## Related Commands

- [sandbox-read-file.md](sandbox-read-file.md) - Read file contents from the sandbox
- [sandbox-edit-file.md](sandbox-edit-file.md) - Apply targeted edits to a file (preserves unchanged content)
- [sandbox-checkpoint.md](sandbox-checkpoint.md) - Create a restore-point before making changes
