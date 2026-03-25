# base44 auth password-login

Enable or disable username & password authentication in the local auth config.

## Syntax

```bash
npx base44 auth password-login <enable|disable>
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<enable\|disable>` | Whether to enable or disable password authentication | Yes |

## What It Does

1. Reads the local auth config from `base44/auth/` (uses default config if none exists)
2. Sets `enableUsernamePassword` to `true` (enable) or `false` (disable)
3. Writes the updated config back to the local file
4. Reminds you to push the change with `base44 auth push` or `base44 deploy`

## Examples

```bash
# Enable password authentication
npx base44 auth password-login enable

# Disable password authentication
npx base44 auth password-login disable
```

## Notes

- **Hidden command**: Not shown in `--help` output but fully functional.
- This command only modifies the **local** auth config file. Run `base44 auth push` or `base44 deploy` to apply the change to Base44.
- **Warning**: Disabling password auth when it is the only login method will leave no login methods enabled — all users will be locked out. The CLI will warn you in this case.

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 auth pull` | Pull auth config from Base44 to local file |
| `base44 auth push` | Push local auth config to Base44 |
| `base44 deploy` | Deploy all resources including auth config |
