# base44 create

Creates a new Base44 project from a template. This command is framework-agnostic and can either scaffold a complete project or add Base44 configuration to an existing project.

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

| Option | Description | Required |
|--------|-------------|----------|
| `-n, --name <name>` | Project name | Yes* |
| `-p, --path <path>` | Path where to create the project | Yes* |
| `-d, --description <description>` | Project description | No |
| `-t, --template <id>` | Template ID (see templates below) | No |
| `--deploy` | Build and deploy the site (includes pushing entities) | No |

*Required for non-interactive mode. Both `--name` and `--path` must be provided together.

## Templates

| Template ID | Description |
|-------------|-------------|
| `backend-only` | Base44 configuration only (default) - use with existing frontend projects |
| `backend-and-client` | Full-stack template with Vite + React + Tailwind + shadcn/ui |

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
# Create backend-only config in current directory (default template)
npx base44 create -n my-app -p .

# Create full-stack project with frontend template
npx base44 create -n my-app -p ./my-app -t backend-and-client

# Create app with description
npx base44 create -n my-app -p . -d "My awesome app"

# Create app and deploy immediately
npx base44 create -n my-app -p . --deploy

# Create full-stack and deploy in one step
npx base44 create -n my-app -p ./my-app -t backend-and-client --deploy
```

## What It Does

1. Applies the selected template to the target path
2. Creates a `base44/` folder with configuration files
3. Registers the project with Base44 backend
4. Creates `base44/.app.jsonc` with the app ID
5. If `--deploy` is used:
   - Pushes any entities defined in `base44/entities/`
   - Runs install and build commands (for templates with frontend)
   - Deploys the site to Base44 hosting
