# base44 dev

Start the local Base44 development server for testing backend functions locally.

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

1. Reads project configuration (functions, entities, project settings)
2. Starts a local development server using Deno
3. Serves your backend functions locally for testing

## Examples

```bash
# Start dev server on default port
npx base44 dev

# Start dev server on a specific port
npx base44 dev -p 3001
```

## Output

```bash
$ npx base44 dev

Dev server is available at http://localhost:3000
```

## Requirements

- Must be run from a Base44 project directory
- Project must have backend functions defined in `base44/functions/`

## Notes

- The dev server runs functions locally so you can test them without deploying
- The port defaults to an automatically selected available port if not specified
- Use `Ctrl+C` to stop the dev server
- After testing locally, use `npx base44 functions deploy` to deploy functions to Base44
