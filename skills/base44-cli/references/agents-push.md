# base44 agents push

Push local agent configurations to Base44. This command synchronizes your local `base44/agents/` directory with the remote agents on Base44, replacing all remote agent configs with the local ones.

## Syntax

```bash
npx base44 agents push
```

## Arguments & Options

This command has no options or arguments.

## Examples

```bash
# Push all local agents to Base44
npx base44 agents push
```

## What It Does

1. Reads all agent configuration files from the `base44/agents/` directory
2. Pushes them to Base44, replacing all remote agent configs
3. Reports which agents were created, updated, or deleted
4. If no local agents are found, this will delete all remote agents

## Output

The command shows:
- **Created**: New agents that were added
- **Updated**: Existing agents that were modified
- **Deleted**: Remote agents that were removed (not present locally)

## Notes

- This command requires authentication (`npx base44 auth login`)
- This is a full sync operation - remote agents not present locally will be deleted
- Use this command after creating or modifying agent config files in `base44/agents/`
