# base44 logs

Fetch function logs for this app.

## Syntax

```bash
npx base44 logs [options]
```

This command can run from a linked project, or outside a project when you pass `--app-id <id>` or set `BASE44_APP_ID`.

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--function <names>` | Filter by function name(s), comma-separated. If omitted, fetches logs for all functions in the current app | No |
| `--since <datetime>` | Show logs from this time. ISO datetime or relative shorthand (e.g. `1h`, `30m`, `2d`). Cannot be combined with `--follow` | No |
| `--until <datetime>` | Show logs until this time. ISO datetime or relative shorthand (e.g. `1h`, `30m`, `2d`). Cannot be combined with `--follow` | No |
| `--level <level>` | Filter by log level: `info`, `warning`, `error`, `debug` | No |
| `-n, --limit <n>` | Number of results to return. **No default** — the server returns at most 500 whether or not you pass it, and a larger value is clamped to 500 | No |
| `--order <order>` | Sort order: `asc` or `desc`. Only affects a **multi-function** fetch (it orders the client-side merge); ignored when reading a single function. Cannot be combined with `--follow` | No |
| `--env <env>` | Which deployment to read logs from: `preview` (current draft) or `prod` (published). Default: `preview` | No |
| `-f, --follow` | Stream new logs as they arrive instead of a one-shot fetch. Realtime (sub-second) where the stream is available, otherwise the CLI polls automatically (~20-30s lag). Cannot be combined with `--since`, `--until` or `--order` | No |

## Examples

```bash
# Fetch logs for all project functions
npx base44 logs

# Fetch logs for a specific app without a local checkout
npx base44 logs --app-id app_123

# Fetch only errors
npx base44 logs --level error

# Fetch logs for a specific function
npx base44 logs --function my-function

# Fetch logs for multiple functions
npx base44 logs --function send-email,process-payment

# Fetch logs since a specific time (ISO datetime)
npx base44 logs --since 2024-01-15T10:00:00

# Fetch logs from the last hour (relative shorthand)
npx base44 logs --since 1h

# Fetch logs within a time range
npx base44 logs --since 2024-01-15T10:00:00 --until 2024-01-15T12:00:00

# Merge several functions' logs oldest-first (--order applies to the merge)
npx base44 logs --function send-email,process-payment -n 100 --order asc

# Last 10 errors for a specific function
npx base44 logs --function myFunction --level error --limit 10

# Fetch logs from the published (prod) deployment instead of preview
npx base44 logs --env prod

# Stream new logs live as they arrive (all functions)
npx base44 logs --follow

# Stream one function's logs live
npx base44 logs --follow --function my-function
```

## Notes

- **Authentication required.** You must be logged in before fetching logs.
- **App context required.** Run from a linked project, or pass `--app-id` / set `BASE44_APP_ID`.
- When multiple functions are specified, logs are merged and sorted by timestamp.
- If `--function` is omitted, logs are fetched for **all functions** in the current app.
- The `--limit` applies after merging logs from all specified functions.
- There is **no default page size**. The CLI applies a limit only when you pass one, and the server returns at most 500 entries either way — a `--limit` above 500 is clamped down to it. Do not plan on paging further back by raising the number.
- `--order` is only honored for the client-side merge of several functions. The server does not read it, so it is inert on a single-function fetch — the entries come back newest-first regardless.
- The `--since` and `--until` values accept an ISO datetime, or a relative shorthand (e.g. `1h`, `30m`, `2d`) measured back from now. ISO values without a timezone are normalized to UTC (appends `Z`).
- `--env` defaults to `preview`. If `prod` returns no logs, the app may not have been published yet — try `--env preview` to see draft logs.
- **`No logs found matching the filters.` is ambiguous.** It means one of: the run has not been ingested yet (~20-30s; wait and re-run — *do not* change flags), there is no function by that name, or a `--function` filter dropped unstamped rows from a legacy per-function deployment. It never means "the app is healthy".
- `--follow` streams logs indefinitely (oldest to newest) instead of a single fetch; it's incompatible with `--since`, `--until` and `--order`. See [Following logs live](#following-logs-live).
- Pass the global `--json` flag to emit each log entry (or, with `--follow`, each new line) as JSON instead of the human-readable format.

## Following logs live

`--follow` is the tool to reach for when you can reproduce the problem, because it
does not wait on log ingestion.

### The two modes, and why you don't choose

`--follow` first opens a realtime stream. Where that stream is available lines arrive
**in under a second** of the invocation ending. Where it is not — the app is still on
a legacy per-function deployment, or the feature is not yet enabled for it — the
request is refused and the CLI **falls back to polling on its own**, printing which
mode you are in:

```
Realtime stream unavailable — falling back to polling (lines may lag ~20-30s).
Realtime stream disconnected — falling back to polling (lines may lag ~20-30s).
```

The command works either way; the only difference is latency. Two consequences worth
knowing:

- On a legacy per-function app, a `--follow --function <name>` run is refused (404)
  and polls instead. This self-heals on the app's next deploy — nothing to fix.
- **The fallback is one-way.** Once a run has conceded to polling it polls for the
  life of that process; it never re-attempts the stream. Re-run the command to try
  realtime again.

### Reading the stream without fooling yourself

- **Silence is not a verdict.** Never open the stream, read for a fixed window, and
  conclude the pipeline is broken — a stream with nothing invoked against it is
  correctly silent. Trigger the function, then read until the lines arrive.
- **Delivery is per-invocation.** A function's lines are delivered as a batch when
  the invocation ends, so a long-running call is silent while it runs.
- **A deploy does not break an open stream.** The script rotates in seconds and the
  same stream carries the new code's lines on the next invoke. Restarting the stream
  after each deploy adds noise and loses nothing.
- **`--function` filters on stamped rows.** Failure records are function-stamped, so
  filtered streams keep them; rows from a legacy per-function script carry no stamp
  and are dropped by the filter until the app's next deploy. When a filtered stream
  looks empty, drop the filter before concluding anything.

### Driving the SSE endpoint directly

The CLI handles all of this for you — this section matters only if you are consuming
`/api/apps/<id>/functions-mgmt/logs/stream` yourself.

- Log frames are unnamed `data:` events (`{time, level, function, message}`).
- Comment lines (`: ping`) are keepalives. They carry no logs but they **do** prove
  the connection is alive — treat a ping as liveness, not as an empty read.
- The typed `event: end` frame is what disambiguates silence, and its `retriable`
  flag is the whole contract: `true` — every reason the backend currently sends,
  including a tail that went unavailable — means **reconnect immediately**; `false`
  means stop streaming and use the bounded polling route. Do not branch on the reason
  string. (Falling back to polling is driven by the connection being *refused*, not by
  an end frame.)
- Reconnect on a drop rather than giving up on the first one. Carry the last seen
  timestamp across the reconnect — but for **dedupe**, and to resume a polling
  fallback where the stream left off. It does not make the handover gapless: a tail
  has no replay, so lines emitted during the gap are simply gone.
