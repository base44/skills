# base44 dev

Start local development for a linked Base44 project.

This command always starts the Base44 backend locally. If `base44/config.jsonc` defines `site.serveCommand`, it also runs your frontend dev server from the project root and wires it to the local backend automatically.

## Syntax

```bash
npx base44 dev [options]
```

## Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `-p, --port <number>` | Port for the local Base44 backend | No | 4400 |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Requirements

- Must be run from a **linked local Base44 project**
- `base44/.app.jsonc` must exist
- `base44 dev` cannot be used with `--app-id` or `BASE44_APP_ID`

## What It Does

1. Reads your linked local project configuration
2. Starts the local Base44 backend for entities, functions, and auth routes
3. Watches local Base44 resources and reloads them when they change
4. If `site.serveCommand` is configured, starts your frontend dev server from the project root
5. Injects `VITE_BASE44_APP_ID` and `VITE_BASE44_APP_BASE_URL` into the frontend process
6. Shuts everything down cleanly when you stop the command

## Frontend + Backend Behavior

`base44 dev` works for **both backend and frontend**:

- **Backend**: always runs locally
- **Frontend**: runs only when `base44/config.jsonc` includes `site.serveCommand`

Before using `base44 dev` for full-stack local development, verify your config:

```jsonc
{
  "site": {
    "serveCommand": "npm run dev"
  }
}
```

If `site.serveCommand` is missing, `base44 dev` still works, but it only starts the Base44 backend.

## Examples

```bash
# Start local development on the default port
npx base44 dev

# Start the backend on a specific port
npx base44 dev --port 4500
```

## Notes

- Use this from a linked local project, not with `--app-id`
- When the frontend is running, the CLI streams backend and frontend output together
- If the frontend process exits, the local dev environment shuts down too
