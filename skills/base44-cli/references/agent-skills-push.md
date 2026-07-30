# base44 agent-skills push

Push local agent skills to Base44. Agent skills are reusable instructions that extend what your app's AI agents know how to do.

## Syntax

```bash
npx base44 agent-skills push [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `-y, --yes` | Skip confirmation prompt | No |

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## What It Does

1. Reads all skill files from the `base44/agent-skills/` directory
2. Validates skill files
3. Displays the count of skills to be pushed
4. Asks for confirmation before replacing remote skills (unless `-y`/`--yes` is passed)
5. Uploads skills to the Base44 backend
6. Reports the results: created, updated, and deleted skills

## Prerequisites

- Must be run from a Base44 project directory
- Project must have skill definitions in the `base44/agent-skills/` folder

## Confirmation Prompt

This is a destructive, full-sync push: any remote skill not present locally is deleted. Before pushing, the CLI warns you and asks for confirmation:

```bash
$ npx base44 agent-skills push

Found 2 agent skills to push
⚠ This will replace all remote agent skills with your local skills and delete any not present locally.
? Are you sure you want to continue? › Yes
```

In non-interactive mode (`--json`, CI/CD, no TTY), you must pass `-y`/`--yes` or the command throws:

```bash
npx base44 agent-skills push --yes
```

## Output

```bash
$ npx base44 agent-skills push --yes

Found 2 agent skills to push
Pushing agent skills to Base44...

Created: pdf-export
Updated: order-lookup
Deleted: old-skill

✓ Agent skills pushed to Base44
```

## Agent Skill Synchronization

The push operation synchronizes your local agent skills with Base44:

- **Created**: New skills that didn't exist in Base44
- **Updated**: Existing skills with modified description or body
- **Deleted**: Skills that were removed from your local `base44/agent-skills/` folder

**Warning**: This is a full sync operation. Skills removed locally are deleted from Base44 on the next push. **Exception:** if you have *no* local skill files, the push is a **no-op** — a safety guard stops an empty local set from wiping all remote skills.

## Error Handling

If no local skill files are found, the push is a safe **no-op** — the guard leaves remote skills untouched, despite the warning line the CLI prints:
```bash
$ npx base44 agent-skills push
No local agent skills found - this will delete all remote skills
```

If a skill file has an invalid name or missing content:
```bash
Error: Invalid skill file
```

## Agent Skill File Format

Each skill is a single Markdown file in `base44/agent-skills/`, named `{skill-name}.md`, with a YAML frontmatter block followed by the skill body:

```markdown
---
description: Export the current report as a PDF and attach it to the conversation.
---

Use this skill when the user asks to export, download, or share a report as a PDF.

1. Call the `generate_report_pdf` function with the current report's entity ID.
2. Attach the returned file URL in your reply.
```

| Field | Location | Required | Description |
|-------|----------|----------|--------------|
| `name` | File name (without `.md`) | Required | Lowercase, hyphenated, 1-64 chars — pattern `/^[a-z0-9]+(-[a-z0-9]+)*$/` |
| `description` | Frontmatter `description` | Required | 1-1024 chars. Shown to the agent to decide when to use the skill |
| body | Markdown content after the frontmatter | Required | 1-15000 chars. The actual instructions the agent follows |

**Naming rules:**
- **Skill names** must match pattern: `/^[a-z0-9]+(-[a-z0-9]+)*$/` (lowercase alphanumeric, hyphen-separated)
  - Valid: `pdf-export`, `order-lookup`, `send-invoice`
  - Invalid: `PdfExport`, `pdf_export`, `PDF-Export`
- The file name (minus `.md`) is the skill's `name` — there is no separate `name` field in the frontmatter

## Use Cases

- After defining new agent skills in your project
- When modifying existing skill instructions
- To sync skill changes before testing agent behavior
- As part of your development workflow when agent capabilities change

## Notes

- Skill files are stored as `.md` in the `base44/agent-skills/` directory
- The directory location is configurable via `agentSkillsDir` in `config.jsonc`
- Changes are applied to your Base44 project immediately
- Use `base44 agent-skills pull` to download skills from Base44
- Agent skills are also pushed as part of `base44 deploy`
