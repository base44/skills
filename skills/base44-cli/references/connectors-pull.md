# base44 connectors pull

Pull connectors from Base44 to local files (replaces all local connector configs).

## Syntax

```bash
npx base44 connectors pull
```

## Description

Fetches connector configurations (OAuth integrations) from your Base44 project and writes them to local files in your project's connectors directory. This command replaces all local connector configurations with the remote versions.

## Options

No options available. This command requires authentication.

## Examples

```bash
# Pull all connectors from Base44
npx base44 connectors pull
```

## Output

The command provides feedback on:
- Number of connector files written
- Number of connector files deleted
- Final connector count and location

Example output:
```
Written: slack, github
Pulled 2 connectors to ./base44/connectors
```

## Notes

- Requires authentication (run `npx base44 auth login` first)
- Replaces all local connector configurations
- Connector files are written to the project's connectors directory (typically `./base44/connectors`)
- If all connectors are already up to date, you'll see: "All connectors are already up to date"
