---
name: base44-cli
description: "The base44 CLI is used for EVERYTHING related to base44 projects: resource configuration (entities, backend functions, ai agents), initialization and actions (resource creation, deployment). This skill is the place for learning about how to configure resources. When you plan or implement a feature, you must learn this skill"
metadata:
  sourcePackage:
    name: base44
    version: 0.1.2
---

# Base44 CLI

Create and manage Base44 apps (projects) using the Base44 CLI tool.

## ⚡ IMMEDIATE ACTION REQUIRED - Read This First

This skill activates on ANY mention of "base44" or when a `base44/` folder exists. **DO NOT read documentation files or search the web before acting.**

**Your first action MUST be:**
1. Check if `base44/config.jsonc` exists in the current directory
2. If **YES** (existing project scenario):
   - Transfer to base44-sdk skill for implementation
   - This skill only handles CLI commands (login, deploy, entities push)
3. If **NO**, decide between two initialization paths:
   - **Provisioned app** — the Base44 app already exists because it was just provisioned through a Stripe Projects / projects.dev flow, OR `BASE44_APP_ID` (or `BASE44_PROJECTS_BASE44_APP_ID`) is present in the environment or a `.env`/`.env.local` file:
     - Run `npx base44 scaffold` to set up local files for that **existing** app
     - **DO NOT run `npx base44 create`** — that creates a second, duplicate app. See [scaffold.md](references/scaffold.md).
   - **New project** — no app exists yet and none was provisioned:
     - This skill (base44-cli) handles the request; guide the user through `npx base44 create`
     - Do NOT activate base44-sdk yet

## Critical: Local Installation Only

NEVER call `base44` directly. The CLI is installed locally as a dev dependency and must be accessed via a package manager:

- `npx base44 <command>` (npm - recommended)
- `yarn base44 <command>` (yarn)
- `pnpm base44 <command>` (pnpm)

WRONG: `base44 login`
RIGHT: `npx base44 login`

## MANDATORY: Authentication Check at Session Start

**CRITICAL**: At the very start of every AI session when this skill is activated, you MUST:

1. **Check authentication status** by running:
   ```bash
   npx base44 whoami
   ```

2. **If the user is logged in** (command succeeds and shows an email):
   - Continue with the requested task

3. **If the user is NOT logged in** (command fails or shows an error):
   - **STOP immediately**
   - **DO NOT proceed** with any CLI operations
   - **Ask the user to login manually** by running:
     ```bash
     npx base44 login
   ```
   - Wait for the user to confirm they have logged in before continuing

**This check is mandatory and must happen before executing any other Base44 CLI commands.**

**Provisioned via Stripe Projects / projects.dev?** When the app was provisioned through that flow, the CLI seeds authentication from the `BASE44_ACCESS_TOKEN` / `BASE44_REFRESH_TOKEN` environment variables it injects (the `BASE44_PROJECTS_*`-prefixed names are normalized automatically). In that case `npx base44 whoami` already succeeds and you do **not** need an interactive `npx base44 login`.

## Overview

The Base44 CLI provides command-line tools for authentication, creating projects, managing entities, and deploying Base44 applications. It is framework-agnostic and works with popular frontend frameworks like Vite, Next.js, and Create React App, Svelte, Vue, and more.

## When to Use This Skill vs base44-sdk

**Use base44-cli when:**
- Creating a **NEW** Base44 project from scratch
- Initializing a project in an empty directory
- Setting up local files for an **existing** app that was provisioned externally (e.g., through a Stripe Projects / projects.dev flow) → use `scaffold`
- Directory is missing `base44/config.jsonc`
- User mentions: "create a new project", "initialize project", "setup a project", "start a new Base44 app"
- Deploying, pushing entities, or authenticating via CLI
- Working with CLI commands (`npx base44 ...`)

**Use base44-sdk when:**
- Building features in an **EXISTING** Base44 project
- `base44/config.jsonc` already exists
- Writing JavaScript/TypeScript code using Base44 SDK
- Implementing functionality, components, or features
- User mentions: "implement", "build a feature", "add functionality", "write code"

