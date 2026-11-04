# Users Module

Invite users to the app via `base44.users`.

## Contents
- [Methods](#methods)
- [Examples](#examples) (Invite User)
- [Roles](#roles)
- [Notes](#notes)

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `inviteUser(user_email, role)` | `Promise<any>` | Invite a user to the app |

## Examples

### Invite User

```javascript
// Invite a user with "user" role
await base44.users.inviteUser("newuser@example.com", "user");

// Invite an admin
await base44.users.inviteUser("admin@example.com", "admin");
```

### Invite Multiple Users

```javascript
const usersToInvite = [
  { email: "user1@example.com", role: "user" },
  { email: "user2@example.com", role: "user" },
  { email: "manager@example.com", role: "admin" }
];

for (const user of usersToInvite) {
  await base44.users.inviteUser(user.email, user.role);
  console.log(`Invited ${user.email} as ${user.role}`);
}
```

## Roles

The `role` parameter must be one of:

| Role | Description |
|------|-------------|
| `"user"` | Standard user with default permissions |
| `"admin"` | Administrator with elevated permissions |

**Note:** Only `"user"` and `"admin"` are valid role values. An error will be thrown if you pass any other value.

## Notes

- **Email invitation**: The invited user receives an email with a link to join the app
- **Duplicate handling**: Inviting an existing user will re-send the invitation
- **Also available in auth**: `base44.auth.inviteUser(userEmail, role)` sends the same kind of invitation, but is more permissive — its `role` parameter accepts any role string configured for the app, not just `"user"`/`"admin"`. Prefer `base44.users.inviteUser()` when you only need the two built-in roles, since it validates the role client-side.
- **Role validation**: `base44.users.inviteUser()` only accepts `"user"` or `"admin"`; passing anything else throws before a request is made

```javascript
// Equivalent for the two built-in roles:
await base44.users.inviteUser("newuser@example.com", "user");
await base44.auth.inviteUser("newuser@example.com", "user");

// Only base44.auth.inviteUser() supports custom app-defined roles:
await base44.auth.inviteUser("manager@example.com", "manager");
```

## Type Definitions

```typescript
/** Users module for inviting users to the app. */
interface UsersModule {
  /**
   * Invite a user to the application.
   * @param user_email - User's email address.
   * @param role - User's role ('user' or 'admin').
   * @returns Promise resolving when the invitation is sent.
   * @throws Error if role is not 'user' or 'admin'.
   */
  inviteUser(user_email: string, role: "user" | "admin"): Promise<any>;
}
```
