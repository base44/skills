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
| `-n, --limit <n>` | Number of results to return. **No default** — the CLI sends a limit only when you pass one, and a value above 500 is clamped down to 500 | No |
| `--order <order>` | Sort order: `asc` or `desc`. Only affects a **multi-function** fetch (it orders the client-side merge); ignored when reading a single function. Cannot be combined with `--follow` | No |
| `--env <env>` | Which deployment to read logs from: `preview` (current draft) or `prod` (published). Default: `preview` | No |
| `-f, --follow` | Stream new logs as they arrive instead of a one-shot fetch. Realtime (sub-second) where the stream is available; where it cannot be opened the CLI polls instead (~20-30s lag). Cannot be combined with `--since`, `--until` or `--order` | No |

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
- There is **no default page size**. The CLI sends a limit only when you pass one, and a `--limit` above 500 is clamped down to 500 — so do not plan on paging further back by raising the number. What you get when you omit it is not a fixed number: the runtime decides, and it may cap you at 500 anyway. Pass `--limit` when the count matters to you.
- `--order` is only honored for the client-side merge of several functions. The server does not read it, so it is inert on a single-function fetch — the entries come back newest-first regardless.
- The `--since` and `--until` values accept an ISO datetime, or a relative shorthand (e.g. `1h`, `30m`, `2d`) measured back from now. ISO values without a timezone are normalized to UTC (appends `Z`).
- `--env` defaults to `preview`. If `prod` returns no logs, the app may not have been published yet — try `--env preview` to see draft logs.
- **`No logs found matching the filters.` is ambiguous.** It means one of: the run has not been ingested yet (~20-30s; wait and re-run — *do not* change flags), there is no function by that name, or a `--function` filter dropped unstamped rows from a legacy per-function deployment. It never means "the app is healthy".
- `--follow` streams logs indefinitely (oldest to newest) instead of a single fetch; it's incompatible with `--since`, `--until` and `--order`. A stream that is lost and cannot be re-established ends the command with an error rather than dropping to polling. See [Following logs live](#following-logs-live).
- Pass the global `--json` flag to emit each log entry as JSON instead of the human-readable format.
- **With `--follow`, `--json` output is one JSON object per line, not one JSON document.** Parse it line by line as it arrives; there is no closing bracket, because a live tail never ends normally. Nothing goes to stderr. If the stream is lost, the error arrives as one more object on its own line and the process exits 1:

  ```json
  {"error":"The realtime log stream stopped and could not be re-established","code":"API_ERROR","hints":[{"message":"Start a new live tail","command":"base44 logs --follow"},{"message":"Or read recent logs without streaming","command":"base44 logs"}]}
  ```

  Note `hints` holds **objects**, each with `message` and `command` — not strings. A consumer that parses per line sees the failure as data rather than as a broken document.

## Following logs live

`--follow` is the tool to reach for when you can reproduce the problem, because it
does not wait on log ingestion.

### Streaming or polling is decided once, at startup

`--follow` opens a realtime stream before it prints anything, and **that first attempt
decides the mode for the whole run.**

**The stream opens** — lines arrive **in under a second** of the invocation ending, and
you stay in realtime for the rest of the run.

**The stream is refused** — the app is still on a legacy per-function deployment, or
the feature is not enabled for it. The CLI says so and polls instead, for the life of
the process:

```
Warning: Realtime logs are not available for this app — falling back to polling (lines may lag ~20-30s).
```

**The stream cannot be reached** — a transient failure that survived the retries. Same
outcome, different message:

```
Warning: Could not reach the realtime log stream — falling back to polling (lines may lag ~20-30s).
```

Either way the command keeps working; the only difference is latency. On a legacy
per-function app, `--follow --function <name>` is refused (404) and polls — that
self-heals on the app's next deploy, there is nothing to fix.

Both warnings go to **stderr**, never into the log output on stdout. They are shown
above as they appear when output is **piped or otherwise not a terminal** — which is
how an agent or a script sees them. In an interactive terminal the same text is
rendered by the fancy logger with a coloured glyph instead of the literal
`Warning: ` prefix, so match on the sentence, not on the prefix. Under `--json` the
warning still prints, on stderr — `--json` routes logs to stderr rather than silencing
them, so a `--json` run gives you both: this warning on stderr, and log lines on
stdout. (Only the lost-stream failure below is stdout-only.)

### A stream that dies mid-run ends the command — it does not quietly start polling

Once the stream has opened there is **no polling fallback left**. If it is lost and
cannot be re-established — repeated dead connections, or a typed end frame saying the
tail is gone — `--follow` exits with an error rather than degrading:

```
Error: The realtime log stream stopped and could not be re-established
```

It exits **1**, and suggests starting a new tail (`base44 logs --follow`) or reading
recent logs without streaming (`base44 logs`). As with the warnings, the literal
`Error: ` prefix is what a piped or non-terminal run prints; an interactive terminal
renders the same message with a glyph. Under `--json` this failure arrives **only** as
one more object on stdout (see the `--json` note above) — there is no `Error:` line to
match at all.

**This matters if you are driving the CLI from a script or an agent loop.** Exit 1 from
`--follow` partway through is the stream giving up, not proof that logging is
broken and not a reason to change flags. Re-run the same command. Ordinary reconnects
are invisible: the CLI reconnects on its own and only errors once it has run out of
attempts.

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
  means stop streaming. Do not branch on the reason string. What you do after a
  `false` is your choice as a raw consumer — the bounded polling route is the obvious
  one — but note the CLI itself does **not** do that: it ends the run with an error
  (see above). (And a fallback to polling in the CLI is driven by the *first*
  connection failing — either refused outright, or still unreachable after its
  retries — never by an end frame.)
- Reconnect on a drop rather than giving up on the first one. Carry the last seen
  timestamp across the reconnect — but for **dedupe**, and to resume a polling
  fallback where the stream left off. It does not make the handover gapless: a tail
  has no replay, so lines emitted during the gap are simply gone.
