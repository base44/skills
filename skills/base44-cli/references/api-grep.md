# base44 api grep

Search the public Base44 API spec with a regular expression, for when [`api search`](api-search.md) misses. For example, find every operation that sends or returns a field such as `noindex`.

## Syntax

```bash
npx base44 api grep <pattern> [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `<pattern>` | A JavaScript regular expression, e.g. `"runs.*status"`; an invalid one fails | Required |
| `--area <area>` | Search only one area's operations (see [api-catalog.md](api-catalog.md)) | - |
| `-i, --ignore-case` | Case-insensitive match | - |
| `--limit <n>` | Most operations to return | `20` |
| `--read-only` | Only operations the spec marks read-only | - |
| `--refresh` | Fetch the API spec again instead of using the cached copy (kept 1 hour) | - |

## Authentication

**Required**: No. The command only reads the API spec and sends nothing.

## What It Matches

The pattern runs over each operation's contract (the same JSON that `api fetch <METHOD> <path> --help` prints: `endpoint`, summary, description, parameters, request and response schemas) as JSON text. So:

- Quotes and newlines appear escaped.
- A common word also matches inside unrelated schemas; narrow it with `--area`.

## Output

A JSON array of matching operations, or an empty array when nothing matches. Each one has an `endpoint` (method and path template) and a one-line `summary`:

```json
[
  { "endpoint": "GET /api/apps/{app_id}/oauth-redirect-uris", "summary": "Get OAuth redirect URIs" }
]
```

## Examples

```bash
npx base44 api grep "noindex" --area seo
npx base44 api grep "runs.*status" -i
npx base44 api grep "webhook_secret" --limit 5
```

## Related

- [api-search.md](api-search.md): search operations by what they do
- [api-fetch.md](api-fetch.md): read an operation's contract and call it
