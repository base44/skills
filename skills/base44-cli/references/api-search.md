# base44 api search

Search every Base44 API operation by what it does. This is the fastest way to find the right endpoint before calling it with `base44 api fetch`.

## Syntax

```bash
npx base44 api search <text...> [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `<text...>` (positional) | What you are looking for, e.g. `"failed workflow runs"` (variadic — words after it are joined with spaces, so quoting is optional) | Yes |
| `--limit <n>` | Most results to return (default 5) | No |
| `--read-only` | Only read-only operations | No |
| `--refresh` | Fetch the API spec again instead of using the cached copy (kept 1 hour) | No |

No authentication is required — the spec is Base44's public OpenAPI document, cached locally for an hour.

## Examples

```bash
# Natural-language search over summaries, descriptions, methods, paths and parameters
npx base44 api search "failed workflow runs"

# Quoting is optional; words are joined automatically
npx base44 api search delete connector

# More than the default 5 results
npx base44 api search "entity records" --limit 15

# Only operations safe to call with a read-only personal access token
npx base44 api search "workflow runs" --read-only
```

## Output

An array of matches, each an `endpoint` (`METHOD /path/template`) and its `summary`:

```json
[
  { "endpoint": "GET /api/apps/{app_id}/workflows/runs", "summary": "List workflow runs" },
  { "endpoint": "GET /api/apps/{app_id}/workflows", "summary": "List workflows" }
]
```

An empty array means nothing matched well enough to return — try `base44 api grep` with a regular expression instead, or broaden the wording.

## Notes

- Ranking favors an operation whose **summary** (its own name, e.g. "List workflow runs") covers every search word; among those, more precise summaries and read (`GET`) operations rank first. Everything else follows by a relevance score boosted by how much of the summary the query covers.
- Common words (`a`, `the`, `is`, `my`, ...) are stripped before matching, so `"who am i"` intentionally finds nothing — it's all stopwords.
- Short words (fewer than 3 letters, e.g. `"id"`) only match as whole words, not prefixes, to avoid matching most of the spec.
- `--limit` must be a positive integer; anything else is rejected before the search runs.
- When search misses an operation you know exists (unusual field name, a term the summary doesn't use), fall back to `base44 api grep <pattern>`, which matches the operation's full contract text with a regular expression.
