# base44 sandbox run

Run a shell command in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox run <command...> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<command...>` | Shell command to execute (quote to keep as a single string) | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--cwd <path>` | Working directory relative to the app root | No |
| `--timeout-ms <n>` | Timeout in milliseconds (default: 120000, max: 600000) | No |

## Examples

```bash
# Run a test suite
npx base44 sandbox run "npm test"

# List files with arguments
npx base44 sandbox run ls -la --cwd src

# Run a script with a custom timeout
npx base44 sandbox run "node scripts/migrate.js" --timeout-ms 300000

# On a specific app (no local project needed)
npx base44 sandbox run --app-id app_123 "npm install"
```

## JSON Output

Returns a JSON object with:
- `stdout` — captured output from the command
- `stderr` — captured error output
- `exitCode` — the remote command's exit code

The CLI itself exits `0` regardless of the remote command's exit code — the exit code is reported in the JSON output.

## Notes

- Works from a linked project directory or with `--app-id` / `BASE44_APP_ID`
- The command runs inside the app's server-side sandbox environment
- Default timeout is 2 minutes (120000 ms); max is 10 minutes (600000 ms)

## Related Commands

- [sandbox-read-file.md](sandbox-read-file.md) - Read files from the sandbox
- [sandbox-write-file.md](sandbox-write-file.md) - Write files to the sandbox
- [sandbox-checkpoint.md](sandbox-checkpoint.md) - Create a restore-point checkpoint
