# base44 agents push

Push local agent configurations to Base44. This command synchronizes your local agent definitions with the remote Base44 backend, replacing all remote agent configurations with your local ones.

## Syntax

```bash
npx base44 agents push
```

## Options

This command has no additional options.

## Requirements

- User must be authenticated (run `npx base44 login` first)
- Must be run from a Base44 project directory (containing `base44/config.jsonc`)

## What It Does

1. Reads all local agent configurations from the project's agents directory (as specified in `base44/config.jsonc`)
2. Pushes these configurations to Base44
3. Replaces all remote agent configurations (acts as a sync operation)
4. Reports which agents were created, updated, or deleted

**Important:** This is a complete replacement operation. Any agents that exist remotely but are not present locally will be deleted.

## Output

The command provides detailed feedback about the sync operation:

- **Created**: New agents that were added remotely
- **Updated**: Existing agents that were modified
- **Deleted**: Remote agents that were removed (because they don't exist locally)

If no local agents are found, this will delete all remote agents.

## Examples

```bash
# Push all local agents to Base44
npx base44 agents push
```

## Notes

- This command requires authentication - ensure you're logged in first
- All remote agent configurations will be replaced with your local definitions
- If you have no local agents defined, all remote agents will be deleted
- The command displays the number of agents being pushed before executing
