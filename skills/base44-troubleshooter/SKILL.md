---
name: base44-troubleshooter
description: Troubleshoot production issues using backend function logs and workflow run history. Use when investigating app errors, debugging function calls, diagnosing why a scheduled job or automation failed, or diagnosing production problems in Base44 apps.
---

# Troubleshoot Production Issues

## Prerequisites

Verify authentication before fetching logs:

```bash
npx base44 whoami
```

If not authenticated or token expired, instruct user to run `npx base44 login`.

Resolve app context in one of these ways:

```bash
# From a linked local project
cat base44/.app.jsonc

# Or explicitly
npx base44 logs --app-id app_123
```

## Available Commands

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 logs` | Fetch function logs for this app | [project-logs.md](references/project-logs.md) |
| `base44 workflows runs` | List workflow runs, newest first; failed runs carry the failing task and the underlying error | [workflows-runs.md](../base44-cli/references/workflows-runs.md) |
| `base44 workflows list` | List this app's workflows with status and run summary | [workflows-list.md](../base44-cli/references/workflows-list.md) |

## Logs are not read-after-write

**A single fetch that misses your run proves nothing.** One-shot `base44 logs` reads
an index that lags behind the invocation, so an empty result right after triggering a
function is the expected result, not evidence of a problem.

- **Live debugging: use `--follow`.** Where the realtime stream is available it
  delivers lines in **under a second**. Where it is not, the CLI says so and polls
  instead (`Warning: Realtime logs are not available for this app — falling back to
  polling (lines may lag ~20-30s).`). Either way `--follow` is the right tool — you never
  have to pick.
- **One-shot fetches lag ~20-30s.** That is ingestion time, not a filter problem.
- **When output is empty, the variable to change is TIME, never a flag.** Wait and
  re-run the same command. Widening `--limit`, dropping `--level`, or switching
  `--order` changes nothing about a line that has not been ingested yet, and
  re-rolling flags is how agents talk themselves into a wrong diagnosis.

## Troubleshooting Flow

### 1. Watch it happen — `--follow`

If you can trigger the failure (or it is happening now), start here rather than
fetching after the fact:

```bash
npx base44 logs --follow
npx base44 logs --follow --function <function_name>
```

Then invoke the function and read what arrives. Rules that keep you from misreading
a healthy stream:

- **Never decide on a timer.** Open the stream, trigger the function, and read until
  you see the lines — do not read a fixed window, print, and conclude "broken".
  A quiet stream is quiet because nothing has been invoked.
- **Delivery is per-invocation, not per-line.** A long-running function's lines all
  arrive when the invocation ends. Silence mid-invocation is normal.
- **Redeploying mid-follow is safe.** A deploy rotates the script in seconds and the
  same open stream delivers the new code's lines on the next invoke. Do not tear the
  stream down and rebuild it after every deploy.
- **`--since` is rejected with `--follow`** (the stream starts from now), as are
  `--until` and `--order`. For anything historical, use a one-shot fetch.
- **The mode is decided once, at startup.** If the first connection is refused or
  unreachable, the run polls for its whole life. If the stream opens, there is no
  polling fallback left.
- **A stream lost mid-run ends the command** with `Error: The realtime log stream
  stopped and could not be re-established`, exit code 1. That exit is the stream
  giving up, not proof that logging is broken — re-run the same command rather than
  changing flags.

### 2. Ask whether it was a scheduled run, not a request

Workflows are the automation system — cron schedules, entity triggers, connector
events, in-app agent actions. **When the complaint is "my scheduled job didn't run" or
"the automation stopped working", function logs are the wrong tool.** They show what a
function printed; they cannot tell you whether a run was dispatched at all, which task
inside it failed, or why the workflow stopped firing.

```bash
npx base44 workflows runs --status failed
npx base44 workflows list
```

A failed run carries the failing task and the underlying error, so start there and drop
into `base44 logs` only once you know which function a failing task called.
`workflows list` reports `consecutiveFailures` — anything above zero is a workflow that
needs attention.

Two things that mislead here:

- **`manual` in the trigger column does not mean a person clicked something.** It is
  what a run is stamped with when it was dispatched with no trigger type at all.
- **Test runs are included**, tagged next to the trigger type as `(scheduled, test)`.
  A run you fired yourself to check something will show up in the list.

### 3. Check Recent Errors

Start by pulling the latest errors across all functions:

```bash
npx base44 logs --level error
```

### 4. Drill Into a Specific Function

If you know which function is failing:

```bash
npx base44 logs --function <function_name> --level error
```

If you are outside the project directory, pass the app explicitly:

```bash
npx base44 logs --app-id app_123 --function <function_name> --level error
```

A `--function` filter is a filter on *stamped* rows. Apps still on the legacy
per-function deployment emit unstamped rows, so a filtered view can hide them; this
self-heals on the app's next deploy. If a filtered run comes back empty, re-run
without `--function` before concluding there are no logs.

### 5. Inspect a Time Range

Correlate with user-reported issue timestamps:

```bash
npx base44 logs --function <function_name> --since <start_time> --until <end_time>
```

### 6. Analyze the Logs

- Look for stack traces and error messages in the output
- Check timestamps to correlate with user-reported issues
- Pass `--limit` explicitly to reach further back — there is no default page size, and a value above 500 is clamped down to 500

## Reading an empty result

`No logs found matching the filters.` is ambiguous — never read it as "healthy". It
means one of:

- the run has not been ingested yet (most common — wait and re-run, see above)
- no function by that name, or the filter dropped unstamped rows (see step 3)
- the app has not been published, when reading `--env prod`
  (`No production logs found.` — try `--env preview` for draft logs)
