# base44 sandbox edit

Apply exact old→new string edits to a file in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox edit <path> [options]
# or pipe edits JSON via stdin
echo '[{"old_text":"foo","new_text":"bar"}]' | npx base44 sandbox edit <path>
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<path>` | File path relative to the app root | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--edits-json <json>` | JSON array of edits (if omitted, read from stdin) | No |
| `--dry-run` | Return the unified diff without writing | No |

## Edit Format

Each edit is a JSON object:

```json
{
  "old_text": "exact string to find",
  "new_text": "replacement string",
  "replace_all": true
}
```

| Field | Type | Description |
|-------|------|-------------|
| `old_text` | string (non-empty) | Exact text to find in the file |
| `new_text` | string | Replacement text (can be empty to delete) |
| `replace_all` | boolean (optional) | Replace all occurrences (default: replace first only) |

## Examples

```bash
# Single edit via flag
npx base44 sandbox edit src/index.ts --edits-json '[{"old_text":"foo","new_text":"bar"}]'

# Multiple edits via stdin
echo '[{"old_text":"foo","new_text":"bar"},{"old_text":"baz","new_text":"qux"}]' \
  | npx base44 sandbox edit src/index.ts

# Preview without writing
npx base44 sandbox edit src/index.ts --dry-run \
  --edits-json '[{"old_text":"a","new_text":"b","replace_all":true}]'
```

## Notes

- Requires app context (`--app-id`, `BASE44_APP_ID`, or a linked project)
- All paths are relative to the app root
- Edits are applied in order; each edit operates on the state after prior edits
- Use `--dry-run` to verify edits before applying them
- Returns JSON with the edit result (or diff when `--dry-run`)

## Related Commands

- [sandbox-read.md](sandbox-read.md) - Read file contents first to construct edits
- [sandbox-write.md](sandbox-write.md) - Full file overwrite
- [sandbox-grep.md](sandbox-grep.md) - Find patterns before editing
