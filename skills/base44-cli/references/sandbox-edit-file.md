# base44 sandbox edit

Apply exact old→new string edits to a file in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox edit <path> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<path>` | File path relative to the app root | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--edits-json <json>` | JSON array of edits. If omitted, reads from stdin | No |
| `--dry-run` | Return the unified diff without writing the file | No |

## Edit Format

Each edit is a JSON object:
```json
{ "old_text": "...", "new_text": "...", "replace_all": true }
```

- `old_text` — exact string to find (must be non-empty)
- `new_text` — replacement string (can be empty to delete)
- `replace_all` — optional boolean; if `true`, replaces all occurrences (default: first only)

Pass as an array: `[{ "old_text": "foo", "new_text": "bar" }]`

## Examples

```bash
# Edit via piped stdin
echo '[{"old_text":"foo","new_text":"bar"}]' | npx base44 sandbox edit src/x.ts

# Edit via flag
npx base44 sandbox edit src/x.ts --edits-json '[{"old_text":"a","new_text":"b","replace_all":true}]'

# Dry run — see the diff without writing
npx base44 sandbox edit src/x.ts --dry-run --edits-json '[{"old_text":"a","new_text":"b"}]'
```

## JSON Output

Returns a JSON object describing the applied edits or (with `--dry-run`) the unified diff.

## Notes

- Works from a linked project directory or with `--app-id` / `BASE44_APP_ID`
- If `--edits-json` is omitted and nothing is piped, the command throws an error

## Related Commands

- [sandbox-read-file.md](sandbox-read-file.md) - Read file contents from the sandbox
- [sandbox-write-file.md](sandbox-write-file.md) - Create or overwrite a file in the sandbox
- [sandbox-grep.md](sandbox-grep.md) - Search files in the sandbox
