# base44 auth social-login

Enable or disable social login providers for your Base44 app.

## Syntax

```bash
npx base44 auth social-login <provider> <enable|disable> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<provider>` | Social login provider: `google`, `microsoft`, `facebook`, `apple` | Yes |
| `<enable\|disable>` | Enable or disable the provider | Yes |

## Options (Google custom OAuth only)

| Option | Description | Required |
|--------|-------------|----------|
| `--client-id <id>` | Custom OAuth client ID | With `--client-secret` |
| `--client-secret <secret>` | Custom OAuth client secret | No |
| `--client-secret-stdin` | Read client secret from stdin | No |
| `--env-file <path>` | Read client secret from a `.env` file (key: `google_oauth_client_secret`) | No |

## Examples

```bash
# Enable Google login (using Base44's built-in OAuth)
npx base44 auth social-login google enable

# Enable Google login with custom OAuth credentials
npx base44 auth social-login google enable --client-id <id> --client-secret <secret>

# Enable Google login with secret from stdin
echo <secret> | npx base44 auth social-login google enable --client-id <id> --client-secret-stdin

# Enable Google login with credentials from .env file
npx base44 auth social-login google enable --client-id <id> --env-file .env.secrets

# Enable Microsoft login
npx base44 auth social-login microsoft enable

# Disable Facebook login
npx base44 auth social-login facebook disable
```

## Notes

- Updates the local auth config only — run `npx base44 auth push` or `npx base44 deploy` to apply changes.
- Custom OAuth credentials (`--client-id`, `--client-secret`) are only supported for Google.
- `--client-id` is required when providing any secret option.
- Disabling a provider when no other login methods are enabled will warn that users will be locked out.
- SSO and social login are mutually exclusive — enabling one disables the other in the local auth config.
