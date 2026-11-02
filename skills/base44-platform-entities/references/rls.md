<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 entities: Row-level security (RLS)

<rls_authoring_guide>

<overview>
Row-Level Security (RLS) decides which app users can read, create, update, or delete each record of an entity. You set it per entity in `base44/entities/<EntityName>.jsonc` under an `rls` key, and the platform applies it on every app-user request.

Mental model: each operation gets a Mongo-style filter, and a user may perform that operation on the records that match the filter. An operation with no rule stays open to everyone — including anonymous visitors on public / no-login apps — which is right for genuinely shared data and wrong for anything personal.
</overview>

<shape>
{
  "rls": {
    "read":   { ... },
    "create": { ... },
    "update": { ... },
    "delete": { ... }
  }
}
- Leave an operation open by omitting its key (or using `{}` or `true`).
- Set the operations you want to protect. It's easy to lock reads and forget writes, so when the goal is "make it private," cover read, update, and delete together. `create` is usually fine left open — users make their own records, and the platform stamps the creator automatically. Two cases do want an explicit `create` rule: public / no-login apps (otherwise anonymous visitors can insert records), and scopes keyed on a field the creator sets — like `data.tenant_id` or `data.members` — so a user can't plant a record in someone else's scope (e.g. `"create": { "data.tenant_id": "{{user.data.tenant_id}}" }`).
</shape>

