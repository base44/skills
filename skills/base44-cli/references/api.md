# base44 api

Search and call any Apps API or Workspace API operation with your CLI login; no API key or personal access token is needed. The commands read the server's OpenAPI spec, so they cover every public endpoint, including ones with no dedicated CLI command.

## When to Use

Use `base44 api` for a Base44 platform task that no dedicated CLI command covers, such as custom domains, app users, SEO settings, and more.

**Prefer a dedicated command when it does exactly what was asked** (`base44 secrets`, `base44 functions`, `base44 logs`, `base44 deploy`, and the rest of this skill). If it also does something the user didn't ask for (read its reference first), use `base44 api` instead. Use `base44 api` for everything else.

The API covers apps and workspaces, not your own Base44 account: there is no operation for your password, email or profile. Send the user to the Base44 web app for those.

## The Flow

1. **Find the endpoint.** Describe what you want to do:
   ```bash
   npx base44 api search "<what you want to do>"
   ```
   Or browse by area with `base44 api catalog [area]`, or match the spec with a regular expression with `base44 api grep <regex>` when search misses.
2. **Read its contract.** Add `--help` after the method and path to print its description, parameters, request body schema and response schema. A contract can run to tens of KB, so select the parts you need:
   ```bash
   npx base44 api fetch <METHOD> <path> --help | jq '.description, .parameters, .requestBodySchema, .responseSchema'
   ```
   Read the `description` before calling: the top search result is not always the right operation, and the description often names the one to use instead or the other operations a task needs (a custom domain, for example, also needs DNS records and linking before it serves).
3. **Call it** with the user's login:
   ```bash
   npx base44 api fetch <METHOD> <path> [--body <json>]
   ```

Each result names its operation as `endpoint` (e.g. `"GET /api/apps/{app_id}/custom-domains"`); pass that method and path to `fetch` as is.

Progress lines ("Loading the API spec", "Calling ...") go to stderr and stdout carries only the response, so pipe stdout alone into `jq`. Don't use `2>&1`.

## Commands

### `base44 api search <text...>`

Search every operation by what it does. Returns the best matches as `endpoint` and `summary`.

| Option | Description | Default |
|--------|-------------|---------|
| `--limit <n>` | Most results to return; weak matches are dropped, so you may get fewer | `5` |
| `--read-only` | Only read-only operations | - |
| `--refresh` | Fetch the API spec again instead of using the cached copy | - |

### `base44 api catalog [area]`

Without an argument, list the API's areas (an area is the path segment after `{app_id}`, else the one after `/api`, e.g. `workflows`). With an area, list every operation in it.

| Option | Description |
|--------|-------------|
| `--read-only` | Only read-only operations |
| `--refresh` | Fetch the API spec again instead of using the cached copy |

### `base44 api grep <pattern>`

Search the spec with a regular expression, for when `search` misses. The pattern runs over each operation's contract (including its `endpoint`, summary and schemas) as JSON text, so quotes and newlines appear escaped, and a common word also matches inside unrelated schemas.

| Option | Description | Default |
|--------|-------------|---------|
| `--area <area>` | Search only one area's operations | - |
| `-i, --ignore-case` | Case-insensitive match | - |
| `--limit <n>` | Most operations to return | `20` |
| `--read-only` | Only read-only operations | - |
| `--refresh` | Fetch the API spec again instead of using the cached copy | - |

### `base44 api fetch <METHOD> <path>`

Call an operation, or with `--help` print its contract. The path may include a query string.

| Option | Description |
|--------|-------------|
| `--help`, `-h` | After a method and path, print that operation's contract (JSON) instead of calling it |
| `--body <json>` | Request body: inline JSON, `@file.json`, or `@-` to read it from stdin |
| `--form <field>` | Multipart field: `name=value`, or `name=@file` to attach a file (repeatable) |
| `--output <file>` | Save the response body to a file |
| `--read-only` | Refuse, before sending, any operation the spec does not mark read-only |
| `--refresh` | Fetch the API spec again instead of using the cached copy |

## Path Placeholders

- `{app_id}` is filled from `--app-id` or the linked project, so an endpoint from `search` or `catalog` can be passed as is.
- **Any other placeholder** (e.g. `{workflow_id}`) must be replaced with a real value by hand; `fetch` fails before sending otherwise.
- **The workspace ID** is never filled in: Workspace API operations take it as a `workspaceId` query parameter or a `{workspace_id}` path placeholder. Get it from `base44 workspace list`.
- `--help` accepts the path template as is.

## Read-Only Mode

`--read-only` refuses, before sending, any operation the spec doesn't mark read-only. Use it whenever you are only looking, so a wrong endpoint can't change anything. Read-only is the spec's mark, not the HTTP method: some list operations are a `POST` (e.g. `POST /api/workspace/members/list`) and still pass. The contract doesn't show the mark; `api search <text> --read-only` lists only the operations that have it. On `search`, `catalog` and `grep` it lists only read-only operations.

## Request Bodies and Responses

- **JSON body:** `--body '{"key":"value"}'`, `--body @payload.json`, or `--body @- < payload.json`. Stdin is read only with `@-`.
- **Multipart body:** when the contract shows `requestBodyContentType: multipart/form-data`, use `--form name=value` and `--form name=@path` for files instead of `--body`; add `;type=<media type>` after the path to set the file's content type. Don't combine `--body` and `--form`.
- **Binary responses** are not printed; add `--output <file>` to save them.
- **Global `--json`** keeps stdout machine-readable: a non-JSON text response is wrapped as `{status, contentType, body}`.
- **An empty response** (e.g. a delete) prints `{"status":204}`.
- **Exit code** is 0 on success and 1 on failure. A failure prints the server's error to stderr; with `--json`, stdout gets `{error, code, details}`.
- **IDs for the next call:** a create returns the new resource, including its `id`; put that into the next path's placeholder.
- **Undoing a write** is up to the API: read the `description` before writing, since some changes can't be fully reverted.

The spec is cached for 1 hour; `--refresh` downloads it again.

## Examples

```bash
# Find the endpoint
npx base44 api search "add a custom domain"
npx base44 api catalog
npx base44 api catalog seo
npx base44 api grep "noindex" --area seo

# Read its contract
npx base44 api fetch PUT "/api/apps/{app_id}/seo/settings" --help | jq '.description, .requestBodySchema'

# Call it while only looking
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

## Requirements

- `search`, `catalog`, `grep`, `fetch --help` and a `--read-only` refusal send nothing and need no login
- Calling an operation requires authentication (`npx base44 login`)
- A path with `{app_id}` needs a linked project, `--app-id <id>`, or `BASE44_APP_ID`

## Notes

- `fetch` has no timeout: a call such as a deploy can take minutes
- A failed call returns the server's own error and a request ID; on a rate limit it also says how long to wait
- A 403 isn't always about permissions: read the response body's `reason` (some operations need a published app, for example)
- Quote the path so the shell doesn't read the braces or the `?`
