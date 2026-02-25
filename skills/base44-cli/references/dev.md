# base44 dev

Start the local development server for the current Base44 project.

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

- Requires authentication
- Reads project configuration from `base44.config.json`
- Loads local functions and entities and serves them via a local proxy
- The server URL is printed on startup (e.g., `http://localhost:<port>`)

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 deploy` | Deploy all project resources to Base44 |
| `base44 entities push` | Push local entity definitions to Base44 |
| `base44 functions deploy` | Deploy local functions to Base44 |
