# base44 api fetch

Call any public Base44 API operation directly, driven by the server's own OpenAPI spec. Add `--help` after a method and path to print that operation's contract (parameters, request body schema, response schema) instead of calling it — the usual way to learn how to fill in a call before sending it.

## Syntax

```bash
npx base44 api fetch [method] [path] [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `[method]` (positional) | HTTP method, e.g. `GET` or `POST` (case-insensitive — normalized to upper case) | No* |
| `[path]` (positional) | Path with any query string; `{app_id}` is filled from `--app-id` or the linked project, e.g. `"/api/apps/{app_id}/workflows/runs?status=failed"` | No* |
| `--body <json>` | Request body: a JSON string, `@file.json` to read it from a file, or `@-` to read it from stdin | No |
| `--form <field>` | Multipart field: `name=value`, or `name=@path` (optionally `name=@path;type=<mime>`) to attach a file; repeat the flag for multiple fields | No |
| `--output <file>` | Save the response body to a file instead of printing it | No |
| `--read-only` | Refuse, before sending, any operation the spec doesn't mark read-only | No |
| `--refresh` | Fetch the API spec again instead of using the cached copy (kept 1 hour) | No |
| `-h, --help` | With a method and path, print that operation's contract; otherwise print this command's own help | No |

\* `method` and `path` are both required to actually call an operation; omitting either (without `--help`) fails with "Provide a method and a path, e.g. `GET /api/apps`." Running `base44 api fetch --help` with no method/path prints this command's help instead of an operation's contract.

This command can run from a linked project, or outside a project when you pass `--app-id <id>` or set `BASE44_APP_ID` — but only if the path needs `{app_id}` filled in; a path with no `{app_id}` placeholder needs neither.

## Examples

```bash
# Find the operation first
npx base44 api search "failed workflow runs"
# → GET /api/apps/{app_id}/workflows/runs

# Print its contract (parameters, request/response schema) before calling it
npx base44 api fetch GET /api/apps/{app_id}/workflows/runs --help

# Call it; {app_id} is filled from the linked project or --app-id
npx base44 api fetch GET "/api/apps/{app_id}/workflows/runs?status=failed"

# Call it against an app with no local project checkout
npx base44 api fetch GET /api/apps/{app_id}/workflows --app-id app_123

# POST with an inline JSON body
npx base44 api fetch POST /api/apps/{app_id}/entities/Task --body '{"title":"Ship docs"}'

# POST with a body read from a file
npx base44 api fetch POST /api/apps/{app_id}/entities/Task --body @task.json

# POST with a body piped in from stdin
echo '{"title":"Ship docs"}' | npx base44 api fetch POST /api/apps/{app_id}/entities/Task --body @-

# Multipart upload: a plain field plus a file field
npx base44 api fetch POST /api/apps/{app_id}/files --form "name=report" --form "file=@report.csv;type=text/csv"

# Save a binary response to a file instead of printing it
npx base44 api fetch GET /api/apps/{app_id}/files/{file_id} --output report.pdf

# Double-check before scripting a write: refuse anything not marked read-only
npx base44 api fetch DELETE /api/apps/{app_id}/workflows/{workflow_id} --read-only

# Force a fresh spec (e.g. the cached copy predates a newly added route)
npx base44 api fetch GET /api/apps/{app_id}/new-thing --refresh
```

## Output

**`--help` with a method and path** prints the operation's contract as JSON — `endpoint`, `method`, `path`, `summary`, `description`, `parameters` (each with `name`, `in`, `required`, `schema`), `requestBodySchema`, `responseSchema`, and (for a non-JSON request body) `requestBodyContentType` plus a hint to use `--form`:

```json
{
  "endpoint": "POST /api/apps/{app_id}/entities/{entity_name}",
  "method": "POST",
  "path": "/api/apps/{app_id}/entities/{entity_name}",
  "summary": "Create entity record",
  "parameters": [{ "name": "entity_name", "in": "path", "required": true, "schema": { "type": "string" } }],
  "requestBodySchema": { "type": "object", "properties": { "title": { "type": "string" } } },
  "responseSchema": { "type": "object", "properties": { "id": { "type": "string" } } }
}
```

Pipe it through `jq` to cut it down, e.g. `| jq '.parameters, .requestBodySchema'`.

**An actual call** prints the response body as sent by the server:
- A JSON body is pretty-printed in a terminal (and left as the server sent it — not re-serialized, so large integers aren't rounded); under `--json` (piped/non-TTY) it is still valid JSON on stdout.
- A non-JSON text body (plain text, XML, etc.) is printed as is.
- An empty body prints just `{ "status": <code> }`.
- A binary body (or a declared non-text content type) is *not* printed — it's described (`status`, `contentType`, `bytes`) with a note to add `--output <file>`; with `--output`, it's written to that file and the same metadata plus `output` is printed.

## Notes

- **`{app_id}` is the only placeholder filled in automatically** — from `--app-id` or the linked local project. Any other `{...}` in the path (e.g. `{workflow_id}`, `{file_id}`) must be replaced with a real value by hand, or the command fails before sending anything.
- **`--body` and `--form` are mutually exclusive** — use one or the other.
- **`--read-only` sends nothing on refusal.** It is also refused outright (without even checking the spec) if the path contains an encoded `/`, `\`, or `.` (e.g. `%2F`), since the server decodes those before routing and the check can't account for where they'd actually land.
- **No operation matches** (wrong method/path, or a route newer than the cached spec) fails with hints: refetch the spec with `--refresh`, or go back to `base44 api search` to find the right endpoint and path template.
- **Authentication** is only required to actually send a request — `--help` and a refusal under `--read-only` need no login. A real call runs `ensureAuth` first and prompts for login if needed.
- The command's own `--body`/`--form` values are never sent to error telemetry (only the method and path, with the query string stripped), since either can carry secrets.
- `--limit`-style validation doesn't apply here, but `--refresh` behaves the same as in `catalog`/`search`/`grep`: it bypasses the hour-long local cache of the OpenAPI spec.
