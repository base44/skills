# Base44 Sandbox

Develop a [Base44](https://base44.com) app remotely, inside Base44's cloud sandbox, from your own coding agent. The platform auto-builds, auto-commits, and auto-syncs, so there is no local checkout and no deploy or push: writing a resource file (entity, backend function, agent, actor) into the sandbox is what ships it.

## What's included

- **Base44 MCP server** (`https://app.base44.com/mcp`): the sandbox tools (`read_file`, `write_file`, `edit_file`, `run_command`, `grep`, `list_directory`, `create_checkpoint`, `get_app_preview_url`, and more) plus your app list and connectors. You sign in to your Base44 account the first time a tool is used.
- **Skills**
  - [`base44-remote-dev`](../../skills/base44-remote-dev/SKILL.md): connecting to the sandbox, the edit → preview → verify loop, and how changes persist.
  - [`base44-sandbox`](../../skills/base44-sandbox/SKILL.md): conventions for authoring entities, functions, agents, and connectors inside the sandbox.
  - [`base44-sdk`](../../skills/base44-sdk/SKILL.md): the Base44 JavaScript/TypeScript SDK.
  - [`base44-troubleshooter`](../../skills/base44-troubleshooter/SKILL.md): diagnosing production issues from backend function logs.

This flavor deliberately leaves out the deploy-oriented `base44-cli` skill. To build and deploy from a local project instead, install the `base44` plugin.

## Learn more

- [Base44 docs](https://docs.base44.com)
- [Base44 MCP](https://docs.base44.com/mcp)
- [Feedback on GitHub Discussions](https://github.com/orgs/base44/discussions)
