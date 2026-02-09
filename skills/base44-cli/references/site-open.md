# base44 site open

Open the published site in your default web browser.

## Syntax

```bash
npx base44 site open
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Fetches the site URL for the current project
2. Opens the site URL in your default browser
3. Skips opening the browser in CI environments (checks `CI` environment variable)

## Example

```bash
# Open the published site
npx base44 site open
```

## Requirements

- Must be run from a linked Base44 project directory (contains `base44/.app.jsonc`)
- Must be authenticated (run `npx base44 login` first)
- Site must be deployed (use `npx base44 site deploy` first)

## Output

```bash
$ npx base44 site open

Site opened at https://my-app.base44.app
```

## Notes

- This opens the publicly accessible URL of your deployed site
- The browser will not open automatically in CI environments
- Use `npx base44 dashboard open` to access the management dashboard instead
