# Base44 SDK Skills

> 🚧 **Under Active Development** — Feedback and suggestions are welcome on [GitHub Discussions](https://github.com/orgs/base44/discussions).

Agent skills for [Base44 SDK](https://docs.base44.com) development. Install these skills onto your coding agents to enhance Base44 app development workflows.

Compatible with **Cursor**, **Claude Code**, **Codex**, **OpenCode**, and [10+ more agents](https://github.com/vercel-labs/add-skill#available-agents).

## Installation

Install skills using [`add-skill`](https://github.com/vercel-labs/add-skill):

```bash
# Install all skills
npx add-skill <owner>/skills

# List available skills
npx add-skill <owner>/skills --list

# Install specific skills
npx add-skill <owner>/skills --skill <skill-name>

# Install globally (user-level)
npx add-skill <owner>/skills -g

# Install to specific agents
npx add-skill <owner>/skills -a cursor -a claude-code
```

## Available Skills

| Skill | Description |
|-------|-------------|
| *Coming soon* | Skills for Base44 SDK development |

## Directory Structure

```
skills/
├── .curated/        # Production-ready, tested skills
├── .experimental/   # Work-in-progress skills
└── _template/       # Template for creating new skills
```

## What are Agent Skills?

Agent skills are reusable instruction sets that extend your coding agent's capabilities. They're defined in `SKILL.md` files with YAML frontmatter containing a `name` and `description`.

Skills help agents perform specialized tasks like:

- Working with Base44 entities and CRUD operations
- Setting up authentication flows
- Integrating third-party APIs via connectors
- Writing backend functions
- Managing AI agents within Base44 apps

## Base44 SDK Overview

The [Base44 SDK](https://docs.base44.com/sdk-getting-started/overview) provides programmatic access to:

- **auth** - User authentication and session management
- **entities** - CRUD operations on app data models
- **functions** - Custom backend logic execution
- **connectors** - OAuth-based third-party integrations
- **integrations** - API calls via shared integrations
- **agents** - AI agent interactions and conversations

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on creating and submitting skills.

## License

[MIT](LICENSE)
