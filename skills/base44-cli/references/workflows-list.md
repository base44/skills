# base44 workflows list

List this app's workflows with their status and run summary.

## Syntax

```bash
npx base44 workflows list [options]
```

This command can run from a linked project, or outside a project when you pass `--app-id <id>` or set `BASE44_APP_ID`.

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `-n, --limit <n>` | Number of workflows to return (1-200, default: 30) | No |

## Examples

```bash
# Show all workflows and how their last run went
npx base44 workflows list

# Machine-readable output
npx base44 workflows list --json

# Show more than the default 30
npx base44 workflows list -n 100
```

## Output

```
nightly-sync  [active]  runs: 12, last run failed at 2026-08-05T03:00:00Z (3 consecutive failures)
weekly-digest  [paused]  runs: 4, last run success at 2026-08-01T09:00:00Z
```

With `--json`, each workflow is a record: `id`, `name`, `description`, `status`, `statusReason`, `totalRuns`, `consecutiveFailures`, `lastRunAt`, `lastRunStatus`.

## Notes

- `consecutiveFailures > 0` is the signal a workflow needs attention — follow up with `base44 workflows runs --status failed`.
- **Apps that predate Workflows** (legacy automations) are not readable via this command; it fails with an explanation.
- `--limit` tops out at **200** and there is no paging flag, so an app with more than 200 workflows cannot be listed exhaustively from the CLI. Do not read a full page as "that's all of them".
