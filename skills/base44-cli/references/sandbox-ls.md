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
| `--max-depth <n>` | Max depth when recursive (1-10, default: 3) | No |
| `--include-hidden` | Include dotfiles | No |

## Examples

```bash
# List the app root
npx base44 sandbox ls

# List the src directory
npx base44 sandbox ls src

# Recursive listing
npx base44 sandbox ls --recursive

# Recursive with depth limit
npx base44 sandbox ls src --recursive --max-depth 2

# Include hidden files
npx base44 sandbox ls --include-hidden
```

## Output

Returns a JSON document with directory entries (names, types, sizes).

## Notes

- Requires app context (`--app-id`, `BASE44_APP_ID`, or a linked project)
- All paths are relative to the app root

## Related Commands

- [sandbox-read.md](sandbox-read.md) - Read file contents
- [sandbox-write.md](sandbox-write.md) - Write a file
- [sandbox-grep.md](sandbox-grep.md) - Search files by pattern
