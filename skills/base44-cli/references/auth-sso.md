# base44 auth sso

Configure Single Sign-On (SSO) for your Base44 app. Supports Google, Microsoft, GitHub, Okta, and custom OIDC providers.

## Syntax

```bash
npx base44 auth sso <enable|disable> [options]
```

## Arguments

| Argument | Description | Required |
|----------|-------------|----------|
| `<enable\|disable>` | Enable or disable SSO | Yes |

## Options (enable)

| Option | Description | Required |
|--------|-------------|----------|
| `--provider <provider>` | SSO provider: `google`, `microsoft`, `github`, `okta`, `custom` | Yes (enable) |
| `--client-id <id>` | OAuth client ID | Yes (enable) |
| `--client-secret <secret>` | OAuth client secret | No |
| `--client-secret-stdin` | Read client secret from stdin | No |
| `--env-file <path>` | Read client secret from a `.env` file (key: `sso_client_secret`) | No |
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

## Examples

```bash
# Enable Google SSO
npx base44 auth sso enable --provider google --client-id <id> --client-secret <secret>

# Enable Microsoft SSO (tenant-id required)
npx base44 auth sso enable --provider microsoft --client-id <id> --client-secret <secret> --tenant-id <tenant-id>

# Enable Okta SSO
npx base44 auth sso enable --provider okta --client-id <id> --client-secret <secret> --okta-domain <domain>

# Enable custom OIDC provider
npx base44 auth sso enable --provider custom --client-id <id> --client-secret <secret> \
  --sso-name "My IdP" --auth-endpoint <url> --token-endpoint <url> \
  --userinfo-endpoint <url> --jwks-uri <url>

# Enable SSO using a JSON config file
npx base44 auth sso enable --file sso-config.json

# Read secret from stdin
echo <secret> | npx base44 auth sso enable --provider google --client-id <id> --client-secret-stdin

# Disable SSO
npx base44 auth sso disable
```

## JSON Config File Format (`--file`)

```json
{
  "provider": "google",
  "clientId": "<id>",
  "clientSecret": "<secret>",
  "scope": "openid email profile",
  "discoveryUrl": "https://accounts.google.com/.well-known/openid-configuration",
  "tenantId": null,
  "oktaDomain": null,
  "authEndpoint": null,
  "tokenEndpoint": null,
  "userinfoEndpoint": null,
  "jwksUri": null,
  "ssoName": null
}
```

Flags passed on the command line override values in the file.

## Notes

- Updates the local auth config and pushes SSO credentials to the Base44 backend immediately.
- Run `npx base44 auth push` or `npx base44 deploy` to apply the local config change.
- SSO and social login are mutually exclusive — enabling one disables the other in the local auth config.
- `disable` removes all SSO credentials from the backend and disables SSO in the local config.
- Disabling SSO when no other login methods are enabled will warn that users will be locked out.
- `--file` and `--env-file` cannot be used together.
