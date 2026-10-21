# base44 site deploy

Deploy built site files to Base44 hosting.

## Table of Contents

- [Syntax](#syntax)
- [Authentication](#authentication)
- [Prerequisites](#prerequisites)
- [How It Works](#how-it-works)
- [Two Deploy Lanes](#two-deploy-lanes)
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

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `-y, --yes` | Skip confirmation prompt | No | — |
| `--build` | Build the site before deploying (skips the build prompt) | No | — |
| `--no-build` | Deploy without building (skips the build prompt) | No | — |
| `--git-hash <hash>` | Deploy through the deployments API, addressed by the commit the build came from (7-64 hex chars) | No | — |
| `--publish` | Serve this build in production once it is deployed (only meaningful with `--git-hash`) | No | — |
| `--concurrency <n>` | Parallel asset uploads, whole number from 1-50 | No | `3` |

Use `-y` flag for non-interactive/automated deployments:

```bash
npx base44 site deploy -y
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Prerequisites

- Must be run from a Base44 project directory (linked, i.e. `base44/.app.jsonc` present)
- Site must be built before deploying (run your build command first, or pass `--build`)
- **SPA only**: Base44 hosting supports Single Page Applications with a single `index.html` entry point. All routes are served from `index.html` (client-side routing).

## How It Works

1. Reads project configuration (`site.outputDirectory` defaults to `./dist` if the `site` block is absent or invalid — a warning is logged, the command still runs)
2. Optionally builds the site first (`--build`/`--no-build`, or an interactive prompt if a `buildCommand` is configured)
3. Prompts for deployment confirmation showing the output directory (skipped with `-y`)
4. Deploys via one of two lanes depending on `--git-hash` (see below)

## Two Deploy Lanes

As of v0.2.1, `site deploy` is no longer gated by `BASE44_DEPLOYMENTS_API` — setting that env var now has no effect. Whether `--git-hash` is given selects the lane:

- **Without `--git-hash`** (default): archive upload, same as before. The output directory is zipped and uploaded; the site **goes live immediately**.
  - Exception: if the output directory contains a full-stack (worker) build, the archive lane can't express it, and the command fails with an error telling you to pass `--git-hash`.
- **With `--git-hash <hash>`**: deploys through the deployments API, addressed by that commit. This **builds** the deployment but does **not** publish it — production keeps serving whatever it served before. Add `--publish` to also make this deployment live. Without `--publish`, the command prints a note that production is unchanged and how to publish it.

This mirrors `base44 deploy --git-hash <hash>`, which uses the same deployments-API lane (for the whole project, not just the site) and always publishes.

## Interactive Flow

```bash
$ npx base44 site deploy

Deploy site from ./dist? (yes/no) yes

Creating archive and deploying site...

✓ Site deployed successfully!

Visit your site at: https://my-app.base44.app
```

With `--git-hash` and no `--publish`:

```bash
$ npx base44 site deploy --git-hash $(git rev-parse HEAD) -y

Deploying site...
✓ Site deployed

Not published: production still serves its previous build. Run again with --publish to serve this one.
```

## Typical Workflow

```bash
# 1. Build your site using your framework's build command
npm run build

# 2. Deploy to Base44 (archive lane, goes live immediately)
npx base44 site deploy

# Or: build and deploy in one step
npx base44 site deploy --build -y

# Or: deploy a specific commit through the deployments API, then publish it
npx base44 site deploy --git-hash $(git rev-parse HEAD) --publish -y
```

## Configuration

The `site.outputDirectory` in your project configuration should point to where your framework outputs built files:

- Vite: typically `./dist`
- Next.js: typically `./.next` or `./out`
- Create React App: typically `./build`
- Custom: whatever your build tool outputs to

If the project has no `site` block at all, the command falls back to `./dist` (and `npm install` / `npm run build` / `npm run dev` for the other site commands) rather than failing.

## Error Handling

If a full-stack (worker) build is deployed without `--git-hash`:
```bash
$ npx base44 site deploy
Error: A full-stack build deploys by the commit that produced it, and none was given.
Hint: Pass it with --git-hash, e.g. --git-hash $(git rev-parse HEAD).
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
- Deploy a specific commit's build without affecting production (`--git-hash` without `--publish`), e.g. for review/preview builds

## Notes

- Always build your site before deploying (or use `--build`)
- `--git-hash` is what selects the deployments-API lane; it is independent of (and replaces the old) `BASE44_DEPLOYMENTS_API` env var, which now does nothing
- Without `--git-hash`, deploying always goes live immediately (archive lane), as before
- With `--git-hash`, deploying does **not** go live unless `--publish` is also given
- `--json` mode emits `{ appUrl, published }` (archive lane) or `{ deploymentId, gitHash, published }` (deployments-API lane) on stdout
