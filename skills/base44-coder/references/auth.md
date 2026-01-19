# Auth Module

User authentication, registration, and session management via `base44.auth`.

## Contents
- [Methods](#methods)
- [Examples](#examples) (Register, Login, Get User, Update, Logout, Protected Routes)
- [Auth Providers](#auth-providers)
- [App Visibility](#app-visibility)
- [Limitations](#limitations)

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `register(params)` | `Promise<any>` | Create new user account |
| `loginViaEmailPassword(email, password, turnstileToken?)` | `Promise<any>` | Authenticate user |
| `me()` | `Promise<User \| null>` | Get current user |
| `updateMe(data)` | `Promise<any>` | Update current user's profile |
| `logout(redirectUrl?)` | `void` | Clear session, optionally redirect |
| `redirectToLogin(nextUrl)` | `void` | Redirect to hosted login page |
| `isAuthenticated()` | `boolean` | Check if user is logged in |

## Examples

### Register New User

```javascript
await base44.auth.register({
  email: "user@example.com",
  password: "securePassword123",
  referral_code: "OPTIONAL_CODE",    // optional
  turnstile_token: "CAPTCHA_TOKEN"   // optional, for bot protection
});
```

### Login

```javascript
await base44.auth.loginViaEmailPassword(
  "user@example.com",
  "password123",
  turnstileToken  // optional
);

// After login, JWT is automatically stored for subsequent requests
```

### Get Current User

```javascript
const user = await base44.auth.me();

if (user) {
  console.log(user.email, user.full_name);
} else {
  // Not authenticated
}
```

### Update User Profile

```javascript
await base44.auth.updateMe({
  full_name: "John Doe",
  // other custom profile fields
});
```

### Logout

```javascript
// Simple logout
base44.auth.logout();

// Logout and redirect
base44.auth.logout("/goodbye");
```

### Protected Route Pattern

```javascript
async function requireAuth() {
  const user = await base44.auth.me();
  if (!user) {
    // Redirect to login, return here after
    base44.auth.redirectToLogin(window.location.href);
    return null;
  }
  return user;
}

// Usage
const user = await requireAuth();
if (!user) return;
// Continue with authenticated logic
```

### Check Authentication Status

```javascript
if (base44.auth.isAuthenticated()) {
  // Show user dashboard
} else {
  // Show login button
}
```

## Auth Providers

Configure in app dashboard:
- Email/password (default)
- Google
- Microsoft
- Facebook
- SSO via Okta, Azure AD, GitHub (Elite plan)

## App Visibility

Set in app settings:
- **Public**: No login required for basic access
- **Private**: Login required for all content

## Limitations

- Cannot create fully custom login/signup UI - Base44 provides hosted auth pages
- `redirectToLogin()` shows both login and signup options
- No separate `redirectToSignup()` method
