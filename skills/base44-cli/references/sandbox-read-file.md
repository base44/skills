# base44 sandbox read

Read file contents from an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox read <paths...> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<paths...>` | One or more file paths relative to the app root | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--offset <n>` | 1-based start line | No |
| `--limit <n>` | Max lines to return from offset | No |

## Examples

```bash
# Read a single file
npx base44 sandbox read src/index.ts

# Read multiple files at once
npx base44 sandbox read src/index.ts src/utils.ts

# Read lines 10–30 of a file
npx base44 sandbox read src/index.ts --offset 10 --limit 20

# On a specific app (no local project needed)
npx base44 sandbox read --app-id app_123 package.json
```

## JSON Output

Returns a JSON object with the file content(s) and metadata.

## Notes

- Works from a linked project directory or with `--app-id` / `BASE44_APP_ID`
- `--offset` and `--limit` use 1-based line numbers, matching common editor conventions

## Related Commands

- [sandbox-write-file.md](sandbox-write-file.md) - Write or overwrite a file
- [sandbox-edit-file.md](sandbox-edit-file.md) - Apply exact edits to a file
- [sandbox-list-directory.md](sandbox-list-directory.md) - List directory contents
