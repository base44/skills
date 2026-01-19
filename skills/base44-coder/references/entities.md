# Entities Module

CRUD operations on data models. Access via `base44.entities.EntityName.method()`.

## Contents
- [Methods](#methods)
- [Examples](#examples) (Create, Bulk Create, List, Filter, Get, Update, Delete)
- [User Entity](#user-entity)
- [Service Role Access](#service-role-access)
- [Permissions](#permissions)

## Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `create(data)` | `Promise<any>` | Create one record |
| `bulkCreate(dataArray)` | `Promise<any[]>` | Create multiple records |
| `list(sort?, limit?, skip?, fields?)` | `Promise<any[]>` | Get all records (paginated) |
| `filter(query, sort?, limit?, skip?, fields?)` | `Promise<any[]>` | Get records matching conditions |
| `get(id)` | `Promise<any>` | Get single record by ID |
| `update(id, data)` | `Promise<any>` | Update record (partial update) |
| `delete(id)` | `Promise<any>` | Delete record by ID |
| `deleteMany(query)` | `Promise<any>` | Delete all matching records |
| `importEntities(file)` | `Promise<any>` | Import from CSV (frontend only) |

## Examples

### Create

```javascript
const task = await base44.entities.Task.create({
  title: "Complete documentation",
  status: "pending",
  dueDate: "2024-12-31"
});
```

### Bulk Create

```javascript
const tasks = await base44.entities.Task.bulkCreate([
  { title: "Task 1", status: "pending" },
  { title: "Task 2", status: "pending" }
]);
```

### List with Pagination

```javascript
// Get first 10 records, sorted by created_date descending
const tasks = await base44.entities.Task.list(
  { created_date: -1 },  // sort
  10,                     // limit
  0                       // skip
);

// Get next page
const page2 = await base44.entities.Task.list({ created_date: -1 }, 10, 10);
```

### Filter

```javascript
// Simple filter
const pending = await base44.entities.Task.filter({ status: "pending" });

// Multiple conditions
const myPending = await base44.entities.Task.filter({
  status: "pending",
  assignedTo: userId
});

// With sort, limit, skip
const recent = await base44.entities.Task.filter(
  { status: "pending" },
  { created_date: -1 },
  5,
  0
);

// Select specific fields
const titles = await base44.entities.Task.filter(
  { status: "pending" },
  null,
  null,
  null,
  ["id", "title"]
);
```

### Get by ID

```javascript
const task = await base44.entities.Task.get("task-id-123");
```

### Update

```javascript
// Partial update - only specified fields change
await base44.entities.Task.update("task-id-123", {
  status: "completed",
  completedAt: new Date().toISOString()
});
```

### Delete

```javascript
// Single record
await base44.entities.Task.delete("task-id-123");

// Multiple records matching query
await base44.entities.Task.deleteMany({ status: "archived" });
```

## User Entity

Every app has a built-in `User` entity with special rules:

- Regular users can only read/update **their own** record
- Cannot create users via `entities.create()` - use `auth.register()` instead
- Service role has full access to all user records

```javascript
// Get current user's record
const me = await base44.entities.User.get(currentUserId);

// Service role: get any user
const anyUser = await base44.asServiceRole.entities.User.get(userId);
```

## Service Role Access

For admin-level operations (bypass user permissions):

```javascript
// Backend only
const allTasks = await base44.asServiceRole.entities.Task.list();
const allUsers = await base44.asServiceRole.entities.User.list();
```

## Permissions

Data access depends on:
1. **Authentication level**: anonymous, authenticated, or service role
2. **Entity security settings**: configured in app dashboard

Operations succeed or fail based on these rules - no partial results.
