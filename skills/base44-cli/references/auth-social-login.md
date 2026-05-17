# base44 auth social-login

Enable or disable social login providers (Google, Microsoft, Facebook, Apple) for your Base44 app. For Google, you can optionally configure custom OAuth credentials.

## Syntax

```bash
npx base44 auth social-login <provider> <enable|disable> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<provider>` | Social login provider: `google`, `microsoft`, `facebook`, `apple` | Yes |
| `<enable\|disable>` | Enable or disable the provider | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--client-id <id>` | Custom OAuth client ID (Google only) | No |
| `--client-secret <secret>` | Custom OAuth client secret (Google only) | No |
| `--client-secret-stdin` | Read client secret from stdin (Google only) | No |
| `--env-file <path>` | Read client secret from a .env file using key `google_oauth_client_secret` (Google only) | No |

## Examples

```bash
# Enable Google login (using Base44's default OAuth)
npx base44 auth social-login google enable

# Enable Google login with custom OAuth credentials
npx base44 auth social-login google enable --client-id <id> --client-secret <secret>

# Enable Google login with custom OAuth, reading secret from stdin
echo <secret> | npx base44 auth social-login google enable --client-id <id> --client-secret-stdin

# Enable Google login with custom OAuth from env file
npx base44 auth social-login google enable --client-id <id> --env-file .env

# Enable Microsoft login
npx base44 auth social-login microsoft enable

# Disable Facebook login
npx base44 auth social-login facebook disable
```

## Notes

- Updates the local auth config only — run `npx base44 auth push` or `npx base44 deploy` to apply changes to Base44.
- Social login and SSO are mutually exclusive — enabling one disables the other in the local auth config.
- Custom OAuth options (`--client-id`, `--client-secret`, etc.) are only supported for Google.
- `--client-id` is required when providing any client secret option.
- When providing `--client-id` without a secret, you'll be prompted interactively (or can provide via env var `google_oauth_client_secret`).
- If `--client-id` is set without a secret, you'll be reminded to push the secret separately: `npx base44 secrets set --env-file <path>`.
- Disabling a provider when no other login methods are enabled will warn that users will be locked out.
