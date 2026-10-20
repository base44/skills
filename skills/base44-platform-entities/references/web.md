<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
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
Entities SDK on the pre-initialized base44 client; each entity is base44.entities.EntityName:

```js
import { base44 } from '@/api/base44Client';

base44.entities.Todo.list()
base44.entities.Todo.list('-updated_date', 20)  // sort, limit
base44.entities.Todo.filter({status: 'active', created_by_id: user.id}, '-created_date', 10)
base44.entities.Todo.create({title: "Todo 1"})
base44.entities.Todo.bulkCreate([{title: "Todo 2"}, {title: "Todo 3"}])
base44.entities.Todo.update(todo.id, {description: "new"})
base44.entities.Todo.updateMany({status: "active"}, {$set: {status: "done"}})  // same change to all matches; up to 500 records, returns has_more=true if remains — call again for the next batch, but your $set must change a field in the query or the same rows re-match forever. 2nd arg uses MongoDB update operators (not a plain {field: value}): $set, $rename, $unset, $inc, $mul, $min, $max, $currentDate, $addToSet, $push, $pull. careful: no schema validation
base44.entities.Todo.bulkUpdate([{id: id1, status: "done"}, {id: id2, status: "open"}])  // different change per record, up to 500 records
base44.entities.Todo.delete(todo.id)
base44.entities.Todo.deleteMany({status: "archived"})  // deletes all matches in one call. careful: a broad or empty ({}) query deletes everything it's allowed to
```

<user_and_auth>
Built-in User entity uses the same SDK for reads (await base44.entities.User.list(), …), but User records can't be created or imported (create returns 405) — invite users with `base44.users.inviteUser(email, role)`. Auth SDK:
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
