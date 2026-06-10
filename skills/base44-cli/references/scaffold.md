# base44 scaffold

Scaffolds a local project for an **existing** Base44 app. Use this when you already have a Base44 app (you know its app ID) and want to set up the local project files to work with it. Runs fully non-interactively, so it is safe for agents and CI.

## Critical: When to Use Scaffold vs Create vs Link

| Scenario | Command |
|----------|---------|
| Starting fresh, want a NEW Base44 app + project from a template | `npx base44 create` |
| You already have a Base44 app (by ID) and want local files for it | `npx base44 scaffold` |
| Have a local `base44/config.jsonc` but no `.app.jsonc` | `npx base44 link` |

## Syntax

```bash
npx base44 scaffold [name] [options]
```

Scaffolds into the **current directory**.

## Arguments & Options

| Argument/Option | Description | Required |
|-----------------|-------------|----------|
| `name` | Project name (positional). Defaults to the current directory name. | No |
| `--app-id <id>` | Existing Base44 app ID. Falls back to the `BASE44_APP_ID` environment variable. | Yes* |
| `--no-skills` | Skip AI agent skills installation (skills are installed by default) | No |

*The app ID is required: provide it via `--app-id` or the `BASE44_APP_ID` environment variable. If neither is set, the command fails.

## Examples

```bash
# Scaffold the current directory for an existing app
npx base44 scaffold --app-id app_123

# Scaffold the current directory with an explicit project name
npx base44 scaffold my-app --app-id app_123

# Provide the app ID via environment variable instead of the flag
BASE44_APP_ID=app_123 npx base44 scaffold

# Scaffold without installing AI agent skills
npx base44 scaffold --app-id app_123 --no-skills
```

## What It Does

1. Resolves the app ID from `--app-id` or the `BASE44_APP_ID` environment variable
2. Applies the `backend-only` template to the current directory
3. Registers the project files against the existing app and writes `base44/.app.jsonc` with the app ID
4. Installs AI agent skills (unless `--no-skills` is passed)

## Notes

- **Template:** Always uses the `backend-only` template (Base44 configuration only — no frontend is generated).
- **Non-interactive:** Never prompts. It does **not** push entities or deploy the site. Use `npx base44 deploy` afterward to push resources.
- **Existing app only:** Unlike `create`, this does not create a new Base44 app — it links local files to the app ID you supply.
- **Authentication:** Requires you to be authenticated (run `npx base44 login` first).
- The `.app.jsonc` file should be git-ignored (it contains your app ID).
