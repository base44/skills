# App Module

Read the current app's own public configuration via `base44.app`.

Available with a client in any authentication mode (anonymous, user, or service role). The client sends its token, if it has one, with the request.

## Methods

| Method | Signature | Description |
|--------|-----------|--------------|
| `getPublicSettings()` | `Promise<AppPublicSettingsResponse>` | Get the app's ID and visibility setting |

Use this to read the app's visibility and decide whether the current visitor can access the app. If the app requires login, use `base44.auth.redirectToLogin()` to send the visitor to the login page.

`getPublicSettings()` rejects with a `Base44Error` that has `status: 403` when the visitor can't access the app. Check `error.data.extra_data.reason` to find the cause:

| Reason | Meaning |
|--------|---------|
| `auth_required` | The visitor must sign in |
| `user_not_registered` | The visitor is signed in but doesn't have access |

## Examples

### Redirect a visitor who isn't signed in

```javascript
try {
  const { public_settings } = await base44.app.getPublicSettings();
  console.log("App visibility:", public_settings);
} catch (error) {
  if (error.status === 403 && error.data?.extra_data?.reason === "auth_required") {
    base44.auth.redirectToLogin("<URL to return to after login>");
  }
}
```

### Check visibility before rendering

```javascript
const { public_settings } = await base44.app.getPublicSettings();

if (public_settings === "public_without_login") {
  // Anyone can see this app; render normally.
} else {
  // Visibility requires login or an invite; gate the UI accordingly.
}
```

## Use Cases

- Deciding whether to redirect an unauthenticated visitor to the login page
- Reading the app's visibility setting to branch UI logic before rendering
- Distinguishing "needs to sign in" from "signed in but not authorized" errors

## Type Definitions

```typescript
/**
 * The app's visibility. One of:
 * - `private_with_login`: Private — only invited users.
 * - `workspace_with_login`: Workspace — users in your Base44 workspace.
 * - `public_with_login`: Public (login required) — visitors must log in.
 * - `public_without_login`: Public (no login) — anyone. (Still requires sign-in if the workspace enforces SSO for apps.)
 * Can also be a custom string value.
 */
type AppPublicSettings =
  | "private_with_login"
  | "public_with_login"
  | "public_without_login"
  | "workspace_with_login"
  | string;

/** The app's public settings. */
interface AppPublicSettingsResponse {
  /** The app's ID. */
  id: string;
  /** The app's visibility. See AppPublicSettings. */
  public_settings: AppPublicSettings;
}

/** App module for reading an app's public settings. Available in any authentication mode. */
interface AppModule {
  /**
   * Retrieves the app's public settings.
   * Rejects with a Base44Error (status 403) when the visitor can't access the app —
   * check data.extra_data.reason for 'auth_required' or 'user_not_registered'.
   * @returns Promise resolving to the app's ID and visibility.
   */
  getPublicSettings(): Promise<AppPublicSettingsResponse>;
}
```
