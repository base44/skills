# base44 workflows list

List this app's workflows with their status and run summary.

## Syntax

```bash
npx base44 workflows list [options]
```

This command can run from a linked project, or outside a project when you pass `--app-id <id>` or set `BASE44_APP_ID`.

## Examples

```bash
# Show all workflows and how their last run went
npx base44 workflows list

# Machine-readable output
npx base44 workflows list --json
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
