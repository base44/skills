# base44 auth push

Push local auth config to Base44.

## Syntax

```bash
npx base44 auth push [options]
```

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `-y, --yes` | Skip confirmation prompt | No |

## What It Does

1. Reads the local auth config file from `base44/auth/`
2. Validates that there is at least one login method enabled (warns if not)
3. Prompts for confirmation (unless `-y` is provided)
4. Pushes the auth config to Base44

## Examples

```bash
# Push with confirmation prompt
npx base44 auth push

# Push without confirmation (non-interactive / CI)
npx base44 auth push -y
```

## Non-Interactive Mode

In non-interactive mode (e.g., CI/CD), `--yes` is required:

```bash
npx base44 auth push -y
```

## Notes

- **Hidden command**: Not shown in `--help` output but fully functional.
- If no local auth config is found, the command exits early and suggests running `base44 auth pull` first.
- **Warning**: Pushing a config with no login methods enabled will lock out all users. The CLI will warn you before pushing in this case.
- Auth config is also pushed as part of `base44 deploy`.

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 auth pull` | Pull auth config from Base44 to local file |
| `base44 auth password-login` | Enable or disable username & password authentication |
| `base44 deploy` | Deploy all resources including auth config |
