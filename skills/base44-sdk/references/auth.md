# Auth Module

User authentication, registration, and session management via `base44.auth`.

## Contents
- [Methods](#methods)
- [Examples](#examples) (Register Flow, Login, Get User, Update, Logout, Protected Routes, OTP, Password Reset)
- [Auth Providers](#auth-providers)
- [App Visibility](#app-visibility)
- [Limitations](#limitations)

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `register(params)` | `Promise<any>` | Create new user account |
| `loginViaEmailPassword(email, password, turnstileToken?)` | `Promise<LoginResponse>` | Authenticate user |
| `me()` | `Promise<User \| null>` | Get current user |
| `updateMe(data)` | `Promise<User>` | Update current user's profile |
| `logout(redirectUrl?)` | `void` | Clear session, optionally redirect |
| `redirectToLogin(nextUrl)` | `void` | Redirect to hosted login page |
| `isAuthenticated()` | `Promise<boolean>` | Check if user is logged in |
| `setToken(token, saveToStorage?)` | `void` | Set authentication token |
| `inviteUser(email, role)` | `Promise<any>` | Invite a user to the app |
| `verifyOtp(params)` | `Promise<any>` | Verify OTP code |
| `resendOtp(email)` | `Promise<any>` | Resend OTP code to email |
| `resetPasswordRequest(email)` | `Promise<any>` | Request password reset email |
| `resetPassword(params)` | `Promise<any>` | Reset password with token |
| `changePassword(params)` | `Promise<any>` | Change user password |

## Examples

### Register New User (Full Flow)

Registration requires email verification before the user can log in. The complete flow is:

1. **Register** - Create the user account
2. **Verification email sent** - User receives an OTP code via email
3. **Verify OTP** - User enters the code to verify their email
4. **Login** - User can now log in with email/password

```javascript
// Step 1: Register the user
await base44.auth.register({
  email: "user@example.com",
  password: "securePassword123",
  referral_code: "OPTIONAL_CODE",    // optional
  turnstile_token: "CAPTCHA_TOKEN"   // optional, for bot protection
});
// A verification email with OTP code is automatically sent

// Step 2: User receives email with OTP code (e.g., "123456")

// Step 3: Verify the OTP code from the email
await base44.auth.verifyOtp({
  email: "user@example.com",
  otpCode: "123456"  // code from verification email
});

// Step 4: Now the user can log in
await base44.auth.loginViaEmailPassword(
  "user@example.com",
  "securePassword123"
);
```

> **Important**: Users cannot log in until they complete OTP verification. Attempting to call `loginViaEmailPassword` before verification will fail.

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
const isLoggedIn = await base44.auth.isAuthenticated();
if (isLoggedIn) {
  // Show user dashboard
} else {
  // Show login button
}
```

### Set Authentication Token

```javascript
// Set token and save to localStorage (default)
base44.auth.setToken("jwt-token-here");

// Set token without saving to localStorage
base44.auth.setToken("jwt-token-here", false);
```

### Invite User

```javascript
await base44.auth.inviteUser("newuser@example.com", "user");
// Sends invitation email to the user
```

### OTP Verification

OTP verification is required after registration (see [Register New User](#register-new-user-full-flow) for the complete flow).

```javascript
// Verify the OTP code sent to user's email
await base44.auth.verifyOtp({
  email: "user@example.com",
  otpCode: "123456"
});

// Resend OTP if the user didn't receive it or it expired
await base44.auth.resendOtp("user@example.com");
```

### Password Reset Flow

```javascript
// Step 1: Request password reset (sends email with reset token)
await base44.auth.resetPasswordRequest("user@example.com");

// Step 2: Reset password using token from email
await base44.auth.resetPassword({
  resetToken: "token-from-email",
  newPassword: "newSecurePassword123"
});
```

### Change Password

```javascript
// Change password for authenticated user
await base44.auth.changePassword({
  userId: "user-id-123",
  currentPassword: "oldPassword123",
  newPassword: "newSecurePassword456"
});
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
