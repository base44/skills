# base44 create

Creates a new Base44 app. This command is framework-agnostic and does NOT initialize a local npm project.

## Syntax

```bash
npm run base44 create [options]
# or
yarn base44 create [options]
# or
pnpm base44 create [options]
```

## Options

| Option | Description |
|--------|-------------|
| `-t, --template <template>` | Template to use |
| `-n, --name <name>` | Project name |
| `-d, --description <description>` | Project description |
| `-p, --path <path>` | Path where to create the project |
| `--deploy` | Build and deploy the site (includes pushing entities) |

## The `-p, --path` flag (project path)

- **Default behavior:** If not specified, uses current working directory (cwd)
  ```bash
  npm run base44 create -n my-app
  # Uses current directory
  ```
- **For existing projects:** Use `-p .` or omit the flag (defaults to cwd)
  ```bash
  npm run base44 create -n my-app -p .
  ```
- **For new projects:** Point to the subfolder created by the framework scaffolding tool
  ```bash
  # Example: Vite creates a subfolder named after the project
  npm create vite@latest my-react-app -- --template react
  npm run base44 create -n my-app -p ./my-react-app
  ```
- **Custom location:** When user specifies "my project is located at ..." or provides a specific path
  ```bash
  npm run base44 create -n my-app -p /path/to/project
  ```

The path specified with `-p` should point to where your project files actually exist after framework initialization.

## Examples

```bash
# Create app in current directory
npm run base44 create -n my-app -d "My awesome app"

# Create app with template and deploy immediately
npm run base44 create -n my-app -t starter --deploy

# Create app from existing Vite project
npm create vite@latest my-react-app -- --template react
npm run base44 create -n my-app -p ./my-react-app
```
