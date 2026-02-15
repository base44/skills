# base44 dev

Start the Base44 development server. This command is currently in development and may not be visible in the main CLI help.

## Syntax

```bash
npx base44 dev [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `-p, --port <number>` | Port for the development server | No |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Starts a local development server
2. Configures the server port (uses provided port or finds an available one)
3. Displays the local server URL

## Examples

```bash
# Start dev server on default port
npx base44 dev

# Start dev server on specific port
npx base44 dev -p 3000
npx base44 dev --port 8080
```

## Output

```bash
$ npx base44 dev

Starting development server...

✓ Dev server is available at http://localhost:3000
```

## Use Cases

- Local development with live Base44 backend connection
- Testing Base44 integrations locally
- Development workflow with hot reloading

## Notes

- This is a development command and may change in future versions
- The command requires authentication to connect to Base44 services
- Port conflicts will be automatically resolved if the requested port is unavailable
- Press Ctrl+C to stop the development server

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 deploy` | Deploy all project resources |
| `base44 site deploy` | Deploy only the site |
