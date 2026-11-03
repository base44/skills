# base44 site dev

Run the site's dev server exactly as written, with **no local backend**. The frontend reaches its backend same-origin — the shape a hosted sandbox needs.

## Syntax

```bash
npx base44 site dev [args...]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `[args...]` | Arguments appended to the `serveCommand`, after `--` | No |

## Authentication

**Not required** for the command itself. It still needs a linked local project (`base44/.app.jsonc`) to know the app id.

## What It Does

1. Requires a linked local project — fails if `base44/.app.jsonc` is missing
2. Reads `site.serveCommand` from `base44/config.jsonc` (defaults to `npm run dev` when the project has no `site` block, or the block doesn't name one)
3. Runs it exactly as written — it starts no local backend of its own
4. Anything passed after `--` is appended to the command as given, with no extra `--` inserted. A `serveCommand` that itself needs `--` to reach its own script's args needs a **second** one: `base44 site dev -- -- --config wrapper.mjs`
5. Where the dev server binds is the `serveCommand`'s own business — in a hosted sandbox, `@base44/vite-plugin` binds Base44 apps to `0.0.0.0:5173`; a custom `serveCommand` must bind whatever address the sandbox exposes itself

## `site dev` vs `dev` vs `dev --remote`

| Command | Backend | Use when |
|---------|---------|----------|
| `base44 dev` | Local | Ordinary developer-machine full-stack development |
| `base44 dev --remote` | Production (remote) | Developer machine, frontend against live data, no local backend |
| `base44 site dev` | None — frontend reaches its backend same-origin | A hosted sandbox that serves the backend itself and only needs the frontend process |

`site dev` is the one case that starts **no** backend at all — not local, not pointed at production. Use plain `base44 dev` for normal local development.

## Examples

```bash
# Run the site's own dev server
npx base44 site dev

# Forward extra args to the serveCommand
npx base44 site dev -- --host

# serveCommand itself needs `--` to reach its script's own args
npx base44 site dev -- -- --config wrapper.mjs
```

## Requirements

- Must be run from a linked local Base44 project (`base44/.app.jsonc` must exist)

## Notes

- Reads only `base44/config.jsonc`'s `site` block — invalid resource files elsewhere in the project do not block it
- Shuts down when the serve command's process exits, or on `SIGINT`/`SIGTERM`
- `serveCommand` defaults to `npm run dev` here specifically because this command's whole job is serving the frontend; `base44 dev` and `base44 deploy` leave an absent `serveCommand` undefaulted, since there it means "no frontend to run"

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 dev` | Run the local backend, and the frontend too if configured |
| `base44 dev --remote` | Frontend only, against the production backend |
| `base44 site install` | Install the site's dependencies |
