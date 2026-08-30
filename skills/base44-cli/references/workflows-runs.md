# base44 workflows runs

List workflow runs for this app, newest first. This is the fastest way to answer "did my scheduled work fail, and why" — each failed run carries the task that failed and the underlying error.

## Syntax

```bash
npx base44 workflows runs [options]
```

This command can run from a linked project, or outside a project when you pass `--app-id <id>` or set `BASE44_APP_ID`.

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--status <status>` | Filter by run status: `running`, `completed`, `failed`, `cancelled` | No |
| `--since <datetime>` | Show runs started after this time. ISO datetime or relative shorthand (e.g. `1h`, `30m`, `2d`) | No |
| `-n, --limit <n>` | Number of runs to return (1-200, default: 30) | No |

## Examples

```bash
# Latest runs across all workflows
npx base44 workflows runs

# Did anything fail? (start here when debugging)
npx base44 workflows runs --status failed

# Failures in the last day
npx base44 workflows runs --status failed --since 1d

# Machine-readable output
npx base44 workflows runs --status failed --json
```

## Output

Each run shows its start time, status, workflow name, trigger type, and duration. Failed and cancelled runs also show the error:

```
2026-08-05 04:00:46 FAILED    nightly-sync  (scheduled)  56.8s
    Task 'call_fn' failed: Backend function 'sync-orders' returned HTTP 500: {...}
```

With `--json`, each run is a record: `runId`, `workflowId`, `workflowName`, `triggerType`, `status`, `startedAt`, `completedAt`, `durationMs`, `stepsCount`, `errorMessage`, `isTestRun`, `statusReason`.

## Notes

- **Trigger types**: `scheduled` (cron), `entity`, `connector`, `in_app_agent`, `app_user_auth`, `app_publish`, `app_payment`, `webhook`, `goal_file` — plus `manual`, which is what a run is stamped with when it was dispatched without a trigger type at all (a "run now" typically lands here).
- **Test runs are included.** Runs fired via "run now" (including the dashboard's test button) carry a `test` tag appended to the trigger type in the output (e.g. `(scheduled, test)`) and `isTestRun: true` in JSON. If you just created a workflow and fired it to verify, your run WILL appear — marked as a test run.
- A failed run's `errorMessage` names the failing task and, when a backend function was the cause, includes the function's HTTP failure. To dig further into that function's own logs, use `base44 logs --function <name>` — and remember function logs can take ~30s to appear.
- `--limit` tops out at **200** and there is no paging flag, so a busy app's older runs cannot be reached from the CLI. Narrow with `--since` and `--status` rather than assuming a full page is the whole history.
- `statusReason` is a typed reason populated only for failed/cancelled runs (e.g. `insufficient_credits`); read it together with `status`.
- **Apps that predate Workflows** (legacy automations) are not readable via this command; it fails with an explanation rather than returning an empty list.
- An empty result tells you whether the app has no workflows at all, or has workflows but no matching runs — read the message, don't assume.
