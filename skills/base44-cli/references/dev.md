# base44 dev

Start the local development server for testing backend functions.

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

1. Reads project configuration (functions, entities)
2. Starts a local development server using Deno
3. Serves backend functions locally for testing
4. Outputs the URL where the dev server is available

## Examples

```bash
# Start dev server on default port
npx base44 dev

# Start dev server on a specific port
npx base44 dev --port 3001
npx base44 dev -p 3001
```

## Output

```bash
$ npx base44 dev

Dev server is available at http://localhost:3000
```

## Prerequisites

- Must be run from a Base44 project directory
- Project must have function definitions in `base44/functions/`

## Notes

- The dev server runs locally and does not require deployment
- Use this to test backend functions before deploying to Base44
- If no port is specified, a default port is chosen automatically
- The server uses Deno under the hood for function execution
