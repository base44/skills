---
name: base44-cli
description: "Create and manage Base44 projects using the Base44 CLI tool. Use when: (1) Creating new Base44 projects from scratch; (2) User mentions CLI commands like 'npx base44', 'base44 login', 'base44 create', 'base44 deploy', 'base44 entities push', 'base44 site deploy'; (3) Initializing Base44 in empty directories or projects without base44/config.jsonc; (4) Deploying Base44 applications, entities, functions, or sites; (5) Managing entity schemas in base44/entities/ directory; (6) Authenticating with Base44 (login, logout, whoami); (7) Linking existing projects to Base44. Handles: project creation with templates, entity schema definition (JSONC format), function deployment, site deployment (SPA only), authentication management, and CLI-based operations."
---

# Base44 CLI

Create and manage Base44 apps (projects) using the Base44 CLI tool.

## Critical Requirements

**Authentication:** Check auth status with `npx base44 whoami` before running CLI commands. If not logged in, instruct user to run `npx base44 login`.

**Local installation only:** Always use package manager prefix (`npx base44`, `yarn base44`, or `pnpm base44`). Never call `base44` directly.

## Overview

The Base44 CLI provides command-line tools for authentication, creating projects, managing entities, and deploying Base44 applications. It is framework-agnostic and works with popular frontend frameworks.

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
    "outputDirectory": "./dist",
  },
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

| Command            | Description                                 | Reference                               |
| ------------------ | ------------------------------------------- | --------------------------------------- |
| `base44 create`    | Create a new Base44 project from a template | [create.md](references/create.md)       |
| `base44 link`      | Link an existing local project to Base44    | [link.md](references/link.md)           |
| `base44 dashboard` | Open the app dashboard in your browser      | [dashboard.md](references/dashboard.md) |

### Deployment

| Command         | Description                                      | Reference                         |
| --------------- | ------------------------------------------------ | --------------------------------- |
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
      "description": "Field description",
    },
  },
  "required": ["field_name"],
}
```

**Field types:** `string`, `number`, `boolean`, `array`
**String formats:** `date`, `date-time`, `email`, `uri`, `richtext`
**For enums:** Add `"enum": ["value1", "value2"]` and optionally `"default": "value1"`

For complete documentation, see [entities-create.md](references/entities-create.md).

### Function Management

| Action / Command          | Description                                   | Reference                                             |
| ------------------------- | --------------------------------------------- | ----------------------------------------------------- |
| Create Functions          | Define functions in `base44/functions` folder | [functions-create.md](references/functions-create.md) |
| `base44 functions deploy` | Deploy local functions to Base44              | [functions-deploy.md](references/functions-deploy.md) |

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

| Error                       | Solution                                                                              |
| --------------------------- | ------------------------------------------------------------------------------------- |
| Not authenticated           | Run `npx base44 login` first                                                          |
| No entities found           | Ensure entities exist in `base44/entities/` directory                                 |
| Entity not recognized       | Ensure file uses kebab-case naming (e.g., `team-member.jsonc` not `TeamMember.jsonc`) |
| No functions found          | Ensure functions exist in `base44/functions/` with valid `function.jsonc` configs     |
| No site configuration found | Check that `site.outputDirectory` is configured in project config                     |
| Site deployment fails       | Ensure you ran `npm run build` first and the build succeeded                          |
