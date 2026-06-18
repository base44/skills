# base44 functions list

List all deployed functions on Base44 remote.

## Syntax

```bash
npx base44 functions list
```

This command also works outside a linked project when you pass `--app-id <id>` or set `BASE44_APP_ID`.

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Fetches all deployed functions from Base44
2. Displays each function name and its automation count (if any)
3. Reports the total count of functions on remote

## Output

```bash
$ npx base44 functions list
  process-order
  send-notification (2 automations)
  daily-report (1 automation)

✓ 3 functions on remote
```

```bash
# Inspect deployed functions for a specific app without a local checkout
npx base44 functions list --app-id app_123
```

If no functions are deployed:
```bash
$ npx base44 functions list
✓ No functions on remote
```

## Notes

- Lists functions currently deployed on Base44, not local function files
- Shows automation count next to each function that has automations configured
- Useful with `--app-id` when you want to inspect a deployed app without switching into a linked local project
- To see local function definitions, look in the `base44/functions/` directory
- Use `npx base44 functions deploy` to sync local functions to remote
- Use `npx base44 functions pull` to download remote functions to local files
