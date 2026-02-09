# base44 dashboard open

Opens the Base44 app dashboard in your default web browser.

## Syntax

```bash
npx base44 dashboard open
```

## Options

This command has no options.

## What It Does

1. Reads the project's app ID from the configuration
2. Opens the dashboard URL in your default browser
3. In CI environments (when `CI` environment variable is set), only displays the URL without opening

## Example

```bash
# Open dashboard for current project
npx base44 dashboard open
```

## Requirements

- Must be authenticated (run `npx base44 login` first)
- Must be run from a linked Base44 project directory

## Notes

- The dashboard provides a web interface to manage your app's entities, functions, users, and settings
- If you're not authenticated or not in a project directory, the command will fail with an error
- The command will display a success message with the dashboard URL after opening
