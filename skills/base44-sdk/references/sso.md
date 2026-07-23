# SSO Module

Single Sign-On (SSO) support for authenticating Base44 users with external systems. Available via `base44.asServiceRole.sso`.

> **Backend only**: This module requires service role access and can only be used in Base44-hosted backend functions.

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAccessToken(userId)` | `Promise<SsoAccessTokenResponse>` | Get an SSO access token for a specific user |
| `getIdToken(userId)` | `Promise<string>` | Get the stored SSO OIDC ID token for the current app user |

Use `getIdToken(userId)` when you need identity claims, especially the user's `email` claim. Use `getAccessToken(userId)` when you need a token to authorize requests to an external system.

The service-role client must include an on-behalf-of token for the same user passed to `getIdToken`.

## Examples

### Get SSO Access Token

```javascript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  // Get the current user
  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Get SSO access token for this user
  const { access_token } = await base44.asServiceRole.sso.getAccessToken(user.id);

  // Use the token to authenticate with an external system
  return Response.json({ ssoToken: access_token });
});
```

### Get Token for a Specific User (Service Role)

```javascript
Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);
  const { userId } = await req.json();

  // Get SSO token for any user (service role has access to all users)
  const { access_token } = await base44.asServiceRole.sso.getAccessToken(userId);

  return Response.json({ token: access_token });
});
```

### Get an ID Token for the User's Email Claim

Use an ID token instead of an access token when you need the user's email claim. The ID token is a JWT containing identity claims from the SSO provider. Validate and decode the token according to your provider's requirements before using its claims.

```javascript
import { createClientFromRequest } from "npm:@base44/sdk";

Deno.serve(async (req) => {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = await base44.asServiceRole.sso.getIdToken(user.id);

  // Pass the ID token to code that validates it and reads the email claim.
  return Response.json({ idToken });
});
```

## Use Cases

- Authenticating Base44 users with external SaaS tools (e.g., Okta, Azure AD)
- Building SSO bridges between Base44 and third-party systems
- Generating tokens for backend-to-backend authenticated calls

## Type Definitions

```typescript
/** Response from the SSO access token endpoint. */
interface SsoAccessTokenResponse {
  /** The SSO access token for the specified user. */
  access_token: string;
}

/** SSO module for managing SSO authentication (service role only). */
interface SsoModule {
  /**
   * Gets an SSO access token for a specific user.
   * @param userId - The Base44 user ID to get the SSO token for.
   * @returns Promise resolving to the SSO access token response.
   */
  getAccessToken(userId: string): Promise<SsoAccessTokenResponse>;

  /**
   * Gets the stored SSO OIDC ID token for the current app user.
   * Use this method when you need the user's email claim.
   * The service-role client must act on behalf of this same user.
   * @param userId - The current app user's Base44 user ID.
   * @returns Promise resolving to the raw ID token string.
   */
  getIdToken(userId: string): Promise<string>;
}
```
