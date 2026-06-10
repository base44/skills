# base44 scaffold

Scaffold a local project directory for an **existing** Base44 app. Use this when you already have a Base44 app in the cloud and want to set up a local project structure for it.

## Critical: When to Use Scaffold vs Create vs Link

| Scenario | Command |
|----------|---------|
| Starting fresh — no Base44 app exists yet | `npx base44 create` |
| Have `base44/config.jsonc` but no `.app.jsonc` | `npx base44 link` |
| Have an existing Base44 app, need a new local project | `npx base44 scaffold` |

## Syntax

```bash
npx base44 scaffold [name] [options]
```

## Arguments & Options

| Argument/Option | Description | Required |
|--------|-------------|----------|
| `[name]` | Project name (defaults to the current directory name) | No |
| `--app-id <id>` | Existing Base44 app ID | Yes* |
| `--no-skills` | Skip AI agent skills installation (skills are added by default) | No |

*Required unless the `BASE44_APP_ID` environment variable is set.

## Examples

```bash
# Scaffold using an app ID
npx base44 scaffold --app-id app_123

# Scaffold with a custom project name
npx base44 scaffold my-app --app-id app_123

# Scaffold using the BASE44_APP_ID environment variable
BASE44_APP_ID=app_123 npx base44 scaffold

# Scaffold without installing AI agent skills
npx base44 scaffold --app-id app_123 --no-skills
```

## What It Does

1. Resolves the app ID from `--app-id` or `BASE44_APP_ID` environment variable
2. Initializes a `base44/` project structure in the current directory using the `backend-only` template
3. Creates `base44/.app.jsonc` with the provided app ID (links to the existing cloud app)
4. Optionally installs AI agent skills (`npx skills add base44/skills`)

## Notes

- Always runs in non-interactive mode (no prompts).
- Uses the `backend-only` template — does not scaffold a frontend.
- Useful in CI/CD or agent-driven workflows where the app already exists and only local project files are needed.
- For new apps, use `npx base44 create` instead.
