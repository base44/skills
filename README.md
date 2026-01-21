# Agent Skills for Base44 and Baas

> 🚧 **Under Active Development** — Feedback and suggestions are welcome on [GitHub Discussions](https://github.com/orgs/base44/discussions).

Install these skills so your coding agents can assist with [Base44](https://docs.base44.com) and Baas development.

Compatible with **Cursor(Nightly)**, **Claude Code**, **Codex**, **OpenCode**, and [10+ more agents](https://github.com/vercel-labs/add-skill#available-agents).

## Installation

Install skills using [`add-skill`](https://github.com/vercel-labs/add-skill):

```bash
# Install all skills
npx add-skill base44/skills

# Install globally (user-level)
npx add-skill base44/skills -g
```

## Available skills

| Skill | Description |
|-------|-------------|
| `base44-cli` | Create and manage Base44 projects using the CLI. Handles initialization, deployment, entity schema management, and authentication. |
| `base44-coder` | Build apps using the Base44 JavaScript SDK. Covers entities, auth, agents, functions, integrations, and connectors. |

## About agent skills

Agent skills are reusable instruction sets that extend your coding agent's capabilities. They're defined in `SKILL.md` files following the <a href="https://agentskills.io/specification" target="_blank">Agent Skills specification <Icon icon="arrow-up-right-from-square" /></a>.

For more about how agent extensions work with Base44, see [About agent extensions](https://base44-nav-anchors.mintlify.app/developers/references/external-integrations/about-agent-extensions).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on creating and submitting skills.

## License

[MIT](LICENSE)
