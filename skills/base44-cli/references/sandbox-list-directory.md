# base44 sandbox ls

List directory entries in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox ls [path] [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `[path]` | Directory relative to the app root (default: app root) | No |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--recursive` | List nested entries | No |
| `--max-depth <n>` | Max depth when recursive (1–10, default: 3) | No |
| `--include-hidden` | Include dotfiles | No |

## Examples

```bash
# List the app root
npx base44 sandbox ls

# List a specific directory
npx base44 sandbox ls src/components

# Recursive listing with max depth
npx base44 sandbox ls --recursive --max-depth 2

# Include hidden files (dotfiles)
npx base44 sandbox ls --include-hidden

# On a specific app (no local project needed)
npx base44 sandbox ls --app-id app_123 src
```

## JSON Output

Returns a JSON object listing file and directory entries with metadata (name, type, size, etc.).

## Notes

- Works from a linked project directory or with `--app-id` / `BASE44_APP_ID`
- When `--recursive` is omitted, only the immediate children of `[path]` are listed

## Related Commands

- [sandbox-read-file.md](sandbox-read-file.md) - Read file contents from the sandbox
- [sandbox-grep.md](sandbox-grep.md) - Search files in the sandbox
- [sandbox-write-file.md](sandbox-write-file.md) - Write a file to the sandbox
