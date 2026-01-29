# Creating Entities

Base44 entities are defined locally in your project and then pushed to the Base44 backend.

## Critical: File Naming

Entity files MUST use kebab-case naming: `{kebab-case-name}.jsonc`

| Entity Name | File Name |
|-------------|-----------|
| `Task` | `task.jsonc` |
| `TeamMember` | `team-member.jsonc` |
| `ActivityLog` | `activity-log.jsonc` |

WRONG: `TeamMember.jsonc`, `teamMember.jsonc`
RIGHT: `team-member.jsonc`

## Table of Contents

- [Creating Entities](#creating-entities)
  - [Entity Directory](#entity-directory)
  - [How to Create an Entity](#how-to-create-an-entity)
  - [Entity Schema Structure](#entity-schema-structure)
  - [Supported Field Types](#supported-field-types)
  - [Field Properties](#field-properties)
  - [Complete Example](#complete-example)
  - [Naming Conventions](#naming-conventions)
  - [Relationships Between Entities](#relationships-between-entities)
  - [Row Level Security (RLS)](#row-level-security-rls)
  - [Field Level Security (FLS)](#field-level-security-fls)
  - [Pushing Entities](#pushing-entities)

## Entity Directory

All entity definitions must be placed in the `base44/entities/` folder in your project root. Each entity is defined in its own `.jsonc` file.

Example structure:
```
my-app/
  base44/
    entities/
      user.jsonc
      product.jsonc
      order.jsonc
```

## How to Create an Entity

1. Create a new `.jsonc` file in the `base44/entities/` directory
2. Define your entity schema following the structure below
3. Push the changes to Base44 using the CLI

## Entity Schema Structure

Each entity file follows a JSON Schema-like structure:

```jsonc
{
  "name": "EntityName",       // PascalCase entity name
  "type": "object",           // Always "object"
  "properties": {
    // Define your fields here
  },
  "required": ["field1"]      // Array of required field names
}
```

## Supported Field Types

### String

Basic text field:
```jsonc
{
  "title": {
    "type": "string",
    "description": "Task title"
  }
}
```

With format:
```jsonc
{
  "due_date": {
    "type": "string",
    "format": "date",
    "description": "Due date"
  }
}
```

Available formats: `date`, `date-time`, `email`, `uri`, `richtext`

### String with Enum

Constrained to specific values:
```jsonc
{
  "status": {
    "type": "string",
    "enum": ["todo", "in_progress", "done"],
    "default": "todo",
    "description": "Current status"
  }
}
```

### Number

```jsonc
{
  "position": {
    "type": "number",
    "description": "Position for ordering"
  }
}
```

### Boolean

```jsonc
{
  "notify_on_change": {
    "type": "boolean",
    "default": true,
    "description": "Enable notifications"
  }
}
```

### Array of Strings

```jsonc
{
  "labels": {
    "type": "array",
    "items": { "type": "string" },
    "description": "Task labels/tags"
  }
}
```

### Array of Objects

```jsonc
{
  "attachments": {
    "type": "array",
    "description": "File attachments",
    "items": {
      "type": "object",
      "properties": {
        "name": { "type": "string" },
        "url": { "type": "string" },
        "type": { "type": "string" }
      }
    }
  }
}
```

## Field Properties

| Property      | Description                                                  |
| ------------- | ------------------------------------------------------------ |
| `type`        | Data type: `string`, `number`, `boolean`, `array`, `object`  |
| `description` | Human-readable description of the field                      |
| `enum`        | Array of allowed values (for strings)                        |
| `default`     | Default value when not provided                              |
| `format`      | Format hint: `date`, `date-time`, `email`, `uri`, `richtext` |
| `items`       | Schema for array items                                       |
| `properties`  | Nested properties for object types                           |

## Complete Example

Here's a complete entity definition for a Task:

```jsonc
{
  "name": "Task",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Task title"
    },
    "description": {
      "type": "string",
      "description": "Task description"
    },
    "status": {
      "type": "string",
      "enum": ["todo", "in_progress", "done"],
      "default": "todo",
      "description": "Current status of the task"
    },
    "board_id": {
      "type": "string",
      "description": "Board this task belongs to"
    },
    "assignee_email": {
      "type": "string",
      "description": "Email of assigned user"
    },
    "priority": {
      "type": "string",
      "enum": ["low", "medium", "high"],
      "default": "medium",
      "description": "Task priority"
    },
    "due_date": {
      "type": "string",
      "format": "date",
      "description": "Due date"
    },
    "labels": {
      "type": "array",
      "items": { "type": "string" },
      "description": "Task labels/tags"
    }
  },
  "required": ["title"]
}
```

## Naming Conventions

- **Entity name**: Use PascalCase (e.g., `Task`, `TeamMember`, `ActivityLog`)
- **File name**: Use kebab-case matching the entity (e.g., `task.jsonc`, `team-member.jsonc`, `activity-log.jsonc`)
- **Field names**: Use snake_case (e.g., `board_id`, `user_email`, `due_date`)

## Relationships Between Entities

To create relationships between entities, use ID reference fields:

```jsonc
{
  "board_id": {
    "type": "string",
    "description": "Board this task belongs to"
  },
  "team_id": {
    "type": "string",
    "description": "Associated team ID"
  }
}
```

## Row Level Security (RLS)

Row Level Security (RLS) controls which records users can access based on their identity and attributes. RLS rules are defined per entity inside the `rls` field of the schema.

**Important:** If no RLS is defined, all records are accessible to all users.

### RLS Operations

RLS supports four operations:

| Operation | Description |
|-----------|-------------|
| `create` | Control who can add new records |
| `read` | Control who can view records |
| `update` | Control who can modify records |
| `delete` | Control who can remove records |

### Permission Values

Each operation accepts one of the following values:

1. **`true`** - Allow all users (including anonymous/unauthenticated)
2. **`false`** - Block all users
3. **Condition object** - Allow users matching the condition

### Template Variables

Use template variables to reference the current user's attributes:

| Template | Description |
|----------|-------------|
| `{{user.id}}` | The user's ID |
| `{{user.email}}` | The user's email |
| `{{user.role}}` | The user's role |
| `{{user.data.field_name}}` | Custom field from the user's `data` object |

### Built-in Entity Attributes

Every entity record has these built-in attributes available for RLS rules:

| Attribute | Description |
|-----------|-------------|
| `id` | Unique record identifier |
| `created_date` | Timestamp when record was created |
| `updated_date` | Timestamp when record was last updated |
| `created_by` | Email of the user who created the record |

### Rule Types

There are two condition types you can use:

**1. Entity-to-user comparison** - Compare record fields to the current user's values:
```jsonc
{
  "created_by": "{{user.email}}"
}
```

**2. User condition check** - Check user properties directly using `user_condition`:
```jsonc
{
  "user_condition": { "role": "admin" }
}
```

**Important limitations:**
- Only **simple equality** is supported (no operators like `$ne`, `$gt`, `$in`, etc.)
- MongoDB-style operators (`$and`, `$or`, `$in`, `$nin`, `$ne`) are **NOT supported** in JSON schema RLS
- You cannot filter by entity field values directly (e.g., `{"status": "published"}`)
- Only user-related conditions are allowed

### RLS Examples

**Owner-only access:**
```jsonc
{
  "created_by": "{{user.email}}"
}
```

**Department-based access:**
```jsonc
{
  "data.department": "{{user.data.department}}"
}
```

**Admin-only access:**
```jsonc
{
  "user_condition": { "role": "admin" }
}
```

**Complete RLS configuration:**
```jsonc
{
  "name": "Task",
  "type": "object",
  "properties": {
    "title": {
      "type": "string",
      "description": "Task title"
    },
    "status": {
      "type": "string",
      "enum": ["todo", "in_progress", "done"],
      "default": "todo"
    }
  },
  "required": ["title"],
  "rls": {
    "create": true,
    "read": { "created_by": "{{user.email}}" },
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}
```

### Common RLS Patterns

**Public create, admin-only management (e.g., contact forms, waitlists):**
```jsonc
{
  "rls": {
    "create": true,
    "read": { "user_condition": { "role": "admin" } },
    "update": { "user_condition": { "role": "admin" } },
    "delete": { "user_condition": { "role": "admin" } }
  }
}
```

**Owner-only access:**
```jsonc
{
  "rls": {
    "create": true,
    "read": { "created_by": "{{user.email}}" },
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}
```

**Logged-in users only:**
```jsonc
{
  "rls": {
    "create": { "user_condition": { "id": "{{user.id}}" } },
    "read": true,
    "update": { "created_by": "{{user.email}}" },
    "delete": { "created_by": "{{user.email}}" }
  }
}
```

### Limitations

- **No MongoDB operators:** `$and`, `$or`, `$in`, `$nin`, `$ne`, `$gt`, `$lt`, `$regex`, `$expr`, `$where` are NOT supported
- **No entity field filtering:** Cannot filter by entity field values (e.g., `{"status": "published"}`)
- **Simple equality only:** `user_condition` only supports exact match (e.g., `{ "role": "admin" }`)
- **Single condition per operation:** Each operation can only have one condition (no combining multiple rules)
- **No deeply nested templates:** Templates like `{{user.data.profile.department}}` may not work

### Complex Access Patterns

For complex access patterns that require multiple conditions (e.g., "owner OR admin"), you have two options:

1. **Use the Base44 Dashboard UI** - The dashboard allows adding multiple rules per operation with OR logic
2. **Use separate entities** - Split data into multiple entities with different access rules
3. **Use backend functions** - Implement custom access logic in backend functions

## Field Level Security (FLS)

**Note:** Field Level Security (FLS) is **NOT currently available** in Base44. You can only set security rules for entire entities (rows/records), not for individual fields within those records.

If you need different access levels for different fields, the recommended approach is to split your data into separate entities:
- Public data in one entity (with `read: true`)
- Protected data in another entity (with appropriate RLS rules)

## Pushing Entities

The `entities push` command will push all entities that exist in the `base44/entities` folder.

```bash
npx base44 entities push
```

For more details on the push command, see [entities-push.md](entities-push.md).
