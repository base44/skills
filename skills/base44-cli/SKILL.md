---
name: base44-cli
description: Manage Base44 apps using the Base44 CLI tool. Use when working with app deployment, project scaffolding, authentication, entity management, or CLI-based Base44 operations. Triggers include creating projects, deploying sites, pushing entities, managing authentication, or any Base44 CLI command.
---

# Base44 CLI

Manage Base44 apps using the Base44 CLI tool.

## Overview

The Base44 CLI provides command-line tools for authentication, creating projects, managing entities, and deploying Base44 applications. All commands use interactive prompts for a user-friendly experience.

## Installation

Install the Base44 CLI as a dev dependency in your project:

```bash
# Using npm
npm install --save-dev @base44/cli

# Using yarn
yarn add -D @base44/cli

# Using pnpm
pnpm add -D @base44/cli
```

Then run commands using your package manager:

```bash
# Using npm
npm run base44 <command>

# Using yarn
yarn base44 <command>

# Using pnpm
pnpm base44 <command>
```

**Note:** When using the CLI through package managers, all commands in this documentation should be prefixed with `npm run`, `yarn`, or `pnpm` as shown above.

## Available Commands

### Authentication

| Command         | Description                                     | Reference                                   |
| --------------- | ----------------------------------------------- | ------------------------------------------- |
| `base44 login`  | Authenticate with Base44 using device code flow | [auth-login.md](references/auth-login.md)   |
| `base44 logout` | Logout from current device                      | [auth-logout.md](references/auth-logout.md) |
| `base44 whoami` | Display current authenticated user              | [auth-whoami.md](references/auth-whoami.md) |

### Project Management

| Command                 | Description                                  | Reference                         |
| ----------------------- | -------------------------------------------- | --------------------------------- |
| `base44 project create` | Create a new Base44 app (framework-agnostic) | [create.md](references/create.md) |

### Entity Management

| Command                | Description                   | Reference                                       |
| ---------------------- | ----------------------------- | ----------------------------------------------- |
| `base44 entities push` | Push local entities to Base44 | [entities-push.md](references/entities-push.md) |

### Site Deployment

| Command              | Description                               | Reference                                   |
| -------------------- | ----------------------------------------- | ------------------------------------------- |
| `base44 site deploy` | Deploy built site files to Base44 hosting | [site-deploy.md](references/site-deploy.md) |

## Quick Start

1. Install the CLI in your project:
   ```bash
   npm install --save-dev @base44/cli
   ```

2. Authenticate with Base44:
   ```bash
   npm run base44 login
   ```

3. Create a new project (interactive prompts will guide you):
   ```bash
   npm run base44 project create
   ```

4. Push entities to Base44:
   ```bash
   npm run base44 entities push
   ```

5. Deploy your site:
   ```bash
   npm run base44 site deploy
   ```

## Common Workflows

### Starting a New Project
```bash
# Login first
npm run base44 login

# Create project with template
npm run base44 project create
# Follow interactive prompts to select template, name, and configure project
```

### Updating Entity Schema
```bash
# After modifying entities in your project config
npm run base44 entities push
```

### Deploying Changes
```bash
# Build your project first (using your framework's build command)
npm run build

# Deploy to Base44
npm run base44 site deploy
```

### Recommended package.json Scripts

Add these scripts to your `package.json` for easier CLI usage:

```json
{
  "scripts": {
    "base44": "base44",
    "base44:login": "base44 login",
    "base44:push": "base44 entities push",
    "base44:deploy": "base44 site deploy",
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
