# base44 sandbox grep

Search files for a pattern in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox grep <pattern> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<pattern>` | Search pattern (regex by default) | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--path <path>` | Subtree to search, relative to the app root | No |
| `--no-regex` | Treat the pattern as a literal string, not a regex | No |
| `--case-sensitive` | Case-sensitive match | No |
| `--glob <glob>` | File glob filter (e.g. `"*.tsx"`) | No |
| `--max-results <n>` | Maximum number of match lines to return | No |

## Examples

```bash
# Search for a pattern across all files
npx base44 sandbox grep "fetchUser"

# Search only in src/
npx base44 sandbox grep "fetchUser" --path src

# Literal string search (no regex)
npx base44 sandbox grep "user.email" --no-regex

# Case-sensitive search in TypeScript files
npx base44 sandbox grep "useState" --case-sensitive --glob "*.tsx"

# Limit results
npx base44 sandbox grep "TODO" --max-results 20
```

## Output

Returns a JSON document with matching lines, their file paths, and line numbers.

## Notes

- Requires app context (`--app-id`, `BASE44_APP_ID`, or a linked project)
- Patterns are treated as regular expressions by default; use `--no-regex` for literal matching
- Search is case-insensitive by default; use `--case-sensitive` to match case exactly

## Related Commands

- [sandbox-read.md](sandbox-read.md) - Read a specific file after finding it
- [sandbox-edit.md](sandbox-edit.md) - Edit a file after locating the target text
- [sandbox-ls.md](sandbox-ls.md) - List directory structure
