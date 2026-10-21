# base44 sandbox run

Run a shell command in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox run <command...> [options]
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `<command...>` | Shell command to execute (quote to keep as one argument) | Yes | — |
| `--cwd <path>` | Working directory relative to the app root | No | app root |
| `--timeout-ms <n>` | Timeout in milliseconds | No | 120000 (max 600000) |

This command also accepts the global `--branch <name>` option and requires an app context (`--app-id`, `BASE44_APP_ID`, or a linked project).

Unquoted trailing words are joined back into a single command string with spaces, so `base44 sandbox run ls -la --cwd src` and `base44 sandbox run "ls -la" --cwd src` behave the same — but quoting is safer for anything with shell operators (`&&`, `|`, redirects).

## Examples

```bash
# Run a test suite
npx base44 sandbox run "npm test"

# Run with a working directory
npx base44 sandbox run ls -la --cwd src

# Run with a longer timeout
npx base44 sandbox run "npm run build" --timeout-ms 300000
```

## Output

Always a JSON document on stdout:

```json
{
  "stdout": "...",
  "stderr": "",
  "exitCode": 0,
  "truncated": false,
  "durationMs": 842
}
```

The CLI process itself exits `0` as long as the HTTP call to the sandbox succeeded — the remote command's own exit status is reported in `exitCode`, not the CLI's process exit code. Check `exitCode` in the JSON to know whether the remote command actually succeeded.

## Notes

- A command that changes files needs a checkpoint too: **writes are committed but not checkpointed.** Only checkpoints appear in the builder's version history; a Restore or Revert there rolls the app back to the last checkpoint and discards everything written after it. Run `base44 sandbox checkpoint` after each unit of work and before you stop — see [sandbox-checkpoint.md](sandbox-checkpoint.md).
