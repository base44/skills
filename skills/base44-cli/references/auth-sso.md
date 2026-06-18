# base44 auth sso

Configure an SSO (Single Sign-On) identity provider for your app. Supports Google, Microsoft, GitHub, Okta, and custom OIDC providers. Auth config changes are local until you run `base44 auth push` or `base44 deploy`.

## Syntax

```bash
npx base44 auth sso <action> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<action>` | `enable` or `disable` | Yes |

## Options (enable)

| Option | Description | Required |
|--------|-------------|----------|
| `--provider <provider>` | SSO provider: `google`, `microsoft`, `github`, `okta`, `custom` | Yes (enable) |
| `--client-id <id>` | OAuth client ID | Yes (enable) |
| `--client-secret <secret>` | OAuth client secret | No* |
| `--client-secret-stdin` | Read client secret from stdin | No* |
| `--env-file <path>` | Read client secret from a `.env` file (key: `sso_client_secret`) | No* |
| `--file <path>` | JSON config file with all SSO settings | No |
| `--scope <scope>` | OAuth scope (defaults per provider) | No |
| `--discovery-url <url>` | OIDC discovery URL | No |
| `--tenant-id <id>` | Microsoft tenant ID | Required for `microsoft` |
| `--okta-domain <domain>` | Okta domain | Required for `okta` |
| `--auth-endpoint <url>` | Authorization endpoint | Required for `custom` |
| `--token-endpoint <url>` | Token endpoint | Required for `custom` |
| `--userinfo-endpoint <url>` | Userinfo endpoint | Required for `custom` |
| `--jwks-uri <url>` | JWKS URI | Required for `custom` |
| `--sso-name <name>` | Provider display name | Required for `custom` |

*The client secret must be provided via `--client-secret`, `--client-secret-stdin`, `--env-file`, or the `sso_client_secret` environment variable.

## Examples

```bash
# Enable Google SSO
npx base44 auth sso enable --provider google --client-id my-id --client-secret my-secret

# Enable Microsoft SSO (tenant ID required)
npx base44 auth sso enable --provider microsoft --client-id my-id --client-secret my-secret --tenant-id my-tenant

# Enable GitHub SSO
npx base44 auth sso enable --provider github --client-id my-id --client-secret my-secret

# Enable Okta SSO (Okta domain required)
npx base44 auth sso enable --provider okta --client-id my-id --client-secret my-secret --okta-domain mycompany.okta.com

# Enable custom OIDC provider
npx base44 auth sso enable --provider custom \
  --client-id my-id --client-secret my-secret \
  --sso-name "My IdP" \
  --auth-endpoint https://idp.example.com/authorize \
  --token-endpoint https://idp.example.com/token \
  --userinfo-endpoint https://idp.example.com/userinfo \
  --jwks-uri https://idp.example.com/.well-known/jwks.json

# Read client secret from stdin
echo "my-secret" | npx base44 auth sso enable --provider google --client-id my-id --client-secret-stdin

# Load all settings from a JSON config file
npx base44 auth sso enable --file sso-config.json

# Disable SSO
npx base44 auth sso disable
```

## JSON Config File Format

Use `--file` to supply all settings from a JSON file:

```json
{
  "provider": "google",
  "clientId": "my-client-id",
  "clientSecret": "my-client-secret",
  "scope": "openid email profile"
}
```

Flags passed alongside `--file` override the file values. Cannot be combined with `--env-file`.

## Notes

- Changes are written to the local `base44/auth/` config. Run `npx base44 auth push` or `npx base44 deploy` to apply them.
- **SSO and social login are mutually exclusive** — enabling SSO disables any active social login configuration in the local auth config.
- `disable` removes SSO from the local config and deletes the stored SSO credentials from Base44.
- Disabling SSO when no other login method is active will warn that users will be locked out.
- The client secret is stored in Base44's secrets store, not in the local auth config file.

## Related Commands

| Command | Description |
|---------|-------------|
| `base44 auth social-login` | Enable or disable social login providers |
| `base44 auth password-login` | Enable or disable username & password authentication |
| `base44 auth push` | Push local auth config to Base44 |
| `base44 auth pull` | Pull auth config from Base44 |