**Skill Dependencies:**
- `base44-cli` is a **prerequisite** for `base44-sdk` in new projects
- If user wants to "create an app" and no Base44 project exists, use `base44-cli` first
- `base44-sdk` assumes a Base44 project is already initialized

**State Check Logic:**
Before selecting a skill, check:
- IF (user mentions "create/build app" OR "make a project"):
  - IF (`base44/config.jsonc` exists):
    → Use **base44-sdk** (project exists, build features)
  - ELSE IF (app was provisioned externally — `BASE44_APP_ID`/`BASE44_PROJECTS_BASE44_APP_ID` set, or a Stripe Projects / projects.dev flow just ran):
    → Use **base44-cli** → `npx base44 scaffold` (set up local files for the existing app; do NOT `create`)
  - ELSE:
    → Use **base44-cli** → `npx base44 create` (new project initialization needed)

## Project Structure

A Base44 project combines a standard frontend project with a `base44/` configuration folder:

```
my-app/
├── base44/                      # Base44 configuration (created by CLI)
│   ├── config.jsonc             # Project settings, site config
│   ├── .types/                  # Auto-generated TypeScript types (created by `types generate`)
│   │   └── types.d.ts           # Module augmentation for @base44/sdk
│   ├── entities/                # Entity schema definitions
│   │   ├── task.jsonc
│   │   └── board.jsonc
│   ├── functions/               # Backend functions (optional)
│   │   └── my-function/
│   │       └── entry.ts
│   ├── agents/                  # Agent configurations (optional)
│   │   └── support_agent.jsonc
│   ├── connectors/              # OAuth connector configurations (optional)
│   │   └── googlecalendar.jsonc
│   ├── seed/                    # Local dev seed fixtures (optional)
│   │   ├── users.jsonc          # Test users for `base44 dev`
│   │   └── Task.jsonc           # Records for entity "Task"
│   └── seed.ts                  # Programmatic seed script (optional, runs in Deno)
├── .base44/                     # Local dev state: data + dev.json (gitignored, safe to delete)
├── src/                         # Frontend source code
│   ├── api/
│   │   └── base44Client.js      # Base44 SDK client
│   ├── pages/
│   ├── components/
│   └── main.jsx
├── index.html                   # SPA entry point
├── package.json
└── vite.config.js               # Or your framework's config
```

**Key files:**
- `base44/config.jsonc` - Project name, description, site build settings
- `base44/entities/*.jsonc` - Data model schemas (see Entity Schema section)
- `base44/functions/*/entry.ts` - Backend function entry point
- `base44/agents/*.jsonc` - Agent configurations (optional)
- `base44/.types/types.d.ts` - Auto-generated TypeScript types for entities, functions, and agents (created by `npx base44 types generate`)
- `base44/connectors/*.jsonc` - OAuth connector configurations (optional)
- `base44/seed/*.jsonc` - Local dev seed fixtures: `users.jsonc` + `<Entity>.jsonc` (see [local-data.md](references/local-data.md))
- `base44/seed.ts` - Programmatic seed script, runs after fixtures (optional, requires Deno)
- `.base44/` - Local dev state written by `base44 dev` (gitignored, safe to delete)
- `src/api/base44Client.js` - Pre-configured SDK client for frontend use

**config.jsonc example:**
```jsonc
{
  "name": "My App",                    // Required: project name
  "description": "App description",    // Optional: project description
  "entitiesDir": "./entities",         // Optional: default "entities"
  "functionsDir": "./functions",       // Optional: default "functions"
  "agentsDir": "./agents",             // Optional: default "agents"
  "connectorsDir": "./connectors",     // Optional: default "connectors"
  "seedDir": "./seed",                 // Optional: default "seed"
  "site": {                            // Optional: site deployment config
    "installCommand": "npm install",   // Optional: install dependencies
    "buildCommand": "npm run build",   // Optional: build command
    "serveCommand": "npm run dev",     // Optional: local dev server
    "outputDirectory": "./dist"        // Optional: build output directory
  }
}
```

