# SSO Module

Single Sign-On (SSO) support for authenticating Base44 users with external systems. Available via `base44.asServiceRole.sso`.

> **Backend only**: This module requires service role access and can only be used in Base44-hosted backend functions.

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAccessToken(userid)` | `Promise<SsoAccessTokenResponse>` | Get an SSO access token for the user who made the current request. Refreshes an expired token automatically when a refresh token is available |
| `getIdToken(userid)` | `Promise<string>` | Get the stored SSO OIDC ID token for the user who made the current request. Never refreshed — fails if already expired |

Both methods only work for the **same user the client is acting on behalf of** — create the client with `createClientFromRequest(req)` and pass that request's user ID. Passing any other user's ID makes the call fail; there's no "look up any user's SSO token" mode, even with the service role.

Use `getIdToken(userid)` when you need identity claims, especially the user's `email` claim. Use `getAccessToken(userid)` when you need a token to authorize requests to an external system.

## Examples

### Get SSO Access Token

```javascript
import { createClientFromRequest } from "npm:@base44/sdk";

export default async function (req) {
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
}
```

### Note: Only the Request's Own User

`getAccessToken()` and `getIdToken()` only work for the user the client is already acting on behalf of — not for an arbitrary user ID. Always build the client with `createClientFromRequest(req)` and pass that same request's user ID; passing a different user's ID fails, even with the service role.

```javascript
export default async function (req) {
  const base44 = createClientFromRequest(req);
  const user = await base44.auth.me();

  // Only works for this same user — not an arbitrary userId from the request body
  const { access_token } = await base44.asServiceRole.sso.getAccessToken(user.id);

  return Response.json({ token: access_token });
}
```

### Get an ID Token for the User's Email Claim

Use an ID token instead of an access token when you need the user's email claim. The ID token is a JWT containing identity claims from the SSO provider. Validate and decode the token according to your provider's requirements before using its claims.

```javascript
import { createClientFromRequest } from "npm:@base44/sdk";

export default async function (req) {
  const base44 = createClientFromRequest(req);

  const user = await base44.auth.me();
  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const idToken = await base44.asServiceRole.sso.getIdToken(user.id);

  // Pass the ID token to code that validates it and reads the email claim.
  return Response.json({ idToken });
}
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
   * Gets an SSO access token for the user who made the current request.
   * Only works for that same user — fails for any other user ID. Refreshes
   * an expired token automatically when a refresh token is available.
   * @param userid - The ID of the user who made the current request (e.g. `base44.auth.me()`'s `id`).
   * @returns Promise resolving to the SSO access token response.
   */
  getAccessToken(userid: string): Promise<SsoAccessTokenResponse>;

  /**
   * Gets the stored SSO OIDC ID token for the user who made the current request.
   * Only works for that same user. The stored token is returned as-is and is
   * never refreshed, so the call fails if it has already expired.
   * @param userid - The ID of the user who made the current request (e.g. `base44.auth.me()`'s `id`).
   * @returns Promise resolving to the raw ID token string.
   */
  getIdToken(userid: string): Promise<string>;
}
```
