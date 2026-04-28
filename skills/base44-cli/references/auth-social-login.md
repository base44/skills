# base44 auth social-login

Enable or disable social login providers for your Base44 app.

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
| `--env-file <path>` | Read client secret from a `.env` file (Google only) | No |

## Examples

```bash
# Enable Google login (using Base44's shared OAuth app)
npx base44 auth social-login google enable

# Disable Microsoft login
npx base44 auth social-login microsoft disable

# Enable Google login with a custom OAuth app
npx base44 auth social-login google enable --client-id my-client-id --client-secret my-secret

# Enable Google login, reading client secret from stdin
echo "my-secret" | npx base44 auth social-login google enable --client-id my-client-id --client-secret-stdin

# Enable Google login, reading client secret from a .env file
npx base44 auth social-login google enable --client-id my-client-id --env-file .env.secrets
```

## Notes

- Updates the local auth config file only — run `npx base44 auth push` or `npx base44 deploy` to apply the change to Base44.
- Custom OAuth options (`--client-id`, `--client-secret`, etc.) are only supported for Google. Microsoft, Facebook, and Apple use Base44's shared OAuth app.
- `--client-id` is required when providing any secret option.
- When providing a `--client-id` without a secret, the command will save the client ID locally. Push the secret separately: `npx base44 secrets set --env-file <path>`.
- Disabling a provider when no other login methods are enabled will warn you that users will be locked out.
- Client secret resolution order: stdin (`--client-secret-stdin`) > flag (`--client-secret`) > environment variable (`google_oauth_client_secret`) > interactive prompt.
