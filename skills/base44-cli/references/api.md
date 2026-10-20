# base44 api

Search and call any public Base44 API operation. The commands read the server's OpenAPI spec, so they cover every public endpoint, including ones with no dedicated CLI command.

## When to Use

Use `base44 api` for a Base44 platform task that no dedicated CLI command covers, such as custom domains, app users, SEO settings, and more.

**Prefer a dedicated command when one exists** (`base44 secrets`, `base44 functions`, `base44 deploy`, and the rest of this skill). Use `base44 api` for everything else.

## The Flow

1. **Find the endpoint.** Describe what you want to do:
   ```bash
   npx base44 api search "<what you want to do>"
   ```
   Or browse by area with `base44 api catalog [area]`, or match the spec with a regular expression with `base44 api grep <regex>` when search misses.
2. **Read its contract.** Add `--help` after the method and path to print its parameters, request body schema and response schema:
   ```bash
   npx base44 api fetch <METHOD> <path> --help
   ```
3. **Call it** with the user's login:
   ```bash
   npx base44 api fetch <METHOD> <path> [--body <json>]
   ```

Each result names its operation as `endpoint` (e.g. `"GET /api/apps/{app_id}/workflows/runs"`); pass that method and path to `fetch` as is.

## Commands

### `base44 api search <text...>`

Search every operation by what it does. Returns the best matches as `endpoint` and `summary`.

| Option | Description | Default |
|--------|-------------|---------|
| `--limit <n>` | Most results to return | `5` |
| `--read-only` | Only read-only operations | - |
| `--refresh` | Fetch the API spec again instead of using the cached copy | - |

### `base44 api catalog [area]`

Without an argument, list the API's areas (an area is the path segment after `{app_id}`, else the one after `/api`, e.g. `workflows`). With an area, list every operation in it.

| Option | Description |
|--------|-------------|
| `--read-only` | Only read-only operations |
| `--refresh` | Fetch the API spec again instead of using the cached copy |

### `base44 api grep <pattern>`

Search the spec with a regular expression, for when `search` misses. The pattern runs over each operation's contract as JSON text, so quotes and newlines appear escaped.

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
- `--help` accepts the path template as is.

## Read-Only Mode

`--read-only` refuses, before sending, any operation the spec doesn't mark read-only. Use it whenever you are only looking, so a wrong endpoint can't change anything. On `search`, `catalog` and `grep` it lists only read-only operations.

## Request Bodies and Responses

- **JSON body:** `--body '{"key":"value"}'`, `--body @payload.json`, or `--body @- < payload.json`. Stdin is read only with `@-`.
- **Multipart body:** when the contract shows `requestBodyContentType: multipart/form-data`, use `--form name=value` and `--form name=@path` for files instead of `--body`. Don't combine `--body` and `--form`.
- **Binary responses** are not printed; add `--output <file>` to save them.
- **Global `--json`** keeps stdout machine-readable: a non-JSON text response is wrapped as `{status, contentType, body}`.
- The contract is JSON; cut it down with e.g. `| jq '.parameters, .requestBodySchema'`.

## Spec Cache

The spec is cached for 1 hour. Pass `--refresh` to download it again, for example when `--help` or `--read-only` reports that no operation matches a route that should exist.

## Examples

```bash
# Find the endpoint
npx base44 api search "failed workflow runs"
npx base44 api catalog
npx base44 api catalog workflows
npx base44 api grep "runs.*status" --area workflows

# Read its contract
npx base44 api fetch GET "/api/apps/{app_id}/workflows/runs" --help

# Call it while only looking
npx base44 api fetch GET "/api/apps/{app_id}/workflows/runs?status=failed" --read-only

# Against a specific app without a linked project
npx base44 api fetch GET "/api/apps/{app_id}/workflows/runs" --app-id app_123

# Send a JSON body from a file, or from stdin
npx base44 api fetch POST "/api/apps/{app_id}/<path>" --body @payload.json
cat payload.json | npx base44 api fetch POST "/api/apps/{app_id}/<path>" --body @-

# Upload a file as multipart
npx base44 api fetch POST "/api/apps/{app_id}/<path>" --form file=@./data.csv

# Save a binary response
npx base44 api fetch GET "/api/apps/{app_id}/<path>" --output ./download.zip
```

## Requirements

- `search`, `catalog`, `grep`, `fetch --help` and a `--read-only` refusal send nothing and need no login
- Calling an operation requires authentication (`npx base44 login`)
- A path with `{app_id}` needs a linked project, `--app-id <id>`, or `BASE44_APP_ID`

## Notes

- `fetch` has no timeout: a call such as a deploy can take minutes
- A failed call returns the server's own error
