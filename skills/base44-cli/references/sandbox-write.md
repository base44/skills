# base44 sandbox write

Create or overwrite a file in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox write <path> [options]
# or pipe content via stdin
echo "content" | npx base44 sandbox write <path>
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<path>` | File path relative to the app root | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--content <content>` | File content (if omitted, read from stdin) | No |
| `--overwrite` | Overwrite the file if it already exists | No |

## Examples

```bash
# Write content via stdin
echo "hello world" | npx base44 sandbox write notes.txt

# Write content via flag
npx base44 sandbox write notes.txt --content "hello world" --overwrite

# Write a multi-line file via stdin
cat local-file.ts | npx base44 sandbox write src/remote-file.ts --overwrite
```

## Notes

- Requires app context (`--app-id`, `BASE44_APP_ID`, or a linked project)
- All paths are relative to the app root
- Content can come from `--content` flag or piped stdin; if neither is provided and stdin is a TTY, the command throws an error
- Returns JSON with the write result

## Related Commands

- [sandbox-read.md](sandbox-read.md) - Read file contents
- [sandbox-edit.md](sandbox-edit.md) - Apply exact old→new edits instead of full overwrite
- [sandbox-ls.md](sandbox-ls.md) - List directory entries
