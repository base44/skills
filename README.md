# Agent Skills for Base44

> **Beta** — These skills are functional and actively maintained. Feedback and suggestions are welcome on [GitHub Discussions](https://github.com/orgs/base44/discussions).

Install these skills so your coding agents can assist with [Base44](https://docs.base44.com/) development.

Supports [many AI coding agents](https://github.com/vercel-labs/skills#available-agents), including Cursor, Claude Code, Codex CLI, and OpenCode.

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

### Codex CLI

In a terminal, register the marketplace:

```bash
codex plugin marketplace add base44/skills
```

Then in Codex CLI, run `/plugins`, select **Base44**, and choose **Install Plugin**.

### Other Agents (via skills CLI)

Install skills using [`skills`](https://github.com/vercel-labs/skills):

```bash
# Install all skills
npx skills add base44/skills

# Install globally (user-level)
npx skills add base44/skills -g
```

### Sandbox flavor (remote dev — no local files)

If you develop your app inside **Base44's cloud sandbox** (the platform auto-builds, auto-commits, and auto-syncs, so you never run deploy/push), install the focused `base44-sandbox` plugin instead of the full set. It bundles `base44-remote-dev`, `base44-sandbox`, `base44-sdk`, and `base44-troubleshooter` — and deliberately excludes the deploy-oriented `base44-cli`.

```bash
# Claude Code
claude plugin install base44-sandbox@base44-skills

# Codex CLI: register the marketplace, then /plugins → "Base44 Sandbox" → Install
codex plugin marketplace add base44/skills

# Other agents (skills CLI)
npx skills add base44/skills --skill base44-remote-dev --skill base44-sandbox --skill base44-sdk --skill base44-troubleshooter
```

## Available Skills

| Skill | Description |
|-------|-------------|
| [`base44-cli`](skills/base44-cli/SKILL.md) | Create and manage Base44 projects using the CLI. Handles resource configuration (entities, backend functions, AI agents), initialization, and deployment. |
| [`base44-sdk`](skills/base44-sdk/SKILL.md) | Build apps using the Base44 JavaScript SDK. Communicate with remote resources like entities, backend functions, and AI agents. |
| [`base44-troubleshooter`](skills/base44-troubleshooter/SKILL.md) | Troubleshoot production issues using backend function logs. Use when investigating app errors or diagnosing production problems. |
| [`base44-remote-dev`](skills/base44-remote-dev/SKILL.md) | Develop a Base44 app remotely from your own coding agent by connecting it to the Base44 sandbox over MCP or the HTTP bridge. |
| [`base44-sandbox`](skills/base44-sandbox/SKILL.md) | Author Base44 app code inside the cloud sandbox — no CLI; writing a backend-function file into the sandbox is what ships it. |

## About Agent Skills

Agent skills are reusable instruction sets that extend your coding agent's capabilities. They're defined in `SKILL.md` files following the [Agent Skills specification](https://agentskills.io/specification).

Learn more about [agent extensions for Base44](https://base44-nav-anchors.mintlify.app/developers/references/external-integrations/about-agent-extensions).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on creating and submitting skills.

## License

[MIT](LICENSE)
