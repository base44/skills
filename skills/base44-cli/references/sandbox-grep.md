# base44 sandbox grep

Search files for a pattern in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox grep <pattern> [options]
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `<pattern>` | Search pattern | Yes | — |
| `--path <path>` | Subtree to search, relative to the app root | No | app root |
| `--no-regex` | Treat the pattern as a literal string, not a regex | No | off (pattern is treated as a regex) |
| `--case-sensitive` | Case-sensitive match | No | off (case-insensitive) |
| `--glob <glob>` | File glob filter, e.g. `"*.tsx"` | No | no filter |
| `--max-results <n>` | Maximum number of match lines to return | No | server default |

`--no-regex` is the only regex-related flag (there is no `--regex`): by default `<pattern>` is interpreted as a regular expression; pass `--no-regex` to match it literally.

This command also accepts the global `--branch <name>` option and requires an app context (`--app-id`, `BASE44_APP_ID`, or a linked project).

## Examples

```bash
# Regex search from the app root
npx base44 sandbox grep "TODO\(.*\)"

# Literal, case-sensitive search scoped to a subtree and file type
npx base44 sandbox grep "useEffect" --no-regex --case-sensitive --path src/components --glob "*.tsx"

# Cap the number of match lines returned
npx base44 sandbox grep "export function" --max-results 20
```

## Output

Always a JSON document on stdout:

```json
{
  "matches": [
    { "path": "src/index.ts", "line": 12, "text": "// TODO(alice): clean this up" }
  ],
  "truncated": false,
  "returnedMatches": 1
}
```

`truncated: true` means more matches existed than were returned — narrow `--path`/`--glob` or raise `--max-results` rather than assuming you've seen everything.

## Notes

- Searches the remote sandbox's files, not your local checkout.
