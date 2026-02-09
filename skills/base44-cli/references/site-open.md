# base44 site open

Open the published site in your default web browser.

## Syntax

```bash
npx base44 site open
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Fetches the site URL for your Base44 app
2. Opens the site in your default browser

## Prerequisites

- Must be run from a linked Base44 project directory
- Must be authenticated (run `npx base44 login` first)
- Site must have been deployed previously

## Output

```bash
$ npx base44 site open

Site opened at https://my-app.base44.app
```

## Use Cases

- Quickly preview your deployed site
- Open your site from the command line
- Check the live version after deployment

## Notes

- The command opens the current live version of your site
- In CI environments (when `CI` env var is set), the browser won't open but the URL is displayed
- The site URL is the same as the one shown after `base44 site deploy`

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 site deploy` | Deploy built site files to Base44 hosting |
| `base44 dashboard open` | Open the app dashboard in your browser |
| `base44 deploy` | Deploy all resources including the site |
