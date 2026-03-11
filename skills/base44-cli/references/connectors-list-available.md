# base44 connectors list-available

List all available OAuth integration types that can be used as connectors in Base44.

## Syntax

```bash
npx base44 connectors list-available
```

## Options

No options. The command takes no arguments or flags.

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Fetches all available integration types from Base44
2. Displays each integration with its type identifier and metadata

## Example

```bash
npx base44 connectors list-available
```

## Output

```bash
Google Calendar
  type: googlecalendar
  ...

Slack
  type: slack
  ...

Notion
  type: notion
  ...

Found 12 available integrations.
```

## Use Cases

- Discover which integration types are supported before creating a connector file
- Find the exact `type` value to use in your connector `.jsonc` file
- Check what OAuth integrations are available on the platform

## Notes

- The `type` field shown in the output is the value to use in your `base44/connectors/{type}.jsonc` file
- Use `base44 connectors push` to push connector configurations to Base44
- Use `base44 connectors pull` to pull existing connector configurations from Base44

## Related Commands

- [connectors-create.md](connectors-create.md) - How to create connector configuration files
- [connectors-push.md](connectors-push.md) - Push local connectors to Base44
- [connectors-pull.md](connectors-pull.md) - Pull connectors from Base44 to local files
