<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 entities: Entities and the entity SDK (mobile apps)

Entities are defined as json schema objects that define the shape of the data that is stored in the app.

<built_in_attributes>
IMPORTANT:
Every entity records has the built in attributes (no need to specify them in the schema):
- id
- created_date
- updated_date
- created_by_id (the ID of the user that created the record)
</built_in_attributes>

<deleting_entities>
Restoring entities is possible from the UI.
</deleting_entities>
<user_entity>
User entity is a built-in entity that exists on every app.
VERY IMPORTANT: YOU DON'T NEED TO CREATE THE USER ENTITY YOURSELF. it is created automatically and available for use on any app.

Read-only attributes (you can not change them, you don't need to define them in the schema):
- id
- created_date
- full_name
- email

Editable attributes:
- role (default values are 'admin' and 'user', but you can freely change, extend, or remove role values to fit the app's needs)
  Example: changing roles to "manager", "employee", "viewer" or any other set of roles

To customize role values or add additional attributes, edit `base44/entities/User.jsonc`.
Only include the fields you want to add or customize - built-in attributes (id, created_date, full_name, email) are included automatically.
Example: To change roles to 'manager', 'employee', 'viewer', include a "role" property with a custom enum.

IMPORTANT: The User entity has special built-in security rules that only allow admin users to list, update, or delete other users. Regular users can only view and update their own user record.
Do not add custom User RLS unless the user explicitly asks to customize User access behavior.
</user_entity>

<field_size_limits>
IMPORTANT: Never store large content (base64 images, PDFs, HTML blobs, binary data) directly on entity fields. Instead, upload files via UploadPrivateFile for anything an end user uploads and store only the returned file_uri.
</field_size_limits>

<entities_sdk>
The Entities SDK can be imported from the pre-initialized base44 sdk client.

use it like this:
import { base44 } from '@/api/base44Client';
base44.entities.EntityName.list() will return the list of entities.

e.g. if there's an entity named Todo, here's how to use the SDK:
import { base44 } from '@/api/base44Client';
base44.entities.Todo.list('-updated_date', 20) will return the 20 most recently updated todos.
base44.entities.Todo.filter({status: 'active', created_by_id: user.id}, '-created_date', 10) will return the top 10 recently created active todos created by the current user.
base44.entities.Todo.create({title: "Todo 1", description: "Todo 1 description"}) will create a new todo.
base44.entities.Todo.bulkCreate([{title: "Todo 2", description: "abc"}, {title: "Todo 3", description: "123"}]) will create 2 new todos.
base44.entities.Todo.update(todo.id, {description: "new description"}) will update the todo with id 1.
base44.entities.Todo.updateMany({status: 'active'}, {$set: {status: 'done'}}) applies the same change to all matching todos (up to 500 records); returns has_more=true if remains; call again for the next batch — but your $set must change a field in the query; otherwise the same rows re-match forever. the 2nd arg uses MongoDB update operators (not a plain {field: value}): $set, $rename, $unset, $inc, $mul, $min, $max, $currentDate, $addToSet, $push, $pull. careful: no schema validation.
base44.entities.Todo.bulkUpdate([{id: id1, status: 'done'}, {id: id2, status: 'open'}]) will update many todos with different values in one call (up to 500).
base44.entities.Todo.delete(todo.id) will delete the todo with id 1.
base44.entities.Todo.deleteMany({status: 'archived'}) will delete all todos matching the query in one call. careful: a broad or empty ({}) query matches and deletes everything it's allowed to.

in addition, you can use the built-in user entity through the SDK like this:
import { base44 } from '@/api/base44Client';
await base44.entities.User.list() ...

the authentication SDK provides special methods for the user entity:
await base44.auth.updateMe(data) - use this to update the current user's data.

and if you want to access the current user, you can use the built-in user object:
const user = await base44.auth.me();  // can throw an error if the user is not logged in and the app is public.

base44.auth.logout(redirectUrl?: string) - use this to logout the current user, redirects to the redirectUrl if provided, reloads the page otherwise.

base44.auth.redirectToLogin(nextUrl?: string) - use this to login (this will redirect the user to the app's login page,
after successful login the user will be automatically redirected to the nextUrl if provided,
otherwise the user will be redirected to the page from which the login was triggered).

to understand if the user is authenticated, you can use the base44.auth.isAuthenticated() which returns Promise<boolean>.

to save additional data on the current user, you can use the base44.auth.updateMe(data)
and data will be persisted (you can access it using await base44.auth.me()).
You can't override the built-in user attributes (id, email, full_name, role).

all entity methods are pretty reliable, there's no need to try and catch errors.

Real-time subscriptions - subscribe to entity changes in real-time:

// Subscribe to ALL changes on an entity type (create, update, delete)
const unsubscribe = base44.entities.Todo.subscribe((event) => {
  console.log(`Todo ${event.id} was ${event.type}d`);
  console.log('Data:', event.data);
});

// Cleanup when done
unsubscribe();

// Example usage in a React component:
useEffect(() => {
  const unsubscribe = base44.entities.Todo.subscribe((event) => {
    if (event.type === 'create') {
      setTodos(prev => [...prev, event.data]);
    } else if (event.type === 'update') {
      setTodos(prev => prev.map(t => t.id === event.id ? event.data : t));
    } else if (event.type === 'delete') {
      setTodos(prev => prev.filter(t => t.id !== event.id));
    }
  });

  return unsubscribe;
}, []);
</entities_sdk>
