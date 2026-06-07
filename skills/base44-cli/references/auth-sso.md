# base44 auth sso

Configure SSO (Single Sign-On) identity provider for your Base44 app. Supports Google, Microsoft, GitHub, Okta, and custom OIDC providers.

## Syntax

```bash
npx base44 auth sso <action> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<action>` | `enable` or `disable` SSO | Yes |

## Options (enable)

| Option | Description | Required |
|--------|-------------|----------|
| `--provider <provider>` | SSO provider: `google`, `microsoft`, `github`, `okta`, `custom` | Yes (for enable) |
| `--client-id <id>` | OAuth client ID | Yes (for enable) |
| `--client-secret <secret>` | OAuth client secret | No |
| `--client-secret-stdin` | Read client secret from stdin | No |
| `--env-file <path>` | Read client secret from `.env` file using key `sso_client_secret` | No |
| `--file <path>` | JSON config file with all SSO settings | No |
| `--scope <scope>` | OAuth scope (defaults vary per provider) | No |
| `--discovery-url <url>` | OIDC discovery URL | No |
| `--tenant-id <id>` | Microsoft tenant ID (required for `microsoft`) | Conditional |
| `--okta-domain <domain>` | Okta domain (required for `okta`) | Conditional |
| `--auth-endpoint <url>` | Authorization endpoint (required for `custom`) | Conditional |
| `--token-endpoint <url>` | Token endpoint (required for `custom`) | Conditional |
| `--userinfo-endpoint <url>` | Userinfo endpoint (required for `custom`) | Conditional |
| `--jwks-uri <url>` | JWKS URI (required for `custom`) | Conditional |
| `--sso-name <name>` | Provider display name (required for `custom`) | Conditional |

## Examples

```bash
# Enable Google SSO
npx base44 auth sso enable --provider google --client-id <id> --client-secret <secret>

# Enable Microsoft SSO (requires tenant ID)
npx base44 auth sso enable --provider microsoft --client-id <id> --client-secret <secret> --tenant-id <id>

# Enable GitHub SSO
npx base44 auth sso enable --provider github --client-id <id> --client-secret <secret>

# Enable Okta SSO (requires Okta domain)
npx base44 auth sso enable --provider okta --client-id <id> --client-secret <secret> --okta-domain <domain>

# Enable custom OIDC SSO
npx base44 auth sso enable --provider custom --client-id <id> --client-secret <secret> \
  --sso-name "My IdP" \
  --auth-endpoint https://idp.example.com/authorize \
  --token-endpoint https://idp.example.com/token \
  --userinfo-endpoint https://idp.example.com/userinfo \
  --jwks-uri https://idp.example.com/.well-known/jwks.json

# Enable SSO with secret from stdin
echo <secret> | npx base44 auth sso enable --provider google --client-id <id> --client-secret-stdin

# Enable SSO using a JSON config file
npx base44 auth sso enable --file sso-config.json

# Disable SSO (removes SSO credentials from Base44)
npx base44 auth sso disable
```

## JSON Config File Format

When using `--file`, provide a JSON file with this structure:

```json
{
  "provider": "google",
  "clientId": "your-client-id",
  "clientSecret": "your-client-secret",
  "scope": "openid email profile",
  "discoveryUrl": "https://accounts.google.com/.well-known/openid-configuration",
  "tenantId": "...",
  "oktaDomain": "...",
  "authEndpoint": "...",
  "tokenEndpoint": "...",
  "userinfoEndpoint": "...",
  "jwksUri": "...",
  "ssoName": "..."
}
```

CLI flags override values from the file when both are provided (except `--env-file` and `--file` cannot be combined).

## Notes

- Updates the local auth config and pushes SSO credentials to Base44 in one step.
- Run `npx base44 auth push` or `npx base44 deploy` to apply the local config change to Base44.
- Client secret resolution order: `--client-secret-stdin` > `--client-secret` flag > `sso_client_secret` env var > interactive prompt.
- `disable` removes SSO credentials from Base44 and updates the local auth config.
- Disabling SSO when no other login methods remain will warn that users will be locked out.
- SSO and social login are mutually exclusive — enabling one disables the other in the local auth config.
