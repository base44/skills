# Entities Module

CRUD operations on data models. Access via `base44.entities.EntityName.method()`.

## Contents
- [Methods](#methods)
- [Examples](#examples) (Create, Bulk Create, List, Cursor Pagination, Distinct Values, Filter, Filter Operators, Get, Count, Aggregate, Update, Update Many, Bulk Update, Upsert, Delete, Import, Subscribe)
- [User Entity](#user-entity)
- [Service Role Access](#service-role-access)
- [Permissions](#permissions)

## Methods

**Note:** The maximum limit for the array forms of `list()` and `filter()` is 5,000 items per request. The cursor forms (passing an options object) also cap `limit` at 5,000 for records and 1,000 for `distinct` values.

| Method | Signature | Description |
|--------|-----------|-------------|
| `create(data)` | `Promise<T>` | Create one record |
| `bulkCreate(dataArray)` | `Promise<T[]>` | Create multiple records in one request (not a transaction) |
| `list(sort?, limit?, skip?, fields?)` | `Promise<Pick<T, K>[]>` | Get all records as an array (`skip`-based pagination). Prefer the cursor form below for loops |
| `list(options)` | `Promise<EntityPage<Pick<T, K>>>` | Get one cursor page of records, or (with `options.distinct`) one page of a field's distinct values |
| `filter(query, sort?, limit?, skip?, fields?)` | `Promise<Pick<T, K>[]>` | Get matching records as an array (`skip`-based pagination) |
| `filter(query, options)` | `Promise<EntityPage<Pick<T, K>>>` | Get one cursor page of matching records, or (with `options.distinct`) one page of a field's distinct values among matches |
| `get(id)` | `Promise<T>` | Get single record by ID |
| `count(query?)` | `Promise<number>` | Count records matching a query, without fetching them |
| `aggregate(spec)` | `Promise<EntityAggregateResult>` | Server-side group-by: counts, sums, averages, min/max, distinct counts |
| `update(id, data)` | `Promise<T>` | Update record (partial update) |
| `updateMany(query, data)` | `Promise<UpdateManyResult>` | Update all matching records using MongoDB update operators (batched in groups of up to 500) |
| `bulkUpdate(dataArray)` | `Promise<T[]>` | Update up to 500 specific records by ID in one request, each with its own data (not a transaction) |
| `upsert(records, options)` | `Promise<EntityUpsertResult<T>>` | Create or update up to 500 records by a key field you define, instead of by `id` (not a transaction) |
| `delete(id)` | `Promise<DeleteResult>` | Delete record by ID (moves to trash) |
| `deleteMany(query)` | `Promise<DeleteManyResult>` | Delete all matching records (moves to trash; not a transaction) |
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

**Note:** `bulkCreate` isn't a transaction. Each record is written on its own, so if the call fails partway, the records already written stay written.

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

### Cursor Pagination (preferred for loops)

`list()` and `filter()` also accept a single options object and return one `{ items, next_cursor, has_more }` page instead of a plain array. Pass `cursor` from the previous page's `next_cursor` to keep paging; omit it (or pass `null`) for the first page. Records added or deleted between pages never shift the boundary, unlike `skip`-based paging.

```javascript
// First page
let page = await base44.entities.Task.list({ sort: "-created_date", limit: 1000 });
const allTasks = [...page.items];

// Walk every remaining page
while (page.has_more) {
  page = await base44.entities.Task.list({ cursor: page.next_cursor, limit: 1000 });
  allTasks.push(...page.items);
}

// Same cursor pagination works with filter()
let openPage = await base44.entities.Task.filter(
  { status: "open" },
  { sort: "-created_date", limit: 1000 }
);
while (openPage.has_more) {
  openPage = await base44.entities.Task.filter(
    { status: "open" },
    { cursor: openPage.next_cursor, limit: 1000 }
  );
}

// Only return specific fields
const slim = await base44.entities.Task.list({ fields: ["title", "status"], limit: 10 });
```

### Distinct Values

Pass `distinct: "<field>"` in the options object (instead of `sort`/`fields`) to page through a single field's distinct values rather than full records. For an array field, each individual element counts once (not each array).

```javascript
// Regular field
const { items: statuses } = await base44.entities.Task.list({ distinct: "status" });
// statuses: ['done', 'in-progress', 'pending']

// Scoped to a filter
const { items: assignees } = await base44.entities.Task.filter(
  { status: "open" },
  { distinct: "assignedTo" }
);

// Array field - each tag counts once, not each array
const { items: tags } = await base44.entities.Task.list({ distinct: "tags" });
```

**Note:** `distinct` pages cap `limit` at 1,000 (default 100), vs. 5,000 for record pages.

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

### Filter Operators

Field values accept an exact value, `null`, an array shorthand (matches any of the listed values), or a MongoDB-style operator object. Operators are typed from the field: numeric fields accept comparisons, string fields accept `$regex`, array fields accept `$all`/`$size`. Root-level `$and`, `$or`, and `$nor` combine nested filter queries, and field name matching is case-sensitive.

| Operator | Meaning |
|----------|---------|
| `$eq` | Equal to value (or `null`) |
| `$ne` | Not equal to value |
| `$gt` / `$gte` | Greater than / greater than or equal |
| `$lt` / `$lte` | Less than / less than or equal |
| `$in` | Value is one of the given array |
| `$nin` | Value is not one of the given array |
| `$exists` | Field is present (`true`) or absent (`false`) |
| `$regex` | String matches the regex (string fields only) |
| `$all` | Array field contains all given elements |
| `$size` | Array field has exactly this length |
| `$not` | Negates a nested field-level operator object |
| `$and` / `$or` / `$nor` | Root-level: combine nested filter queries |

```javascript
// Comparison operators
const popular = await base44.entities.Task.filter({
  viewCount: { $gte: 100 },
  priority: { $in: ["high", "critical"] }
});

// Array shorthand - matches any of the listed values (equivalent to $in)
const some = await base44.entities.Task.filter({
  externalId: ["item-1", "item-2"]
});

// Logical operators ($or, $and, $nor) at the root level
const urgentOrMine = await base44.entities.Task.filter({
  $or: [
    { priority: "critical" },
    { assignedTo: userId }
  ]
});

// Filter null / missing values
const noDueDate = await base44.entities.Task.filter({ dueDate: null });
const missingField = await base44.entities.Task.filter({ dueDate: { $exists: false } });

// String regex, array $all / $size, and $not
const matches = await base44.entities.Task.filter({
  title: { $regex: "^Bug" },
  tags: { $all: ["urgent", "backend"], $size: 2 },
  status: { $not: { $eq: "archived" } }
});
```

### Get by ID

```javascript
const task = await base44.entities.Task.get("task-id-123");
```

### Count

Returns the number of matching records without fetching them. Use for totals, badges, and "page N of M".

```javascript
const open = await base44.entities.Task.count({ status: "open" });

// Count all records
const total = await base44.entities.Task.count();

// Page N of M
const pageSize = 20;
const totalPages = Math.ceil(total / pageSize);
```

### Aggregate

Server-side group-by: computes counts, sums, averages, min/max, or distinct counts per group, up to 1,000 rows. Use it for dashboards and reports instead of loading every record and reducing it client-side.

```javascript
// Sales per agent this month, biggest first
const { rows } = await base44.entities.Sale.aggregate({
  query: { sale_date: { $gte: "2026-09-01" } },
  groupBy: "agent_id",
  sum: "amount",
  sort: "-sum_amount"
});
// rows: [{ agent_id: 'a1', count: 42, sum_amount: 18250 }, ...]

// Group by a date bucket
const { rows: daily } = await base44.entities.Task.aggregate({
  dateBucket: { field: "created_date", unit: "day" }
});
// rows: [{ created_date: '2026-09-01', count: 8 }, ...]

// having: filter the computed rows after grouping (supports $eq, $ne, $gt, $gte, $lt, $lte, $in, $nin)
const { rows: duplicates } = await base44.entities.Order.aggregate({
  groupBy: "external_id",
  having: { count: { $gt: 1 } }
});

// Distinct customers per product (array fields count the whole array as one value here,
// unlike distinct on list()/filter())
const { rows: uniqueCustomers } = await base44.entities.Order.aggregate({
  groupBy: "product_id",
  countDistinct: "customer_id"
});
```

`aggregate()` accepts `query` (pre-grouping filter), `groupBy` (one or up to four fields), `dateBucket`, `count` (default `true`), `sum`/`avg`/`min`/`max` (field or fields), `countDistinct` (one field), `having`, `sort`, and `limit` (default and max 1,000). The result's `truncated` flag is `true` when more groups exist than `limit` allowed.

### Update

```javascript
// Partial update - only specified fields change
await base44.entities.Task.update("task-id-123", {
  status: "completed",
  completedAt: new Date().toISOString()
});
```

### Delete

Deleted records move to the entity's trash. Use **Recently deleted** in the Data tab, or the Restore/Permanently delete entity record API endpoints, to restore or purge them. `deleteMany` isn't a transaction — each matching record is deleted on its own, so if the call fails partway, the records already deleted stay deleted.

```javascript
// Single record
const result = await base44.entities.Task.delete("task-id-123");
console.log("Deleted:", result.success);

// Multiple records matching query
const manyResult = await base44.entities.Task.deleteMany({ status: "archived" });
console.log("Deleted:", manyResult.deleted);
```

### Update Many (MongoDB-style)

Applies the same update to every record matching a query. Results are batched in groups of up to 500: when `has_more` is `true`, call `updateMany` again with the same query to update the next batch (make sure the query excludes already-updated records, e.g. filter by the pre-update status, so you don't reprocess the same records). Each matching record is updated on its own (not a transaction), but all update operators in one call (`$set`, `$inc`, etc.) are applied to each record in a single write.

```javascript
// Update all pending tasks to status "in-progress"
const result = await base44.entities.Task.updateMany(
  { status: "pending" },                     // query: which records to update
  { $set: { status: "in-progress" } }        // MongoDB update operator
);
console.log("Updated:", result.updated, "Has more:", result.has_more);

// Increment a counter field
await base44.entities.Task.updateMany(
  { category: "bugs" },
  { $inc: { priority: 1 } }
);

// Process everything in batches of 500
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

Supported update operators: `$set`, `$rename`, `$unset`, `$inc`, `$mul`, `$min`, `$max`, `$currentDate`, `$addToSet`, `$push`, `$pull`. Each field may only appear in one operator per call.

**Claiming a record safely:** when the query names a single `id`, the extra conditions are re-checked at write time, so only one of several concurrent callers can succeed. Any other query (including multiple IDs via `$in`/`$or`) finds matching records first and then updates them, without that re-check guarantee.

```javascript
// Only one caller can claim the task, even if several try at the same time
const result = await base44.entities.Task.updateMany(
  { id: taskId, status: "open" },
  { $set: { status: "claimed", claimed_by: user.email } }
);
if (result.updated === 1) {
  // This caller claimed the task
}

// Optimistic concurrency with a version field
const result2 = await base44.entities.Document.updateMany(
  { id: doc.id, version: doc.version },
  { $set: { body: newBody }, $inc: { version: 1 } }
);
if (result2.updated === 0) {
  // Someone else saved a change first; reload and retry
}
```

### Bulk Update (by ID)

Updates up to 500 specific records per request, each with its own data. Not a transaction — each record is written on its own, so if the call fails partway, the records already written stay written. For more than 500, chunk your updates into batches.

```javascript
// Update multiple records, each with different data
const updated = await base44.entities.Task.bulkUpdate([
  { id: "task-1", status: "done", completedAt: new Date().toISOString() },
  { id: "task-2", status: "in-progress", assignedTo: userId },
  { id: "task-3", priority: 5 }
]);
```

### Upsert (create or update by a natural key)

Creates or updates records by a key field you define (e.g. an external system's ID), instead of by `id`, so you don't have to look up each record first. Up to 500 records per request; when two records in one call share a key, the last one wins. Matches merge the given fields into the existing record, like `update()`. Not a transaction, and concurrent calls with the same key can create duplicate records.

```javascript
// Sync by a single key field
const result = await base44.entities.Product.upsert(
  supplierCatalog.map(p => ({ sku: p.sku, name: p.name, price: p.price })),
  { key: "sku" }
);
console.log(`${result.created} new, ${result.updated} updated`);
// result.records: all written records (created + updated), as they now exist

// Compound key (array of fields)
const result2 = await base44.entities.Inventory.upsert(
  warehouseFeed.map(row => ({ sku: row.sku, warehouse: row.warehouseCode, quantity: row.qty })),
  { key: ["sku", "warehouse"] }
);
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

**Oversize records:** realtime broadcasts are capped in size for the websocket transport. If a record's payload is too large, the server marks it with `_oversize: true` on `data`, string fields over ~10 KB arrive empty, and the rest of the record may be a stub. The SDK logs a console error naming the affected entity/id when this happens (skipped for `delete` events, since there's no data). On an oversize event, fetch the full record yourself, e.g. `base44.entities.Task.get(event.id)`, instead of rendering the slimmed payload.

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
  /** Whether more matching entities remain unupdated (batches are capped at 500). Call `updateMany` again with the same query to update the next batch. */
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

### Filter Query Types

```typescript
/**
 * Query object accepted by filter(), count(), deleteMany(), updateMany(), and the
 * `query` field of an aggregate spec. Field keys are typed from the entity schema;
 * each field accepts an exact value, `null`, an array shorthand (match any), or a
 * field-level operator object. Root-level $and/$or/$nor combine nested queries.
 */
type EntityFilterQuery<T> = {
  [K in keyof T]?: EntityFilterValue<T[K]>;
} & {
  $and?: EntityFilterQuery<T>[];
  $or?: EntityFilterQuery<T>[];
  $nor?: EntityFilterQuery<T>[];
};

/** Value accepted when filtering one entity field. */
type EntityFilterValue<T> =
  | (Exclude<T, undefined> | null)                 // exact match or null
  | (Exclude<T, undefined> | null)[]                // array shorthand: matches any value
  | EntityFilterOperators<T>;                       // operator object

/** MongoDB-style query operators accepted for a single field. */
type EntityFilterOperators<T> = {
  $eq?: Exclude<T, undefined> | null;
  $ne?: Exclude<T, undefined> | null;
  $gt?: Exclude<T, undefined> | null;
  $gte?: Exclude<T, undefined> | null;
  $lt?: Exclude<T, undefined> | null;
  $lte?: Exclude<T, undefined> | null;
  $in?: (Exclude<T, undefined> | null)[];
  $nin?: (Exclude<T, undefined> | null)[];
  $exists?: boolean;
  $regex?: string;                 // string fields only
  $all?: T extends readonly (infer U)[] ? U[] : never;  // array fields only
  $size?: number;                  // array fields only
  /** Negates another field-level filter expression. */
  $not?: EntityFilterOperators<T>;
};
```

### Pagination Types

```typescript
/** Options for list()/filter() to read one cursor page of records. Up to 5,000 per page. */
interface EntityListOptions<T, K extends keyof T = keyof T> {
  /** Sort parameter, e.g. '-priority'. Defaults to '-created_date'. */
  sort?: SortField<T>;
  /** Max records per page, up to 5,000. Defaults to 100. */
  limit?: number;
  /** `next_cursor` from the previous page. Omit or pass `null` for the first page. */
  cursor?: string | null;
  /** Fields to include in each record. Defaults to all fields. */
  fields?: K[];
}

/** Options for list()/filter() to read one cursor page of a field's distinct values instead of records. */
interface EntityDistinctOptions<T, K extends keyof T = keyof T> {
  /** Field whose distinct values to return, ascending. For array fields, returns distinct elements, not distinct arrays. */
  distinct: K;
  /** Max values per page, up to 1,000. Defaults to 100. */
  limit?: number;
  /** `next_cursor` from the previous page. Omit or pass `null` for the first page. */
  cursor?: string | null;
}

/** One page of items (records, or distinct values when `distinct` was requested), with a cursor to continue. */
interface EntityPage<T> {
  items: T[];
  /** Cursor for the next page, or `null` on the last page. */
  next_cursor: string | null;
  /** Whether records remain after this page. */
  has_more: boolean;
}
```

### Aggregate Types

```typescript
/** A time bucket to group a date field by. */
interface EntityDateBucket<T> {
  /** Date field to bucket by: created_date, updated_date, or a schema date field. */
  field: keyof T & string;
  /** Every date field supports day/month/year; created_date/updated_date also support week. */
  unit: "day" | "week" | "month" | "year";
}

/** Describes what aggregate() computes: group-by fields plus measures. */
interface EntityAggregateSpec<T> {
  /** Filter applied before grouping. Defaults to all records. */
  query?: EntityFilterQuery<T>;
  /** Field, or up to four fields, to group by. Omit for one total row. */
  groupBy?: (keyof T & string) | (keyof T & string)[];
  /** Group by a time bucket of a date field. */
  dateBucket?: EntityDateBucket<T>;
  /** Include record count per group as `count`. Defaults to `true`. */
  count?: boolean;
  /** Field(s) to sum, returned as `sum_<field>`. */
  sum?: (keyof T & string) | (keyof T & string)[];
  /** Field(s) to average, returned as `avg_<field>`. */
  avg?: (keyof T & string) | (keyof T & string)[];
  /** Field(s) to min, returned as `min_<field>`. */
  min?: (keyof T & string) | (keyof T & string)[];
  /** Field(s) to max, returned as `max_<field>`. */
  max?: (keyof T & string) | (keyof T & string)[];
  /** Field whose distinct values to count per group, as `count_distinct_<field>`. Array fields count the whole array as one value. */
  countDistinct?: keyof T & string;
  /** Filter on computed fields after grouping. Supports $eq/$ne/$gt/$gte/$lt/$lte/$in/$nin; all keys must hold. */
  having?: Record<string, any>;
  /** Computed or group field to sort by, '-' prefix for descending, e.g. '-count'. */
  sort?: string;
  /** Max rows, up to 1,000. Defaults to 1,000. */
  limit?: number;
}

/** Rows returned by aggregate(). */
interface EntityAggregateResult {
  /** One row per group: group fields, then count/sum_<field>/avg_<field>/min_<field>/max_<field>/count_distinct_<field>. */
  rows: Record<string, any>[];
  /** `true` when more groups exist than `limit` allowed. */
  truncated: boolean;
}
```

### Upsert Types

```typescript
/** Options for upsert(). */
interface EntityUpsertOptions<T> {
  /** Field, or fields, identifying a record. Matching values update the existing record; otherwise a new one is created. */
  key: (keyof T & string) | (keyof T & string)[];
}

/** Result returned by upsert(). */
interface EntityUpsertResult<T = any> {
  /** Number of records created. */
  created: number;
  /** Number of existing records updated. */
  updated: number;
  /** The written records (created and updated), as they now exist. */
  records: T[];
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
  /** Cursor page of records, sorted and optionally field-selected. Up to 5,000 per page. */
  list<K extends keyof T = keyof T>(options: EntityListOptions<T, K>): Promise<EntityPage<Pick<T, K>>>;

  /** Cursor page of one field's distinct values instead of records. Up to 1,000 per page. */
  list<K extends keyof T>(options: EntityDistinctOptions<T, K>): Promise<EntityPage<T[K]>>;

  /** Lists records as an array, using `skip` for pagination (kept for existing code; prefer the cursor form above). Max 5,000 per request. */
  list<K extends keyof T = keyof T>(
    sort?: SortField<T>,
    limit?: number,
    skip?: number,
    fields?: K[]
  ): Promise<Pick<T, K>[]>;

  /** Cursor page of matching records, sorted and optionally field-selected. Up to 5,000 per page. */
  filter<K extends keyof T = keyof T>(
    query: EntityFilterQuery<T>,
    options: EntityListOptions<T, K>
  ): Promise<EntityPage<Pick<T, K>>>;

  /** Cursor page of one field's distinct values among matching records. Up to 1,000 per page. */
  filter<K extends keyof T>(
    query: EntityFilterQuery<T>,
    options: EntityDistinctOptions<T, K>
  ): Promise<EntityPage<T[K]>>;

  /** Filters records as an array, using `skip` for pagination (kept for existing code; prefer the cursor form above). Max 5,000 per request. */
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

  /** Deletes a single record by ID. Moves it to the trash. */
  delete(id: string): Promise<DeleteResult>;

  /** Deletes all records matching a query. Not a transaction. */
  deleteMany(query: Partial<T>): Promise<DeleteManyResult>;

  /** Creates multiple records in a single request. Not a transaction. */
  bulkCreate(data: Partial<T>[]): Promise<T[]>;

  /** Counts records matching a query, without fetching them. Omit `query` to count all records. */
  count(query?: EntityFilterQuery<T>): Promise<number>;

  /** Computes counts, sums, averages, min/max, or distinct counts, grouped by fields. Up to 1,000 rows. */
  aggregate(spec: EntityAggregateSpec<T>): Promise<EntityAggregateResult>;

  /**
   * Applies the same update to all records matching a query, using MongoDB update operators.
   * Batched in groups of up to 500; check `has_more` to continue. Not a transaction.
   * @param query - Filter to select which records to update.
   * @param data - MongoDB update operator object (e.g., `{ $set: { field: value } }`).
   */
  updateMany(query: Partial<T>, data: Record<string, Record<string, any>>): Promise<UpdateManyResult>;

  /** Creates or updates up to 500 records by a key field (not `id`) in one request. Not a transaction. */
  upsert(records: Partial<T>[], options: EntityUpsertOptions<T>): Promise<EntityUpsertResult<T>>;

  /** Updates up to 500 specific records by ID in a single request, each with its own data. Not a transaction. */
  bulkUpdate(data: (Partial<T> & { id: string })[]): Promise<T[]>;

  /** Imports records from a file (frontend only). */
  importEntities(file: File): Promise<ImportResult<T>>;

  /** Subscribes to realtime updates for all records of this entity type. Returns an unsubscribe function. */
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