**Config properties:**

| Property | Description | Default |
|----------|-------------|---------|
| `name` | Project name (required) | - |
| `description` | Project description | - |
| `entitiesDir` | Directory for entity schemas | `"entities"` |
| `functionsDir` | Directory for backend functions | `"functions"` |
| `agentsDir` | Directory for agent configs | `"agents"` |
| `connectorsDir` | Directory for connector configs | `"connectors"` |
| `seedDir` | Directory for local dev seed fixtures | `"seed"` |
| `site.installCommand` | Command to install dependencies | - |
| `site.buildCommand` | Command to build the project | - |
| `site.serveCommand` | Command to run dev server | - |
| `site.outputDirectory` | Build output directory for deployment | - |

## Installation

Install the Base44 CLI as a dev dependency in your project:

```bash
npm install --save-dev base44
```

**Important:** Never assume or hardcode the `base44` package version. Always install without a version specifier to get the latest version.

Then run commands using `npx`:

```bash
npx base44 <command>
```

**Note:** All commands in this documentation use `npx base44`. You can also use `yarn base44`, or `pnpm base44` if preferred.

## Global `--app-id` Option

The CLI has a global `--app-id <id>` option for commands that only need an app context, not local project files.

**Resolution order:** `--app-id` flag → `BASE44_APP_ID` environment variable → local `base44/.app.jsonc`

This is useful when you want to inspect or operate on an app without switching into a linked project directory. Common examples:

```bash
# Run a one-off script against a specific app
cat ./script.ts | npx base44 exec --app-id app_123

# Fetch logs for a deployed app without a local checkout
npx base44 logs --app-id app_123 --level error
```

Use `--app-id` for app-scoped commands like `exec` and `logs`.

Do **not** use `--app-id` for commands that need local project files:
- `base44 create` creates a new app, so it rejects `--app-id`
- `base44 dev` runs from a linked local project, so it rejects `--app-id`
- `base44 deploy` still requires a local project directory because it reads local resources

## Global `--json` Option

The CLI has a global `--json` option that makes commands emit a machine-readable JSON document on stdout instead of human-oriented output. It also forces non-interactive mode (spinners/status messages/logs move to stderr), so stdout stays pure JSON — safe to pipe into `jq` or another program.

```bash
npx base44 connectors list-available --json
npx base44 logs --app-id app_123 --json
```

## Available Commands

### Authentication

| Command         | Description                                     | Reference                                   |
| --------------- | ----------------------------------------------- | ------------------------------------------- |
| `base44 login`  | Authenticate with Base44 using device code flow | [auth-login.md](references/auth-login.md)   |
| `base44 logout` | Logout from current device                      | [auth-logout.md](references/auth-logout.md) |
| `base44 whoami` | Display current authenticated user              | [auth-whoami.md](references/auth-whoami.md) |

### Project Management

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 create` | Create a new Base44 project from a template | [create.md](references/create.md) ⚠️ **MUST READ** |
| `base44 scaffold` | Scaffold a local project for an existing Base44 app (by app ID) | [scaffold.md](references/scaffold.md) |
| `base44 link` | Link an existing local project to Base44 | [link.md](references/link.md) |
| `base44 eject` | Download the code for an existing Base44 project | [eject.md](references/eject.md) |
| `base44 dashboard open` | Open the app dashboard in your browser | [dashboard.md](references/dashboard.md) |

### Development

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 dev` | Start local development for your Base44 backend, and your frontend too when `site.serveCommand` is configured; `--fresh` wipes local data and re-seeds | [dev.md](references/dev.md) |
| `base44 dev status` | Show the local dev instance descriptor (URL, port, pid, seed state) | [local-data.md](references/local-data.md) |
| `base44 dev seed` | Apply seed fixtures and `seed.ts` to local data (idempotent upsert; `--replace` truncates first) | [local-data.md](references/local-data.md) |
| `base44 dev reset` | Wipe local data and re-seed — the canonical clean-slate command | [local-data.md](references/local-data.md) |

