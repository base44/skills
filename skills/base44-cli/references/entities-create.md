# Creating Entities

Base44 entities are defined locally in your project and then pushed to the Base44 backend.

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

## Pushing Entities

The `entities push` command will push all entities that exist in the `base44/entities` folder.

```bash
npx base44 entities push
```

For more details on the push command, see [entities-push.md](entities-push.md).
