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

# Read multiple files
npx base44 sandbox read src/index.ts src/utils.ts

# Read lines 10-20 of a file
npx base44 sandbox read src/index.ts --offset 10 --limit 10
```

## Output

Returns a JSON document with file contents. When multiple paths are given, each file's content is included in the response.

## Notes

- Requires app context (`--app-id`, `BASE44_APP_ID`, or a linked project)
- All paths are relative to the app root
- Use `--offset` and `--limit` to paginate large files

## Related Commands

- [sandbox-ls.md](sandbox-ls.md) - List directory entries
- [sandbox-write.md](sandbox-write.md) - Write a file
- [sandbox-edit.md](sandbox-edit.md) - Apply exact edits to a file
