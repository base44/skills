# RLS Examples

Practical Row-Level Security patterns for common application types.

**Important:** Base44 RLS in JSON schema format only supports simple conditions. MongoDB-style operators (`$or`, `$and`, `$in`, etc.) are **NOT supported**. For complex access patterns, use the Base44 Dashboard UI or implement logic in backend functions.

## Contents
- [Simple Patterns (JSON Schema)](#simple-patterns-json-schema)
- [Complex Patterns (Dashboard UI or Backend)](#complex-patterns-dashboard-ui-or-backend)
- [Best Practices](#best-practices)

---

## Simple Patterns (JSON Schema)

These patterns work with the JSON schema RLS format.

### Todo App - Owner-only access

Users see and manage only their own tasks.

```jsonc
{
  "name": "Task",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "description": { "type": "string" },
    "completed": { "type": "boolean" },
    "priority": { "type": "string", "enum": ["low", "medium", "high"] },
    "due_date": { "type": "string", "format": "date" }
  },
  "rls": {
    "create": true,
    "read": { "created_by": "{{user.email}}" },
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}
```

### Contact Form - Public create, admin-only read

Anyone can submit, only admins can view submissions.

```jsonc
{
  "name": "ContactSubmission",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "message": { "type": "string" }
  },
  "rls": {
    "create": true,
    "read": { "user_condition": { "role": "admin" } },
    "update": { "user_condition": { "role": "admin" } },
    "delete": { "user_condition": { "role": "admin" } }
  }
}
```

### User Profile - Self-management

Users can only access their own profile.

```jsonc
{
  "name": "UserProfile",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "avatar_url": { "type": "string" },
    "bio": { "type": "string" },
    "preferences": { "type": "object" }
  },
  "rls": {
    "create": true,
    "read": { "created_by": "{{user.email}}" },
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}
```

### Department Data - Same department access

Users can only see records from their department.

```jsonc
{
  "name": "DepartmentAnnouncement",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "content": { "type": "string" },
    "department": { "type": "string" }
  },
  "rls": {
    "create": { "user_condition": { "role": "manager" } },
    "read": { "data.department": "{{user.data.department}}" },
    "update": { "user_condition": { "role": "manager" } },
    "delete": { "user_condition": { "role": "admin" } }
  }
}
```

### Subscription - Admin-managed, user-readable via email field

```jsonc
{
  "name": "Subscription",
  "type": "object",
  "properties": {
    "user_email": { "type": "string" },
    "tier": { "type": "string", "enum": ["free", "basic", "pro", "enterprise"] },
    "credits": { "type": "number" },
    "renewal_date": { "type": "string", "format": "date" }
  },
  "rls": {
    "create": { "user_condition": { "role": "admin" } },
    "read": { "data.user_email": "{{user.email}}" },
    "update": { "user_condition": { "role": "admin" } },
    "delete": { "user_condition": { "role": "admin" } }
  }
}
```

**Note:** This pattern only allows users to read their own subscription. Admins need to use the Dashboard UI to configure additional read access for themselves.

### Private Data - Owner-only

```jsonc
{
  "name": "PrivateNotes",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "content": { "type": "string" },
    "tags": { "type": "array", "items": { "type": "string" } }
  },
  "rls": {
    "create": true,
    "read": { "created_by": "{{user.email}}" },
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}
```

### Public Read, Authenticated Write

Anyone can read, only logged-in users can create/edit their own records.

```jsonc
{
  "name": "BlogPost",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "content": { "type": "string" },
    "author_email": { "type": "string" }
  },
  "rls": {
    "create": true,
    "read": true,
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}
```

---

## Complex Patterns (Dashboard UI or Backend)

These patterns require multiple conditions and **cannot be implemented in JSON schema**. Use the Base44 Dashboard UI or backend functions instead.

### Owner OR Admin access

**Requirement:** Users can access their own records, OR admins can access all records.

**JSON Schema limitation:** Cannot combine conditions with OR logic.

**Solution options:**
1. **Dashboard UI:** Add two rules to the read operation - one for "Creator only" and one for "User property check" with role = admin
2. **Backend function:** Implement custom access logic that checks both conditions

### Bidirectional Relationships (e.g., Friendships, Matches)

**Requirement:** Either party in a relationship should have access.

**JSON Schema limitation:** Cannot check if user matches field A OR field B.

**Solution options:**
1. **Dashboard UI:** Add multiple rules matching different fields
2. **Backend function:** Query with custom logic
3. **Entity redesign:** Store two records per relationship (one for each party)

### Multi-role Access

**Requirement:** Multiple roles (hr, admin, manager) should have access.

**JSON Schema limitation:** Cannot specify multiple roles.

**Solution options:**
1. **Dashboard UI:** Add separate rules for each role
2. **Backend function:** Check if user role is in allowed list

### Conditional Field-based Access

**Requirement:** Access depends on entity field value (e.g., `is_public: true`).

**JSON Schema limitation:** Cannot filter by entity field values, only user-related conditions.

**Solution options:**
1. **Separate entities:** Create PublicPosts and PrivatePosts entities
2. **Backend function:** Filter based on field values

---

## Best Practices

### Entity Separation Strategy

Since RLS has limitations, split data strategically:

| Data Type | Entity | RLS Pattern |
|-----------|--------|-------------|
| User-editable | UserProfile | Owner-only |
| Billing/subscription | Subscription | Admin-managed |
| Public content | PublicPost | Read: true |
| Private content | PrivateNote | Owner-only |

### When to Use Each Approach

| Requirement | Approach |
|-------------|----------|
| Single condition (owner, admin, department) | JSON Schema RLS |
| Multiple OR conditions | Dashboard UI |
| Complex business logic | Backend functions |
| Field-value filtering | Backend functions |

### Common Role Patterns

| Role | Typical Access |
|------|----------------|
| `admin` | Full access to all records |
| `moderator` | Read/update access, limited delete |
| `manager` | Department-scoped access |
| `user` | Own records only |

### Limitations Summary

| Not Supported | Alternative |
|---------------|-------------|
| `$or`, `$and` operators | Dashboard UI rules |
| `$in`, `$nin` operators | Backend functions |
| `$ne`, `$gt`, `$lt` operators | Backend functions |
| Entity field filtering | Separate entities or backend |
| Cross-entity relationships | Backend functions |
| Field-level security | Separate entities |