### Local Data

Local dev data is persistent by default (gitignored `.base44/` directory) and seedable from `base44/seed/` fixtures. Full guide: [local-data.md](references/local-data.md).

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 data pull` | Pull records from the remote app into `base44/seed/` fixtures (read-only against remote) | [local-data.md](references/local-data.md) |
| `base44 data dump` | Freeze local dev data as `base44/seed/` fixtures | [local-data.md](references/local-data.md) |

### Deployment

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 deploy` | Deploy all resources (entities, functions, agents, connectors, auth config, and site) | [deploy.md](references/deploy.md) |

### Entity Management

| Action / Command       | Description                                 | Reference                                           |
| ---------------------- | ------------------------------------------- | --------------------------------------------------- |
| Create Entities        | Define entities in `base44/entities` folder | [entities-create.md](references/entities-create.md) |
| `base44 entities push` | Push local entities to Base44               | [entities-push.md](references/entities-push.md)     |
| RLS Patterns           | Row-level security examples and operators   | [rls-examples.md](references/rls-examples.md) ⚠️ **READ FOR RLS** |

#### Entity Schema (Quick Reference)

ALWAYS follow this exact structure when creating entity files:

**File naming:** `base44/entities/{kebab-case-name}.jsonc` (e.g., `team-member.jsonc` for `TeamMember`)

**Schema template:**
```jsonc
{
  "name": "EntityName",
  "type": "object",
  "properties": {
    "field_name": {
      "type": "string",
      "description": "Field description"
    }
  },
  "required": ["field_name"]
}
```

**Field types:** `string`, `number`, `integer`, `boolean`, `array`, `object`, `binary`
**String formats:** `date`, `date-time`, `time`, `email`, `uri`, `hostname`, `ipv4`, `ipv6`, `uuid`, `file`, `regex`, `richtext`
**For enums:** Add `"enum": ["value1", "value2"]` and optionally `"default": "value1"`
**Entity names:** Must be alphanumeric only (pattern: `/^[a-zA-Z0-9]+$/`)

For complete documentation, see [entities-create.md](references/entities-create.md).

### Function Management

| Action / Command          | Description                                   | Reference                                               |
| ------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| Create Functions          | Define functions in `base44/functions` | [functions-create.md](references/functions-create.md)   |
| `base44 functions deploy [names...] [--force]` | Deploy local functions to Base44; optionally target specific functions or prune removed ones | [functions-deploy.md](references/functions-deploy.md)   |
| `base44 functions delete <names...>` | Delete one or more deployed functions from Base44 | [functions-delete.md](references/functions-delete.md) |
| `base44 functions list`   | List all deployed functions on Base44 remote  | [functions-list.md](references/functions-list.md)       |
| `base44 functions pull [name]` | Pull deployed functions from Base44 to local files | [functions-pull.md](references/functions-pull.md)  |

### Agent Management

Agents are conversational AI assistants that can interact with users, access your app's entities, and call backend functions. Use these commands to manage agent configurations.

| Action / Command        | Description                             | Reference                                       |
| ----------------------- | --------------------------------------- | ----------------------------------------------- |
| Create Agents           | Define agents in `base44/agents` folder | See Agent Schema below                          |
| `base44 agents pull`    | Pull remote agents to local files       | [agents-pull.md](references/agents-pull.md)     |
| `base44 agents push`    | Push local agents to Base44             | [agents-push.md](references/agents-push.md)     |

**Note:** Agent commands perform full synchronization - pushing replaces all remote agents with local ones, and pulling replaces all local agents with remote ones.

#### Agent Schema (Quick Reference)

**File naming:** `base44/agents/{agent_name}.jsonc` (e.g., `support_agent.jsonc`)

