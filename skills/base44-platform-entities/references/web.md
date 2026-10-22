<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 entities: Entities and the entity SDK (web apps)

Entities = JSON schema objects defining stored data. Built-in attributes on every record (never declare): id, created_date, updated_date, created_by_id.

<deleting_entities>
Restoring entities is possible from the UI.
</deleting_entities>
<user_entity>
User is built-in on every app — never create it. Read-only: id, created_date, full_name, email. Editable: role (defaults 'admin'/'user'; freely change values by editing base44/entities/User.jsonc, declaring only customized fields). Built-in security: only admins list/update/delete other users. Don't add custom User RLS unless explicitly asked. You cannot insert User records — users join via invites; say so if asked.
</user_entity>

<field_limits>
Never store large content (base64, PDFs, blobs) in entity fields — upload via UploadPrivateFile for anything an end user uploads, store the returned file_uri; oversized fields break record operations.
</field_limits>

<entities_sdk>
Entities SDK on the pre-initialized base44 client; each entity is base44.entities.EntityName. Calls are rate-limited per app and every record read counts against the app's budget, so the server does the filtering, counting and math. Pick the call by what the screen needs:
- a list of records → filter(query, {sort, limit, fields}), a page: read .items, never treat it as an array; more rows on demand → the same call with cursor
- a number (total, badge, "N of M") → count(query); a sum or average → aggregate
- totals per group, a chart, a leaderboard, "top products" → aggregate({groupBy or dateBucket, sum/avg/min/max})
- dropdown or autocomplete values → the schema enum when the field declares one, else filter(query, {distinct: 'field'})
- import or sync keyed by your own id → upsert(records, {key})
- every record → only for an export (CSV download, backup, sync), with the cursor loop
A list on screen is one page: filter(query, {sort, limit: 50}) with a "load more" that passes cursor, not a 500-row fetch into state. A number or grouping added to an existing page gets its own count/aggregate call even when a list is already loaded — that list is one page, not the data — and replacing a loaded-list computation with the server call is part of the ask, not a refactor. Every filter, dropdown choice or search term the user changes is a new filter() call with those conditions in the query (text search: $regex), replacing the page on screen; narrowing the loaded page in JS shows only what happened to be on it. Never load records to filter, count, sum or dedupe them in JS — `const all = await Sale.list(); all.filter(s => s.store === store).reduce(...)` is wrong even for a small table, because tables grow; `Sale.aggregate({query: {store}, sum: 'total'})` is right. A search box is a `$regex` filter on the server, not `.includes()` on a loaded list.

```js
import { base44 } from '@/api/base44Client';

base44.entities.Todo.filter({priority: {$in: ['high', 'urgent']}, due_date: {$gte: '2026-01-01', $lt: '2026-02-01'}, archived: {$exists: false}}, {sort: '-due_date', limit: 100, fields: ['title', 'due_date']})  // → {items, next_cursor, has_more}: the options form ALWAYS returns a page object, never an array — read .items. MongoDB operators ($in/$nin/$gt/$gte/$lt/$lte/$ne/$exists/$or) on any field; fields returns only those (plus id)
base44.entities.Todo.filter({status: 'open'}, {sort: '-created_date', limit: 1000, cursor})  // one page: {items, next_cursor, has_more}. "Load more"/infinite scroll and export loops: first call without cursor, then cursor = page.next_cursor until has_more is false. Same options on list({sort, limit, cursor, fields})
base44.entities.Todo.count({status: 'open'})  // a number, no records transferred: totals, badges, "N of M", pagination totals
// An entity with field-level read rules (per-field visibility in its schema) rejects aggregate and distinct with a 400: there, use count for numbers and one filter page for the rest, and say so in the summary
base44.entities.Todo.aggregate({query: {status: 'done'}, groupBy: 'owner', sum: ['amount', 'hours'], sort: '-sum_amount'})  // {rows: [{owner, count, sum_amount, sum_hours}], truncated}; one call computes every sum/avg/min/max you need; sort names a group field or a computed column (count, sum_<field>, avg_<field>…), nothing else. Also dateBucket: {field: 'created_date', unit: 'day'|'week'|'month'|'year'}, avg/min/max, countDistinct: 'field', having: {count: {$gt: 1}} (duplicates), limit up to 1000. Dashboards, totals per group, charts
// aggregate has the lowest rate limit (about 15 calls a minute per app): still far better than loading the collection to compute in JS, but spend it sparingly: several counters or totals on the same entity (per status, per owner, open vs done) come from one aggregate with groupBy, each read from its row, not one aggregate or count call per counter; a separate call only for another entity, another query, or a measure one call cannot hold (a second countDistinct)
base44.entities.Todo.list({distinct: 'category'})  // {items: values, next_cursor, has_more}: dropdowns and autocomplete; also filter(query, {distinct: 'field'})
base44.entities.Todo.upsert(records, {key: 'external_id'})  // create-or-update by your own key (or {key: ['a', 'b']}), up to 500 per call: {created, updated, records}. Imports and syncs; never read first to check what exists
base44.entities.Todo.filter({name: {$regex: '^ann', $options: 'i'}})  // prefix/contains text match, only when the feature really needs it: it scans, so keep it behind another filter, keep the pattern simple, and never use it for exact matches
base44.entities.Todo.create({title: "Todo 1"})
base44.entities.Todo.bulkCreate([{title: "Todo 2"}, {title: "Todo 3"}])
base44.entities.Todo.update(todo.id, {description: "new"})
base44.entities.Todo.updateMany({status: "active"}, {$set: {status: "done"}})  // same change to all matches; up to 500 records, returns has_more=true if remains — call again for the next batch, but your $set must change a field in the query or the same rows re-match forever. 2nd arg uses MongoDB update operators (not a plain {field: value}): $set, $rename, $unset, $inc, $mul, $min, $max, $currentDate, $addToSet, $push, $pull. careful: no schema validation
base44.entities.Todo.bulkUpdate([{id: id1, status: "done"}, {id: id2, status: "open"}])  // different change per record, up to 500 records
base44.entities.Todo.delete(todo.id)
base44.entities.Todo.deleteMany({status: "archived"})  // deletes all matches in one call. careful: a broad or empty ({}) query deletes everything it's allowed to
```

<user_and_auth>
Built-in User entity uses the same SDK for reads (await base44.entities.User.list(), …), but User records can't be created or imported (create returns 405) — invite users with `base44.users.inviteUser(email, role)`. count, aggregate, upsert and the cursor form are not available on User. Auth SDK:
- await base44.auth.me() — current user; can throw if not logged in on a public app.
- await base44.auth.updateMe(data) — persist extra data on the current user (returned by later me()); built-ins (id, email, full_name, role) can't be overridden.
- base44.auth.isAuthenticated() — Promise<boolean>.
- base44.auth.logout(redirectUrl?: string) — then redirect to redirectUrl, or reload.
- base44.auth.redirectToLogin(nextUrl?: string) — app login page; after login → nextUrl, else the triggering page.
</user_and_auth>

<realtime_subscriptions>
```js
useEffect(() => {
  // event: { id, type: 'create'|'update'|'delete', data }
  const unsubscribe = base44.entities.Todo.subscribe((event) => { /* update state from event */ });
  return unsubscribe;
}, []);
```
</realtime_subscriptions>
</entities_sdk>
