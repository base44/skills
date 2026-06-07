# base44 dev

Start a local development server that runs your Base44 backend (functions and entities) against a local database, so you can develop and test without hitting production.

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
# Start the dev server on an auto-selected port
npx base44 dev

# Start the dev server on a specific port
npx base44 dev --port 3001
```

## Output

```bash
$ npx base44 dev
◆ Created .env.local with app ID and dev server URL
└ Dev server is available at http://localhost:3001
```

## Auto-creation of `.env.local`

On first run, if `.env.local` does not exist in the project root, the CLI creates it with:

```
VITE_BASE44_APP_ID=<your-app-id>
VITE_BASE44_BACKEND_URL=http://localhost:<port>
```

This ensures the `@base44/vite-plugin` in your frontend routes API calls to the local dev server instead of the production backend. If `.env.local` already exists, it is left unchanged.

## Notes

- The dev server runs your backend functions locally using Deno
- Keeps running until you press Ctrl+C
- Changes to function files are picked up automatically (watch mode)
- Use this while developing to avoid deploying changes to production repeatedly
