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

## Syntax

```bash
npx base44 site deploy [options]
```

## Options

| Option       | Description               |
| ------------ | ------------------------- |
| `-y, --yes`  | Skip confirmation prompt  |
| `--build` | Build the site before deploying (skips the interactive prompt) |
| `--no-build` | Deploy without building (skips the interactive prompt) |
| `--git-hash <hash>` | Deploy by the commit the build came from, through the deployments API |
| `--publish` | Serve this build in production once it is deployed (only with `--git-hash`) |
| `--concurrency <n>` | Parallel asset uploads (only with `--git-hash`); whole number 1-50, default `3` |

Use `-y` flag for non-interactive/automated deployments:

```bash
npx base44 site deploy -y
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Prerequisites

- Must be run from a Base44 project directory
- Project must have `site.outputDirectory` configured in project config
- Site must be built before deploying — pass `--build` to have the command build it, or build beforehand with `npx base44 build`
- **SPA only**: Base44 hosting supports Single Page Applications with a single `index.html` entry point. All routes are served from `index.html` (client-side routing).

## How It Works

There are two deploy lanes, selected by whether `--git-hash` is passed:

1. **Archive upload (no `--git-hash`)** — the default, unchanged from before: reads project configuration, archives the files in `site.outputDirectory`, uploads them, and the site goes live immediately. A full-stack build (one that also carries a worker) cannot be shipped this way — it fails asking for `--git-hash` instead of silently dropping the worker.
2. **Deployments API (`--git-hash <hash>`)** — the same lane `base44 deploy --git-hash` uses. The build is deployed by the commit it came from but is **not** published automatically; add `--publish` to also make it live. This is the lane that carries a full-stack build's worker.

In either lane, `-y`/`--yes` skips the confirmation prompt, and `--build`/`--no-build` pre-answer whether to build first.

**Note:** `site deploy` is no longer gated by the `BASE44_DEPLOYMENTS_API` environment variable — setting it now does nothing. `--git-hash` and `--concurrency` are always available.

## Interactive Flow

Archive upload (no `--git-hash`):

```bash
$ npx base44 site deploy

Deploy site from ./dist? (yes/no) yes

Creating archive and deploying site...

✓ Deployment successful!

Visit your site at: https://my-app.base44.app
```

Deployments API (`--git-hash`), not published:

```bash
$ npx base44 site deploy --git-hash $(git rev-parse HEAD)

Deploy site from ./dist? (yes/no) yes

Deploying site...
✓ Site deployed

Not published: production still serves its previous build. Run again with --publish to serve this one.
```

Deployments API, published:

```bash
$ npx base44 site deploy --git-hash $(git rev-parse HEAD) --publish

Deploy site from ./dist? (yes/no) yes

Deploying site...
✓ Site deployed
Publishing site...
✓ Site published

App URL: https://my-app.base44.app
```

## Typical Workflow

```bash
# Build then deploy (archive upload, live immediately)
npx base44 site deploy --build -y

# Deploy a full-stack build by commit and publish it
npx base44 site deploy --build --git-hash $(git rev-parse HEAD) --publish -y
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

- Build your site before deploying — pass `--build` or run `npx base44 build` first
- The archive-upload lane (no `--git-hash`) deploys whatever is in your output directory and goes live immediately
- The deployments-API lane (`--git-hash`) is not live until `--publish` is passed or `base44 deploy --git-hash` runs
- Previous deployments are preserved (versioned) in Base44
