# Base44 Sandbox

Develop a [Base44](https://base44.com) app remotely, inside Base44's cloud sandbox, from your own coding agent. The platform auto-builds, auto-commits, and auto-syncs, so there is no local checkout and no deploy or push: writing a resource file (entity, backend function, agent, actor) into the sandbox is what ships it.

## What's included

- **Base44 MCP server** (`https://app.base44.com/mcp`): the sandbox tools (`read_file`, `write_file`, `edit_file`, `run_command`, `grep`, `list_directory`, `create_checkpoint`, `get_app_preview_url`, and more) plus your app list and connectors. The first time a tool is used, you sign in to your Base44 account in the browser; the server shows in **/mcp** as `base44-sandbox_mcp`.
- **Skills**
  - `base44-remote-dev`: connecting to the sandbox, the edit → preview → verify loop, and how changes persist.
  - `base44-sandbox`: conventions for authoring entities, functions, agents, and connectors inside the sandbox.
  - `base44-sdk`: the Base44 JavaScript/TypeScript SDK.
  - `base44-troubleshooter`: diagnosing production issues from backend function logs.

This flavor deliberately leaves out the deploy-oriented `base44-cli` skill. To build and deploy from a local project instead, install the **Base44** plugin.

## Learn more

- [Base44 docs](https://docs.base44.com)
- [Feedback on GitHub Discussions](https://github.com/orgs/base44/discussions)
- [Source and issues](https://github.com/base44/skills)
