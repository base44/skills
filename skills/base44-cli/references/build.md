# base44 build

Build the site with the Base44 app id injected.

## Syntax

```bash
npx base44 build
```

## Options

This command takes no options.

## What It Does

1. Requires a linked local project (`base44/.app.jsonc` must exist)
2. Reads `site.buildCommand` from `base44/config.jsonc`
3. Runs that build command with the environment variable `VITE_BASE44_APP_ID` set to the linked app's id
4. Fails with a config error if `site.buildCommand` is not set

## Examples

```bash
# Build the site with the app id injected as VITE_BASE44_APP_ID
npx base44 build
```

## Requirements

- Must be run from a linked Base44 project directory (`base44/.app.jsonc` must exist)
- `site.buildCommand` must be configured in `base44/config.jsonc`, e.g.:
  ```jsonc
  "site": {
    "buildCommand": "npm run build",
    "outputDirectory": "./dist"
  }
  ```

## Notes

- This is the same build step that `base44 deploy` and `base44 site deploy` can run for you via `--build` — use `base44 build` directly when you want to build without deploying
- Vite projects should read `import.meta.env.VITE_BASE44_APP_ID` to get the app id at build time

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 deploy` | Deploy all project resources (can build first with `--build`) |
| `base44 site deploy` | Deploy only the site (can build first with `--build`) |
