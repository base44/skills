# base44 build

Build the site with the linked app's id injected. Use this instead of a bare `npm run build` (or your framework's build command) so the built bundle can resolve its own app.

## Syntax

```bash
npx base44 build
```

## Options

This command takes no command-specific options (only the global flags, e.g. `--app-id`).

## What It Does

1. Resolves the app id — from `base44/.app.jsonc` in the current project, or from `--app-id` / `BASE44_APP_ID` (works even without a local project checkout, e.g. inside a Builder repo or a publish sandbox)
2. Resolves the site's build command: `site.buildCommand` from `base44/config.jsonc` if present (defaults to `npm run build` when the `site` block is declared but doesn't set it), or `npm run build` if there is no config at all
3. Runs that build command with `VITE_BASE44_APP_ID` set to the resolved app id
4. Reports the app id the built bundle now carries

## Examples

```bash
# Build the site for the linked project
npx base44 build

# Build for a specific app without a local checkout (e.g. a publish sandbox)
npx base44 build --app-id app_123
```

## Output

```bash
$ npx base44 build

Site built with app id app_123
```

## Requirements

- An app id must be resolvable (`base44/.app.jsonc`, or `--app-id` / `BASE44_APP_ID`)
- **No authentication required** — the command calls no API, so it also works in environments that only have an app id and no credentials yet

## Notes

- This is why a bare `npm run build` is discouraged: without `VITE_BASE44_APP_ID` injected, the bundle can't resolve its own app, and every API call on the deployed site fails
- Does **not** deploy anything — follow with `npx base44 deploy` (or `npx base44 deploy --build` to build and deploy in one step) or `npx base44 site deploy` to ship the built output
- Reads `base44/config.jsonc` if present, but does not require it — a Builder repo (or any directory with no CLI config) still builds, falling back to the `npm install` / `npm run build` conventions
- A project with a partial `site` block (e.g. only `outputDirectory` set) still builds: `installCommand`/`buildCommand` default to `npm install`/`npm run build` when the `site` block is declared but doesn't name them

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 deploy` | Deploy all resources; `--build` builds first through this same path |
| `base44 site deploy` | Deploy only the site; `--build` builds first through this same path |
| `base44 site install` | Run only the site's `installCommand` |
