# base44 site deploy

Deploy built site files to Base44 hosting.

## Table of Contents

- [Syntax](#syntax)
- [Authentication](#authentication)
- [Prerequisites](#prerequisites)
- [How It Works](#how-it-works)
- [Deploying by Commit (`--git-hash`)](#deploying-by-commit---git-hash)
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

| Option | Description |
|--------|-------------|
| `-y, --yes` | Skip confirmation prompt |
| `--build` | Build the site first (skips the interactive "build first?" prompt) |
| `--no-build` | Deploy without building (skips the prompt) |
| `--git-hash <hash>` | Deploy by the commit the build came from, through the deployments API (see [Deploying by Commit](#deploying-by-commit---git-hash)) |
| `--concurrency <n>` | Parallel asset uploads when using `--git-hash` (default varies by build; whole number) |
| `--publish` | Serve this build in production once it is deployed. Only meaningful with `--git-hash` |

Use `-y` flag for non-interactive/automated deployments:

```bash
npx base44 site deploy -y
```

## Authentication

**Required**: Yes. If not authenticated, you'll be prompted to login first.

## Prerequisites

- Must be run from a Base44 project directory
- Site must be built before deploying — either run your build command first, let this command build for you (prompt, or `--build`), or pass `--no-build` to deploy the current output directory as-is
- **SPA only**: Base44 hosting supports Single Page Applications with a single `index.html` entry point. All routes are served from `index.html` (client-side routing) — this applies to the default archive-upload lane; a `--git-hash` full-stack deploy is served by its own Worker instead

## How It Works

There are two deploy lanes, chosen by whether `--git-hash` is passed:

**Without `--git-hash` (default, archive upload):**
1. Reads project configuration (`site.outputDirectory` defaults to the convention `base44 create` scaffolds if not set)
2. Offers to build first (prompt, or `--build`/`--no-build`)
3. Prompts for deployment confirmation showing the output directory
4. Creates an archive of site files from the output directory and deploys it
5. Goes live immediately and returns the app URL

**With `--git-hash <hash>` (deployments API):** see [Deploying by Commit](#deploying-by-commit---git-hash) below. A full-stack build (one that produced a Cloudflare Worker) cannot use the archive lane at all — this command detects it and requires `--git-hash`.

This command is no longer gated behind `BASE44_DEPLOYMENTS_API`; `--git-hash` and `--concurrency` are always available, and setting that env var does nothing anymore.

## Deploying by Commit (`--git-hash`)

```bash
npx base44 site deploy --git-hash <hash>
```

- The build is deployed **by that commit** but is **not published** — production keeps serving its previous build. Pass `--publish` to also make it live, or run `base44 site deploy --publish` again (or use `base44 deploy --git-hash`, which always publishes).
- This is the same lane the platform's own build step uses for Builder-managed apps, which are published from the Builder — so this command deliberately leaves production alone unless you ask with `--publish`.
- `--concurrency <n>` controls how many asset uploads run in parallel.
- If `--publish` succeeds in deploying but the app's URL can't be looked up afterward (e.g. with a workspace API key), the command still reports the deploy; it just omits the URL rather than failing.

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

# Or let the command build for you
npx base44 site deploy --build -y
```

## Configuration

The `site.outputDirectory` in your project configuration should point to where your framework outputs built files:

- Vite: typically `./dist`
- Next.js: typically `./.next` or `./out`
- Create React App: typically `./build`
- Custom: whatever your build tool outputs to

`site.installCommand` and `site.buildCommand` default to the conventions `base44 create` scaffolds (`npm install` / `npm run build`) when a `site` block is present but doesn't name them. `serveCommand` and `outputDirectory` are deliberately **not** defaulted — their absence means "no frontend to run" / "nothing built to upload".

## Error Handling

If you cancel the deployment:
```bash
Deploy site from ./dist? (yes/no) no
Deployment cancelled
```

If a full-stack build (with a Cloudflare Worker) is deployed without `--git-hash`, the command fails asking for the flag — the archive upload cannot carry a worker, so this previously shipped incompletely and now refuses up front instead.

## Use Cases

- Deploy your site after making changes
- Push new versions of your application
- Deploy after updating content or functionality
- Part of your CI/CD pipeline
- `--git-hash` / `--publish`: deploy a specific commit's build without immediately making it production (e.g. a preview, or a platform-driven build step)

## Notes

- Always build your site before deploying (or let this command build it — see [Options](#options))
- The archive lane deploys whatever is in your output directory; the `--git-hash` lane deploys a build addressed by its commit
- Make sure your build completed successfully before deploying
- Previous deployments are preserved (versioned) in Base44
- Without `--git-hash`, deployment is immediate and updates your live site. With `--git-hash` and no `--publish`, it is not

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 deploy` | Deploy all project resources, including the site |
| `base44 build` | Build the site with its app id injected |
| `base44 site dev` | Run only the site's dev server |
| `base44 site install` | Install the site's dependencies |
