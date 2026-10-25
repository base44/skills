# base44 api search

Search every public Base44 API operation (Apps API and Workspace API) by what it does. This is usually the first step before [`api fetch`](api-fetch.md).

## Syntax

```bash
npx base44 api search <text...> [options]
```

## Options

| Option | Description | Default |
|--------|-------------|---------|
| `<text...>` | What you want to do, e.g. `add a custom domain` | Required |
| `--limit <n>` | Most results to return; weak matches are dropped, so you may get fewer | `5` |
| `--read-only` | Only operations the spec marks read-only (the ones `api fetch --read-only` lets through) | - |
| `--refresh` | Fetch the API spec again instead of using the cached copy (kept 1 hour) | - |

## Authentication

**Required**: No. The command only reads the API spec and sends nothing.

## How It Matches

- Common words such as "the", "my" and "how" are ignored.
- Operations whose summary contains every word you searched for come first.
- The top result is not always the right operation: read its `description` with `api fetch <METHOD> <path> --help` before calling it.

## Output

A JSON array of matches, best first, or an empty array when nothing matches. Each one has an `endpoint` (method and path template) and a one-line `summary`:

```json
[
  { "endpoint": "GET /api/apps/{app_id}/workflows/runs", "summary": "List workflow runs for an app" }
]
```

Pass the `endpoint`'s method and path to `api fetch` as is.

## Examples

```bash
npx base44 api search "add a custom domain"
npx base44 api search "failed workflow runs" --limit 10
npx base44 api search "workspace members" --read-only
```

## Related

- [api-catalog.md](api-catalog.md): browse operations by area
- [api-grep.md](api-grep.md): search with a regular expression when `search` misses
- [api-fetch.md](api-fetch.md): read an operation's contract and call it
