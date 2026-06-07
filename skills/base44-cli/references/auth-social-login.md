# base44 auth social-login

Enable or disable social login providers (Google, Microsoft, Facebook, Apple) for your Base44 app. For Google, you can optionally supply a custom OAuth client ID and secret.

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
| `--env-file <path>` | Read client secret from a .env file — key: `google_oauth_client_secret` (Google only) | No |

## Examples

```bash
# Enable Google login (using Base44-managed OAuth)
npx base44 auth social-login google enable

# Enable Google login with your own OAuth credentials
npx base44 auth social-login google enable --client-id <id> --client-secret <secret>

# Enable Google login, reading secret from stdin
echo <secret> | npx base44 auth social-login google enable --client-id <id> --client-secret-stdin

# Enable Google login, reading secret from a .env file
npx base44 auth social-login google enable --client-id <id> --env-file .env

# Enable Microsoft login
npx base44 auth social-login microsoft enable

# Disable Facebook login
npx base44 auth social-login facebook disable
```

## Notes

- Updates the local auth config only — run `npx base44 auth push` or `npx base44 deploy` to apply the change to Base44.
- Custom OAuth credentials (client ID / secret) are only supported for Google. Microsoft, Facebook, and Apple use Base44-managed OAuth.
- `--client-id` is required when providing any secret option (`--client-secret`, `--client-secret-stdin`, or `--env-file`).
- If `--client-id` is set without a secret, the client secret must be pushed separately: `npx base44 secrets set --env-file <path>`.
- Disabling a provider when it is the only active login method will warn that users will be locked out.
- Social login and SSO are mutually exclusive — enabling one disables the other in the local auth config.
