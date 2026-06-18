# base44 auth social-login

Enable or disable social login providers for your app (Google, Microsoft, Facebook, Apple). Auth config changes are local until you run `base44 auth push` or `base44 deploy`.

## Syntax

```bash
npx base44 auth social-login <provider> <action> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<provider>` | Social login provider: `google`, `microsoft`, `facebook`, `apple` | Yes |
| `<action>` | `enable` or `disable` | Yes |

## Options

| Option | Description | Required |
|--------|-------------|----------|
| `--client-id <id>` | Custom OAuth client ID (Google only) | No |
| `--client-secret <secret>` | Custom OAuth client secret (Google only) | No |
| `--client-secret-stdin` | Read client secret from stdin (Google only) | No |
| `--env-file <path>` | Read client secret from a `.env` file using key `google_oauth_client_secret` (Google only) | No |

Custom OAuth options (`--client-id`, `--client-secret`, `--client-secret-stdin`, `--env-file`) are only supported for Google. For other providers, enable/disable without any options.

## Examples

```bash
# Enable Google login (using Base44's default OAuth)
npx base44 auth social-login google enable

# Enable Google login with your own OAuth app (custom credentials)
npx base44 auth social-login google enable --client-id my-client-id --client-secret my-secret

# Enable Google login with secret from stdin
echo "my-secret" | npx base44 auth social-login google enable --client-id my-client-id --client-secret-stdin

# Enable Google login with credentials from a .env file
npx base44 auth social-login google enable --client-id my-client-id --env-file .env.production

# Enable Microsoft login
npx base44 auth social-login microsoft enable

# Disable Facebook login
npx base44 auth social-login facebook disable

# Enable Apple login
npx base44 auth social-login apple enable
```

## Notes

- Changes are written to the local `base44/auth/` config. Run `npx base44 auth push` or `npx base44 deploy` to apply them.
- **SSO and social login are mutually exclusive** — enabling social login disables any active SSO configuration in the local auth config (and vice versa).
- Disabling the last active login method will warn that users will be locked out.
- When using custom OAuth for Google: `--client-id` is required whenever any secret option is passed.
- The client secret is saved to Base44's secrets store; the client ID is stored in the local auth config.
- If you set a custom client ID without providing a secret now, push the secret later: `npx base44 secrets set --env-file <path>`

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 auth password-login` | Enable or disable username & password authentication |
| `base44 auth sso` | Configure SSO identity provider |
| `base44 auth push` | Push local auth config to Base44 |
| `base44 auth pull` | Pull auth config from Base44 |
