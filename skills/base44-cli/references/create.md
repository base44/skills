# base44 create

Creates a new Base44 project. This command is framework-agnostic and does NOT initialize a local npm project.

## Critical: Non-Interactive Mode Required

ALWAYS use `--name` AND `--path` flags together. Without both flags, the command opens an interactive TUI which agents cannot use properly.

WRONG: `npx base44 create`
WRONG: `npx base44 create -n my-app`
RIGHT: `npx base44 create -n my-app -p ./my-app`

## Syntax

```bash
npx base44 create --name <name> --path <path> [options]
```

## Options

| Option                            | Description                                           | Required |
| --------------------------------- | ----------------------------------------------------- | -------- |
| `-n, --name <name>`               | Project name                                          | Yes*     |
| `-p, --path <path>`               | Path where to create the project                      | Yes*     |
| `-d, --description <description>` | Project description                                   | No       |
| `--deploy`                        | Build and deploy the site (includes pushing entities) | No       |

*Required for non-interactive mode. Both `--name` and `--path` must be provided together.

## The `--path` Flag

- **For existing projects:** Use `-p .` to use current directory
  ```bash
  npx base44 create -n my-app -p .
  ```
- **For new projects:** Point to where project files exist
  ```bash
  # Example: After Vite creates a subfolder
  npm create vite@latest my-react-app -- --template react
  npx base44 create -n my-app -p ./my-react-app
  ```
- **Custom location:**
  ```bash
  npx base44 create -n my-app -p /path/to/project
  ```

## Examples

```bash
# Create app in current directory
npx base44 create -n my-app -p .

# Create app with description
npx base44 create -n my-app -p . -d "My awesome app"

# Create app and deploy immediately
npx base44 create -n my-app -p . --deploy

# Create app from existing Vite project
npm create vite@latest my-react-app -- --template react
npx base44 create -n my-app -p ./my-react-app --deploy
```

## What It Does

1. Creates a `base44/` folder in your project with configuration files
2. Registers the project with Base44 backend
3. If `--deploy` is used:
   - Pushes any entities defined in `base44/entities/`
   - Builds and deploys the site (if site config exists)
