# Agent Skills for Base44

> **Beta** — These skills are functional and actively maintained. Feedback and suggestions are welcome on [GitHub Discussions](https://github.com/orgs/base44/discussions).

Install these skills so your coding agents can assist with [Base44](https://docs.base44.com/) development.

Supports [many AI coding agents](https://github.com/vercel-labs/skills#available-agents), including Cursor, Claude Code, Codex, and OpenCode.

## Installation

### Claude Code (Plugin Marketplace)

Add the marketplace and install:

```
/plugin marketplace add base44/skills
/plugin install base44@base44-skills
```

Or install directly:

```bash
claude plugin install base44@base44-skills
```

### Other Agents (via skills CLI)

Install skills using [`skills`](https://github.com/vercel-labs/skills):

```bash
# Install all skills
npx skills add base44/skills

# Install globally (user-level)
npx skills add base44/skills -g
```

## Available Skills

| Skill | Description |
|-------|-------------|
| [`base44-cli`](skills/base44-cli/SKILL.md) | Create and manage Base44 projects using the CLI. Handles initialization, deployment, entity schema management, and authentication. |
| [`base44-sdk`](skills/base44-sdk/SKILL.md) | Build apps using the Base44 JavaScript SDK. Covers entities, auth, agents, functions, integrations, and connectors. |

## About Agent Skills

Agent skills are reusable instruction sets that extend your coding agent's capabilities. They're defined in `SKILL.md` files following the [Agent Skills specification](https://agentskills.io/specification).

Learn more about [agent extensions for Base44](https://base44-nav-anchors.mintlify.app/developers/references/external-integrations/about-agent-extensions).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on creating and submitting skills.

## License

[MIT](LICENSE)
