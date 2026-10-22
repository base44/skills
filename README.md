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
| [`base44-cli`](skills/base44-cli/SKILL.md) | Create and manage Base44 projects using the CLI. Handles resource configuration (entities, backend functions, realtime actors, AI agents), initialization, and deployment. |
| [`base44-sdk`](skills/base44-sdk/SKILL.md) | Build apps using the Base44 JavaScript SDK. Communicate with remote resources like entities, backend functions, realtime actors, and AI agents. |
| [`base44-troubleshooter`](skills/base44-troubleshooter/SKILL.md) | Troubleshoot production issues using backend function logs and workflow run history. Use when investigating app errors or diagnosing failed scheduled jobs. |
| [`base44-remote-dev`](skills/base44-remote-dev/SKILL.md) | Develop a Base44 app remotely from your own coding agent by connecting it to the Base44 sandbox over MCP or the `base44 sandbox` CLI. |
| [`base44-sandbox`](skills/base44-sandbox/SKILL.md) | Author Base44 app code inside the cloud sandbox — no deploy/push; writing a resource file (function, actor, entity, agent) into the sandbox is what ships it. |
| [`base44-platform-platform`](skills/base44-platform-platform/SKILL.md) | Platform concepts for a Base44 app: entities, functions or server code, workflows, file structure, authentication and user invites, per app type. Compiled from the Base44 builder's own prompt. |
| [`base44-platform-entities`](skills/base44-platform-entities/SKILL.md) | Entity schemas, the entity SDK and row-level security rules, as the Base44 builder teaches them. Compiled from the Base44 builder's own prompt. |
| [`base44-platform-backend-functions`](skills/base44-platform-backend-functions/SKILL.md) | Backend functions on Cloudflare (or TanStack Start server code): secrets, the SDK on the server, auth, webhooks, testing, the InvokeLLM model table. Compiled from the Base44 builder's own prompt. |
| [`base44-platform-workflows`](skills/base44-platform-workflows/SKILL.md) | Workflows: trigger-driven `.jsonc` processes under `base44/workflows/` with the full authoring guide, plus the legacy automations pipeline. Compiled from the Base44 builder's own prompt. |
| [`base44-platform-agents`](skills/base44-platform-agents/SKILL.md) | In-app AI agents: config files, tool permissions, channels, the agents SDK and code agents on the AI gateway. Compiled from the Base44 builder's own prompt. |
| [`base44-platform-actors`](skills/base44-platform-actors/SKILL.md) | Realtime actors: stateful WebSocket rooms for multiplayer, presence, collaborative boards and chat. Compiled from the Base44 builder's own prompt. |
| [`base44-platform-integrations-sdk`](skills/base44-platform-integrations-sdk/SKILL.md) | Built-in integrations (InvokeLLM, SendEmail, file uploads, data extraction) with every Core endpoint schema, plus analytics. Compiled from the Base44 builder's own prompt. |
| [`base44-platform-connectors`](skills/base44-platform-connectors/SKILL.md) | App connectors: OAuth integrations in shared, app-user and BYO-shared modes, and how server code reads their tokens. Compiled from the Base44 builder's own prompt. |
| [`base44-platform-frontend`](skills/base44-platform-frontend/SKILL.md) | Frontend coding standards: conventions, installed packages, routing, Tailwind and design tokens, npm installs, per framework. Compiled from the Base44 builder's own prompt. |
| [`base44-platform-games`](skills/base44-platform-games/SKILL.md) | Phaser 4 and Three.js (via React Three Fiber) references: scenes, physics, input, cameras, assets and HUD. Compiled from the Base44 builder's own prompt. |

### Platform skills (compiled)

The `base44-platform-*` skills are generated from the Base44 builder's own system prompt and synced here by Base44, so they describe the platform exactly as the in-editor AI learns it: one reference per app shape (Vite SPA, TanStack Start, native mobile, 2D/3D game). Ask the platform which shape an app is with `GET /api/apps/{app_id}/agent-profile` (also reachable through the Base44 MCP `execute_api` tool); it returns the exact reference files to read. Do not edit these files by hand: the `SOURCE_COMMIT` file records the source commit they were compiled from, and the next sync overwrites them. How the pipeline works and how to change the content: [CONTRIBUTING.md](CONTRIBUTING.md#compiled-platform-skills-base44-platform-).

## About Agent Skills

Agent skills are reusable instruction sets that extend your coding agent's capabilities. They're defined in `SKILL.md` files following the [Agent Skills specification](https://agentskills.io/specification).

Learn more about [agent extensions for Base44](https://base44-nav-anchors.mintlify.app/developers/references/external-integrations/about-agent-extensions).

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines on creating and submitting skills.

## License

[MIT](LICENSE)
