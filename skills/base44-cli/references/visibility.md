# base44 visibility

Set the app's visibility on the Base44 server.

## Syntax

```bash
npx base44 visibility <level>
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<level>` | Visibility level: `public`, `private`, or `workspace` | Yes |

## Examples

```bash
# Make the app publicly accessible
npx base44 visibility public

# Restrict the app to the workspace
npx base44 visibility workspace

# Make the app private
npx base44 visibility private
```

## What It Does

- Calls the Base44 API directly to update the app's visibility — takes effect immediately, no deploy or push needed
- Requires the project to be linked (an app ID must be resolvable)

## Notes

- If `visibility` is set in `base44/config.jsonc`, `npx base44 deploy` also applies it as part of the deployment summary
- Must be authenticated and run from a linked Base44 project directory (or with `--app-id`)

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 deploy` | Deploys all resources, including visibility if configured in `base44/config.jsonc` |