<fields_and_user_values>
Records carry a few built-in fields at the top level — `id`, `created_by_id` (the creator's user id, your reliable "owner" handle), `created_by` (creator email), `created_date`, `updated_date`. Reference these directly.
Every field you defined on the entity lives under `data.`, so reference it with that prefix: a `status` field is `data.status`, a `members` field is `data.members`.

Describe the current user with `{{...}}` templates:
- `{{user.id}}` — pair with `created_by_id` for ownership
- `{{user.email}}`
- `{{user.role}}` — "admin" or "user"
- `{{user.data.<field>}}` — a custom field on the user, one level deep (e.g. `{{user.data.tenant_id}}`)
- When a user field is itself an array (e.g. `{{user.data.departments}}`), match a record field against the whole template as the `$in` operand: `{ "data.department": { "$in": "{{user.data.departments}}" } }` — the template is the entire value. Only this whole-operand form resolves; an array template used as a direct equality value (`{ "data.department": "{{user.data.departments}}" }`) or wrapped in a list (`{ "$in": ["{{user.data.departments}}"] }`) is left verbatim and matches nothing.

Users can edit their own custom User fields (`base44.auth.updateMe`), so a rule may only trust a value the user can't set themselves: `{{user.id}}`, `{{user.email}}`, `{{user.role}}`, record fields the write rules protect (`created_by_id`, a `members` list), or a custom User field locked as in the_user_entity. An unlocked `{{user.data.<field>}}` or custom field in `user_condition` lets a user set their own `tenant_id` to another tenant's and get that tenant's records.

Gate on a user value when every relevant user actually has it set. If a user's field is empty the template resolves to null, which matches records whose field is also empty rather than blocking — so `created_by_id` (always present) is the most dependable anchor, and custom user fields work well once you make sure they're populated.
</fields_and_user_values>

<checking_the_user_with_user_condition>
To allow access based on who the user is rather than a field on the record, use `user_condition`, which compares user attributes for exact equality:
  { "user_condition": { "role": "admin" } }
Keep `user_condition` as the only key in its object, and combine it with record conditions through `$or` / `$and` (see owner-or-admin below). A `$or` / `$and` / `$nor` is the same way — it must be the only key in its object, so to require a logical group *and* another condition, wrap both in an outer `$and` (e.g. `{ "$and": [ { "$or": [...] }, { "data.tenant_id": "{{user.data.tenant_id}}" } ] }`) rather than placing the field beside the `$or`. Use a plain value inside `user_condition` — it matches by exact equality. Role checks use "admin" (the elevated role) against the default "user".
</checking_the_user_with_user_condition>

<reads_and_writes>
Reads run as a database query and accept the comparison and array operators — `$eq`/`$ne`, `$in`/`$nin`, `$gt`/`$gte`/`$lt`/`$lte`, `$exists`, `$all`, `$size`, `$elemMatch` — plus `$or`/`$and`/`$nor`. (Text search like `$regex` isn't available, so scope reads by exact field values.) Writes (create / update / delete) are checked against the single record in application code, which understands a focused, dependable set — build write rules from these and they behave exactly as written:
  - equality: `{ "created_by_id": "{{user.id}}" }`
  - `$in` / `$nin` with a list: `{ "data.status": { "$in": ["active", "trial"] } }`
  - `$ne` with a single value: `{ "data.status": { "$ne": "archived" } }`
  - `$or` / `$and`, alternating when you nest them (an `$or` holding `$and` branches, and vice-versa)
  - `user_condition`
  - top-level `data.` fields, i.e. a single-segment key like `data.tenant_id`

Two natural adjustments for writes:
  - Membership: on reads, `{ "data.members": "{{user.id}}" }` matches when the array contains the user. For writes, write the same idea as `{ "data.members": { "$in": ["{{user.id}}"] } }`.
  - The read-only operators above (ranges, `$exists`, `$all`, `$size`, `$elemMatch`, and `$nor`) are great on `read`; keep write rules to the compact set above so they enforce cleanly.

Handy detail: when `update`/`delete` are absent they inherit `write`, then `read`. So if an entity's protection currently lives on `read`, add matching explicit `update`/`delete` rules before you open `read` up, so writes stay covered.
</reads_and_writes>

<a_library_of_good_rules>
Match the pattern to what the data is; `created_by_id` is the owner throughout.

Private to each user — their own records only (read / update / delete):
  { "created_by_id": "{{user.id}}" }

Owner, and admins see and manage everything:
  { "$or": [ { "created_by_id": "{{user.id}}" }, { "user_condition": { "role": "admin" } } ] }

Public to read, only the author edits — read open, writes owner-scoped:
  "read": {},
  "create": { "created_by_id": "{{user.id}}" },
  "update": { "created_by_id": "{{user.id}}" },
  "delete": { "created_by_id": "{{user.id}}" }

Everyone reads; only admins create or edit (announcements, shared catalog):
  "read": {},
  "create": { "user_condition": { "role": "admin" } },
  "update": { "user_condition": { "role": "admin" } },
  "delete": { "user_condition": { "role": "admin" } }

Visitor submissions the app's operator reviews (contact, booking, intake forms) — anyone submits; a logged-in submitter sees their own; only admins (plus any role that handles them) change them:
  "create": {},
  "read":   { "$or": [ { "created_by_id": "{{user.id}}" }, { "user_condition": { "role": "admin" } } ] },
  "update": { "user_condition": { "role": "admin" } },
  "delete": { "user_condition": { "role": "admin" } }
  (If visitors who don't log in need to see their own submission later — a status page, a receipt — keep read closed. When they submit, save a long random code from a secure source (`crypto.randomUUID()`) in its own field and give it to them (not the record id or their email, which can be guessed). Look it up in a backend or server function with the service-role client (`asServiceRole`). It is a deliberately public endpoint: skip the sign-in check, since the code is the check. Reject a missing or blank code before the query, and match it exactly, never as a regex. Return only the fields they need.)

Team / shared records — owner, a listed member, or an admin:
  read:  { "$or": [ { "created_by_id": "{{user.id}}" }, { "data.members": "{{user.id}}" }, { "user_condition": { "role": "admin" } } ] }
  write: { "$or": [ { "created_by_id": "{{user.id}}" }, { "data.members": { "$in": ["{{user.id}}"] } }, { "user_condition": { "role": "admin" } } ] }
  (If members only need to view, owner-or-admin on the write ops is simpler.)
  This assumes `data.members` is a list of user IDs (plain strings). If it's a list of objects (e.g. `[{ "user_id": ... }]`), match the sub-field on reads — `{ "data.members.user_id": "{{user.id}}" }` — because a plain value compared to a list of objects matches nothing. For write access there's no clean form (the write gate can't reach into an object list), so anchor member writes on `created_by_id`/admin, or denormalize to a list of plain user-ID strings.

Multi-tenant — each user sees only their organization's data (user carries `data.tenant_id`, so do the records). Apply to read/update/delete, and to create so a user can only add records in their own tenant, and lock the User's `tenant_id` (see the_user_entity):
  { "data.tenant_id": "{{user.data.tenant_id}}" }

Published-or-mine — a visibility state anyone can read, plus your own drafts:
  read:   { "$or": [ { "data.status": "published" }, { "created_by_id": "{{user.id}}" } ] }
  create/update/delete: { "created_by_id": "{{user.id}}" }
  (A plain `{ "data.status": "published" }` read is a fine visibility filter on its own; add the owner branch when people also need their own records. Combine visibility with identity using `$or`, or require both with `$and`.)

One extra care on update: when access depends on a field the user could change (`data.tenant_id`, `data.members`), base the access decision on the unchangeable `created_by_id` rather than that field, so a user editing the field can't quietly grant or revoke their own access. A top-level `update` rule authorizes the *existing* record before the new values are applied — it gates who may edit the record, not which fields they may touch — so `created_by_id` is the dependable anchor here.
</a_library_of_good_rules>

<keeping_the_right_people_in>
A good rule is precise and lets the intended users through. Three quick checks keep it that way:
- Anchor on a field the app guarantees on every record. `created_by_id` is set automatically on every record, so an owner rule always lets owners in — it's the safest anchor. A custom field works as an anchor only when the app fills it on every record (for example a required field set at creation); gating on a field that's sometimes empty locks out users whose records don't have it. Live population isn't something you can check at build time, so prefer `created_by_id` unless you know the field is always set.
- Reference fields that exist on the entity's schema (with the `data.` prefix for custom ones). A rule pointing at a field the records don't have matches nothing.
- Read the rule back from the owner's and admin's perspective and confirm they still satisfy it.
- To close an operation entirely, point it at whoever should still have access — for example admin-only (`{ "user_condition": { "role": "admin" } }`). Keep the condition real and satisfiable: an impossible one like `{ "id": { "$exists": false } }` matches no record, so it shuts everyone out (owners included) rather than restricting a subset.
When a rule matches no one, reads come back empty and writes are refused — so this precision is what separates "secured" from "locked out."
</keeping_the_right_people_in>

<working_with_existing_rules>
Read the entity's current `rls` first, then change only what needs changing:
- An operation already protected by a rule that fits the intent is done — keep it as-is. Rewording a working rule into a lateral or looser variant just adds churn; a change earns its place when it tightens access, fixes a rule that locks people out, or closes an operation that's still open.
- For an operation that is open but should be restricted, add a rule following the patterns above.
- For a whole-app request ("secure everything", "lock it down"), cover every entity that holds user data, not just the obvious ones — it's easy to secure most and leave one open.
- When a rule locks users out (see the checks above), repair it into the nearest correct rule that keeps the intended restriction, rather than dropping the protection.
- Respect deliberate choices. An operation the user wants public stays open. A `read` or `delete` set to `false` means "no one" on purpose, so leave it; on `create`/`update`, `false` isn't enforced, so treat those as open and give them a real rule if they should be restricted. A legacy top-level `write: false` behaves the same way — it denies `delete` but leaves `update` open — so replace it with explicit `update`/`delete` rules when writes should stay locked.
Change what differs from the current config, and leave the rest.
</working_with_existing_rules>

<the_user_entity>
The built-in `User` entity is governed by the platform's own permissions (for example, only admins manage other users), and a top-level `rls` on `User` isn't applied — so rely on those built-in permissions rather than adding one. For role-based access, put the `user_condition` role checks on the other entities' rules, where they take effect.

Field-level rules on `User` properties do apply. A field lock is not the custom User RLS the entity guide tells you to skip, so add it even when the user didn't ask for User rules. Every custom User field another entity's rule trusts (`{{user.data.tenant_id}}`, `user_condition: { "data.department": ... }`) gets a write lock in `base44/entities/User.jsonc` — add its entry to the file's existing `properties`, keeping the fields already there:
  "properties": { "tenant_id": { "type": "string", "rls": { "update": { "user_condition": { "collaborator_role": "editor" } } } } }
App users, app admins included, can then no longer change it, on first set too; the app's editors still can from the dashboard. Assign it in a backend or server function with the service-role client (`asServiceRole`, which skips these rules), after checking the user is entitled to it: an invite code, an admin's assignment, the tenant's verified domain. Backend functions need a paid plan; in an app with neither backend functions nor server functions, only the app's editors can set the field, from the dashboard, so if that won't scale use `created_by_id` or a `members` list instead. Never let a user pick their own tenant, company, or access level from the app's UI. A field that only holds the user's current choice among tenants (`active_tenant_id`) is not a boundary: the rule must also check membership in a list the user can't edit.
</the_user_entity>

<applying>
1. Open `base44/entities/<Name>.jsonc`, note the owner field (`created_by_id`) and any custom field you'll reference.
2. Write one complete `rls` object covering each operation you're protecting, using the write-safe forms above and keeping any protection that should remain.
3. Save the file — the rules apply immediately to app-user requests.
4. Tell the user which operations you locked and to which rule, and confirm owners and admins keep the access they need.
</applying>

</rls_authoring_guide>
