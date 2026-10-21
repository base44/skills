# RLS Examples

Practical Row-Level Security patterns for common application types.

**Important:** Base44 RLS supports:
- **Logical operators:** `$or`, `$and`, `$nor` for combining conditions
- **Field operators (for `data.*` fields, and `created_by`/`created_by_id`):** `$eq`, `$ne`, `$in`, `$nin`, `$gt`, `$gte`, `$lt`, `$lte`, `$exists`, `$all`, `$size`, `$elemMatch`
- **user_condition:** Equality only (no operators)

**Local dev caveat:** `npx base44 dev`'s local RLS emulator only evaluates `$in`, `$nin`, `$ne`, `$all` — a rule using `$eq`, `$gt`, `$gte`, `$lt`, `$lte`, `$exists`, `$size`, or `$elemMatch` pushes and validates fine, but denies every record locally (the condition always evaluates to false). Test rules that use these operators against a deployed app, not `base44 dev`.

## Contents
- [Simple Patterns (JSON Schema)](#simple-patterns-json-schema)
- [Using Operators](#using-operators)
- [Field-Level Security Examples](#field-level-security-examples)
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

## Using Operators

### Logical Operators

Combine multiple conditions using `$or`, `$and`, or `$nor`:

**Owner OR Admin access:**
```jsonc
{
  "name": "Document",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "content": { "type": "string" }
  },
  "rls": {
    "create": true,
    "read": {
      "$or": [
        { "created_by": "{{user.email}}" },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "update": {
      "$or": [
        { "created_by": "{{user.email}}" },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "delete": { "user_condition": { "role": "admin" } }
  }
}
```

**Multiple roles with $or:**
```jsonc
{
  "rls": {
    "read": {
      "$or": [
        { "user_condition": { "role": "admin" } },
        { "user_condition": { "role": "manager" } },
        { "user_condition": { "role": "hr" } }
      ]
    }
  }
}
```

### Field Operators for data.* Fields

Use `$eq`, `$ne`, `$in`, `$nin`, `$gt`, `$gte`, `$lt`, `$lte`, `$exists`, `$all`, `$size`, `$elemMatch` for comparing entity data fields. `$gt`/`$gte`/`$lt`/`$lte`/`$exists`/`$size`/`$elemMatch` are schema-validated but **not evaluated by `npx base44 dev`'s local RLS emulator** (see the caveat above) — verify these against a deployed app:

**Access based on tags ($in):**
```jsonc
{
  "rls": {
    "read": {
      "data.category": { "$in": ["public", "shared"] }
    }
  }
}
```

**Exclude specific statuses ($nin):**
```jsonc
{
  "rls": {
    "read": {
      "data.status": { "$nin": ["archived", "deleted"] }
    }
  }
}
```

**Not equal ($ne):**
```jsonc
{
  "rls": {
    "read": {
      "data.visibility": { "$ne": "private" }
    }
  }
}
```

**All tags must match ($all):**
```jsonc
{
  "rls": {
    "read": {
      "data.required_tags": { "$all": ["approved", "reviewed"] }
    }
  }
}
```

**Numeric/date comparison ($gt, $gte, $lt, $lte) — verify against a deployed app, not `base44 dev`:**
```jsonc
{
  "rls": {
    "read": {
      "data.priority_score": { "$gte": 50 }
    }
  }
}
```

**Field is present ($exists) — verify against a deployed app, not `base44 dev`:**
```jsonc
{
  "rls": {
    "read": {
      "data.archived_at": { "$exists": false }
    }
  }
}
```

### Combining Logical and Field Operators

```jsonc
{
  "rls": {
    "read": {
      "$and": [
        { "data.status": { "$ne": "draft" } },
        {
          "$or": [
            { "created_by": "{{user.email}}" },
            { "data.visibility": "public" }
          ]
        }
      ]
    }
  }
}
```

---

## Field-Level Security Examples

Control access to specific fields within an entity.

### Sensitive Salary Field

```jsonc
{
  "name": "Employee",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "email": { "type": "string", "format": "email" },
    "salary": {
      "type": "number",
      "description": "Annual salary",
      "rls": {
        "read": { "user_condition": { "role": "hr" } },
        "write": { "user_condition": { "role": "hr" } }
      }
    },
    "performance_notes": {
      "type": "string",
      "description": "Manager notes",
      "rls": {
        "read": {
          "$or": [
            { "user_condition": { "role": "manager" } },
            { "user_condition": { "role": "hr" } }
          ]
        },
        "write": { "user_condition": { "role": "manager" } }
      }
    }
  }
}
```

### Admin-Only Internal Fields

```jsonc
{
  "name": "Order",
  "type": "object",
  "properties": {
    "order_number": { "type": "string" },
    "total": { "type": "number" },
    "internal_notes": {
      "type": "string",
      "description": "Internal processing notes",
      "rls": {
        "read": { "user_condition": { "role": "admin" } },
        "write": { "user_condition": { "role": "admin" } }
      }
    },
    "profit_margin": {
      "type": "number",
      "description": "Profit margin percentage",
      "rls": {
        "read": { "user_condition": { "role": "admin" } },
        "write": false
      }
    }
  }
}
```

---

## Complex Patterns (Dashboard UI or Backend)

Some patterns may still require the Dashboard UI or backend functions.

### Bidirectional Relationships (e.g., Friendships, Matches)

**Requirement:** Either party in a relationship should have access.

**Now possible with $or:**
```jsonc
{
  "rls": {
    "read": {
      "$or": [
        { "data.user_a_email": "{{user.email}}" },
        { "data.user_b_email": "{{user.email}}" }
      ]
    }
  }
}
```

**Alternative solutions:**
1. **Entity redesign:** Store two records per relationship (one for each party)
2. **Backend function:** Query with custom logic

### Complex Business Logic

**Requirement:** Access depends on multiple entity fields with complex conditions.

**JSON Schema limitation:** While operators help, very complex business logic may still be hard to express.

**Solution options:**
1. **Backend function:** Implement custom access logic
2. **Combine simpler rules:** Break complex rules into simpler entity-level and field-level rules

---

## Best Practices

### Security Strategy

Use a combination of entity-level RLS and field-level security:

| Data Type | Approach | Example |
|-----------|----------|---------|
| User-editable | Entity RLS: Owner-only | UserProfile with `created_by` check |
| Sensitive fields | Field-level RLS | Salary field with HR role check |
| Multi-role access | `$or` with user_condition | Admin OR Manager access |
| Conditional access | Field operators | `$in`, `$ne` on data fields |
| Public content | Entity RLS: `read: true` | PublicPost |
| Private content | Entity RLS: Owner-only | PrivateNote |

### When to Use Each Approach

| Requirement | Approach |
|-------------|----------|
| Single condition (owner, admin, department) | JSON Schema RLS |
| Multiple OR/AND conditions | JSON Schema RLS with `$or`/`$and` |
| Field value checks with `$in`/`$ne`/etc. | JSON Schema RLS for `data.*` fields |
| Field-level access control | JSON Schema FLS (field-level `rls`) |
| Comparison operators (`$gt`, `$lt`, `$gte`, `$lte`) | JSON Schema RLS — schema-validated, but not emulated by `base44 dev`; test against a deployed app |
| Very complex business logic | Backend functions |

### Common Role Patterns

| Role | Typical Access |
|------|----------------|
| `admin` | Full access to all records |
| `moderator` | Read/update access, limited delete |
| `manager` | Department-scoped access |
| `user` | Own records only |

### Supported Operators Summary

| Operator | Supported | Notes |
|----------|-----------|-------|
| `$or` | Yes | Combine multiple conditions |
| `$and` | Yes | All conditions must match |
| `$nor` | Yes | None of the conditions match |
| `$eq` | Yes | For `data.*`/`created_by`/`created_by_id` fields |
| `$in` | Yes | For `data.*`/`created_by`/`created_by_id` fields |
| `$nin` | Yes | For `data.*`/`created_by`/`created_by_id` fields |
| `$ne` | Yes | For `data.*`/`created_by`/`created_by_id` fields |
| `$all` | Yes | For `data.*`/`created_by`/`created_by_id` fields |
| `$gt`, `$lt`, `$gte`, `$lte` | Yes | Not emulated by `base44 dev` — verify against a deployed app |
| `$exists` | Yes | Not emulated by `base44 dev` — verify against a deployed app |
| `$size` | Yes | Not emulated by `base44 dev` — verify against a deployed app |
| `$elemMatch` | Yes | Not emulated by `base44 dev` — verify against a deployed app |
| `$regex` | No | Use backend functions |

### Limitations Summary

| Not Supported | Alternative |
|---------------|-------------|
| Operators on `user_condition` | Use equality only for user checks |
| Regex matching (`$regex`) | Backend functions |
| Cross-entity relationships | Backend functions |
