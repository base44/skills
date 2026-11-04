# SSO Module

Single Sign-On (SSO) support for authenticating Base44 users with external systems. Available via `base44.asServiceRole.sso`.

> **Backend only**: This module requires service role access and can only be used in Base44-hosted backend functions.

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getAccessToken(userId)` | `Promise<SsoAccessTokenResponse>` | Get an SSO access token for the user who made the current request |
| `getIdToken(userId)` | `Promise<string>` | Get the stored SSO OIDC ID token for the user who made the current request |

Use `getIdToken(userId)` when you need identity claims, especially the user's `email` claim. Use `getAccessToken(userId)` when you need a token to authorize requests to an external system.

**Both methods only work for the user who made the current request.** Create the client with `createClientFromRequest` so it acts on behalf of the request's user, then pass that user's ID (e.g. from `base44.auth.me()`) as `userId`. If `userId` is any other user, the call fails — service role does **not** grant access to arbitrary users' SSO tokens.

- `getAccessToken`: an expired access token is refreshed automatically when a refresh token is available.
- `getIdToken`: the stored ID token is returned as-is and is **never** refreshed, so the call fails if the token has already expired.

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

### Verify the Requested User Matches the Caller

```javascript
export default async function (req) {
  const base44 = createClientFromRequest(req);
  const { userId } = await req.json();

  // getAccessToken only works for the user who made the current request.
  // Passing a different user's ID here causes the call to fail.
  const user = await base44.auth.me();
  if (!user || user.id !== userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { access_token } = await base44.asServiceRole.sso.getAccessToken(userId);

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
   * Only works for that same user (the service-role client must act on
   * behalf of this user); fails for any other user ID. An expired token
   * is refreshed automatically when a refresh token is available.
   * @param userId - The ID of the user who made the current request,
   * such as the `id` returned by `base44.auth.me()`.
   * @returns Promise resolving to the SSO access token response.
   */
  getAccessToken(userId: string): Promise<SsoAccessTokenResponse>;

  /**
   * Gets the stored SSO OIDC ID token for the user who made the current
   * request. Use this method when you need the user's email claim. Only
   * works for that same user (the service-role client must act on behalf
   * of this user); fails for any other user ID. The stored token is
   * returned as-is and is never refreshed, so the call fails if the token
   * has already expired.
   * @param userId - The ID of the user who made the current request,
   * such as the `id` returned by `base44.auth.me()`.
   * @returns Promise resolving to the raw ID token string.
   */
  getIdToken(userId: string): Promise<string>;
}
```
