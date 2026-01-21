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
  - [Table of Contents](#table-of-contents)
  - [Entity Directory](#entity-directory)
  - [How to Create an Entity](#how-to-create-an-entity)
  - [Entity Schema Structure](#entity-schema-structure)
  - [Supported Field Types](#supported-field-types)
    - [String](#string)
    - [String with Enum](#string-with-enum)
    - [Number](#number)
    - [Boolean](#boolean)
    - [Array of Strings](#array-of-strings)
    - [Array of Objects](#array-of-objects)
  - [Field Properties](#field-properties)
  - [Complete Example](#complete-example)
  - [Naming Conventions](#naming-conventions)
  - [Relationships Between Entities](#relationships-between-entities)
  - [Row Level Security (RLS)](#row-level-security-rls)
    - [RLS Operations](#rls-operations)
    - [Template Fields](#template-fields)
    - [Built-in Entity Attributes](#built-in-entity-attributes)
    - [Rule Types](#rule-types)
    - [RLS Examples](#rls-examples)
    - [Common RLS Patterns](#common-rls-patterns)
    - [Limitations](#limitations)
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

Row Level Security (RLS) rules are MongoDB-style queries that filter access based on the user's identity and attributes. RLS rules are defined per entity inside the `rls` field of the schema.

**Important:** If no RLS is defined, all records are accessible to all users.

For real-world examples (todo apps, subscription systems, social apps, enterprise systems), see [rls-examples.md](rls-examples.md).

### RLS Operations

RLS supports four operations:

| Operation | Description |
|-----------|-------------|
| `create` | Control who can create new records |
| `read` | Control who can view records |
| `update` | Control who can modify existing records |
| `delete` | Control who can remove records |

### Template Fields

Use dynamic template fields in RLS queries to reference user attributes:

| Template | Description |
|----------|-------------|
| `{{user.id}}` | The user's ID |
| `{{user.email}}` | The user's email |
| `{{user.role}}` | The user's role |
| `{{user.data.field_name}}` | Any custom field inside the user's `data` object |

### Built-in Entity Attributes

Every entity record has these built-in attributes that can be used in RLS rules:

| Attribute | Description |
|-----------|-------------|
| `id` | Unique record identifier |
| `created_date` | Timestamp when record was created |
| `updated_date` | Timestamp when record was last updated |
| `created_by` | Email of the user that created the record |

### Rule Types

There are three valid RLS rule styles:

1. **Boolean values:**
   - `true` - Allow all (including anonymous/unauthenticated users)
   - `false` - Block all access

2. **Role/attribute check using `user_condition`:**
```jsonc
{
  "user_condition": { "role": "admin" }
}
```

3. **Entity-User field comparison:**
```jsonc
{
  "created_by": "{{user.email}}"
}
```

You can combine rules using `$and`, `$or`, `$in`, `$nin`, etc.

**Warning:** Never filter by entity field values directly (e.g., `{"status": "published"}`). Only use user-related conditions.

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

**Admin override with $or:**
```jsonc
{
  "$or": [
    { "data.team": "{{user.data.team}}" },
    { "user_condition": { "role": "admin" } }
  ]
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
    "create": {
      "user_condition": { "role": { "$ne": "guest" } }
    },
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
    "delete": {
      "$or": [
        { "created_by": "{{user.email}}" },
        { "user_condition": { "role": "admin" } }
      ]
    }
  }
}
```

### Common RLS Patterns

**Public create, admin-only read (e.g., contact forms, waitlists):**
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

### Limitations

- **Unsupported operators:** `$regex`, `$expr`, `$where`
- **No entity field filtering:** You cannot filter by entity field values (e.g., `{"status": "published"}`). Only user-related conditions are allowed.
- **Template arrays:** Template values resolving to arrays are only valid inside `$in`, `$all`, etc.
- **No deeply nested templates:** Templates like `{{user.data.profile.department}}` are not supported unless explicitly handled.

## Field Level Security (FLS)

FLS controls access to individual fields within records. Define `rls` rules at the field level inside `properties`.

### FLS Structure

```jsonc
{
  "properties": {
    "public_field": {
      "type": "string"
    },
    "admin_only_field": {
      "type": "string",
      "rls": {
        "read": { "user_condition": { "role": "admin" } },
        "write": { "user_condition": { "role": "admin" } }
      }
    }
  }
}
```

### FLS Operations

- `read` - Controls who can see the field value
- `write` - Controls who can set/update the field value

### FLS Examples

**Admin-only notes:**
```jsonc
{
  "admin_notes": {
    "type": "string",
    "rls": {
      "read": { "user_condition": { "role": "admin" } },
      "write": { "user_condition": { "role": "admin" } }
    }
  }
}
```

**Owner-only private field:**
```jsonc
{
  "private_notes": {
    "type": "string",
    "rls": {
      "read": { "created_by": "{{user.email}}" },
      "write": { "created_by": "{{user.email}}" }
    }
  }
}
```

**Completely hidden field:**
```jsonc
{
  "internal_score": {
    "type": "number",
    "rls": {
      "read": false,
      "write": false
    }
  }
}
```

## Pushing Entities

The `entities push` command will push all entities that exist in the `base44/entities` folder.

```bash
npx base44 entities push
```

For more details on the push command, see [entities-push.md](entities-push.md).
