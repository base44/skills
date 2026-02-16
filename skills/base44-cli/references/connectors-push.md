# base44 connectors push

Push local connectors to Base44 (overwrites connectors on Base44).

## Syntax

```bash
npx base44 connectors push
```

## Description

Pushes local connector configurations (OAuth integrations) to your Base44 project. This command reads connector files from your local project and syncs them to Base44, overwriting any existing connectors on the remote.

For connectors that require OAuth authorization, the command will:
1. Display authorization URLs
2. Prompt to open your browser for authorization
3. Wait for authorization completion (with option to skip)

## Options

No options available. This command requires authentication.

## Examples

```bash
# Push all local connectors to Base44
npx base44 connectors push
```

## OAuth Authorization Flow

When pushing connectors that require OAuth:

```bash
# The CLI will prompt:
2 connector(s) require authorization in your browser:
  slack: https://api.base44.com/oauth/...
  github: https://api.base44.com/oauth/...

? Open browser to authorize now? (Y/n)

# If you choose Yes:
Opening browser for slack...
⠋ Waiting for slack authorization... (Esc to skip)

# After authorization:
✓ slack authorization complete
```

## Output

The command provides a summary showing:
- **Synced**: Connectors successfully updated
- **Added**: New connectors authorized and added
- **Removed**: Connectors removed from Base44
- **Skipped**: Connectors that required authorization but were skipped
- **Failed**: Connectors that encountered errors

Example output:
```
Summary:
✓ Synced: stripe
✓ Added: slack, github
⚠ Skipped: discord
✗ Failed: twitter - authorization timed out
```

## CI/CD Usage

In CI environments (when `CI=true`):
- OAuth prompts are automatically skipped
- Authorization links are displayed for manual completion
- Command will complete without waiting for OAuth

## Notes

- Requires authentication (run `npx base44 auth login` first)
- Overwrites connectors on Base44 with local configurations
- If no local connectors are found, checks for remote connectors to remove
- OAuth authorization timeout is 2 minutes per connector
- Press `Esc` during authorization to skip a connector
- Skipped connectors can be authorized later by running the command again
