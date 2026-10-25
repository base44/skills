# base44 api catalog

List the public Base44 API's areas, or every operation in one area. Use it to browse when you don't know what to search for.

## Syntax

```bash
npx base44 api catalog [area] [options]
```

## Options

| Option | Description |
|--------|-------------|
| `[area]` | Omit to list the areas; pass an area's name (e.g. `workflows`, `seo`) to list its operations |
| `--read-only` | Only operations the spec marks read-only |
| `--refresh` | Fetch the API spec again instead of using the cached copy (kept 1 hour) |

## Authentication

**Required**: No. The command only reads the API spec and sends nothing.

## Areas

An area is the path segment right after `{app_id}`, or for other operations the one right after `/api`. For example, `workflows` holds every operation under `/api/apps/{app_id}/workflows`. Area names don't always match the section names in the API reference.

An unknown area fails with the list of real ones.

## Output

**Without an area**, every area: one with one or two operations lists them under `operations`; a larger one shows its `operationCount` and a `sample` of up to three summaries, reads first:

```json
{
  "areas": [
    {
      "area": "backend-functions",
      "operations": [
        { "endpoint": "DELETE /api/apps/{app_id}/backend-functions/{function_name}", "summary": "Delete a backend function" },
        { "endpoint": "GET /api/apps/{app_id}/backend-functions", "summary": "List backend functions" }
      ]
    },
    { "area": "workflows", "operationCount": 19, "sample": ["List workflows", "List workflow runs for an app", "Get workflow stats"] }
  ],
  "total": 494
}
```

**With an area**, up to 200 of its operations. `truncated` is `true` when it holds more, and `total` counts them all:

```json
{
  "area": "workflows",
  "operations": [
    { "endpoint": "GET /api/apps/{app_id}/workflows", "summary": "List workflows" }
  ],
  "total": 19,
  "truncated": false
}
```

## Examples

```bash
npx base44 api catalog
npx base44 api catalog seo
npx base44 api catalog workflows --read-only
```

## Related

- [api-search.md](api-search.md): search operations by what they do
- [api-fetch.md](api-fetch.md): read an operation's contract and call it
