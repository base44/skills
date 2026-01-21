# RLS Real-World Examples

Practical Row-Level Security patterns for common application types.

## Contents
- [Todo App](#todo-app)
- [Subscription System](#subscription-system)
- [Social App](#social-app)
- [Dating App](#dating-app)
- [Enterprise System](#enterprise-system)
- [Mini Social Network](#mini-social-network)
- [Best Practices](#best-practices)

---

## Todo App

Simple ownership - users see and manage only their own tasks.

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

---

## Subscription System

Separate user-editable data from protected billing data. Since there's no field-level permissions for different access levels, use separate entities.

### User Profile (user can edit)
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

### Subscription (user can read, only admin can modify)
```jsonc
{
  "name": "Subscription",
  "type": "object",
  "properties": {
    "user_email": { "type": "string" },
    "tier": { "type": "string", "enum": ["free", "basic", "pro", "enterprise"] },
    "credits": { "type": "number" },
    "credits_used": { "type": "number" },
    "renewal_date": { "type": "string", "format": "date" }
  },
  "rls": {
    "create": { "user_condition": { "role": "admin" } },
    "read": {
      "$or": [
        { "data.user_email": "{{user.email}}" },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "update": { "user_condition": { "role": "admin" } },
    "delete": { "user_condition": { "role": "admin" } }
  }
}
```

---

## Social App

Public profiles visible to all, private data owner-only.

### Public Profile
```jsonc
{
  "name": "PublicProfile",
  "type": "object",
  "properties": {
    "username": { "type": "string" },
    "display_name": { "type": "string" },
    "bio": { "type": "string" },
    "avatar_url": { "type": "string" },
    "is_public": { "type": "boolean" },
    "follower_count": { "type": "number" }
  },
  "rls": {
    "create": true,
    "read": {
      "$or": [
        { "data.is_public": true },
        { "created_by": "{{user.email}}" },
        { "user_condition": { "role": "moderator" } }
      ]
    },
    "update": {
      "$or": [
        { "created_by": "{{user.email}}" },
        { "user_condition": { "role": "moderator" } }
      ]
    },
    "delete": {
      "$or": [
        { "created_by": "{{user.email}}" },
        { "user_condition": { "role": "moderator" } }
      ]
    }
  }
}
```

### Private Profile Data
```jsonc
{
  "name": "PrivateProfileData",
  "type": "object",
  "properties": {
    "phone": { "type": "string" },
    "email": { "type": "string" },
    "date_of_birth": { "type": "string", "format": "date" },
    "location": { "type": "string" }
  },
  "rls": {
    "create": true,
    "read": { "created_by": "{{user.email}}" },
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}
```

### Friendship (bidirectional access)
```jsonc
{
  "name": "Friendship",
  "type": "object",
  "properties": {
    "requester_email": { "type": "string" },
    "recipient_email": { "type": "string" },
    "status": { "type": "string", "enum": ["pending", "accepted", "blocked"] }
  },
  "rls": {
    "create": true,
    "read": {
      "$or": [
        { "data.requester_email": "{{user.email}}" },
        { "data.recipient_email": "{{user.email}}" }
      ]
    },
    "update": {
      "$or": [
        { "data.requester_email": "{{user.email}}" },
        { "data.recipient_email": "{{user.email}}" }
      ]
    },
    "delete": {
      "$or": [
        { "data.requester_email": "{{user.email}}" },
        { "data.recipient_email": "{{user.email}}" }
      ]
    }
  }
}
```

---

## Dating App

Profiles visible to active users, contact info protected.

### Dating Profile
```jsonc
{
  "name": "DatingProfile",
  "type": "object",
  "properties": {
    "display_name": { "type": "string" },
    "age": { "type": "number" },
    "bio": { "type": "string" },
    "photos": { "type": "array", "items": { "type": "string" } },
    "interests": { "type": "array", "items": { "type": "string" } },
    "is_active": { "type": "boolean" }
  },
  "rls": {
    "create": true,
    "read": {
      "$or": [
        { "created_by": "{{user.email}}" },
        { "data.is_active": true },
        { "user_condition": { "role": "moderator" } }
      ]
    },
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}
```

### Match (both users can access)
```jsonc
{
  "name": "Match",
  "type": "object",
  "properties": {
    "user1_email": { "type": "string" },
    "user2_email": { "type": "string" },
    "user1_liked": { "type": "boolean" },
    "user2_liked": { "type": "boolean" },
    "matched_at": { "type": "string", "format": "date-time" }
  },
  "rls": {
    "create": true,
    "read": {
      "$or": [
        { "data.user1_email": "{{user.email}}" },
        { "data.user2_email": "{{user.email}}" }
      ]
    },
    "update": {
      "$or": [
        { "data.user1_email": "{{user.email}}" },
        { "data.user2_email": "{{user.email}}" }
      ]
    },
    "delete": {
      "$or": [
        { "data.user1_email": "{{user.email}}" },
        { "data.user2_email": "{{user.email}}" }
      ]
    }
  }
}
```

---

## Enterprise System

Role and department-based access with admin overrides.

### Employee
```jsonc
{
  "name": "Employee",
  "type": "object",
  "properties": {
    "employee_id": { "type": "string" },
    "email": { "type": "string" },
    "department": { "type": "string" },
    "position": { "type": "string" },
    "manager_email": { "type": "string" }
  },
  "rls": {
    "create": {
      "$or": [
        { "user_condition": { "role": "hr" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "read": {
      "$or": [
        { "data.email": "{{user.email}}" },
        { "data.department": "{{user.data.department}}" },
        { "user_condition": { "role": "hr" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "update": {
      "$or": [
        { "user_condition": { "role": "hr" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "delete": {
      "$or": [
        { "user_condition": { "role": "hr" } },
        { "user_condition": { "role": "admin" } }
      ]
    }
  }
}
```

### Department Document
```jsonc
{
  "name": "DepartmentDocument",
  "type": "object",
  "properties": {
    "title": { "type": "string" },
    "content": { "type": "string" },
    "department": { "type": "string" },
    "classification": { "type": "string", "enum": ["public", "internal", "confidential"] }
  },
  "rls": {
    "create": {
      "$or": [
        { "user_condition": { "role": "manager" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "read": {
      "$or": [
        {
          "$and": [
            { "data.department": "{{user.data.department}}" },
            { "data.classification": "public" }
          ]
        },
        {
          "$and": [
            { "data.department": "{{user.data.department}}" },
            { "user_condition": { "role": { "$in": ["manager", "admin"] } } }
          ]
        },
        { "created_by": "{{user.email}}" },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "update": {
      "$or": [
        {
          "$and": [
            { "data.department": "{{user.data.department}}" },
            { "user_condition": { "role": "manager" } }
          ]
        },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "delete": { "user_condition": { "role": "admin" } }
  }
}
```

### Salary Info (highly restricted)
```jsonc
{
  "name": "SalaryInfo",
  "type": "object",
  "properties": {
    "employee_email": { "type": "string" },
    "base_salary": { "type": "number" },
    "bonus": { "type": "number" }
  },
  "rls": {
    "create": {
      "$or": [
        { "user_condition": { "role": "hr" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "read": {
      "$or": [
        { "data.employee_email": "{{user.email}}" },
        { "user_condition": { "role": "hr" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "update": {
      "$or": [
        { "user_condition": { "role": "hr" } },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "delete": { "user_condition": { "role": "admin" } }
  }
}
```

---

## Mini Social Network

Groups with different visibility levels and membership.

### Group
```jsonc
{
  "name": "Group",
  "type": "object",
  "properties": {
    "name": { "type": "string" },
    "description": { "type": "string" },
    "visibility": { "type": "string", "enum": ["public", "private", "secret"] },
    "owner_email": { "type": "string" }
  },
  "rls": {
    "create": true,
    "read": {
      "$or": [
        { "data.visibility": "public" },
        { "data.owner_email": "{{user.email}}" },
        { "user_condition": { "role": "moderator" } }
      ]
    },
    "update": {
      "$or": [
        { "data.owner_email": "{{user.email}}" },
        { "user_condition": { "role": "moderator" } }
      ]
    },
    "delete": {
      "$or": [
        { "data.owner_email": "{{user.email}}" },
        { "user_condition": { "role": "admin" } }
      ]
    }
  }
}
```

### Group Membership
```jsonc
{
  "name": "GroupMembership",
  "type": "object",
  "properties": {
    "group_id": { "type": "string" },
    "member_email": { "type": "string" },
    "role": { "type": "string", "enum": ["member", "moderator", "admin"] }
  },
  "rls": {
    "create": true,
    "read": {
      "$or": [
        { "data.member_email": "{{user.email}}" },
        { "user_condition": { "role": "admin" } }
      ]
    },
    "update": { "user_condition": { "role": "admin" } },
    "delete": {
      "$or": [
        { "data.member_email": "{{user.email}}" },
        { "user_condition": { "role": "admin" } }
      ]
    }
  }
}
```

---

## Best Practices

### Entity Separation
Since there's no field-level permissions for different access levels, split sensitive data into separate entities:
- User-editable data in one entity
- Protected data (subscriptions, billing) in admin-only entities

### Read vs Update Asymmetry
Users can often read but not modify certain data:
- Users read their subscription info but only admins modify it
- Users see department documents but only managers update them

### Ownership Patterns
- Use `created_by` for simple ownership
- Use email fields (`user_email`, `owner_email`) for explicit ownership
- Use array fields with `$in` for multi-user access

### Role-Based Access
- Use `user_condition` for role checks
- Common roles: `admin`, `moderator`, `hr`, `manager`
- Combine role checks with data field checks for nuanced access

### Limitations
- Cannot check relationships across entities (e.g., friendship status)
- Cannot have different permissions for different fields in same entity
- Complex access patterns may require backend functions
