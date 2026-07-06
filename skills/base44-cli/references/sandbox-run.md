# base44 sandbox run

Run a shell command in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox run <command...> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<command...>` | Shell command to execute (quote to keep as one argument) | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--cwd <path>` | Working directory relative to the app root | No |
| `--timeout-ms <n>` | Timeout in milliseconds (default: 120000, max: 600000) | No |

## Examples

```bash
# Run a test suite
npx base44 sandbox run "npm test"

# Run ls with arguments
npx base44 sandbox run ls -la --cwd src

# Run with a custom timeout
npx base44 sandbox run "npm run build" --timeout-ms 300000

# Run in a specific directory
npx base44 sandbox run "cat package.json" --cwd packages/cli
```

## Output

Returns a JSON document with the command output, exit code, and stderr. The CLI always exits 0 (the HTTP call succeeded); the remote command's exit code is reported in the JSON response.

## Notes

- Requires app context (`--app-id`, `BASE44_APP_ID`, or a linked project)
- The working directory defaults to the app root; use `--cwd` to change it
- The CLI exit code reflects whether the API call succeeded, not the remote command's exit code — check the JSON response for the remote exit code

## Related Commands

- [sandbox-ls.md](sandbox-ls.md) - List directory entries
- [sandbox-read.md](sandbox-read.md) - Read output files
- [sandbox-checkpoint.md](sandbox-checkpoint.md) - Checkpoint before risky operations
