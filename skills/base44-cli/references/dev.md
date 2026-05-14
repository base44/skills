# base44 dev

Start the local development server for your Base44 app.

## Syntax

```bash
npx base44 dev [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `-p, --port <number>` | Port for the development server | No |

## Examples

```bash
# Start the dev server on the default port
npx base44 dev

# Start the dev server on a specific port
npx base44 dev --port 3001
npx base44 dev -p 3001
```

## Notes

- The dev server emulates Base44's backend locally, including entity CRUD, backend functions, and auth endpoints.
- If no port is specified, the server selects an available port automatically and prints the URL on startup.
- Analytics tracking calls are silently proxied to production (not logged as warnings) to keep logs readable.
- Requests for endpoints not supported locally are proxied to the Base44 production API.
