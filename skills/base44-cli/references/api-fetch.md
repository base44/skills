# base44 api fetch

Call any public Base44 API operation (Apps API and Workspace API) with your CLI login; no API key or personal access token is needed. Add `--help` after the method and path to print the operation's contract instead of calling it.

Find the method and path first with [`api search`](api-search.md), [`api catalog`](api-catalog.md) or [`api grep`](api-grep.md).

## Syntax

```bash
npx base44 api fetch <METHOD> <path> [options]
npx base44 api fetch <METHOD> <path> --help
```

## Options

| Option | Description |
|--------|-------------|
| `<METHOD>` | HTTP method, e.g. `GET` or `POST` |
| `<path>` | Path with any query string, e.g. `"/api/apps/{app_id}/workflows/runs?status=failed"`. Quote it so the shell doesn't read the braces or the `?` |
| `-h, --help` | After a method and path, print that operation's contract (JSON) and send nothing; on its own, print the command's help |
| `--body <json>` | Request body: inline JSON, `@file.json`, or `@-` to read it from stdin |
| `--form <field>` | Multipart field: `name=value`, or `name=@path` to attach a file; add `;type=<media type>` after the path to set its content type. Repeatable |
| `--output <file>` | Save the response body to a file |
| `--read-only` | Refuse, before sending, any operation the spec does not mark read-only |
| `--refresh` | Fetch the API spec again instead of using the cached copy (kept 1 hour). Only matters with `--help` or `--read-only`, the only times `fetch` reads the spec |

## Authentication

**Required**: To call an operation, yes (`npx base44 login`). `--help` and a `--read-only` refusal send nothing and need no login.

## The Contract (`--help`)

`--help` prints the operation's `description`, `parameters`, `requestBodySchema` and `responseSchema` as JSON (plus `requestBodyContentType` for a non-JSON body). A contract can run to tens of KB, so select the parts you need:

```bash
npx base44 api fetch PUT "/api/apps/{app_id}/seo/settings" --help | jq '.description, .requestBodySchema'
```

Read the `description` before calling: it often names the operation to use instead, or the other operations a task needs (a custom domain, for example, also needs DNS records and linking before it serves). It accepts the path template as is.

## Path Placeholders

- `{app_id}` is filled from `--app-id`, `BASE44_APP_ID`, or the linked project, so an endpoint from `search` or `catalog` can be passed as is.
- **Any other placeholder** (e.g. `{workflow_id}`) must be replaced with a real value by hand; `fetch` fails before sending otherwise.
- **The workspace ID** is never filled in: Workspace API operations take it as a `workspaceId` query parameter or a `{workspace_id}` path placeholder. Get it from `base44 workspace list`.
- **IDs for the next call:** a create returns the new resource, including its `id`; put that into the next path's placeholder.

## Read-Only Mode

`--read-only` refuses, before sending, any operation the spec doesn't mark read-only. Use it whenever you are only looking, so a wrong endpoint can't change anything.

- Read-only is the spec's mark, not the HTTP method: some list operations are a `POST` (e.g. `POST /api/workspace/members/list`) and still pass.
- The contract doesn't show the mark; `api search <text> --read-only` lists only the operations that have it.
- It also refuses a path with an encoded `/`, `\` or `.` (`%2f`, `%5c`, `%2e`), which it can't check.

## Request Bodies

- **JSON:** `--body '{"key":"value"}'`, `--body @payload.json`, or `--body @- < payload.json`. Stdin is read only with `@-`.
- **Multipart:** when the contract shows `requestBodyContentType: multipart/form-data`, use `--form name=value` and `--form name=@path` instead of `--body`. Don't combine `--body` and `--form`.

## Output

The response body as the server sent it. Progress lines ("Loading the API spec", "Calling ...") go to stderr and stdout carries only the response, so pipe stdout alone into `jq`. Don't use `2>&1`.

- **JSON** is formatted in a terminal and passed through unchanged when piped.
- **Global `--json`** keeps stdout machine-readable: a non-JSON text response is wrapped as `{status, contentType, body}`.
- **An empty response** (e.g. a delete) prints `{"status":204}`.
- **A binary response** isn't printed; it's described by `status`, `contentType` and `bytes`. Add `--output <file>` to save it.
- **With `--output`**, it prints `status`, `contentType`, `bytes` and the `output` path.

## Errors

- **Exit code** is 0 on success and 1 on failure. A failure prints the server's error and a request ID to stderr; with `--json`, stdout gets `{error, code, details}`.
- **Rate limit:** the error also says how long to wait.
- **A 403 isn't always about permissions:** read the response body's `reason` (some operations need a published app, for example).
- **No operation matches** under `--help` or `--read-only`: the cached spec may predate the route, so add `--refresh`, or find the right path with `api search`.
- **Undoing a write** is up to the API: read the `description` before writing, since some changes can't be fully reverted.

## Examples

```bash
# Read a contract, then call while only looking
npx base44 api fetch PUT "/api/apps/{app_id}/seo/settings" --help | jq '.description, .requestBodySchema'
npx base44 api fetch GET "/api/apps/{app_id}/seo/settings" --read-only

# Against a specific app without a linked project
npx base44 api fetch GET "/api/apps/{app_id}/custom-domains" --read-only --app-id app_123

# Check which entities an app has, without a local project
npx base44 api fetch GET "/api/apps/{app_id}/entity-schemas" --read-only --app-id app_123

# Send a JSON body from a file, or from stdin
npx base44 api fetch POST "/api/apps/{app_id}/<path>" --body @payload.json
cat payload.json | npx base44 api fetch POST "/api/apps/{app_id}/<path>" --body @-

# A Workspace API call (find the ID with base44 workspace list)
npx base44 api fetch GET "/api/workspace/groups?workspaceId=<workspace-id>"

# Import entity records from a CSV file, sent as multipart (the entity must exist)
npx base44 api fetch POST "/api/apps/{app_id}/entities/Task/import" --form "file=@tasks.csv;type=text/csv"

# Save a binary response: download the app's source code without creating a new app
npx base44 api fetch GET "/api/apps/{app_id}/coding/export-to-zip" --read-only --output ./app.zip
```

## Notes

- `fetch` has no timeout: a call such as a deploy can take minutes.
- `fetch` doesn't validate the request itself; the server does.
