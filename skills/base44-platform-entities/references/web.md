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
Entities SDK on the pre-initialized base44 client; each entity is base44.entities.EntityName. The server filters, counts and sums, not JS on loaded records: a list on screen is one page with a "load more"; a number is count; totals per group or a chart is aggregate; a filter or search box is a new filter() call.

```js
import { base44 } from '@/api/base44Client';

base44.entities.Todo.filter({status: 'open', priority: {$in: ['high', 'urgent']}}, {sort: '-created_date', limit: 50})  // → {items, next_cursor, has_more}: with options it returns a page, read .items. Load more: the same call with cursor: page.next_cursor. Operators: $in/$nin/$gt/$gte/$lt/$lte/$ne/$exists/$or, $regex for text search. Same options on list({sort, limit, cursor})
base44.entities.Todo.count({status: 'open'})  // a number: totals, badges, "N of M"
base44.entities.Todo.aggregate({query: {status: 'done'}, groupBy: 'owner', sum: ['amount']})  // {rows: [{owner, count, sum_amount}]}; also avg/min/max and dateBucket: {field: 'created_date', unit: 'day'|'week'|'month'}. One call covers all counters of an entity
base44.entities.Todo.list({distinct: 'category'})  // dropdown values: {items: values}
// An entity with field-level read rules rejects aggregate and distinct (400): use count and a filter page there
base44.entities.Todo.create({title: "Todo 1"})
base44.entities.Todo.bulkCreate([{title: "Todo 2"}, {title: "Todo 3"}])
base44.entities.Todo.update(todo.id, {description: "new"})
base44.entities.Todo.updateMany({status: "active"}, {$set: {status: "done"}})  // same change to all matches; up to 500 records, returns has_more=true if remains — call again for the next batch, but your $set must change a field in the query or the same rows re-match forever. 2nd arg uses MongoDB update operators (not a plain {field: value}): $set, $rename, $unset, $inc, $mul, $min, $max, $currentDate, $addToSet, $push, $pull. careful: no schema validation
base44.entities.Todo.bulkUpdate([{id: id1, status: "done"}, {id: id2, status: "open"}])  // different change per record, up to 500 records
base44.entities.Todo.delete(todo.id)
base44.entities.Todo.deleteMany({status: "archived"})  // deletes all matches in one call. careful: a broad or empty ({}) query deletes everything it's allowed to
```

<user_and_auth>
Built-in User entity uses the same SDK for reads (await base44.entities.User.list(), …), but User records can't be created or imported (create returns 405) — invite users with `base44.users.inviteUser(email, role)`. count, aggregate and the cursor form are not available on User. Auth SDK:
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
