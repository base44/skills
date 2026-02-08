# base44 dashboard

Opens the Base44 app dashboard in your default web browser.

## Syntax

```bash
npx base44 dashboard
```

## Options

This command has no options.

## What It Does

1. Reads the project's app ID from `base44/.app.jsonc`
2. Opens the dashboard URL in your default browser

## Example

```bash
# Open dashboard for current project
npx base44 dashboard
```

## Requirements

- Must be run from a linked Base44 project directory (contains `base44/.app.jsonc`)
- Must be authenticated (run `npx base44 login` first)

## Notes

- The dashboard provides a web interface to manage your app's entities, functions, users, and settings
- If you're not in a project directory, the command will fail with an error
