# base44 api catalog

List the API's areas, or every operation in one area. This is the entry point for discovering what the Base44 REST API can do before calling it with `base44 api fetch`.

## Syntax

```bash
npx base44 api catalog [area] [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `[area]` (positional) | An area from the list, e.g. `"workflows"` | No |
| `--read-only` | Only read-only operations | No |
| `--refresh` | Fetch the API spec again instead of using the cached copy (kept 1 hour) | No |

No authentication is required — the spec is Base44's public OpenAPI document, cached locally for an hour (per API host, under `~/.base44/cache/<host>/openapi.json`).

## Examples

```bash
# List every API area, with an operation count and a sample of what each holds
npx base44 api catalog

# List every operation in one area
npx base44 api catalog workflows

# Only operations safe to call with a read-only personal access token
npx base44 api catalog workflows --read-only

# Force a fresh spec instead of the cached copy
npx base44 api catalog --refresh
```

## Output

Without an area, each area is summarized — small areas (2 operations or fewer) are listed in full, larger ones get a count and a sample of up to 3 (reads shown before writes):

```json
{
  "areas": [
    { "area": "apps", "operations": [{ "endpoint": "GET /api/apps/{app_id}", "summary": "Get app" }] },
    {
      "area": "workflows",
      "operationCount": 7,
      "sample": ["List workflows", "List workflow runs", "Archive workflow"]
    }
  ],
  "total": 142
}
```

With an area argument, every one of its operations is listed (capped at 200, with `truncated: true` if there were more):

```json
{
  "area": "workflows",
  "operations": [
    { "endpoint": "GET /api/apps/{app_id}/workflows", "summary": "List workflows" },
    { "endpoint": "GET /api/apps/{app_id}/workflows/runs", "summary": "List workflow runs" }
  ],
  "total": 7,
  "truncated": false
}
```

An area's "endpoint" is `METHOD /path/template` — pass that method and path straight to `base44 api fetch`.

## Notes

- An area is the path segment right after `{app_id}` (or after `/api` for operations with no app id), e.g. `/api/apps/{app_id}/workflows/runs` is area `workflows`.
- An unknown area fails with the full list of real area names, so a typo is cheap to recover from.
- When narrowing by `--read-only`, the area is looked up *before* filtering — an area that happens to have no read-only operations returns an empty list, not an "unknown area" error.
- Use `base44 api search "<what you want to do>"` when you don't know which area to look in, and `base44 api grep <pattern>` when a keyword search misses.
