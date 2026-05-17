# base44 auth sso

Configure an SSO (Single Sign-On) identity provider for your Base44 app. Supports Google, Microsoft, GitHub, Okta, and custom OIDC providers.

## Syntax

```bash
npx base44 auth sso <enable|disable> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<enable\|disable>` | Enable or disable SSO | Yes |

## Options (enable only)

| Option | Description | Required |
|--------|-------------|----------|
| `--provider <provider>` | SSO provider: `google`, `microsoft`, `github`, `okta`, `custom` | Yes (for enable) |
| `--client-id <id>` | OAuth client ID | Yes (for enable) |
| `--client-secret <secret>` | OAuth client secret | No* |
| `--client-secret-stdin` | Read client secret from stdin | No* |
| `--env-file <path>` | Read client secret from a .env file using key `sso_client_secret` | No* |
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

*Client secret is resolved via: flag > stdin > env var `sso_client_secret` > interactive prompt.

## Examples

```bash
# Enable Google SSO
npx base44 auth sso enable --provider google --client-id <id> --client-secret <secret>

# Enable Microsoft SSO (tenant ID required)
npx base44 auth sso enable --provider microsoft --client-id <id> --client-secret <secret> --tenant-id <id>

# Enable GitHub SSO
npx base44 auth sso enable --provider github --client-id <id> --client-secret <secret>

# Enable Okta SSO (domain required)
npx base44 auth sso enable --provider okta --client-id <id> --client-secret <secret> --okta-domain <domain>

# Enable custom OIDC provider
npx base44 auth sso enable --provider custom --client-id <id> --client-secret <secret> \
  --sso-name "My Provider" \
  --auth-endpoint https://example.com/oauth/authorize \
  --token-endpoint https://example.com/oauth/token \
  --userinfo-endpoint https://example.com/oauth/userinfo \
  --jwks-uri https://example.com/.well-known/jwks.json

# Enable SSO using a JSON config file
npx base44 auth sso enable --file sso-config.json

# Read client secret from stdin
echo <secret> | npx base44 auth sso enable --provider google --client-id <id> --client-secret-stdin

# Read client secret from env file
npx base44 auth sso enable --provider google --client-id <id> --env-file .env

# Disable SSO
npx base44 auth sso disable
```

## JSON Config File Format

Use `--file <path>` to provide all settings from a JSON file:

```json
{
  "provider": "google",
  "clientId": "<id>",
  "clientSecret": "<secret>",
  "scope": "openid email profile",
  "discoveryUrl": "https://accounts.google.com/.well-known/openid-configuration",
  "tenantId": null,
  "oktaDomain": null,
  "ssoName": null
}
```

CLI flags take precedence over file values when both are provided. `--file` and `--env-file` cannot be combined.

## Notes

- Updates the local auth config and pushes SSO credentials to the Base44 backend.
- Run `npx base44 auth push` or `npx base44 deploy` to apply the auth config change to Base44.
- SSO and social login are mutually exclusive — enabling one disables the other in the local auth config.
- `disable` removes SSO credentials from Base44 and does not accept any configuration flags.
- Disabling SSO when no other login methods are enabled will warn that users will be locked out.
