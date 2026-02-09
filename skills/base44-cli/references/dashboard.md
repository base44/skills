# base44 dashboard

Manage app dashboard operations.

## Syntax

```bash
npx base44 dashboard <subcommand> [options]
```

## Subcommands

| Subcommand | Description |
|------------|-------------|
| `open` | Open the app dashboard in your browser |

## What It Does

The `dashboard` command provides access to your Base44 app's web dashboard, where you can manage entities, functions, users, and settings.

## Example

```bash
# Open dashboard for current project
npx base44 dashboard open
```

## Requirements

- Must be run from a linked Base44 project directory
- Must be authenticated (run `npx base44 login` first)

## Notes

- For detailed information about the `open` subcommand, see [dashboard-open.md](dashboard-open.md)
- The dashboard provides a web interface to manage all aspects of your Base44 application
