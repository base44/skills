# Entities Module

CRUD operations on data models. Access via `base44.entities.EntityName.method()`.

## Contents
- [Methods](#methods)
- [Examples](#examples) (Create, Bulk Create, List, Cursor Pagination, Distinct Values, Filter, Get, Count, Aggregate, Update, Update Many, Bulk Update, Upsert, Delete, Import, Subscribe)
- [User Entity](#user-entity)
- [Service Role Access](#service-role-access)
- [Permissions](#permissions)

## Methods

**Note:** The maximum limit for `list()` and `filter()` (array form or cursor-page form) is 5,000 items per request; for distinct-value pages it's 1,000. `aggregate()` returns up to 1,000 rows. `updateMany()` processes up to 500 records per call (check `has_more` to continue). `upsert()` and `bulkUpdate()` accept up to 500 records per call.

| Method | Signature | Description |
|--------|-----------|-------------|
| `create(data)` | `Promise<T>` | Create one record |
| `bulkCreate(dataArray)` | `Promise<T[]>` | Create multiple records (not a transaction) |
| `list(sort?, limit?, skip?, fields?)` | `Promise<Pick<T, K>[]>` | Get records as an array, using `skip` for pagination (legacy form) |
| `list(options)` | `Promise<EntityPage<Pick<T, K>>>` | Get one cursor page of records (preferred pagination) |
| `list({ distinct, ... })` | `Promise<EntityPage<T[K]>>` | Get one cursor page of a field's distinct values |
| `filter(query, sort?, limit?, skip?, fields?)` | `Promise<Pick<T, K>[]>` | Get matching records as an array, using `skip` for pagination (legacy form) |
| `filter(query, options)` | `Promise<EntityPage<Pick<T, K>>>` | Get one cursor page of matching records |
| `filter(query, { distinct, ... })` | `Promise<EntityPage<T[K]>>` | Get one cursor page of a field's distinct values among matches |
| `get(id)` | `Promise<T>` | Get single record by ID |
| `count(query?)` | `Promise<number>` | Count records matching a query, without fetching them |
| `aggregate(spec)` | `Promise<EntityAggregateResult>` | Server-side group-by aggregation: counts, sums, averages, min/max, distinct counts |
| `update(id, data)` | `Promise<T>` | Update record (partial update) |
| `updateMany(query, data)` | `Promise<UpdateManyResult>` | Update all matching records using MongoDB update operators, batched up to 500 at a time |
| `bulkUpdate(dataArray)` | `Promise<T[]>` | Update up to 500 records by ID in one call, each with its own data |
| `upsert(records, options)` | `Promise<EntityUpsertResult<T>>` | Create or update up to 500 records by a natural key instead of `id` |
| `delete(id)` | `Promise<DeleteResult>` | Delete record by ID (moves to trash) |
| `deleteMany(query)` | `Promise<DeleteManyResult>` | Delete all matching records (moves to trash, not a transaction) |
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

**Note:** Not a transaction - if the call fails partway, the records already created stay created.

### List with Pagination

```javascript
// Get first 10 records, sorted by created_date descending (max 5,000 per request)
const tasks = await base44.entities.Task.list(
  "-created_date",  // sort (SortField: prefix with - for descending). Defaults to "-created_date"
  10,               // limit. Defaults to 5000
  0                 // skip. Defaults to 0
);

// Get next page
const page2 = await base44.entities.Task.list("-created_date", 10, 10);
```

### List with Cursor Pagination

```javascript
// Get one page of records (preferred over skip-based pagination)
const page = await base44.entities.Task.list({ limit: 100 });
console.log(page.items);       // array of records for this page
console.log(page.has_more);    // true if more records exist
console.log(page.next_cursor); // pass this as `cursor` to get the next page

// Sort and select fields
const sortedPage = await base44.entities.Task.list({
  sort: "-priority",
  fields: ["id", "title", "priority"],
  limit: 50
});

// Walk every record with a cursor
const allTasks = [];
let page = await base44.entities.Task.list({ sort: "-created_date", limit: 1000 });
allTasks.push(...page.items);
while (page.has_more) {
  page = await base44.entities.Task.list({ cursor: page.next_cursor, limit: 1000 });
  allTasks.push(...page.items);
}
```

**Note:** A cursor token carries the original walk's parameters (sort, fields, query), so later pages should pass only `cursor` and `limit` - passing other parameters alongside a `cursor` is an error. Records added or deleted between pages never shift the page boundary.

### Distinct Values

```javascript
// Get a field's distinct values instead of records
const { items: statuses } = await base44.entities.Task.list({ distinct: "status" });
// statuses: ["completed", "in-progress", "pending"]

// Works with filter() too; array fields count each element once, not each array
const { items: tags } = await base44.entities.Task.filter(
  { status: "pending" },
  { distinct: "tags" }
);
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

// Cursor-based pagination (same options object as list())
const page = await base44.entities.Task.filter({ status: "pending" }, { limit: 50 });
```

**Query operators:** field values accept an exact match, `null`, an array shorthand for "any of these values", or an operator object: `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin`, `$exists`, `$regex` (string fields), `$all`/`$size` (array fields), and `$not` (negates another operator object). Combine conditions with root-level `$and`, `$or`, and `$nor`.

```javascript
// Comparison and membership operators
const popular = await base44.entities.Task.filter({
  priority: { $gte: 3 },
  status: { $ne: "archived" },
  category: { $in: ["bugs", "urgent"] }
});

// Logical operators
const mine = await base44.entities.Task.filter({
  $or: [{ assignedTo: userId }, { createdBy: userId }]
});
```

### Get by ID

```javascript
const task = await base44.entities.Task.get("task-id-123");
```

### Count

```javascript
// Count matching records, without fetching them
const openCount = await base44.entities.Task.count({ status: "open" });

// Count all records
const totalCount = await base44.entities.Task.count();

// Use for pagination totals
const pageSize = 20;
const total = await base44.entities.Task.count({ status: "open" });
const totalPages = Math.ceil(total / pageSize);
```

### Aggregate

```javascript
// Group by field, with sum and count, biggest first
const { rows } = await base44.entities.Sale.aggregate({
  query: { sale_date: { $gte: "2026-09-01" } },
  groupBy: "agent_id",
  sum: "amount",
  sort: "-sum_amount"
});
// rows: [{ agent_id: "a1", count: 42, sum_amount: 18250 }, ...]

// Bucket by date
const { rows: daily } = await base44.entities.Task.aggregate({
  dateBucket: { field: "created_date", unit: "day" }
});
// rows: [{ created_date: "2026-09-01", count: 8 }, ...]

// Filter grouped results with `having` (applies after grouping, not before)
const { rows: dupes } = await base44.entities.Order.aggregate({
  groupBy: "external_id",
  having: { count: { $gt: 1 } }
});

// Unique customers per product
const { rows: uniqueCustomers } = await base44.entities.Order.aggregate({
  groupBy: "product_id",
  countDistinct: "customer_id"
});
```

**Note:** `groupBy` supports up to 4 fields. Results are capped at 1,000 rows (`truncated: true` in the response when more groups exist). `having` supports `$eq`, `$ne`, `$gt`, `$gte`, `$lt`, `$lte`, `$in`, `$nin` against computed/group fields.

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

**Note:** Deleted records move to the entity's trash rather than being destroyed immediately. Restore them, or delete them permanently, from **Recently deleted** in the Data tab, or via the restore/permanently-delete API endpoints. `deleteMany()` isn't a transaction - each record is deleted on its own, so if the call fails partway, the records already deleted stay deleted.

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

// Process all pending items in batches of 500.
// The query filters by "pending", so updated records (now "processed")
// are automatically excluded from the next batch.
let hasMore = true;
let totalUpdated = 0;
while (hasMore) {
  const batchResult = await base44.entities.Job.updateMany(
    { status: "pending" },
    { $set: { status: "processed" } }
  );
  totalUpdated += batchResult.updated;
  hasMore = batchResult.has_more;
}

// Claim a record safely: only one of several concurrent callers succeeds.
// Conditions are re-checked at write time only when the query names a single `id`.
const claim = await base44.entities.Task.updateMany(
  { id: taskId, status: "open" },
  { $set: { status: "claimed", claimed_by: user.email } }
);
if (claim.updated === 1) {
  // This caller claimed the task
} else {
  // Someone else claimed it first, or it was no longer open
}
```

**Note:** Results are batched in groups of up to 500 - when `has_more` is `true`, call `updateMany` again with the same query to process the next batch (exclude already-updated records from the query so each batch is new work). Each matching record is updated on its own; the call isn't a transaction, but all update operators in one call (`$set`, `$inc`, `$push`, etc.) are applied to each record in a single write. Supported operators: `$set`, `$rename`, `$unset`, `$inc`, `$mul`, `$min`, `$max`, `$currentDate`, `$addToSet`, `$push`, `$pull`. Each field may only appear in one operator per call.

### Bulk Update (by ID)

```javascript
// Update multiple records, each with different data
const updated = await base44.entities.Task.bulkUpdate([
  { id: "task-1", status: "done", completedAt: new Date().toISOString() },
  { id: "task-2", status: "in-progress", assignedTo: userId },
  { id: "task-3", priority: 5 }
]);

// More than 500 items: chunk into batches
const allUpdates = reassignments.map(r => ({ id: r.taskId, owner: r.newOwner }));
for (let i = 0; i < allUpdates.length; i += 500) {
  const batch = allUpdates.slice(i, i + 500);
  await base44.entities.Task.bulkUpdate(batch);
}
```

**Note:** Up to 500 records per request. Not a transaction - if the call fails partway, the records already written stay written. Use this when each record needs *different* field values; to apply the *same* update to every record matching a query, use `updateMany()` instead.

### Upsert

```javascript
// Create or update by a natural key (e.g. an ID from another system)
const result = await base44.entities.Product.upsert(
  supplierCatalog.map(p => ({ sku: p.sku, name: p.name, price: p.price })),
  { key: "sku" }
);
console.log(`${result.created} created, ${result.updated} updated`);

// Compound key
const result2 = await base44.entities.Inventory.upsert(
  warehouseFeed.map(row => ({ sku: row.sku, warehouse: row.warehouseCode, quantity: row.qty })),
  { key: ["sku", "warehouse"] }
);
```

**Note:** Up to 500 records per call. Every record must carry a value (not an object or array) for each field named in `options.key`. Updates merge the given fields into the existing record, like `update()`. If two records in one call share a key, the last one wins. Not a transaction - concurrent calls with the same key can create duplicate records.

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

**Note (oversize payloads):** Realtime broadcasts are capped in size for transport. If a record has fields over 10 KB, the server slims the payload before sending: large string fields arrive as empty strings, or the whole record may collapse to a stub, and `data._oversize` is set to `true` (this flag is not set on `delete` events, since there's no data to slim). When you see `_oversize: true`, call `base44.entities.EntityName.get(event.id)` to fetch the full record instead of rendering the slimmed payload.

## User Entity

Every app has a built-in `User` entity with special rules:

- Regular users can only read/update **their own** record
- Cannot create users via `entities.create()` - use `auth.register()` instead
- Service role has full access to all user records, and can remove any user except the app owner
- A removed user moves to **Recently deleted** for 30 days (where an app editor can restore them) before being permanently deleted

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
/** Result returned when updating multiple entities using a query. */
interface UpdateManyResult {
  /** Whether the operation was successful. */
  success: boolean;
  /** Number of entities that were updated. */
  updated: number;
  /** Whether more entities matching the query remain unupdated. When `true`, call `updateMany` again with the same query to update the next batch (up to 500 per call). */
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

/** One page of items, with a cursor to continue. Returned by list()/filter() when called with an options object. */
interface EntityPage<T> {
  /** The page's items: records in the requested sort order, or (with `distinct`) that field's distinct values, in ascending order. */
  items: T[];
  /** A cursor for the next page, or `null` on the last page. Pass it as `cursor` to keep paging. */
  next_cursor: string | null;
  /** Whether records remain after this page. */
  has_more: boolean;
}

/** Rows returned by aggregate(). */
interface EntityAggregateResult {
  /** One row per group: the group fields by name, then `count`, `sum_<field>`, `avg_<field>`, `min_<field>`, `max_<field>`, or `count_distinct_<field>`. */
  rows: Record<string, any>[];
  /** `true` when more groups exist than `limit` allowed. */
  truncated: boolean;
}

/** Result returned by upsert(). */
interface EntityUpsertResult<T = any> {
  /** Number of records that were created. */
  created: number;
  /** Number of existing records that were updated. */
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
  /** Unique identifier of the record. */
  id: string;
  /** ISO 8601 timestamp when the record was created. */
  created_date: string;
  /** ISO 8601 timestamp when the record was last updated. */
  updated_date: string;
  /** Email of the user who created the record (may be hidden in some responses). */
  created_by?: string | null;
  /** ID of the user who created the record. */
  created_by_id?: string | null;
  /** Whether the record is sample/seed data. */
  is_sample?: boolean;
}
```

### Filtering, Pagination, and Aggregation Options

```typescript
/**
 * Query object accepted by filter(), count(), deleteMany(), updateMany(), and
 * the `query` field of EntityAggregateSpec.
 *
 * Each field can use an exact value, `null`, an array shorthand for matching
 * any of the listed values, or an operator object. Root-level `$and`, `$or`,
 * and `$nor` combine nested filter queries.
 */
type EntityFilterQuery<T> = {
  [K in keyof T]?:
    | T[K]
    | null
    | (T[K] | null)[]
    | {
        $eq?: T[K] | null;
        $ne?: T[K] | null;
        $gt?: T[K] | null;
        $gte?: T[K] | null;
        $lt?: T[K] | null;
        $lte?: T[K] | null;
        $in?: (T[K] | null)[];
        $nin?: (T[K] | null)[];
        $exists?: boolean;
        $regex?: string;   // string fields only
        $all?: any[];      // array fields only
        $size?: number;    // array fields only
        $not?: { /* any of the operators above */ };
      };
} & {
  $and?: EntityFilterQuery<T>[];
  $or?: EntityFilterQuery<T>[];
  $nor?: EntityFilterQuery<T>[];
};

/** Options accepted by list() and filter() to read one cursor page of records. */
interface EntityListOptions<T, K extends keyof T = keyof T> {
  /** Sort parameter, such as '-priority' for descending. Defaults to '-created_date'. */
  sort?: SortField<T>;
  /** Maximum number of records per page, up to 5,000. Defaults to 100. */
  limit?: number;
  /** The `next_cursor` from the previous page. Omit or pass `null` for the first page. Passing other parameters alongside a cursor is an error - the token already carries the original walk's parameters. */
  cursor?: string | null;
  /** Array of field names to include in each record. Defaults to all fields. */
  fields?: K[];
}

/** Options accepted by list() and filter() to read the distinct values of one field instead of records. */
interface EntityDistinctOptions<T, K extends keyof T = keyof T> {
  /** Field whose distinct values to return, in ascending order. For an array field, this returns the distinct individual elements used across records, not the distinct arrays. */
  distinct: K;
  /** Maximum number of values per page, up to 1,000. Defaults to 100. */
  limit?: number;
  /** The `next_cursor` from the previous page. Omit or pass `null` for the first page. */
  cursor?: string | null;
}

/** A time bucket to group a date field by, for EntityAggregateSpec.dateBucket. */
interface EntityDateBucket<T> {
  /** The date field to bucket by: created_date, updated_date, or a date field of your schema. */
  field: keyof T & string;
  /** Every date field supports 'day', 'month', and 'year'. created_date and updated_date also support 'week'. */
  unit: "day" | "week" | "month" | "year";
}

/** Describes what aggregate() computes: name the fields to group by and the measures to compute. */
interface EntityAggregateSpec<T> {
  /** Filter applied before grouping, matching EntityFilterQuery. Defaults to all records. */
  query?: EntityFilterQuery<T>;
  /** Field, or up to 4 fields, to group by. Omit to get one total row. */
  groupBy?: (keyof T & string) | (keyof T & string)[];
  /** Group by a time bucket of a date field. */
  dateBucket?: EntityDateBucket<T>;
  /** Whether to include the number of records per group as `count`. Defaults to `true`. */
  count?: boolean;
  /** Field, or fields, to sum. Each appears in the rows as `sum_<field>`. */
  sum?: (keyof T & string) | (keyof T & string)[];
  /** Field, or fields, to average. Each appears in the rows as `avg_<field>`. */
  avg?: (keyof T & string) | (keyof T & string)[];
  /** Field, or fields, to take the minimum of. Each appears in the rows as `min_<field>`. */
  min?: (keyof T & string) | (keyof T & string)[];
  /** Field, or fields, to take the maximum of. Each appears in the rows as `max_<field>`. */
  max?: (keyof T & string) | (keyof T & string)[];
  /** Field whose distinct values to count per group, returned as `count_distinct_<field>`. Unlike `distinct` on list()/filter(), an array field here counts each whole array as one value. */
  countDistinct?: keyof T & string;
  /** Filter applied to the computed fields after grouping. Supports $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin. With more than one key, a row is kept only when every key's condition holds. */
  having?: Record<string, any>;
  /** Computed or group field to sort the rows by, with a '-' prefix for descending, e.g. '-count'. */
  sort?: string;
  /** Maximum number of rows, up to 1,000. Defaults to 1,000. */
  limit?: number;
}

/** Options for upsert(). */
interface EntityUpsertOptions<T> {
  /** Field, or fields, that identify a record. A record whose key values match an existing record updates it; any other record is created. */
  key: (keyof T & string) | (keyof T & string)[];
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
  /** Lists one cursor page of records, sorted and optionally field-selected. Max 5,000 per page. */
  list<K extends keyof T = keyof T>(options: EntityListOptions<T, K>): Promise<EntityPage<Pick<T, K>>>;

  /** Lists one cursor page of a single field's distinct values instead of records. Max 1,000 per page. */
  list<K extends keyof T>(options: EntityDistinctOptions<T, K>): Promise<EntityPage<T[K]>>;

  /** Lists records as an array, using `skip` for pagination (legacy form; prefer a cursor). Max 5,000 per request. */
  list<K extends keyof T = keyof T>(
    sort?: SortField<T>,
    limit?: number,
    skip?: number,
    fields?: K[]
  ): Promise<Pick<T, K>[]>;

  /** Filters and returns one cursor page of matching records, sorted and optionally field-selected. Max 5,000 per page. */
  filter<K extends keyof T = keyof T>(
    query: EntityFilterQuery<T>,
    options: EntityListOptions<T, K>
  ): Promise<EntityPage<Pick<T, K>>>;

  /** Filters and returns one cursor page of a single field's distinct values among matching records. Max 1,000 per page. */
  filter<K extends keyof T>(
    query: EntityFilterQuery<T>,
    options: EntityDistinctOptions<T, K>
  ): Promise<EntityPage<T[K]>>;

  /** Filters records as an array, using `skip` for pagination (legacy form; prefer a cursor). Max 5,000 per request. */
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

  /** Updates an existing record by ID (partial update). */
  update(id: string, data: Partial<T>): Promise<T>;

  /** Deletes a single record by ID. The record moves to the entity's trash. */
  delete(id: string): Promise<DeleteResult>;

  /** Deletes multiple records matching a query. Records move to trash. Not a transaction. */
  deleteMany(query: Partial<T>): Promise<DeleteManyResult>;

  /** Creates multiple records in a single request. Not a transaction. */
  bulkCreate(data: Partial<T>[]): Promise<T[]>;

  /**
   * Applies the same update to all records matching a query, using MongoDB update operators.
   * Batched in groups of up to 500; check `has_more` to continue. The query parameter is
   * typed as `Partial<T>` in source but its JSDoc says it matches `EntityFilterQuery`, so
   * operator objects like `{ $in: [...] }` are accepted at runtime despite the looser type.
   * @param query - Filter to select which records to update.
   * @param data - MongoDB update operator object (e.g., `{ $set: { field: value } }`).
   */
  updateMany(query: Partial<T>, data: Record<string, Record<string, any>>): Promise<UpdateManyResult>;

  /** Counts the records that match a query, without fetching them. Defaults to all records. */
  count(query?: EntityFilterQuery<T>): Promise<number>;

  /** Computes counts, sums, averages, min/max, or distinct counts, grouped by fields. Up to 1,000 rows. */
  aggregate(spec: EntityAggregateSpec<T>): Promise<EntityAggregateResult>;

  /**
   * Creates or updates records by a key you define, instead of by `id`. Up to 500 records
   * per call. Updates merge fields into the existing record, like `update()`.
   */
  upsert(records: Partial<T>[], options: EntityUpsertOptions<T>): Promise<EntityUpsertResult<T>>;

  /** Updates up to 500 records by ID in a single request, each with its own update data. */
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