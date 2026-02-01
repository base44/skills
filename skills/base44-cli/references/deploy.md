# base44 deploy

Deploys all project resources (entities, functions, and site) to Base44 in a single command.

## Syntax

```bash
npx base44 deploy [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-y, --yes` | Skip confirmation prompt |

## What It Deploys

The command automatically detects and deploys:

1. **Entities** - All `.jsonc` files in `base44/entities/`
2. **Functions** - All functions in `base44/functions/`
3. **Agents** - All agent configurations in `base44/agents/`
4. **Site** - Built files from `site.outputDirectory` (if configured)

## Examples

```bash
# Interactive mode - shows what will be deployed and asks for confirmation
npx base44 deploy

# Non-interactive - skip confirmation (for CI/CD or agent use)
npx base44 deploy -y
```

## Typical Workflow

```bash
# 1. Make your changes (entities, functions, frontend code)

# 2. Build the frontend (if you have one)
npm run build

# 3. Deploy everything
npx base44 deploy -y
```

## What It Does

1. Reads project configuration from `base44/config.jsonc`
2. Detects available resources (entities, functions, site)
3. Shows a summary of what will be deployed
4. Asks for confirmation (unless `-y` flag is used)
5. Deploys all resources in sequence:
   - Pushes entity schemas
   - Deploys functions
   - Pushes agent configurations
   - Uploads site files
6. Displays the dashboard URL and app URL (if site was deployed)

## Requirements

- Must be run from a linked Base44 project directory
- Must be authenticated (run `npx base44 login` first)
- For site deployment, must run `npm run build` first

## Output

After successful deployment:
- **Dashboard**: Link to your app's management dashboard
- **App URL**: Your deployed site's public URL (if site was included)

## Notes

- If no resources are found, the command exits with a message
- Use individual commands (`entities push`, `functions deploy`, `site deploy`) if you only want to deploy specific resources
- The site must be built before deployment - this command does not run `npm run build` for you

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 entities push` | Push only entities |
| `base44 functions deploy` | Deploy only functions |
| `base44 agents push` | Push only agents |
| `base44 site deploy` | Deploy only the site |
