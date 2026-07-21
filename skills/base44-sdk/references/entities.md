# Entities Module

CRUD operations on data models. Access via `base44.entities.EntityName.method()`.

## Contents
- [Methods](#methods)
- [Examples](#examples) (Create, Bulk Create, List, Filter, Get, Update, Delete, Subscribe)
- [User Entity](#user-entity)
- [Service Role Access](#service-role-access)
- [Permissions](#permissions)

## Methods

**Note:** The maximum limit for `list()` and `filter()` is 5,000 items per request.

| Method | Signature | Description |
|--------|-----------|-------------|
| `create(data)` | `Promise<T>` | Create one record |
| `bulkCreate(dataArray)` | `Promise<T[]>` | Create multiple records |
| `list(sort?, limit?, skip?, fields?)` | `Promise<Pick<T, K>[]>` | Get all records (paginated) |
| `filter(query, sort?, limit?, skip?, fields?)` | `Promise<Pick<T, K>[]>` | Get records matching conditions |
| `get(id)` | `Promise<T>` | Get single record by ID |
| `update(id, data)` | `Promise<T>` | Update record (partial update) |
| `updateMany(query, data)` | `Promise<UpdateManyResult>` | Update all matching records using MongoDB update operators |
| `bulkUpdate(dataArray)` | `Promise<T[]>` | Update multiple records by ID, each with its own data |
| `delete(id)` | `Promise<DeleteResult>` | Delete record by ID |
| `deleteMany(query)` | `Promise<DeleteManyResult>` | Delete all matching records |
| `importEntities(file)` | `Promise<ImportResult<T>>` | Import from CSV (frontend only) |
| `subscribe(callback)` | `() => void` | Subscribe to realtime updates (returns unsubscribe function) |

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
// Get first 10 records, sorted by created_date descending (max 5,000 per request)
const tasks = await base44.entities.Task.list(
  "-created_date",  // sort (SortField: prefix with - for descending)
  10,               // limit
  0                 // skip
);

// Get next page
const page2 = await base44.entities.Task.list("-created_date", 10, 10);
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

// With sort, limit, skip (max 5,000 per request)
const recent = await base44.entities.Task.filter(
  { status: "pending" },
  "-created_date",  // sort (SortField: prefix with - for descending)
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

// Query operators (MongoDB-style)
const highValue = await base44.entities.Order.filter({
  amount: { $gte: 100 },
  status: { $in: ["pending", "processing"] }
});

// Combine with $and / $or / $nor at the root level
const flagged = await base44.entities.Task.filter({
  $or: [
    { priority: "high" },
    { count: { $gte: 100 } }
  ]
});
```

**Supported query operators:** `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists` (all fields); `$regex` (string fields); `$all`, `$size` (array fields); `$not` (negates a field-level operator expression); `$and`, `$or`, `$nor` (root-level, combine nested filter queries).

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
const result = await base44.entities.Task.delete("task-id-123");
console.log("Deleted:", result.success);

// Multiple records matching query
const manyResult = await base44.entities.Task.deleteMany({ status: "archived" });
console.log("Deleted:", manyResult.deleted);
```

### Update Many (MongoDB-style)

```javascript
// Update all pending tasks to status "in-progress"
const result = await base44.entities.Task.updateMany(
  { status: "pending" },                     // query: which records to update
  { $set: { status: "in-progress" } }        // MongoDB update operator
);
console.log("Updated:", result.updated);

// Increment a counter field
await base44.entities.Task.updateMany(
  { category: "bugs" },
  { $inc: { priority: 1 } }
);
```

**Batching:** results are batched in groups of up to 500. When `result.has_more` is `true`, call `updateMany` again with the *same query* to process the next batch — make sure the query excludes already-updated records so you don't re-process the same entities:

```javascript
// Process all pending items in batches of 500.
// The query filters by 'pending', so updated records (now 'processed')
// are automatically excluded from the next batch.
let hasMore = true;
let totalUpdated = 0;
while (hasMore) {
  const result = await base44.entities.Job.updateMany(
    { status: "pending" },
    { $set: { status: "processed" } }
  );
  totalUpdated += result.updated;
  hasMore = result.has_more;
}
```

### Bulk Update (by ID)

```javascript
// Update multiple records, each with different data
const updated = await base44.entities.Task.bulkUpdate([
  { id: "task-1", status: "done", completedAt: new Date().toISOString() },
  { id: "task-2", status: "in-progress", assignedTo: userId },
  { id: "task-3", priority: 5 }
]);
```

**Limit:** up to 500 records per request. For more, chunk the array yourself:

```javascript
const allUpdates = reassignments.map(r => ({ id: r.taskId, owner: r.newOwner }));
for (let i = 0; i < allUpdates.length; i += 500) {
  const batch = allUpdates.slice(i, i + 500);
  await base44.entities.Task.bulkUpdate(batch);
}
```

### Import from File

```javascript
// Frontend only: import from CSV/file
const result = await base44.entities.Task.importEntities(file);
if (result.status === "success" && result.output) {
  console.log(`Imported ${result.output.length} records`);
} else {
  console.error(result.details);
}
```

### Subscribe to Realtime Updates

```javascript
// Subscribe to all changes on Task entity
const unsubscribe = base44.entities.Task.subscribe((event) => {
  console.log(`Task ${event.id} was ${event.type}:`, event.data);
  // event.type is "create", "update", or "delete"
});

// Later: unsubscribe to stop receiving updates
unsubscribe();
```

**Event structure:**
```javascript
{
  type: "create" | "update" | "delete",
  data: { ... },       // the entity data
  id: "entity-id",     // the affected entity's ID
  timestamp: "2024-01-15T10:30:00Z"
}
```

**Oversize payloads:** the realtime transport caps payload size. If a broadcast would exceed it, the server sets `data._oversize: true` and slims the payload (fields over 10 KB arrive as empty strings, or the whole record may collapse to a stub). The SDK logs a console warning when this happens. On `create`/`update` events, check for `data._oversize` and call `entities.EntityName.get(id)` to fetch the full record instead of rendering the slimmed payload.

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

## Permissions (RLS & FLS)

Data access is controlled by **Row Level Security (RLS)** and **Field Level Security (FLS)** rules defined in entity schemas.

1. **Authentication level**: anonymous, authenticated, or service role
2. **RLS rules**: Control which records (rows) users can create/read/update/delete
3. **FLS rules**: Control which fields users can read/write within accessible records

Operations succeed or fail based on these rules - no partial results.

RLS and FLS are configured in entity schema files (`base44/entities/*.jsonc`). See [entities-create.md](../../base44-cli/references/entities-create.md#row-level-security-rls) for configuration details.

**Note:** `asServiceRole` operations bypass entity access rules and field-level security entirely — they can read and write any record in any entity, regardless of RLS/FLS rules.

## Type Definitions

### RealtimeEvent

```typescript
/** Event types for realtime entity updates. */
type RealtimeEventType = "create" | "update" | "delete";

/** Payload received when a realtime event occurs. */
interface RealtimeEvent<T = any> {
  /** The type of change that occurred. */
  type: RealtimeEventType;
  /** The entity data. */
  data: T;
  /** The unique identifier of the affected entity. */
  id: string;
  /** ISO 8601 timestamp of when the event occurred. */
  timestamp: string;
}

/** Callback function invoked when a realtime event occurs. */
type RealtimeCallback<T = any> = (event: RealtimeEvent<T>) => void;
```

### Result Types

```typescript
/** Result returned when updating multiple entities. */
interface UpdateManyResult {
  /** Whether the update was successful. */
  success: boolean;
  /** Number of entities that were updated. */
  updated: number;
  /** Whether more records match the query and weren't updated in this batch. When `true`, call `updateMany` again with the same query to process the next batch. */
  has_more: boolean;
}

/** Result returned when deleting a single entity. */
interface DeleteResult {
  /** Whether the deletion was successful. */
  success: boolean;
}

/** Result returned when deleting multiple entities. */
interface DeleteManyResult {
  /** Whether the deletion was successful. */
  success: boolean;
  /** Number of entities that were deleted. */
  deleted: number;
}

/** Result returned when importing entities from a file. */
interface ImportResult<T = any> {
  /** Status of the import operation. */
  status: "success" | "error";
  /** Details message, e.g., "Successfully imported 3 entities with RLS enforcement". */
  details: string | null;
  /** Array of created entity objects when successful, or null on error. */
  output: T[] | null;
}
```

### SortField and Server Fields

```typescript
/**
 * Sort field type for entity queries.
 * Supports ascending (no prefix or '+') and descending ('-') sorting.
 * Example: 'created_date', '+created_date', '-created_date'
 */
type SortField<T> = (keyof T & string) | `+${keyof T & string}` | `-${keyof T & string}`;

/** Fields added by the server to every entity record. */
interface ServerEntityFields {
  id: string;
  created_date: string;
  updated_date: string;
  created_by?: string | null;
  created_by_id?: string | null;
  is_sample?: boolean;
}
```

### Type Registry (for typed entities)

**How to get typed entities:** The Base44 CLI can generate entity interfaces and an augmentation of `EntityTypeRegistry` from your project. For how to run it, use the **base44-cli** skill.

```typescript
/**
 * Registry mapping entity names to their TypeScript types.
 * Augment this interface with your entity schema (user-defined fields only).
 * Typically populated by the Base44 CLI type generator.
 */
interface EntityTypeRegistry {}

/**
 * Full record type for each entity: schema fields + server-injected fields.
 */
type EntityRecord = {
  [K in keyof EntityTypeRegistry]: EntityTypeRegistry[K] & ServerEntityFields;
};
```

### EntityFilterQuery

Query type accepted by `filter()`, `updateMany()`, and `deleteMany()`. Each field can use an exact value, `null`, an array shorthand (matches any listed value), or a field-level operator object. Root-level `$and`, `$or`, `$nor` combine nested filter queries.

```typescript
/** Query object accepted by entity filtering methods. */
type EntityFilterQuery<T> = {
  [K in keyof T]?: EntityFilterValue<T[K]>;
} & {
  $and?: EntityFilterQuery<T>[];
  $or?: EntityFilterQuery<T>[];
  $nor?: EntityFilterQuery<T>[];
};

/** Value accepted when filtering an entity field: exact match, array shorthand, or operator object. */
type EntityFilterValue<T> =
  | (Exclude<T, undefined> | null)
  | (Exclude<T, undefined> | null)[]
  | EntityFilterOperators<T>;

/** MongoDB-style query operators accepted for a single entity field. */
type EntityFilterOperators<T> = {
  $eq?: T; $ne?: T; $gt?: T; $gte?: T; $lt?: T; $lte?: T;
  $in?: T[]; $nin?: T[];
  $exists?: boolean;
  $regex?: string;   // string fields only
  $all?: T; $size?: number; // array fields only
  $not?: EntityFilterOperators<T>; // negates a field-level filter expression
};
```

### EntityHandler

```typescript
/** Entity handler providing CRUD operations for a specific entity type. */
interface EntityHandler<T = any> {
  /** Lists records with optional pagination and sorting. Max 5,000 per request. */
  list<K extends keyof T = keyof T>(
    sort?: SortField<T>,
    limit?: number,
    skip?: number,
    fields?: K[]
  ): Promise<Pick<T, K>[]>;

  /** Filters records based on a query. Max 5,000 per request. */
  filter<K extends keyof T = keyof T>(
    query: EntityFilterQuery<T>,
    sort?: SortField<T>,
    limit?: number,
    skip?: number,
    fields?: K[]
  ): Promise<Pick<T, K>[]>;

  /** Gets a single record by ID. */
  get(id: string): Promise<T>;

  /** Creates a new record. */
  create(data: Partial<T>): Promise<T>;

  /** Updates an existing record. */
  update(id: string, data: Partial<T>): Promise<T>;

  /** Deletes a single record by ID. */
  delete(id: string): Promise<DeleteResult>;

  /** Deletes multiple records matching a query. */
  deleteMany(query: EntityFilterQuery<T>): Promise<DeleteManyResult>;

  /** Creates multiple records in a single request. */
  bulkCreate(data: Partial<T>[]): Promise<T[]>;

  /**
   * Updates multiple records matching a query using MongoDB update operators.
   * Results are batched in groups of up to 500 — see `has_more` on the result.
   * @param query - Filter to select which records to update.
   * @param data - MongoDB update operator object (e.g., `{ $set: { field: value } }`).
   */
  updateMany(query: EntityFilterQuery<T>, data: Record<string, Record<string, any>>): Promise<UpdateManyResult>;

  /** Updates multiple records by ID, each with its own update data. Up to 500 records per request. */
  bulkUpdate(data: (Partial<T> & { id: string })[]): Promise<T[]>;

  /** Imports records from a file (frontend only). */
  importEntities(file: File): Promise<ImportResult<T>>;

  /** Subscribes to realtime updates. Returns unsubscribe function. */
  subscribe(callback: RealtimeCallback<T>): () => void;
}
```

### EntitiesModule

```typescript
/** Entities module: typed registry keys get typed handlers; dynamic access remains untyped. */
type EntitiesModule = TypedEntitiesModule & DynamicEntitiesModule;

type TypedEntitiesModule = {
  [K in keyof EntityTypeRegistry]: EntityHandler<EntityRecord[K]>;
};

type DynamicEntitiesModule = {
  [entityName: string]: EntityHandler<any>;
};
```
