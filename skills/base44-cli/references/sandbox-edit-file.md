# base44 sandbox edit

Apply exact old→new string edits to a file in an app's remote sandbox.

## Syntax

```bash
npx base44 sandbox edit <path> [options]
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `<path>` | File path relative to the app root | Yes | — |
| `--edits-json <json>` | JSON array of edits | No* | read from stdin |
| `--dry-run` | Return the unified diff without writing | No | off |

\* Either `--edits-json` or piped stdin is required.

Each edit is `{ "old_text": "...", "new_text": "...", "replace_all"?: true }`:

- `old_text` — non-empty string to find (required)
- `new_text` — replacement string (required, may be empty to delete)
- `replace_all` — replace every occurrence instead of requiring/matching exactly one (optional, default: false)

The array must be non-empty; invalid JSON or a malformed edit object is rejected before any request is made.

This command also accepts the global `--branch <name>` option and requires an app context (`--app-id`, `BASE44_APP_ID`, or a linked project).

## Examples

```bash
# Pipe edits via stdin
echo '[{"old_text":"foo","new_text":"bar"}]' | npx base44 sandbox edit src/x.ts

# Pass edits inline, replacing every occurrence, previewing first
npx base44 sandbox edit src/x.ts --dry-run --edits-json '[{"old_text":"a","new_text":"b","replace_all":true}]'

# Apply for real once the diff looks right
npx base44 sandbox edit src/x.ts --edits-json '[{"old_text":"a","new_text":"b","replace_all":true}]'
```

## Output

Always a JSON document on stdout:

```json
{ "path": "src/x.ts", "diff": "@@ -1,3 +1,3 @@\n-foo\n+bar\n", "applied": true }
```

With `--dry-run`, `applied` is `false` and no write happens — inspect `diff` before re-running without the flag.

## Notes

- `old_text` must match the file's current content exactly (including whitespace) — this is a literal find/replace, not a fuzzy or regex match.
- Use `--dry-run` first when you're not certain `old_text` is unique; the returned `diff` shows exactly what would change before you commit to it.
- **Writes are committed but not checkpointed.** Only checkpoints appear in the builder's version history; a Restore or Revert there rolls the app back to the last checkpoint and discards everything written after it. Run `base44 sandbox checkpoint` after each unit of work and before you stop — see [sandbox-checkpoint.md](sandbox-checkpoint.md).