**Schema template:**
```jsonc
{
  "name": "agent_name",
  "description": "Brief description of what this agent does",
  "instructions": "Detailed instructions for the agent's behavior",
  "tool_configs": [
    // Entity tool - gives agent access to entity operations
    { "entity_name": "tasks", "allowed_operations": ["read", "create", "update", "delete"] },
    // Backend function tool - gives agent access to a function
    { "function_name": "send_email", "description": "Send an email notification" }
  ],
  "memory_config": {                 // Optional: lets the agent remember facts across conversations
    "enabled": true,
    "scope": "both",                 // "global" | "user" | "both"
    "include_other_conversation_context": false,
    "instructions": null
  },
  "whatsapp_greeting": "Hello! How can I help you today?"
}
```

**Naming rules:** 
- Agent names must match pattern: `/^[a-z0-9_]+$/` (lowercase alphanumeric with underscores, 1-100 chars)
- Valid: `support_agent`, `order_bot`
- Invalid: `Support-Agent`, `OrderBot`

**Required fields:** `name`, `description`, `instructions`
**Optional fields:** `tool_configs` (defaults to `[]`), `memory_config`, `whatsapp_greeting`

**Tool config types:**
- **Entity tools**: `entity_name` + `allowed_operations` (array of: `read`, `create`, `update`, `delete`)
- **Backend function tools**: `function_name` + `description`

