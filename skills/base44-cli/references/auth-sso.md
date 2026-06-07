# base44 auth sso

Configure Single Sign-On (SSO) for your Base44 app. Supports Google, Microsoft, GitHub, Okta, and fully custom OIDC providers.

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
| `--provider <provider>` | SSO provider: `google`, `microsoft`, `github`, `okta`, `custom` | Yes (enable) |
| `--client-id <id>` | OAuth client ID | Yes (enable) |
| `--client-secret <secret>` | OAuth client secret | Conditional |
| `--client-secret-stdin` | Read client secret from stdin | Conditional |
| `--env-file <path>` | Read client secret from a .env file — key: `sso_client_secret` | Conditional |
| `--file <path>` | JSON config file with all SSO settings (flags override file values) | No |
| `--scope <scope>` | OAuth scope (defaults per provider) | No |
| `--discovery-url <url>` | OIDC discovery URL | No |
| `--tenant-id <id>` | Microsoft tenant ID | Required for `microsoft` |
| `--okta-domain <domain>` | Okta domain | Required for `okta` |
| `--auth-endpoint <url>` | Authorization endpoint | Required for `custom` |
| `--token-endpoint <url>` | Token endpoint | Required for `custom` |
| `--userinfo-endpoint <url>` | Userinfo endpoint | Required for `custom` |
| `--jwks-uri <url>` | JWKS URI | Required for `custom` |
| `--sso-name <name>` | Provider display name | Required for `custom` |

> Note: `--client-secret`, `--client-secret-stdin`, and `--env-file` are mutually exclusive ways to supply the client secret. `--file` and `--env-file` cannot be combined.

## JSON Config File Format (`--file`)

```json
{
  "provider": "google",
  "clientId": "<id>",
  "clientSecret": "<secret>",
  "scope": "openid email profile",
  "discoveryUrl": "https://accounts.google.com/.well-known/openid-configuration",
  "tenantId": "<microsoft-only>",
  "oktaDomain": "<okta-only>",
  "authEndpoint": "<custom-only>",
  "tokenEndpoint": "<custom-only>",
  "userinfoEndpoint": "<custom-only>",
  "jwksUri": "<custom-only>",
  "ssoName": "<custom-only>"
}
```

## Examples

```bash
# Enable Google SSO
npx base44 auth sso enable --provider google --client-id <id> --client-secret <secret>

# Enable Microsoft SSO
npx base44 auth sso enable --provider microsoft --client-id <id> --client-secret <secret> --tenant-id <tenant>

# Enable Okta SSO
npx base44 auth sso enable --provider okta --client-id <id> --client-secret <secret> --okta-domain mycompany.okta.com

# Enable GitHub SSO
npx base44 auth sso enable --provider github --client-id <id> --client-secret <secret>

# Enable custom OIDC provider
npx base44 auth sso enable --provider custom \
  --client-id <id> --client-secret <secret> \
  --sso-name "My IdP" \
  --auth-endpoint https://idp.example.com/authorize \
  --token-endpoint https://idp.example.com/token \
  --userinfo-endpoint https://idp.example.com/userinfo \
  --jwks-uri https://idp.example.com/.well-known/jwks.json

# Enable SSO from a JSON config file
npx base44 auth sso enable --file sso-config.json

# Read secret from stdin
echo <secret> | npx base44 auth sso enable --provider google --client-id <id> --client-secret-stdin

# Read secret from .env file (key: sso_client_secret)
npx base44 auth sso enable --provider google --client-id <id> --env-file .env

# Disable SSO
npx base44 auth sso disable
```

## Notes

- Updates the local auth config and pushes SSO credentials to the Base44 backend. Run `npx base44 auth push` or `npx base44 deploy` to apply the auth config to your app.
- `disable` removes all stored SSO credentials.
- SSO and social login are mutually exclusive — enabling one disables the other in the local auth config.
- Disabling SSO when it is the only active login method will warn that users will be locked out.
- Flags override values from `--file` when both are provided.
- The client secret can be supplied via `--client-secret`, `--client-secret-stdin`, `--env-file`, or the `sso_client_secret` environment variable.
