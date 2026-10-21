# base44 sandbox ls

List directory entries in an app's remote sandbox (a server-side dev environment for the app, distinct from local `base44 dev`).

## Syntax

```bash
npx base44 sandbox ls [path] [options]
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `[path]` | Directory relative to the app root | No | app root |
| `--recursive` | List nested entries | No | off |
| `--max-depth <n>` | Max depth when recursive (1-10) | No | 3 |
| `--include-hidden` | Include dotfiles | No | off |

This command also accepts the global `--branch <name>` option (see below) and requires an app context (`--app-id`, `BASE44_APP_ID`, or a linked project's `base44/.app.jsonc`).

## Examples

```bash
# List the app root
npx base44 sandbox ls

# List a subdirectory, recursively, including dotfiles
npx base44 sandbox ls src --recursive --max-depth 5 --include-hidden

# Target a specific app branch
npx base44 sandbox ls --branch feature-x
```

## Output

Sandbox commands always print a JSON document to stdout (not gated by the global `--json` flag):

```json
{
  "entries": [
    { "name": "index.ts", "path": "src/index.ts", "type": "file", "size": 482 },
    { "name": "components", "path": "src/components", "type": "directory" }
  ],
  "truncated": false
}
```

`truncated: true` means the listing was cut off (e.g. `--max-depth` or an entry-count limit was hit) — narrow `path` or lower `--max-depth`/scope before trusting it as exhaustive.

## Notes

- Sandbox commands read and write a remote, server-side copy of the app — not your local checkout.
- Writes made via other `sandbox` commands (`write`, `edit`, `run`) are committed but not checkpointed. See [sandbox-checkpoint.md](sandbox-checkpoint.md) for why that matters before you stop work.