**Memory config fields** (all optional, see [agents-push.md](references/agents-push.md#memory-configuration) for details): `enabled` (bool, default `true`), `scope` (`global`\|`user`\|`both`, default `both`), `include_other_conversation_context` (bool, default `false`), `instructions` (string\|null, default `null`)

### Connector Management

Connectors let your app connect to external services (Google Calendar, Slack, Stripe, etc.). Most connectors use OAuth to provide access tokens for backend functions to call external APIs. Stripe is the exception — it is provisioned automatically on the server side with no OAuth browser flow.

| Action / Command                   | Description                                          | Reference                                                           |
| ---------------------------------- | ---------------------------------------------------- | ------------------------------------------------------------------- |
| Create Connectors                  | Define connectors in `base44/connectors` folder      | [connectors-create.md](references/connectors-create.md)             |
| `base44 connectors list-available` | List all available integration types from Base44     | [connectors-list-available.md](references/connectors-list-available.md) |
| `base44 connectors initiate --integration-type <t> [--scopes <s...>]` | Initialize a connector and start its OAuth flow; works projectless with `--app-id` | [connectors-initiate.md](references/connectors-initiate.md) |
| `base44 connectors pull`           | Pull remote connectors to local files                | [connectors-pull.md](references/connectors-pull.md)                 |
| `base44 connectors push`           | Push local connectors to Base44                      | [connectors-push.md](references/connectors-push.md)                 |

**Note:** Connector commands perform full synchronization - pushing replaces all remote connectors with local ones (and triggers OAuth for new OAuth connectors), and pulling replaces all local connectors with remote ones.

#### Connector Schema (Quick Reference)

**File naming:** `base44/connectors/{type}.jsonc` (e.g., `googlecalendar.jsonc`, `slack.jsonc`)

**Schema template:**
```jsonc
{
  "type": "googlecalendar",
  "scopes": [
    "https://www.googleapis.com/auth/calendar.readonly",
    "https://www.googleapis.com/auth/calendar.events"
  ]
}
```

**Required fields:** `type`
**Optional fields:** `scopes` (defaults to `[]`)

**Available connector types:** Run `npx base44 connectors list-available` to see all supported integration types.

**Note:** `stripe` is also a valid connector type but is not returned by `list-available`. Treat it as a supported type — it is provisioned automatically by Base44 with no OAuth browser flow. See [connectors-create.md](references/connectors-create.md) for details.

For complete documentation, see [connectors-create.md](references/connectors-create.md).

### Auth Configuration

Manage your app's authentication settings (e.g., username & password login). Auth config is stored in `base44/auth/` and synced with Base44 via `auth push`/`auth pull`.

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 auth password-login <enable\|disable>` | Enable or disable username & password authentication | [auth-password-login.md](references/auth-password-login.md) |
| `base44 auth social-login <provider> <enable\|disable>` | Enable or disable social login (google, microsoft, facebook, apple) | [auth-social-login.md](references/auth-social-login.md) |
| `base44 auth sso <enable\|disable>` | Configure SSO identity provider (google, microsoft, github, okta, custom) | [auth-sso.md](references/auth-sso.md) |
| `base44 auth pull` | Pull auth config from Base44 to local files | [auth-pull.md](references/auth-pull.md) |
| `base44 auth push` | Push local auth config to Base44 | [auth-push.md](references/auth-push.md) |

**Note:** Auth config is also deployed as part of `base44 deploy`.

### Secrets Management

Manage project secrets (environment variables stored securely in Base44). These commands are hidden from `--help` output but are fully functional.

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 secrets list` | List the names of all secrets | [secrets-list.md](references/secrets-list.md) |
| `base44 secrets set` | Set one or more secrets (KEY=VALUE or --env-file) | [secrets-set.md](references/secrets-set.md) |
| `base44 secrets delete <key>` | Delete a secret by name | [secrets-delete.md](references/secrets-delete.md) |

### Script Execution

Run one-off scripts against your app with the Base44 SDK pre-authenticated. Use it to perform CRUD operations on entities (`base44.entities.MyEntity.list/create/update/delete`), call backend functions (`base44.functions.invoke("myFunction", args)`), invoke agents, or access any other resource exposed by the SDK — without deploying a full function. Useful for data migrations, bulk operations, debugging, and scripted workflows.

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 exec` | Run a script (via stdin) with the Base44 SDK pre-authenticated | [exec.md](references/exec.md) |

### Type Generation

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 types generate` | Generate TypeScript types (`types.d.ts`) from entities, functions, agents, and connectors | [types-generate.md](references/types-generate.md) |

**Output:** `base44/.types/types.d.ts` — augments `@base44/sdk` module with typed registries (`EntityTypeRegistry`, `FunctionNameRegistry`, `AgentNameRegistry`, `ConnectorTypeRegistry`).

**No authentication required.** Runs entirely locally. Automatically updates `tsconfig.json` to include the generated types.

### Site Management

| Command              | Description                               | Reference                                   |
| -------------------- | ----------------------------------------- | ------------------------------------------- |
| `base44 site deploy` | Deploy built site files to Base44 hosting | [site-deploy.md](references/site-deploy.md) |
| `base44 site open`   | Open the deployed site in your browser    | [site-open.md](references/site-open.md)     |

**SPA only**: Base44 hosting supports Single Page Applications with a single `index.html` entry point. All routes are served from `index.html` (client-side routing).

## Quick Start

1. Install the CLI in your project:
   ```bash
   npm install --save-dev base44
   ```

2. Authenticate with Base44:
   ```bash
   npx base44 login
   ```

3. Create a new project (ALWAYS provide name and `--path` flag):
   ```bash
   npx base44 create my-app --path .
   ```

4. Run local development:
   ```bash
   npx base44 dev
   ```

5. Build and deploy everything:
   ```bash
   npm run build
   npx base44 deploy -y
   ```

Or deploy individual resources:
- `npx base44 entities push` - Push entities only
- `npx base44 functions deploy` - Deploy functions only
- `npx base44 functions delete <name>` - Delete a deployed function
- `npx base44 functions list` - List all deployed functions
- `npx base44 functions pull` - Pull deployed functions to local files
- `npx base44 agents push` - Push agents only
- `npx base44 connectors pull` - Pull connectors from Base44
- `npx base44 connectors push` - Push connectors only
- `npx base44 auth pull` - Pull auth config from Base44
- `npx base44 auth push` - Push auth config only
- `npx base44 site deploy -y` - Deploy site only

## Common Workflows

### Creating a New Project

**⚠️ MANDATORY: Before running `base44 create`, you MUST read [create.md](references/create.md) for:**
- **Template selection** - Choose the correct template (`backend-and-client` vs `backend-only`)
- **Correct workflow** - Different templates require different setup steps
- **Common pitfalls** - Avoid folder creation errors that cause failures

Failure to follow the create.md instructions will result in broken project scaffolding.

### Linking an Existing Project
```bash
# If you have base44/config.jsonc but no .app.jsonc
npx base44 link --create --name my-app
```

### Running Local Development
```bash
# Starts the Base44 backend locally
npx base44 dev
```

If you want `base44 dev` to run your frontend too, verify `base44/config.jsonc` has `site.serveCommand` set correctly (for example, `"serveCommand": "npm run dev"`). When that field is present, `base44 dev` runs both the backend and the frontend together.

Local entity data persists in a gitignored `.base44/` directory — it survives restarts and entity edits. Seed fixtures in `base44/seed/` are applied automatically on first boot; use `npx base44 dev seed` to re-apply and `npx base44 dev reset` for a clean slate. See [local-data.md](references/local-data.md).

### Deploying All Changes
```bash
# Generate types (optional, for TypeScript projects)
npx base44 types generate

# Build your project first
npm run build

# Deploy everything (entities, functions, and site)
npx base44 deploy -y
```

### Generating TypeScript Types
```bash
# Generate types from entities, functions, agents, and connectors
npx base44 types generate
```

This creates `base44/.types/types.d.ts` with typed registries for the `@base44/sdk` module. Run this after changing entities, functions, agents, or connectors to keep your types in sync. No authentication required.

### Deploying Individual Resources
```bash
# Push only entities
npx base44 entities push

# Deploy only functions (all)
npx base44 functions deploy
# Deploy specific functions
npx base44 functions deploy my-function other-function
# Deploy and prune removed functions
npx base44 functions deploy --force

# Push only agents
npx base44 agents push

# Pull connectors from Base44
npx base44 connectors pull

# Push only connectors
npx base44 connectors push

# Deploy only site
npx base44 site deploy -y
```

### Opening the Dashboard
```bash
# Open app dashboard in browser
npx base44 dashboard
```

## Authentication

Most commands require authentication. If you're not logged in, the CLI will automatically prompt you to login. Your session is stored locally and persists across CLI sessions.

## Troubleshooting

| Error                       | Solution                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Not authenticated           | Run `npx base44 login` first                                                        |
| No entities found           | Ensure entities exist in `base44/entities/` directory                               |
| Entity not recognized       | Ensure file uses kebab-case naming (e.g., `team-member.jsonc` not `TeamMember.jsonc`) |
| No functions found          | Ensure functions exist in `base44/functions/` with `entry.ts` or `entry.js`   |
| No agents found             | Ensure agents exist in `base44/agents/` directory with valid `.jsonc` configs       |
| Invalid agent name          | Agent names must be lowercase alphanumeric with underscores only                    |
| No connectors found         | Ensure connectors exist in `base44/connectors/` directory with valid `.jsonc` configs |
| Invalid connector type      | Run `npx base44 connectors list-available` to see valid types |
| Duplicate connector type    | Each connector type can only be defined once per project                            |
| Connector authorization timeout | Re-run `npx base44 connectors push` and complete the OAuth flow in your browser  |
| No site configuration found | Check that `site.outputDirectory` is configured in project config                   |
| Local dev data is stale or broken | Run `npx base44 dev reset` (or start with `npx base44 dev --fresh`); `.base44/` is safe to delete |
| `dev` refuses to start (app id mismatch) | The folder was relinked to a different app — start with `npx base44 dev --fresh` to wipe the old local data |
| Site deployment fails       | Ensure you ran `npm run build` first and the build succeeded                        |
| Update available message    | If prompted to update, run `npm install -g base44@latest` (or use npx for local installs) |
