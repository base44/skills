# base44 sandbox read

Read file contents from an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox read <paths...> [options]
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `<paths...>` | One or more file paths relative to the app root | Yes | — |
| `--offset <n>` | 1-based start line | No | start of file |
| `--limit <n>` | Max lines to return from offset | No | no limit |

`--offset`/`--limit` apply to every path in the same invocation. This command also accepts the global `--branch <name>` option and requires an app context (`--app-id`, `BASE44_APP_ID`, or a linked project).

## Examples

```bash
# Read one file in full
npx base44 sandbox read src/index.ts

# Read several files in one call
npx base44 sandbox read src/index.ts src/utils.ts

# Read lines 100-149 of a file
npx base44 sandbox read src/index.ts --offset 100 --limit 50
```

## Output

Always a JSON document on stdout:

```json
{
  "files": [
    {
      "path": "src/index.ts",
      "content": "...",
      "startLine": 1,
      "endLine": 42,
      "totalLines": 42,
      "truncated": false
    }
  ]
}
```

A path that doesn't exist (or can't be read) comes back with an `error: { code, message }` entry instead of `content` — check for that per-file rather than assuming the call as a whole failed.

## Notes

- Paths are relative to the app root in the remote sandbox, not your local filesystem.
- Prefer reading a bounded `--offset`/`--limit` window for large files instead of the whole file.
