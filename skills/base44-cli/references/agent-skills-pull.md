# base44 agent-skills pull

Pull agent skills from Base44 to local files. Agent skills are reusable instructions that extend what your app's AI agents know how to do, authored as Markdown files with a YAML frontmatter description.

## Syntax

```bash
npx base44 agent-skills pull
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Fetches all agent skills from Base44
2. Writes skill files to the `base44/agent-skills/` directory
3. Deletes local skill files that don't exist remotely
4. Reports written and deleted skills

## Prerequisites

- Must be run from a Base44 project directory
- Project must be linked to a Base44 app

## Output

```bash
$ npx base44 agent-skills pull

Fetching agent skills from Base44...
✓ Agent skills fetched successfully

Syncing skill files...
✓ Skill files synced successfully

Written: pdf-export, order-lookup
Deleted: old-skill

Pulled 2 agent skills to base44/agent-skills
```

When skills are already up to date (no changes):
```bash
$ npx base44 agent-skills pull

Fetching agent skills from Base44...
✓ Agent skills fetched successfully

Syncing skill files...
✓ Skill files synced successfully

All skills are already up to date

Pulled 3 agent skills to base44/agent-skills
```

## Agent Skill Synchronization

The pull operation synchronizes remote agent skills to your local files:

- **Written**: Skill files created or updated from remote
- **Deleted**: Local skill files removed (didn't exist remotely)

**Warning**: This operation replaces all local agent skills with remote versions. Any local changes not pushed to Base44 will be overwritten.

## Use Cases

- Sync agent skills to a new development machine
- Get the latest agent skills from your team
- Restore local skill files after accidental deletion
- Start working on an existing project with agent skills

## Notes

- Skill files are stored as `.md` in the `base44/agent-skills/` directory
- The directory location is configurable via `agentSkillsDir` in `config.jsonc`
- See [agent-skills-push.md](agent-skills-push.md) for the file format
- Use `base44 agent-skills push` to upload local changes to Base44
