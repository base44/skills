# base44 deploy

Deploys all project resources (entities, functions, actors, agents, agent skills, connectors, and site) to Base44 in a single command.

## Syntax

```bash
npx base44 deploy [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-y, --yes` | Skip confirmation prompt |
| `--build` | Build the site first (runs `site.buildCommand` with `VITE_BASE44_APP_ID` injected), skipping the interactive prompt |
| `--no-build` | Deploy without building, skipping the interactive prompt |
| `--git-hash <hash>` | Deploy the site through the deployments API, addressed by this commit (7-64 hex chars). Without it the site deploys through the archive upload, as before |

## What It Deploys

The command automatically detects and deploys:

1. **Entities** - All `.jsonc` files in `base44/entities/`
2. **Functions** - All functions in `base44/functions/`
3. **Actors** - All realtime actors in `base44/actors/`
4. **Agents** - All agent configurations in `base44/agents/`
5. **Agent Skills** - All skill files in `base44/agent-skills/`
6. **Connectors** - All connector configurations in `base44/connectors/`
7. **Auth Config** - Authentication settings from `base44/auth/` (if present)
8. **Visibility** - App visibility (`public`, `private`, or `workspace`) from the `visibility` field in `base44/config.jsonc` (if set)
9. **Site** - Built files from `site.outputDirectory` (if configured), or the full-stack build artifact under it when present

## Examples

```bash
# Interactive mode - shows what will be deployed, asks whether to build, and asks for confirmation
npx base44 deploy

# Non-interactive - skip both prompts, deploy without building (for CI/CD or agent use)
npx base44 deploy -y

# Non-interactive - build first, then deploy
npx base44 deploy -y --build

# Ship a full-stack (worker) build by the commit it came from
npx base44 deploy -y --build --git-hash $(git rev-parse HEAD)
```

## Typical Workflow

```bash
# 1. Make your changes (entities, functions, frontend code)

# 2. Deploy everything, building the site first
npx base44 deploy -y --build
```

Building through the CLI (`--build`, or a prior `npx base44 build`) is preferred over a bare `npm run build`: it injects `VITE_BASE44_APP_ID` into the build, which a bare `npm run build` leaves unset, breaking every API call on the deployed site.

## What It Does

1. Reads project configuration from `base44/config.jsonc`
2. Detects available resources (entities, functions, actors, agents, agent skills, connectors, site)
3. Shows a summary of what will be deployed
4. Asks for confirmation (unless `-y` flag is used)
5. Decides whether to build the site first: `--build` builds, `--no-build` skips, and with neither given an interactive run asks (non-interactive runs skip without asking)
6. Deploys all resources in sequence:
   - Sets app visibility (if configured)
   - Pushes entity schemas
   - Deploys functions
   - Deploys actors
   - Pushes agent skill files
   - Pushes agent configurations
   - Pushes auth configuration
   - Pushes connector configurations
   - Ships the site: with `--git-hash <hash>`, through the deployments API addressed by that commit (required for a full-stack/worker build, which has no archive form); otherwise through the archive upload, as before
7. Handles OAuth authorization for any new connectors that require it
8. Displays the dashboard URL and app URL (if site was deployed)

## Connector OAuth Flow

If any connectors require authorization after deployment, the CLI will prompt you to open your browser to complete OAuth. In non-interactive environments (CI/CD, no TTY), OAuth prompts are skipped automatically.

```
Some connectors still require authorization. Run 'base44 connectors push' or open the links above in your browser.
```

## Requirements

- Must be run from a linked Base44 project directory
- Must be authenticated (run `npx base44 login` first)
- For site deployment, the site must be built first — either beforehand (`npx base44 build`) or by passing `--build` (or answering yes to the build prompt) to this command
- A full-stack (worker) build can only be deployed with `--git-hash <hash>`; without it, the command fails and asks for the flag instead of silently dropping the worker

## Output

After successful deployment:
- **Dashboard**: Link to your app's management dashboard
- **App URL**: Your deployed site's public URL (if site was included)

## Notes

- If no resources are found, the command exits with a message
- Use individual commands (`entities push`, `functions deploy`, `actors deploy`, `agents push`, `agent-skills push`, `connectors push`, `site deploy`) if you only want to deploy specific resources
- Building is optional and explicit: pass `--build` to build first, `--no-build` to deploy without building, or let an interactive run ask. Non-interactive runs (`-y` with neither flag) deploy without building, so CI behavior is unchanged unless you add `--build`
- `--git-hash <hash>` ships the site through the same deployments-API lane as `base44 site deploy --git-hash`, addressed by that commit. Without it, the site deploys through the archive upload and goes live immediately, as before. A full-stack build has no archive form, so it now fails asking for `--git-hash` instead of shipping without its worker
- Also configurable via `"visibility"` in `base44/config.jsonc`, which this command applies as part of the deploy

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 build` | Build only the site (what `--build` runs) |
| `base44 entities push` | Push only entities |
| `base44 functions deploy` | Deploy only functions |
| `base44 actors deploy` | Deploy only actors |
| `base44 agents push` | Push only agents |
| `base44 agent-skills push` | Push only agent skills |
| `base44 connectors push` | Push only connectors |
| `base44 auth push` | Push only auth config |
| `base44 site deploy` | Deploy only the site |
| `base44 visibility <level>` | Set only the app's visibility |
