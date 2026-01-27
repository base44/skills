---
name: base44-cli
description: "Base44 CLI for project initialization and operations. Activate when: (1) no base44/config.jsonc exists and user wants Base44 project, (2) user mentions CLI commands: npx base44, create, deploy, login, logout, entities push, (3) CLI operation keywords: initialize, create project, deploy, push schema. Handles: creating projects from templates, linking existing apps, authentication, deploying resources (entities/functions/site), schema management. Keywords: create project, initialize, deploy, push entities, npx base44. Excludes: SDK code implementation, feature development, writing application code. Use base44-sdk for those. Context: CLI tool with npx/yarn/pnpm."
---

# Base44 CLI

Create and manage Base44 apps (projects) using the Base44 CLI tool.

## ⚡ IMMEDIATE ACTION REQUIRED - Read This First

This skill activates when you need to initialize a Base44 project or run CLI commands.

## ⚡ MANDATORY PROJECT STATE CHECK

**CRITICAL: Run this check BEFORE any action:**

```bash
test -f base44/config.jsonc && echo "✅ PROJECT EXISTS" || echo "❌ NO PROJECT"
```

### If "❌ NO PROJECT":

**PROCEED** - This skill handles project initialization.

**Your actions:**
1. Guide user through Base44 project creation
2. Check authentication status: `npx base44 whoami`
3. If not authenticated, prompt user to run: `npx base44 login`
4. Create project using: `npx base44 create -n <name> -p <path>`
5. After project is created, inform user they can now implement features using the Base44 SDK

### If "✅ PROJECT EXISTS":

**Determine intent:**
- If user wants **CLI operations** (deploy, push entities, authenticate):
  - **PROCEED** - This skill handles these commands
  - Run the requested CLI command
- If user wants **feature implementation** (write code, implement functionality):
  - **TRANSFER** to base44-sdk skill with context:
    - Pass the original user request
    - Note: "User wants to implement features, not run CLI commands"

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

## When to Use This Skill vs base44-sdk

**✅ Use base44-cli when:**
- No Base44 project (empty directory or missing config.jsonc)
- User wants to: initialize project, create new app, run CLI commands, deploy, push schemas
- CLI context: npx base44 commands, authentication, project setup
- Keywords: "create project", "initialize", "deploy", "push entities", "npx base44"

**❌ Use base44-sdk when:**
- Base44 project EXISTS (base44/config.jsonc present)
- User wants to: implement features, write SDK code, build functionality
- Keywords: "implement", "build", "write code", "add feature", "create records"

**Decision Logic:**
```
IF (user mentions CLI command explicitly):
  → Use base44-cli

ELSE IF (user mentions "create/build app"):
  IF (base44/config.jsonc missing):
    → Use base44-cli (initialization needed)
  ELSE:
    → Use base44-sdk (project exists, implement features)

ELSE IF (project exists AND user wants implementation):
  → Use base44-sdk

ELSE IF (no project OR wants setup/deploy):
  → Use base44-cli
```

## Project Structure

A Base44 project combines a standard frontend project with a `base44/` configuration folder:

```
my-app/
├── base44/                      # Base44 configuration (created by CLI)
│   ├── config.jsonc             # Project settings, site config
│   ├── entities/                # Entity schema definitions
│   │   ├── task.jsonc
│   │   └── board.jsonc
│   └── functions/               # Backend functions (optional)
│       └── my-function/
│           ├── function.jsonc
│           └── index.ts
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
  "entitiesDir": "./entities",
  "functionsDir": "./functions",
  "site": {
    "installCommand": "npm install",
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

**Important:** Never assume or hardcode the `base44` package version. Always install without a version specifier to get the latest version.

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

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 create` | Create a new Base44 project from a template | [create.md](references/create.md) |
| `base44 link` | Link an existing local project to Base44 | [link.md](references/link.md) |
| `base44 dashboard` | Open the app dashboard in your browser | [dashboard.md](references/dashboard.md) |

### Deployment

| Command | Description | Reference |
|---------|-------------|-----------|
| `base44 deploy` | Deploy all resources (entities, functions, site) | [deploy.md](references/deploy.md) |

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

### Function Management

| Action / Command          | Description                                   | Reference                                               |
| ------------------------- | --------------------------------------------- | ------------------------------------------------------- |
| Create Functions          | Define functions in `base44/functions` folder | [functions-create.md](references/functions-create.md)   |
| `base44 functions deploy` | Deploy local functions to Base44              | [functions-deploy.md](references/functions-deploy.md)   |

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

4. Build and deploy everything:
   ```bash
   npm run build
   npx base44 deploy -y
   ```

Or deploy individual resources:
- `npx base44 entities push` - Push entities only
- `npx base44 functions deploy` - Deploy functions only
- `npx base44 site deploy -y` - Deploy site only

## Common Workflows

### Starting a New Project
```bash
# Login first
npx base44 login

# Create project (ALWAYS use --name and --path flags)
npx base44 create -n my-app -p .

# Or create with full-stack template and deploy in one step
npx base44 create -n my-app -p ./my-app -t backend-and-client --deploy
```

### Linking an Existing Project
```bash
# If you have base44/config.jsonc but no .app.jsonc
npx base44 link --create --name my-app
```

### Deploying All Changes
```bash
# Build your project first
npm run build

# Deploy everything (entities, functions, and site)
npx base44 deploy -y
```

### Deploying Individual Resources
```bash
# Push only entities
npx base44 entities push

# Deploy only functions
npx base44 functions deploy

# Deploy only site
npx base44 site deploy -y
```

### Opening the Dashboard
```bash
# Open app dashboard in browser
npx base44 dashboard
```

### Recommended package.json Scripts

Add these scripts to your `package.json` for easier CLI usage:

```json
{
  "scripts": {
    "base44:login": "base44 login",
    "base44:push": "base44 entities push",
    "base44:functions": "base44 functions deploy",
    "base44:site": "base44 site deploy -y",
    "base44:deploy": "base44 deploy -y",
    "deploy": "npm run build && npm run base44:deploy"
  }
}
```

Then use them like:
```bash
npm run base44:login
npm run base44:push
npm run deploy  # Builds and deploys everything in one command
```

## Authentication

Most commands require authentication. If you're not logged in, the CLI will automatically prompt you to login. Your session is stored locally and persists across CLI sessions.

## Troubleshooting

| Error                       | Solution                                                                            |
| --------------------------- | ----------------------------------------------------------------------------------- |
| Not authenticated           | Run `npx base44 login` first                                                        |
| No entities found           | Ensure entities exist in `base44/entities/` directory                               |
| Entity not recognized       | Ensure file uses kebab-case naming (e.g., `team-member.jsonc` not `TeamMember.jsonc`) |
| No functions found          | Ensure functions exist in `base44/functions/` with valid `function.jsonc` configs   |
| No site configuration found | Check that `site.outputDirectory` is configured in project config                   |
| Site deployment fails       | Ensure you ran `npm run build` first and the build succeeded                        |
