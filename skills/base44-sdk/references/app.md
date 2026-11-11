# App Module

Read an app's own public configuration — currently just its [visibility](/Setting-up-your-app/Managing-access#setting-your-app-visibility).

- **`base44.app`** — Available in any authentication mode (anonymous, user, or service role). The client sends its token, if it has one, with the request.

## Contents
- [Methods](#methods)
- [Type Definitions](#type-definitions)

---

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getPublicSettings()` | `Promise<AppPublicSettingsResponse>` | Retrieves the app's ID and visibility |

### `getPublicSettings()`

Retrieves the app's public settings. Use it to determine whether the current visitor can access the app, and to decide whether to redirect them to the login page.

**Returns:** `Promise<AppPublicSettingsResponse>` — `{ id, public_settings }`, where `public_settings` is the app's visibility (see [Type Definitions](#type-definitions)).

**Throws:** rejects with a `Base44Error` with `status: 403` when the visitor can't access the app. Check `error.data.extra_data.reason`:
- `auth_required` — the visitor must sign in.
- `user_not_registered` — the visitor is signed in but doesn't have access.

**Example:**

```javascript
// Redirect a visitor who isn't signed in
try {
  const { public_settings } = await base44.app.getPublicSettings();
  console.log("App visibility:", public_settings);
} catch (error) {
  if (error.status === 403 && error.data?.extra_data?.reason === "auth_required") {
    base44.auth.redirectToLogin("<URL to return to after login>");
  }
}
```

---

## Notes

- **Frontend and backend**: `app` works in any authentication mode — anonymous, user, or service role (`base44.app` is the same in all of them; there's no separate `asServiceRole.app`).
- If the app requires login, use `redirectToLogin()` from the [auth module](auth.md) to send the visitor to the login page.

---

## Type Definitions

```typescript
/**
 * The app's visibility. Supported values:
 * - `private_with_login`: Private — only invited users.
 * - `workspace_with_login`: Workspace — users in your Base44 workspace.
 * - `public_with_login`: Public (login required) — visitors must log in.
 * - `public_without_login`: Public (no login) — anyone.
 *
 * If your workspace enforces SSO for apps, apps set to `public_without_login` also require sign-in.
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
  getPublicSettings(): Promise<AppPublicSettingsResponse>;
}
```
