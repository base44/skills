<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 platform: Native mobile app (Expo)

Here's a list of concepts you can use to develop the app:
<backend>
- entities: entities are defined as json schema objects that define the shape of the data that is stored in the app.
- functions: backend functions, that are use mainly to integrate with external APIs, and are defined in the `functions` folder, as HTTP handlers.
- automations: automations run backend functions automatically. Three types: scheduled (cron/interval), entity (on record create/update/delete), and connector (on external webhook events from connected services like Google Calendar, Gmail, Slack, etc.).

</backend>
<frontend>
- screens: screens are defined as React Native components in the `app/` directory — each file is automatically a route (expo-router file-based navigation).
- components: components are defined as React Native components, that can be used on screens.
- root layout: `app/_layout.jsx` wraps every screen (navigation stack, providers).
</frontend>

<file_structure>
This is an Expo + React Native project using expo-router (file-based routing).

Standard directories:
- app/... (jsx files) — every file is a screen/route (e.g., app/index.jsx is the home screen, app/settings.jsx → /settings, app/items/[id].jsx → /items/:id)
- app/_layout.jsx — root layout (Stack navigator, providers, global.css import)
- src/components/... (jsx files) — reusable components, can have subfolders
- base44/entities/<Name>.jsonc — entity JSON schema files
- base44/functions/<name>/entry.ts — backend functions
- tailwind.config.js (Tailwind/NativeWind theme configuration)
- global.css (Tailwind directives)

You are free to create additional directories and files as needed (e.g., src/lib/, src/hooks/, src/context/, src/utils/).
IMPORTANT: In code, import shared code with the @/ alias (e.g., import TaskCard from "@/components/TaskCard") — the alias maps to src/. Screen files in app/ are routes, never import them manually.

Create, edit and delete files directly at these paths; a change is live once the file is written.
</file_structure>

<authentication>
Authentication backend (token issuance, sessions, email verification) is handled by the base44 platform.
You do NOT need to implement any auth backend logic.

Login and authentication are handled by the base44 platform,
you don't need to worry about them nor to implement them.
Therefore, IMPORTANT: NEVER try to create a login page.
</authentication>

<invite_user>
You can use the `base44.users.inviteUser` function from base44 sdk in order to invite users to the app.
It accepts email and role in the app ("user" or "admin"). Make sure you understand the role that the builder is aiming for.

Since the app is public, both admin users and regular users can invite others. However, only admin users can invite with role="admin", while regular users can only invite with role="user". Pay attention where you locate the call to this function, otherwise it may not work as expected.

Example:
```js
import { base44 } from '@/api/base44Client';

await base44.users.inviteUser("foo@gmail.com", "user")
```
</invite_user>
