# base44 agents pull

Pull agent configurations from Base44 to local files. This command fetches all remote agent definitions from Base44 and writes them to your local project, replacing all local agent configurations.

## Syntax

```bash
npx base44 agents pull
```

## Options

This command has no additional options.

## Requirements

- User must be authenticated (run `npx base44 login` first)
- Must be run from a Base44 project directory (containing `base44/config.jsonc`)

## What It Does

1. Fetches all agent configurations from Base44
2. Writes them to local files in the project's agents directory (as specified in `base44/config.jsonc`)
3. Replaces all local agent configurations (acts as a sync operation)
4. Reports which agent files were written or deleted

**Important:** This is a complete replacement operation. Any local agent files that don't exist remotely will be deleted.

## Output

The command provides detailed feedback about the sync operation:

- **Written**: Agent files that were created or updated locally
- **Deleted**: Local agent files that were removed (because they don't exist remotely)
- The total number of agents pulled
- The target directory where agents were written

If no remote agents are found, the command will report this and no local files will be modified.

## Examples

```bash
# Pull all remote agents from Base44 to local files
npx base44 agents pull
```

## Notes

- This command requires authentication - ensure you're logged in first
- All local agent configurations will be replaced with remote definitions
- If no remote agents exist, local agent files will remain unchanged
- The command displays where agent files are being written (typically `base44/agents/`)
