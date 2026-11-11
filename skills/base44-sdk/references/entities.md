# Entities Module

CRUD operations on data models. Access via `base44.entities.EntityName.method()`.

## Contents
- [Methods](#methods)
- [Query Operators](#query-operators)
- [Examples](#examples) (Create, Bulk Create, List, Filter, Get, Update, Delete, Subscribe)
- [Cursor Pagination](#cursor-pagination)
- [Count and Aggregate](#count-and-aggregate)
- [Upsert](#upsert)
- [User Entity](#user-entity)
- [Service Role Access](#service-role-access)
- [Permissions](#permissions)

## Methods

**Note:** The legacy `(sort, limit, skip, fields)` form of `list()`/`filter()` accepts up to 5,000 items per request. The cursor-based form (`EntityListOptions`) also caps at 5,000 per page but defaults to 100; the distinct-values form (`EntityDistinctOptions`) caps at 1,000 per page, defaulting to 100.

| Method | Signature | Description |
|--------|-----------|-------------|
| `create(data)` | `Promise<T>` | Create one record |
| `bulkCreate(dataArray)` | `Promise<T[]>` | Create multiple records (not a transaction) |
| `list(sort?, limit?, skip?, fields?)` | `Promise<Pick<T, K>[]>` | Get all records (legacy array pagination; prefer the cursor form below) |
| `list(options)` | `Promise<EntityPage<Pick<T, K>>>` | Get one cursor page of records, or one page of a field's distinct values |
| `filter(query, sort?, limit?, skip?, fields?)` | `Promise<Pick<T, K>[]>` | Get records matching conditions (legacy array pagination) |
| `filter(query, options)` | `Promise<EntityPage<Pick<T, K>>>` | Get one cursor page of records matching conditions, or distinct values |
| `get(id)` | `Promise<T>` | Get single record by ID |
| `update(id, data)` | `Promise<T>` | Update record (partial update) |
| `updateMany(query, data)` | `Promise<UpdateManyResult>` | Apply the same update to all matching records using MongoDB update operators (batched, up to 500 per call) |
| `bulkUpdate(dataArray)` | `Promise<T[]>` | Update up to 500 records by ID, each with its own data (not a transaction) |
| `count(query?)` | `Promise<number>` | Count matching records without fetching them |
| `aggregate(spec)` | `Promise<EntityAggregateResult>` | Group matching records and compute count/sum/avg/min/max/distinct per group |
| `upsert(records, options)` | `Promise<EntityUpsertResult<T>>` | Create or update up to 500 records by a natural key (not a transaction) |
| `delete(id)` | `Promise<DeleteResult>` | Move a record to trash (restorable; not a transaction with other calls) |
| `deleteMany(query)` | `Promise<DeleteManyResult>` | Move all matching records to trash (not a transaction) |
| `importEntities(file)` | `Promise<ImportResult<T>>` | Import from CSV (frontend only) |
| `subscribe(callback)` | `() => void` | Subscribe to realtime updates (returns unsubscribe function) |

## Query Operators

`filter()`, `count()`, `deleteMany()`, `updateMany()`'s query argument, and `aggregate()`'s `query` field all accept an `EntityFilterQuery<T>` — a MongoDB-style query object:

| Operator | Where | Description |
|---|---|---|
| `$eq`, `$ne` | any field | Equal / not equal |
| `$gt`, `$gte`, `$lt`, `$lte` | any field | Comparison |
| `$in`, `$nin` | any field | Value is / isn't one of an array |
| `$exists` | any field | Field is present (`true`) or absent (`false`) |
| `$regex` | string fields only | Regex match |
| `$all` | array fields only | Array contains all listed elements |
| `$size` | array fields only | Array has this length |
| `$not` | any field | Negates a nested field-level operator object |
| `$and`, `$or`, `$nor` | root level | Combine nested `EntityFilterQuery` objects |

A plain array as a field's value is shorthand for "any of": `{ external_id: ['item-1', 'item-2'] }`. `null` is a valid exact-match value.

```javascript
// Exact match, a comparison operator, and a nested $or
const query = {
  status: "open",
  priority: { $gte: 3 },
  $or: [{ assignee: "me" }, { team: "core" }],
};
const tasks = await base44.entities.Task.filter(query);
```

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

`delete()` and `deleteMany()` move records to the entity's trash — they're restorable via **Recently deleted** in the Data tab (or the Restore/Permanently delete API endpoints), not a permanent delete. `deleteMany()` isn't a transaction: if the call fails partway, records already deleted stay deleted.

```javascript
// Single record
const result = await base44.entities.Task.delete("task-id-123");
console.log("Deleted:", result.success);

// Multiple records matching query
const manyResult = await base44.entities.Task.deleteMany({ status: "archived" });
console.log("Deleted:", manyResult.deleted);
```

### Update Many (MongoDB-style)

Supported update operators: `$set`, `$rename`, `$unset`, `$inc`, `$mul`, `$min`, `$max`, `$currentDate`, `$addToSet`, `$push`, `$pull` (each field may appear in only one operator per call). Not a transaction — each matching record is updated on its own. Results are batched in groups of up to 500; when `result.has_more` is `true`, call `updateMany` again with the same query (which should exclude already-updated records) to process the next batch.

```javascript
// Update all pending tasks to status "in-progress"
const result = await base44.entities.Task.updateMany(
  { status: "pending" },                     // query: which records to update
  { $set: { status: "in-progress" } }        // MongoDB update operator
);
console.log("Updated:", result.updated, "More remaining:", result.has_more);

// Increment a counter field
await base44.entities.Task.updateMany(
  { category: "bugs" },
  { $inc: { priority: 1 } }
);

// Batch loop: the query excludes already-processed records so each
// iteration picks up fresh ones
let hasMore = true;
while (hasMore) {
  const result = await base44.entities.Job.updateMany(
    { status: "pending" },
    { $set: { status: "processed" } }
  );
  hasMore = result.has_more;
}

// Claim a record so only one of several concurrent callers succeeds:
// the condition (status: 'open') is re-checked at write time only
// because the query names a single id
const claim = await base44.entities.Task.updateMany(
  { id: taskId, status: "open" },
  { $set: { status: "claimed", claimed_by: user.email } }
);
if (claim.updated === 1) {
  // this caller claimed the task
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

### Cursor Pagination

`list()` and `filter()` also accept a single options object for cursor-based paging, preferred over the legacy `(sort, limit, skip, fields)` form for loops over large result sets. Pass `distinct` instead of `fields` to page through a field's distinct values instead of records.

```javascript
// Page through records with a cursor
let cursor;
do {
  const page = await base44.entities.Task.filter(
    { status: "open" },
    { limit: 200, cursor }
  );
  page.items.forEach((task) => console.log(task.id));
  cursor = page.next_cursor;
} while (page.has_more);

// Distinct values of a field
const { items: categories } = await base44.entities.Task.list({ distinct: "category" });
```

### Count and Aggregate

```javascript
// Count matching records without fetching them
const open = await base44.entities.Task.count({ status: "open" });
const total = await base44.entities.Task.count();

// Group and compute measures per group
const { rows } = await base44.entities.Order.aggregate({
  groupBy: "status",
  sum: "amount",
  avg: "amount",
});
// rows: [{ status: "paid", count: 12, sum_amount: 4300, avg_amount: 358.3 }, ...]

// Group by a date bucket, with a having filter on the computed count
const { rows: daily } = await base44.entities.Sale.aggregate({
  dateBucket: { field: "created_date", unit: "day" },
  having: { count: { $gt: 1 } },
  sort: "-count",
});
```

### Upsert

Creates or updates by a natural key (not an auto-generated `id`). Up to 500 records per call; last write wins for duplicate keys within the same call; not a transaction.

```javascript
const result = await base44.entities.Product.upsert(
  [
    { sku: "ABC-1", name: "Widget", price: 999 },
    { sku: "ABC-2", name: "Gadget", price: 1999 },
  ],
  { key: "sku" }
);
console.log(result.created, result.updated, result.records);
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

**Oversize records:** fields over 10 KB are slimmed for transport on a broadcast — the SDK logs a console error naming the affected record and tells you to call `entities.<Name>.get(id)` to fetch the full record instead of rendering the slimmed payload. This doesn't apply to delete events.

**Event structure:**
```javascript
{
  type: "create" | "update" | "delete",
  data: { ... },       // the entity data
  id: "entity-id",     // the affected entity's ID
  timestamp: "2024-01-15T10:30:00Z"
}
```

## User Entity

Every app has a built-in `User` entity with special rules:

- Regular users can only read/update **their own** record
- Cannot create users via `entities.create()` - use `auth.register()` instead
- Service role can read and update any user, and remove any user **except the app owner**. A removed user moves to **Recently deleted** for 30 days, where an app editor can restore them, before being deleted permanently.

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

**Note:** `asServiceRole` bypasses RLS and FLS entirely. The client reads and writes any record in any entity without needing a matching admin rule. Use it for trusted backend logic only, and enforce your own access checks when the function needs them.

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
  /** True when more matching records remain unprocessed. Call updateMany() again with the same query for the next batch (up to 500 per call). */
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

### Query, Pagination, and Aggregation Types

```typescript
/** MongoDB-style query object accepted by filter(), count(), deleteMany(), updateMany(), and aggregate()'s query field. */
type EntityFilterQuery<T> = {
  [K in keyof T]?:
    | Exclude<T[K], undefined>
    | null
    | Exclude<T[K], undefined>[]              // array shorthand: matches any of the values
    | {
        $eq?: Exclude<T[K], undefined> | null;
        $ne?: Exclude<T[K], undefined> | null;
        $gt?: Exclude<T[K], undefined> | null;
        $gte?: Exclude<T[K], undefined> | null;
        $lt?: Exclude<T[K], undefined> | null;
        $lte?: Exclude<T[K], undefined> | null;
        $in?: (Exclude<T[K], undefined> | null)[];
        $nin?: (Exclude<T[K], undefined> | null)[];
        $exists?: boolean;
        $regex?: string;    // string fields only
        $all?: unknown[];   // array fields only
        $size?: number;     // array fields only
        $not?: Record<string, unknown>;  // negates another field-level operator object
      };
} & {
  $and?: EntityFilterQuery<T>[];
  $or?: EntityFilterQuery<T>[];
  $nor?: EntityFilterQuery<T>[];
};

/** Options for one cursor page of records from list()/filter(). */
interface EntityListOptions<T, K extends keyof T = keyof T> {
  /** Defaults to '-created_date'. */
  sort?: SortField<T>;
  /** Up to 5,000. Defaults to 100. */
  limit?: number;
  /** next_cursor from the previous page. Omit for the first page. */
  cursor?: string | null;
  /** Defaults to all fields. */
  fields?: K[];
}

/** Options for one cursor page of a field's distinct values from list()/filter(). */
interface EntityDistinctOptions<T, K extends keyof T = keyof T> {
  /** Field whose distinct values to return, ascending. */
  distinct: K;
  /** Up to 1,000. Defaults to 100. */
  limit?: number;
  cursor?: string | null;
}

/** One page of items (records, or distinct values when `distinct` was passed). */
interface EntityPage<T> {
  items: T[];
  /** Cursor for the next page, or null on the last page. */
  next_cursor: string | null;
  has_more: boolean;
}

/** A time bucket to group a date field by, for EntityAggregateSpec.dateBucket. */
interface EntityDateBucket<T> {
  /** 'created_date', 'updated_date', or a date field of your schema. */
  field: keyof T & string;
  /** Every date field supports day/month/year. created_date/updated_date also support week. */
  unit: "day" | "week" | "month" | "year";
}

/** Describes what aggregate() computes: group-by fields/measures, computed per group. */
interface EntityAggregateSpec<T> {
  /** Filter applied before grouping. Defaults to all records. */
  query?: EntityFilterQuery<T>;
  /** Field, or up to 4 fields, to group by. Omit for one total row. */
  groupBy?: (keyof T & string) | (keyof T & string)[];
  dateBucket?: EntityDateBucket<T>;
  /** Include the group's record count as `count`. Defaults to true. */
  count?: boolean;
  /** Produces sum_<field> in each row. */
  sum?: (keyof T & string) | (keyof T & string)[];
  /** Produces avg_<field> in each row. */
  avg?: (keyof T & string) | (keyof T & string)[];
  /** Produces min_<field> in each row. */
  min?: (keyof T & string) | (keyof T & string)[];
  /** Produces max_<field> in each row. */
  max?: (keyof T & string) | (keyof T & string)[];
  /** Produces count_distinct_<field> in each row. Counts whole arrays, not elements. */
  countDistinct?: keyof T & string;
  /** Filters computed fields after grouping. Supports $eq/$ne/$gt/$gte/$lt/$lte/$in/$nin. */
  having?: Record<string, any>;
  /** Computed or group field to sort by, '-' prefix for descending. */
  sort?: string;
  /** Up to 1,000. Defaults to 1,000. */
  limit?: number;
}

/** Rows returned by aggregate(). */
interface EntityAggregateResult {
  /** One row per group: group fields by name, plus count/sum_<field>/avg_<field>/min_<field>/max_<field>/count_distinct_<field>. */
  rows: Record<string, any>[];
  /** True when more groups exist than `limit` allowed. */
  truncated: boolean;
}

/** Options for upsert(). */
interface EntityUpsertOptions<T> {
  /** Field, or fields, identifying a record. Matching values update; otherwise a record is created. */
  key: (keyof T & string) | (keyof T & string)[];
}

/** Result of upsert(). */
interface EntityUpsertResult<T = any> {
  created: number;
  updated: number;
  /** The written records, created and updated, as they now exist. */
  records: T[];
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

### EntityHandler

```typescript
/** Entity handler providing CRUD operations for a specific entity type. */
interface EntityHandler<T = any> {
  /** Lists records (legacy array pagination). Kept for existing code; prefer a cursor for pagination. */
  list<K extends keyof T = keyof T>(
    sort?: SortField<T>,
    limit?: number,
    skip?: number,
    fields?: K[]
  ): Promise<Pick<T, K>[]>;
  /** Lists one cursor page of records. */
  list<K extends keyof T = keyof T>(options: EntityListOptions<T, K>): Promise<EntityPage<Pick<T, K>>>;
  /** Lists one cursor page of a field's distinct values. */
  list<K extends keyof T>(options: EntityDistinctOptions<T, K>): Promise<EntityPage<T[K]>>;

  /** Filters records based on a query (legacy array pagination). Kept for existing code; prefer a cursor for pagination. */
  filter<K extends keyof T = keyof T>(
    query: EntityFilterQuery<T>,
    sort?: SortField<T>,
    limit?: number,
    skip?: number,
    fields?: K[]
  ): Promise<Pick<T, K>[]>;
  /** Filters records and returns one cursor page. */
  filter<K extends keyof T = keyof T>(
    query: EntityFilterQuery<T>,
    options: EntityListOptions<T, K>
  ): Promise<EntityPage<Pick<T, K>>>;
  /** Filters records and returns one cursor page of a field's distinct values. */
  filter<K extends keyof T>(
    query: EntityFilterQuery<T>,
    options: EntityDistinctOptions<T, K>
  ): Promise<EntityPage<T[K]>>;

  /** Gets a single record by ID. */
  get(id: string): Promise<T>;

  /** Creates a new record. */
  create(data: Partial<T>): Promise<T>;

  /** Updates an existing record. */
  update(id: string, data: Partial<T>): Promise<T>;

  /** Moves a single record to trash by ID. Restorable. */
  delete(id: string): Promise<DeleteResult>;

  /** Moves records matching a query to trash. Restorable; not a transaction. */
  deleteMany(query: EntityFilterQuery<T>): Promise<DeleteManyResult>;

  /** Creates multiple records in a single request. Not a transaction. */
  bulkCreate(data: Partial<T>[]): Promise<T[]>;

  /**
   * Applies the same update to all records matching a query, batched up to 500 per call.
   * @param query - Filter to select which records to update.
   * @param data - MongoDB update operator object (e.g., `{ $set: { field: value } }`). Supports $set, $rename, $unset, $inc, $mul, $min, $max, $currentDate, $addToSet, $push, $pull.
   */
  updateMany(query: EntityFilterQuery<T>, data: Record<string, Record<string, any>>): Promise<UpdateManyResult>;

  /** Updates up to 500 records by ID, each with its own update data. Not a transaction. */
  bulkUpdate(data: (Partial<T> & { id: string })[]): Promise<T[]>;

  /** Counts records matching a query, without fetching them. */
  count(query?: EntityFilterQuery<T>): Promise<number>;

  /** Groups matching records and computes count/sum/avg/min/max/distinct-count per group. */
  aggregate(spec: EntityAggregateSpec<T>): Promise<EntityAggregateResult>;

  /** Creates or updates up to 500 records by a natural key. Not a transaction; last write wins per key. */
  upsert(records: Partial<T>[], options: EntityUpsertOptions<T>): Promise<EntityUpsertResult<T>>;

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
