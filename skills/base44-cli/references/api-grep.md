# base44 api grep

Search the API spec with a regular expression, for when `base44 api search` misses. The pattern is matched against each operation's full contract (the same JSON `base44 api fetch ... --help` prints), so it finds operations by field name, schema detail, or exact wording that a keyword search won't rank highly.

## Syntax

```bash
npx base44 api grep <pattern> [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `<pattern>` (positional) | Regular expression over each operation's contract as JSON text (quotes and newlines appear escaped), e.g. `"runs.*status"` | Yes |
| `--area <area>` | Search only one area's operations (see `base44 api catalog`) | No |
| `-i, --ignore-case` | Case-insensitive match | No |
| `--limit <n>` | Most operations to return (default 20) | No |
| `--read-only` | Only read-only operations | No |
| `--refresh` | Fetch the API spec again instead of using the cached copy (kept 1 hour) | No |

No authentication is required — the spec is Base44's public OpenAPI document, cached locally for an hour.

## Examples

```bash
# Find operations whose contract mentions a run's status field
npx base44 api grep "runs.*status"

# A field name you know but can't recall which operation sends/returns
npx base44 api grep "webhook_secret"

# Case-insensitive, scoped to one area
npx base44 api grep "stripe" --area connectors -i

# More than the default 20 matches
npx base44 api grep "entity" --limit 50
```

## Output

Same shape as `base44 api search`: an array of `{ endpoint, summary }` matches, in spec order, capped at `--limit`:

```json
[
  { "endpoint": "GET /api/apps/{app_id}/workflows/runs", "summary": "List workflow runs" },
  { "endpoint": "POST /api/apps/{app_id}/workflows/{workflow_id}/runs", "summary": "Trigger workflow run" }
]
```

## Notes

- The pattern is matched against `JSON.stringify(contract)` for every operation — the same contract `base44 api fetch <method> <path> --help` would print, including inlined (`$ref`-resolved) request/response schemas. So it can match on a parameter name, a schema field, or a description, not just the summary line.
- An invalid regular expression fails immediately with the parser's error message — nothing is searched.
- `--area` filters to one area's operations *before* matching (see `base44 api catalog` for area names); an unknown area fails with the full list of real ones.
- `--limit` must be a positive integer.
- Prefer `base44 api search` first — it ranks by relevance. Reach for `grep` when you know specific wording (a field or error code) that search's relevance ranking might bury.
