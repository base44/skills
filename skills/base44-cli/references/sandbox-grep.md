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
| `--case-sensitive` | Case-sensitive match (default: case-insensitive) | No |
| `--glob <glob>` | File glob filter, e.g. `"*.tsx"` | No |
| `--max-results <n>` | Maximum number of match lines to return | No |

## Examples

```bash
# Search for a pattern in all files
npx base44 sandbox grep "TODO"

# Literal string search (not regex)
npx base44 sandbox grep "console.log(" --no-regex

# Search only TypeScript files
npx base44 sandbox grep "useState" --glob "*.tsx"

# Case-sensitive search in a specific directory
npx base44 sandbox grep "MyComponent" --path src/components --case-sensitive

# Limit to 20 results
npx base44 sandbox grep "import" --max-results 20
```

## JSON Output

Returns a JSON object with match lines, file paths, and line numbers.

## Notes

- Works from a linked project directory or with `--app-id` / `BASE44_APP_ID`
- Pattern is treated as a regex by default; use `--no-regex` for literal searches

## Related Commands

- [sandbox-read-file.md](sandbox-read-file.md) - Read a specific file's contents
- [sandbox-list-directory.md](sandbox-list-directory.md) - List directory entries
- [sandbox-edit-file.md](sandbox-edit-file.md) - Edit files in the sandbox
