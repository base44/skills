# base44 site deploy

Deploy built site files to Base44 hosting.

## Table of Contents

- [Syntax](#syntax)
- [Authentication](#authentication)
- [Prerequisites](#prerequisites)
- [How It Works](#how-it-works)
- [Interactive Flow](#interactive-flow)
- [Typical Workflow](#typical-workflow)
- [Configuration](#configuration)
- [Error Handling](#error-handling)
- [Use Cases](#use-cases)
- [Notes](#notes)
- [Related Commands](#related-commands)

## Syntax

```bash
npx base44 site deploy [options]
```

## Options

| Option       | Description               |
| ------------ | ------------------------- |
| `-y, --yes`  | Skip confirmation prompt  |
| `--build` | Build the site before deploying (skips the prompt) |
| `--no-build` | Deploy without building (skips the prompt) |

Use `-y` flag for non-interactive/automated deployments:

```bash
npx base44 site deploy -y
```

### Build Before Deploy

If `site.outputDirectory` is configured, `site deploy` can build the site for you first:

- `--build`: always builds first (runs `site.buildCommand` with `VITE_BASE44_APP_ID` injected), and errors out if `site.buildCommand` isn't configured
- `--no-build`: never builds, deploys whatever is already in `site.outputDirectory`
- Neither flag, interactive mode, `site.buildCommand` configured: asks "Build the site first?"
- Neither flag, non-interactive mode (or no `site.buildCommand`): skips building silently

This is the same build step as running `base44 build` separately.

### Experimental: Deployments API (`--git-hash`, `--concurrency`)

These options only appear in `--help` and are only accepted when the environment variable `BASE44_STATIC_DEPLOYMENTS` is set to `1` or `true`. Without the env var, passing them fails with an unknown-option error. Treat this as an experimental, opt-in code path, not the default deploy flow.

| Option | Description |
|--------|-------------|
| `--git-hash <hash>` | Commit the build came from (7-64 hex chars); deploys through the deployments API instead of the legacy tarball upload |
| `--concurrency <n>` | Parallel asset uploads (whole number, default and max defined by the CLI internals) |

When `--git-hash` is passed, `site deploy` uploads only new/changed static assets (deduped against what's already stored for the app) and creates a deployment tied to that commit, instead of archiving and uploading the whole output directory. The resulting deployment has no public URL of its own — what production serves is still decided by publishing the app from the Base44 builder.

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Prerequisites

- Must be run from a Base44 project directory
- Project must have `site.outputDirectory` configured in project config
- Site must be built before deploying — either configure `site.buildCommand` so `site deploy` can build it for you (see [Build Before Deploy](#build-before-deploy)), or build it yourself first
- **SPA only**: Base44 hosting supports Single Page Applications with a single `index.html` entry point. All routes are served from `index.html` (client-side routing).

## How It Works

1. Reads project configuration
2. Validates that site configuration exists
3. Prompts for deployment confirmation showing the output directory
4. Builds the site first if requested (see [Build Before Deploy](#build-before-deploy))
5. Creates an archive of site files from the output directory
6. Deploys to Base44 hosting
7. Returns the app URL

## Interactive Flow

```bash
$ npx base44 site deploy

Deploy site from ./dist? (yes/no) yes

Creating archive...
Uploading to Base44...
Deploying...

✓ Deployment successful!

Visit your site at: https://my-app.base44.app
```

## Typical Workflow

```bash
# 1. Build your site using your framework's build command
npm run build

# 2. Deploy to Base44
npx base44 site deploy
```

## Configuration

The `site.outputDirectory` in your project configuration should point to where your framework outputs built files:

- Vite: typically `./dist`
- Next.js: typically `./.next` or `./out`
- Create React App: typically `./build`
- Custom: whatever your build tool outputs to

## Error Handling

If site configuration is missing:
```bash
$ npx base44 site deploy
Error: No site configuration found in project
```

If you cancel the deployment:
```bash
Deploy site from ./dist? (yes/no) no
Deployment cancelled
```

## Use Cases

- Deploy your site after making changes
- Push new versions of your application
- Deploy after updating content or functionality
- Part of your CI/CD pipeline

## Notes

- Always build your site before deploying (or pass `--build` to have `site deploy` do it for you)
- The command deploys whatever is in your output directory
- Make sure your build completed successfully before deploying
- Previous deployments are preserved (versioned) in Base44
- Deployment is immediate and updates your live site

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 build` | Build the site (with the app id injected) without deploying |
| `base44 deploy` | Deploy all project resources, including the site |
