# base44 agents pull

Pull agent configurations from Base44 to local files. This command synchronizes your remote agents on Base44 with your local `base44/agents/` directory, replacing all local agent configs with the remote ones.

## Syntax

```bash
npx base44 agents pull
```

## Arguments & Options

This command has no options or arguments.

## Examples

```bash
# Pull all agents from Base44 to local files
npx base44 agents pull
```

## What It Does

1. Fetches all agent configurations from Base44
2. Writes them to the `base44/agents/` directory
3. Replaces all local agent config files with the remote ones
4. Reports which agent files were written or deleted

## Output

The command shows:
- **Written**: Agent files that were created or updated locally
- **Deleted**: Local agent files that were removed (not present on Base44)
- If no agents are found on Base44, the command exits without making changes

## Notes

- This command requires authentication (`npx base44 auth login`)
- This is a full sync operation - local agent files not present on Base44 will be deleted
- Use this command to download agents configured in the Base44 dashboard
- The agents are written to the directory specified in `base44/config.jsonc` (default: `base44/agents/`)
