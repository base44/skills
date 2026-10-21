# base44 site dev

Run the site's dev server, with no local backend.

## Syntax

```bash
npx base44 site dev [-- [args...]]
```

## Options

This command defines no options of its own. Arguments after a literal `--` are appended, as written, to the configured `serveCommand`.

| Argument | Description | Required |
|----------|-------------|----------|
| `[args...]` (after `--`) | Appended verbatim to `serveCommand` | No |

## Authentication

**Required**: No. This command works without logging in (e.g. in a build sandbox that has never authenticated).

## Requirements

- Must be run from a project with a linked local app (`base44/.app.jsonc` must exist), OR the app id must be supplied via `BASE44_APP_ID` for an unlinked checkout
- `base44/config.jsonc` is optional: if missing, gitignored, or invalid, the command falls back to the default site commands (`npm run dev`) and logs a warning instead of failing

## What It Does

1. Reads the linked app context (fails with `base44 site dev requires a linked local project...` if there is none)
2. Reads the project's `site.serveCommand`, defaulting to `npm run dev` if the project has no `site` block (or no `serveCommand` configured)
3. Appends anything passed after `--` to the end of the command, unmodified
4. Runs the resulting command from the project root
5. Injects the app id into the process so the frontend can resolve its backend
6. Does **not** start a local Base44 backend — the frontend is expected to reach its backend **same-origin** (no `VITE_BASE44_APP_BASE_URL` is injected). `@base44/vite-plugin` handles this for Base44-scaffolded apps by proxying `/api` and binding to `0.0.0.0:5173`; a custom `serveCommand` must bind to whatever address its environment exposes
7. Shuts down cleanly on signal (SIGINT/SIGTERM)

## How `site dev` relates to `base44 dev`

- `base44 dev` is the developer-machine command: it always runs the backend locally, and optionally the frontend.
- `base44 dev --remote` runs only the frontend, wired to the app's **published** production backend.
- `base44 site dev` runs only the frontend, with **no backend of its own** — it assumes same-origin access to whatever backend the hosting environment provides. This is the shape a hosted sandbox needs, not a developer's own machine.

## Argument Forwarding (`--`)

Everything after `--` is appended to `serveCommand`, exactly as given — this command adds nothing of its own. Because many package-manager scripts (e.g. `npm run dev`) need their own `--` to forward flags to the underlying binary, you often need **two** `--`:

```bash
# serveCommand = "npm run dev"
# this runs: npm run dev -- --config wrapper.mjs
npx base44 site dev -- -- --config wrapper.mjs
```

The first `--` ends `base44`'s own option parsing (consumed by the CLI, not forwarded). Everything after that — including a second, literal `--` — becomes the forwarded argument list and is joined onto `serveCommand` with spaces.

A flag placed before `--` is **not** forwarded and is rejected as an unknown option:

```bash
npx base44 site dev --port 5999
# Error: unknown option '--port'
```

If `serveCommand` takes no arguments, you can simply omit `--` and anything after it.

## Examples

```bash
# Run the configured serveCommand as-is
npx base44 site dev

# Forward "--config wrapper.mjs" through an npm script to the underlying tool
npx base44 site dev -- -- --config wrapper.mjs

# Forward args directly to a serveCommand that isn't a package-manager script
# (serveCommand = "vite"): runs `vite --config wrapper.mjs`
npx base44 site dev -- --config wrapper.mjs
```

## Notes

- Local only in the sense that it never calls the deployments/publish API and never requires login — but it does need an app context (linked project or `BASE44_APP_ID`) to inject the app id
- Falls back to `npm run dev` when the `site` block names no `serveCommand` — this fallback is specific to `site dev`/`site install`, not a schema-level default
- Works even if a resource file (entity/function/etc.) is invalid — serving the frontend reads only the site config, not the rest of the project
- Where the dev server binds is the `serveCommand`'s own responsibility; this command does not inject a host/port
