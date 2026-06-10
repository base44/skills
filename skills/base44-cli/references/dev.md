# base44 dev

Start a local development server that mirrors the Base44 backend, enabling offline or low-latency development without hitting the production API.

## Syntax

```bash
npx base44 dev [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `-p, --port <number>` | Port for the development server (default: auto-selected) | No |

## Examples

```bash
# Start dev server on the default port
npx base44 dev

# Start dev server on a specific port
npx base44 dev --port 3001
```

## What It Does

1. Reads project configuration (`base44/config.jsonc`) to load entities, functions, and settings
2. Starts a local HTTP server that handles entity CRUD, function invocations, and auth
3. Watches `base44/config.jsonc` for changes and hot-reloads functions and entities automatically
4. On first run, creates `.env.local` in the project root with `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL` if the file doesn't already exist — this wires the Vite frontend plugin to the dev server instead of production

## Notes

- The dev server requires Deno to run backend functions locally.
- `.env.local` is created automatically on first run so the `@base44/vite-plugin` connects to the local dev server. If you maintain your own `.env.local`, the file is left unchanged.
- Use Ctrl+C to stop the server.
- Must be run from a Base44 project directory (with `base44/config.jsonc`).
