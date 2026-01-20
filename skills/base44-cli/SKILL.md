---
name: base44-cli
description: Base44 PROJECT SETUP AND DEPLOYMENT - Use for initializing new projects, deploying, and managing entity schemas via CLI. ACTIVATE when: (1) INTENT - User wants to create a NEW Base44 project, initialize a project, deploy, push/sync entity schemas, or authenticate with Base44 via terminal; (2) CONTEXT - Empty directory OR missing base44/config.jsonc AND user mentions "create/build/make an app/project/site"; (3) TECHNICAL - mentions npx/yarn/pnpm base44, base44/entities/*.jsonc files, or CLI commands like "base44 login", "base44 create", "base44 whoami", "base44 logout", "site deploy", "entities push". KEYWORDS: "new project", "initialize project", "setup a project", "start a new Base44 app/site", "create a [type] app in base44" (when directory is empty). SKILL DEPENDENCIES: base44-cli is a prerequisite for base44-coder in new projects. If user wants to "create an app" and no Base44 project exists, trigger base44-cli first. This skill handles terminal/CLI operations. For JavaScript SDK code (base44.entities.*, base44.auth.*) in EXISTING projects, use base44-coder instead.
---

# Base44 CLI

Create and manage Base44 apps (projects) using the Base44 CLI tool.

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

## Overview

The Base44 CLI provides command-line tools for authentication, creating projects, managing entities, and deploying Base44 applications. It is framework-agnostic and works with popular frontend frameworks like Vite, Next.js, and Create React App, Svelte, Vue, and more.

## When to Use This Skill vs base44-coder

**Use base44-cli when:**
- Creating a **NEW** Base44 project from scratch
- Initializing a project in an empty directory
- Directory is missing `base44/config.jsonc`
- User mentions: "create a new project", "initialize project", "setup a project", "start a new Base44 app"
- Deploying, pushing entities, or authenticating via CLI
- Working with CLI commands (`npx base44 ...`)

**Use base44-coder when:**
- Building features in an **EXISTING** Base44 project
- `base44/config.jsonc` already exists
- Writing JavaScript/TypeScript code using Base44 SDK
- Implementing functionality, components, or features
- User mentions: "implement", "build a feature", "add functionality", "write code"

**Skill Dependencies:**
- `base44-cli` is a **prerequisite** for `base44-coder` in new projects
- If user wants to "create an app" and no Base44 project exists, use `base44-cli` first
- `base44-coder` assumes a Base44 project is already initialized

**State Check Logic:**
Before selecting a skill, check:
- IF (user mentions "create/build app" OR "make a project"):
  - IF (directory is empty OR no `base44/config.jsonc` exists):
    → Use **base44-cli** (project initialization needed)
  - ELSE:
    → Use **base44-coder** (project exists, build features)

## Project Structure

A Base44 project combines a standard frontend project with a `base44/` configuration folder:

```
my-app/
├── base44/                      # Base44 configuration (created by CLI)
│   ├── config.jsonc             # Project settings, site config
│   ├── entities/                # Entity schema definitions
│   │   ├── task.jsonc
│   │   └── board.jsonc
│   ├── functions/               # Backend functions (optional)
│   │   └── my-function/
│   │       ├── function.jsonc
│   │       └── index.ts
│   └── agents/                  # AI agents (optional)
│       └── assistant.jsonc
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
- `src/api/base44Client.js` - Pre-configured SDK client for frontend use

**config.jsonc example:**
```jsonc
{
  "name": "My App",
  "description": "App description",
  "site": {
    "buildCommand": "npm run build",
    "serveCommand": "npm run dev",
    "outputDirectory": "./dist"
  }
}
```

## Installation

Install the Base44 CLI as a dev dependency in your project:

```bash
npm install --save-dev base44
```

Then run commands using `npx`:

```bash
npx base44 <command>
```

**Note:** All commands in this documentation use `npx base44`. You can also use `yarn base44`, or `pnpm base44` if preferred.

## Available Commands

### Authentication

| Command         | Description                                     | Reference                                   |
| --------------- | ----------------------------------------------- | ------------------------------------------- |
| `base44 login`  | Authenticate with Base44 using device code flow | [auth-login.md](references/auth-login.md)   |
| `base44 logout` | Logout from current device                      | [auth-logout.md](references/auth-logout.md) |
| `base44 whoami` | Display current authenticated user              | [auth-whoami.md](references/auth-whoami.md) |

### Project Management

| Command         | Description                                  | Reference                         |
| --------------- | -------------------------------------------- | --------------------------------- |
| `base44 create` | Create a new Base44 app (framework-agnostic) | [create.md](references/create.md) |

### Entity Management

| Action / Command       | Description                                 | Reference                                           |
| ---------------------- | ------------------------------------------- | --------------------------------------------------- |
| Create Entities        | Define entities in `base44/entities` folder | [entities-create.md](references/entities-create.md) |
| `base44 entities push` | Push local entities to Base44               | [entities-push.md](references/entities-push.md)     |

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

**Field types:** `string`, `number`, `boolean`, `array`
**String formats:** `date`, `date-time`, `email`, `uri`, `richtext`
**For enums:** Add `"enum": ["value1", "value2"]` and optionally `"default": "value1"`

For complete documentation, see [entities-create.md](references/entities-create.md).

### Site Deployment

| Command              | Description                               | Reference                                   |
| -------------------- | ----------------------------------------- | ------------------------------------------- |
| `base44 site deploy` | Deploy built site files to Base44 hosting | [site-deploy.md](references/site-deploy.md) |

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

3. Create a new project (ALWAYS use `--name` and `--path` flags):
   ```bash
   npx base44 create -n my-app -p .
   ```

4. Push entities to Base44:
   ```bash
   npx base44 entities push
   ```

5. Deploy your site:
   ```bash
   npx base44 site deploy -y
   ```

## Common Workflows

### Starting a New Project
```bash
# Login first
npx base44 login

# Create project (ALWAYS use --name and --path flags)
npx base44 create -n my-app -p .

# Or create and deploy in one step
npx base44 create -n my-app -p . --deploy
```

### Updating Entity Schema
```bash
# After modifying entities in base44/entities/
npx base44 entities push
```

### Deploying Changes
```bash
# Build your project first (using your framework's build command)
npm run build

# Deploy to Base44 (use -y to skip confirmation)
npx base44 site deploy -y
```

### Recommended package.json Scripts

Add these scripts to your `package.json` for easier CLI usage:

```json
{
  "scripts": {
    "base44:login": "base44 login",
    "base44:push": "base44 entities push",
    "base44:deploy": "base44 site deploy -y",
    "deploy": "npm run build && npm run base44:deploy"
  }
}
```

Then use them like:
```bash
npm run base44:login
npm run base44:push
npm run deploy  # Builds and deploys in one command
```

## Authentication

Most commands require authentication. If you're not logged in, the CLI will automatically prompt you to login. Your session is stored locally and persists across CLI sessions.

## Troubleshooting

| Error                       | Solution                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Not authenticated           | Run `npx base44 login` first                                                        |
| No entities found           | Ensure entities exist in `base44/entities/` directory                               |
| Entity not recognized       | Ensure file uses kebab-case naming (e.g., `team-member.jsonc` not `TeamMember.jsonc`) |
| No site configuration found | Check that `site.outputDirectory` is configured in project config                   |
| Site deployment fails       | Ensure you ran `npm run build` first and the build succeeded                        |
