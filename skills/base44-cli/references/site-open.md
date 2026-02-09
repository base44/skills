# base44 site open

Opens the published Base44 site in your default web browser.

## Syntax

```bash
npx base44 site open
```

## Options

This command has no options.

## What It Does

1. Retrieves the published site URL from the project configuration
2. Opens the site URL in your default browser
3. In CI environments (when `CI` environment variable is set), only displays the URL without opening

## Example

```bash
# Open the published site
npx base44 site open
```

## Requirements

- Must be authenticated (run `npx base44 login` first)
- Must be run from a linked Base44 project directory
- The site must have been deployed at least once using `npx base44 site deploy`

## Notes

- This command opens the live production URL of your deployed site
- If the site hasn't been deployed yet, the command may fail
- The command will display a success message with the site URL after opening
- Useful for quickly viewing your deployed site without manually navigating to it
