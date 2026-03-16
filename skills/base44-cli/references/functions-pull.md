# base44 functions pull

Pull deployed functions from Base44 remote to local files.

## Syntax

```bash
npx base44 functions pull [name]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `name` | Function name to pull (pulls all if omitted) | No |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Examples

```bash
# Pull all remote functions
npx base44 functions pull

# Pull a specific function
npx base44 functions pull my-function
```

## Output

```bash
$ npx base44 functions pull

Fetching functions from Base44...
✓ Functions fetched successfully

my-function               written
send-notification         unchanged

Pulled 2 functions to base44/functions
```

If a specific function is not found:
```bash
$ npx base44 functions pull nonexistent
Function "nonexistent" not found on remote
```

## Notes

- Functions are written to the `functionsDir` configured in `base44/config.jsonc` (default: `base44/functions/`)
- Files that already match remote content are reported as `unchanged` (not overwritten)
- Use this command to sync remote changes back to your local project
