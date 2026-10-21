# base44 branches list

List main and active branch names for use with the global `--branch` option.

## Syntax

```bash
npx base44 branches list
```

This command takes no options besides the global ones; it does not accept `--branch` itself (that's for sandbox commands). It requires an app context (`--app-id`, `BASE44_APP_ID`, or a linked project's `base44/.app.jsonc`).

## Examples

```bash
# Human-readable list
npx base44 branches list

# Machine-readable, for scripting which --branch value to pass
npx base44 branches list --app-id app_123 --json
```

## Output

Human mode prints one line per branch:

```
main (active)
feature-x (active)
```

With `--json`:

```json
{ "branches": [ { "name": "main", "status": "active" }, { "name": "feature-x", "status": "active" } ] }
```

`main` is always listed first with status `active` and is never fetched from the server; the rest come from the app's actual branches, filtered to `active` status (merged/deleted branches are not listed).

## Notes

- This is how an agent working outside the Builder (Base44's web-based app editor) discovers valid names to pass to `sandbox`'s global `--branch <name>` option.
- Branch names must be unique to be usable with `--branch` — if two active branches share a name, `--branch <name>` fails as ambiguous rather than guessing which one you meant.
