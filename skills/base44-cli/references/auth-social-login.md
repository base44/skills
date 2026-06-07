# base44 auth social-login

Enable or disable social login providers for your Base44 app. Supports Google, Microsoft, Facebook, and Apple. Optionally configure custom OAuth credentials for Google.

## Syntax

```bash
npx base44 auth social-login <provider> <action> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<provider>` | Social login provider: `google`, `microsoft`, `facebook`, `apple` | Yes |
| `<action>` | `enable` or `disable` the provider | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--client-id <id>` | Custom OAuth client ID (Google only) | No |
| `--client-secret <secret>` | Custom OAuth client secret (Google only) | No |
| `--client-secret-stdin` | Read client secret from stdin (Google only) | No |
| `--env-file <path>` | Read client secret from a `.env` file using key `google_oauth_client_secret` (Google only) | No |

## Examples

```bash
# Enable Google login (using Base44 managed OAuth)
npx base44 auth social-login google enable

# Enable Google login with custom OAuth credentials
npx base44 auth social-login google enable --client-id <id> --client-secret <secret>

# Enable Google login with secret from stdin
echo <secret> | npx base44 auth social-login google enable --client-id <id> --client-secret-stdin

# Enable Google login with credentials from .env file
npx base44 auth social-login google enable --client-id <id> --env-file .env

# Enable Microsoft login
npx base44 auth social-login microsoft enable

# Disable Facebook login
npx base44 auth social-login facebook disable

# Disable Apple login
npx base44 auth social-login apple disable
```

## Notes

- Updates the local auth config file only — run `npx base44 auth push` or `npx base44 deploy` to apply the change to Base44.
- Custom OAuth credentials are only supported for Google. Other providers use Base44's managed OAuth.
- When using custom OAuth, `--client-id` is always required when providing secret options.
- Client secret resolution order: `--client-secret-stdin` > `--client-secret` flag > `google_oauth_client_secret` env var > interactive prompt.
- If you set `--client-id` without a secret, the client secret must be pushed separately via `npx base44 secrets set`.
- Disabling a social provider when no other login methods remain will warn that users will be locked out.
- Social login and SSO are mutually exclusive — enabling one disables the other in the local auth config.
