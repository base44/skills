<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 frontend: Web app, TanStack Start

You develop pages and, when needed, components or the app's layout.

<code_conventions>
- Before editing, account for dependent files, earlier changes, and the user's own edits.
- Route files export `Route` (components are plain functions in the same file); every other component is a default export named same as its file.
- shadcn/ui from @/components/ui; Tailwind CSS for styling.
- Icons: lucide-react only, only icons that exist — a nonexistent or unimported icon breaks the whole app.
- Every import must resolve to a real file or package.
- URL params: `Route.useParams()` for path params, `validateSearch` + `Route.useSearch()` for the query string — never `window.location` in render.
- Handle just-registered users with nothing saved on the user entity yet.
- Entities: always the full JSON schema — no comments/placeholders; it replaces the stored schema.
- Let errors bubble up — no try/catch unless asked, since uncaught errors come back to you to fix. Exception: user-facing form/auth flows catch and show inline errors (that behavior is the feature).
</code_conventions>

<available_packages>
<packages_installed>
Only these packages are installed: React 19; tailwind css; shadcn/ui (all components); lucide-react; moment; date-fns; lodash; recharts; react-hook-form + @hookform/resolvers + zod; react-day-picker; react-markdown; react-quill-new; react-hot-toast; sonner (toasts, via @/components/ui/sonner); next-themes; framer-motion; three.js (3d models/games); react-resizable-panels; react-leaflet (maps); @hello-pangea/dnd (drag and drop); canvas-confetti; html2canvas; jspdf; @stripe/stripe-js + @stripe/react-stripe-js; @tanstack/react-router; @tanstack/react-start; @tanstack/react-query (data fetching/query state); @base44/sdk; @/api/base44Client (pre-initialized browser sdk); @/lib/utils (`cn`).
Never use any other library — only this list plus shadcn components in @/components/ui/; anything else breaks the app.
</packages_installed>

<entities_package>
The entity SDK is documented in the `base44-platform-entities` skill.
</entities_package>

<integrations_package>
The integrations SDK (InvokeLLM, SendEmail, file uploads) is documented in the `base44-platform-integrations-sdk` skill.
</integrations_package>

<analytics_package>
Analytics tracking is documented in the `base44-platform-integrations-sdk` skill.
</analytics_package>
</available_packages>

<file_routes>
Routing is file-based: every file under `src/routes/` is a route. `src/routeTree.gen.ts` is generated on every dev/build run: never write, edit or delete it, and write only `.js`/`.jsx` files — this app is JavaScript/JSX.
- `__root.jsx` — the document and providers (see <root_document>).
- `index.jsx` → `/` · `about.jsx` → `/about` · `posts.index.jsx` → `/posts` · `posts.$postId.jsx` → `/posts/:postId` · `posts.$postId_.edit.jsx` → `/posts/:postId/edit` · `$.jsx` catch-all.
- Dots and folders nest: `posts.jsx` is the parent of every `posts.*` route, as `posts/$postId.jsx` is of `posts/$postId/edit.jsx`, and a parent shows its child only through `<Outlet />` — without it the child URL silently renders the parent page. So list/detail/edit pages are siblings: `posts.index.jsx` + `posts.$postId.jsx` + `posts.$postId_.edit.jsx`, no `posts.jsx` (add one only as a shared layout with `<Outlet />`). A trailing `_` (`posts_.$postId.jsx`, `$postId_.edit`) opts out of the parent.
- `_authed.jsx` + `_authed/dashboard.jsx` — pathless layout: wraps its children (`/dashboard`) without adding a URL segment; `_authed.jsx` holds the login gate (`beforeLoad: requireSignedIn` from `@/components/auth/AuthGate`, see <authentication>), and its children read `Route.useRouteContext().user`. `(marketing)/pricing.jsx` — route group: organizes files, adds no segment. A folder (`posts/index.jsx`) equals the dotted name.
- `api/<name>.js` — server routes (see <server_code>).
- Every route file: `export const Route = createFileRoute("/path")({ component, loader, head, … })` from `@tanstack/react-router`; the path string is the file's URL, and the plugin rewrites it on rename.
</file_routes>

<data_and_rendering>
- Reads: a `loader` (runs on the server for a document request, in the browser on client navigation) calling a server function; the component reads it with `Route.useLoaderData()`. `loaderDeps: ({ search }) => ({ … })` when the loader depends on search params.
- Writes: `useServerFn(fn)` + TanStack Query `useMutation`, then `useRouter().invalidate()` (or `queryClient.invalidateQueries`) so lists refresh.
- Page metadata: `head: () => ({ meta: [{ title }, { name: "description", content }], links: [...] })` per route — never a `<title>` in JSX.
- `ssr: false` only on a route whose render or loader needs the signed-in user (`useAuth()`, `base44.auth.me()`, the user's own records), so personal data never lands in cacheable HTML, and on the auth pages and `oauth/consent`, wired with `ssr: false` as <authentication> shows. Every other page stays server-rendered — public pages anyone can open and pages that only keep browser state (localStorage, theme, drafts); `ssr: false` is never the fix for `window` or hydration. A library that touches `window`/`document` on import (maps, rich-text editors) goes in its own component, rendered as `lazy(() => import("@/components/Map"))` inside `<ClientOnly fallback={…}>` from `@tanstack/react-router`. Public pages may opt into edge caching with the route's `headers: () => ({ "cache-control": "public, s-maxage=…" })`.
- Auth is resolved client-side after hydration: `useAuth()` from `@/lib/AuthContext` (`user`, `isAuthenticated`, `isLoadingAuth`, `refresh`, `logout`, `navigateToLogin`). Gate user-specific UI on `isLoadingAuth`; the server renders every page anonymously.
- Search params: make each `validateSearch` param optional and apply its default where it is read, since a default returned from `validateSearch` redirects `/` to `/?param=…`.
- Server and first client render must match, or React throws a hydration error (a bug to fix, not a warning). `window`, `document` and browser storage only inside effects and handlers — never at module scope, in render or in a `useState` initializer, even behind `typeof window`: render the server's default, then load the stored value in `useEffect`. Format dates and numbers with an explicit locale and time zone (`toLocaleString("en-US", { timeZone: "UTC" })`); render `Date.now()`/random values only after mount.
</data_and_rendering>

<navigation>
`<Link to="/posts/$postId" params={{ postId }}>` and `useNavigate()` from `@tanstack/react-router`; paths are the file names above — never `createPageUrl`, `react-router-dom` or `<a href>` for in-app links.
Every screen, tab and section a user can navigate to is its own route file with its own URL and `head()` — never one route switching screens with `useState` or a `?tab=` param.
The main/home page (`/`) is exactly one file: `src/routes/index.jsx`, or `_authed/index.jsx` / `_site/index.jsx` once it moves under a layout (move it, never copy it, so two files never claim `/`); changing the main page means editing that file — no platform setting. The starter's home page is a placeholder: replace the whole file rather than patching it.
The starter has no app chrome. A shared header, nav or sidebar is a component (e.g. `src/components/Layout.jsx`) rendered around `<Outlet />` in a layout route's `component`: `__root.jsx` while the app has no auth routes; `_authed.jsx` once it has them, with its gated pages under `_authed/`; and if it also keeps public pages, a pathless `_site.jsx` rendering the same layout component, with those pages (the home page included) under `_site/`. The auth pages and `oauth/consent` stay outside every such layout and render full-screen.
</navigation>

<tailwind_class_names>
Write Tailwind classes as literal strings (const maps/arrays included) — the build purges anything not found as a literal substring in source; dynamic names (`bg-${color}-500`, `"bg-" + shade`) silently disappear. `safelist` in `tailwind.config.js` only for runtime-sourced values (entity records, API responses, user input), never for classes in source.
</tailwind_class_names>

<prebuilt_components>
<root_document>
`src/routes/__root.jsx` renders the document and providers. Site-wide title/meta/favicon/font links go in its `head()`; per-page ones in each route's `head()`. External scripts (Analytics, AdSense) go in `<body>` next to `<Base44Scripts />`, never in `head()` — the preview proxy prepends its own scripts to `<head>`, which breaks hydration of any script rendered there. Always preserve `data-react-root` on `<body>` and the order `<HeadContent />`, `<AuthProvider>`, `<Toaster />`, `<Base44Scripts />` immediately before `<Scripts />` — the platform's runtime hooks depend on it.
</root_document>
</prebuilt_components>

<styling_instructions>
Build beautiful, clean, modern, fully featured, production-worthy, responsive (mobile + desktop) apps.

Stock photos from Unsplash where appropriate — only valid URLs you know exist; link in image tags, don't download.

<content_image_component>
Render every content image (user uploads, generated images — any media.base44.com / static.wixstatic.com URL) with the `Image` component from `@/components/ui/image`, never a plain `<img>` — it serves the image resized to its container, encoded for the browser, with responsive srcset. Size the box via `className`; `fittingType="fill"` (default, crops) or `"fit"` (contains); optional `focalPointX`/`focalPointY` (0–1) anchor the crop. Other hosts and SVGs pass through unchanged, so it is always safe.
</content_image_component>

Show loading indicators while integration calls are in flight.
Color token syntax must match its consumer: `hsl(var(--token))` requires HSL channels such as `0 0% 100%`; an RGB tuple such as `248 250 252` requires `rgb(var(--token))`. Never put unitless RGB channels into an HSL token.

<tokens_based_design_system>
- `src/index.css` owns token values; `tailwind.config.js` maps tokens to Tailwind classes. Theme changes: update values in `src/index.css`, use mapped classes in JSX.
- Colors: update both `:root` and `.dark`.
- Fonts: `@import url('...')` at top of `src/index.css`, before `@tailwind base;`; update font role tokens (`--font-heading`, `--font-body`, `--font-display`), adding them to `src/index.css`/`tailwind.config.js` if missing.
- JSX: mapped token classes (`bg-primary`, `font-heading`, `font-body`, `font-display`); no hardcoded values (`bg-[#ffffff]`, `bg-white`, `font-[Inter]`, inline `style={{ background: "#ffffff", fontFamily: "Inter" }}`).
- New custom tokens only when semantic tokens aren't enough and the value is reused: define under `:root` + `.dark` in `src/index.css`, map in `tailwind.config.js`, use the generated class.
</tokens_based_design_system>

</styling_instructions>

<componentization>
- Small focused files: components of 50 lines or less; every new component/page gets its own new file, never added to an existing one.
- Break oversized pages into components yourself — no need to ask.
</componentization>

<working_with_files>
You work on the app's sandbox files directly: read, write and edit them by path and run shell commands, through the Base44 MCP sandbox tools or the `base44 sandbox` CLI.
- Entity files (`base44/entities/*.jsonc`) are stored as objects: always write the complete schema, never a partial patch or placeholders.
- Writes are committed automatically a few seconds after the change and synced into the platform: a resource file (entity, agent, function, workflow) is live once written; there is no deploy step.
- Only checkpoints appear in the builder's version history. Create a checkpoint when you finish a unit of work and before you stop; the next Restore in the builder discards everything after the last checkpoint.
- Verify with the project's own commands (`npm run build`, lint) before finishing.
</working_with_files>

<npm_package_installation>
Install only when the user explicitly requests a package by name or npmjs.com URL — the exact package, no substitutes; otherwise use installed packages. Check the installed list first, then install from the sandbox shell (`npm install <package>@^<version>`): stable versions, caret (^) for compatible updates. Remove a package the user no longer wants with `npm uninstall`. Never uninstall @base44/sdk or @base44/vite-plugin — the platform requires them.
</npm_package_installation>

<example>
Two short worked examples; each file is shown with its path. `…` elides boilerplate.

<user_ask>Create a simple TODO app where I can track my tasks</user_ask>
<assistant>
```
// base44/entities/Task.jsonc
{"name":"Task","type":"object","properties":{"title":{"type":"string"},"description":{"type":"string"},"status":{"type":"string","enum":["todo","in_progress","done"],"default":"todo"},"priority":{"type":"string","enum":["low","medium","high"],"default":"medium"},"due_date":{"type":"string","format":"date"}},"required":["title"]}
```
<note>Schema first; then all independent files in one parallel batch:</note>
```
// src/lib/server-fns.js
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const TaskInput = z.object({ title: z.string().min(1), description: z.string().optional(), status: z.enum(["todo", "in_progress", "done"]).optional(), priority: z.enum(["low", "medium", "high"]).optional(), due_date: z.string().optional() });
export const listTasks = createServerFn({ method: "GET" }).handler(({ context }) =>
  context.getBase44().entities.Task.list("-created_date", 50));
export const createTask = createServerFn({ method: "POST" })
  .validator(TaskInput)
  .handler(({ data, context }) => context.getBase44().entities.Task.create(data));
export const updateTask = createServerFn({ method: "POST" })
  .validator(TaskInput.partial().extend({ id: z.string() }))
  .handler(({ data: { id, ...patch }, context }) => context.getBase44().entities.Task.update(id, patch));
… // deleteTask: same shape, called as deleteTask({ data: { id } })
```
```
// src/components/tasks/TaskForm.jsx
import React from "react";
import { Button } from "@/components/ui/button";
… // controlled form for title/status/priority/due_date, onSubmit(currentTask)
```
```
// src/components/tasks/TaskItem.jsx
… // one task row: status toggle, priority badge, edit/delete actions
```
```
// src/routes/index.jsx
import { createFileRoute, useRouter } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { listTasks, createTask, updateTask } from "@/lib/server-fns";
import TaskForm from "@/components/tasks/TaskForm";
import TaskItem from "@/components/tasks/TaskItem";

export const Route = createFileRoute("/")({
  ssr: false, // the signed-in user's own tasks — a public page (home, listing, detail anyone can open) omits this
  loader: () => listTasks(),
  head: () => ({ meta: [{ title: "Tasks" }] }),
  component: TasksPage,
});

function TasksPage() {
  const tasks = Route.useLoaderData();
  const router = useRouter();
  const create = useServerFn(createTask);
  const update = useServerFn(updateTask);
  … // renders form + filtered list, full CRUD wired: await create({ data: form }), await update({ data: { id: task.id, ...patch } }), then router.invalidate()
}
```

Your todo app is ready — add tasks, set priority and due dates, and move them between To Do, In Progress, and Done.
</assistant>

<user_ask>show each item on its own page with its full details</user_ask>
<assistant>
<note>One focused route — exactly the ask, no extra sections/pages/animations. Add the server function it needs, load by id in the loader, and render every stored field (a view that drops the item's main text/body is incomplete).</note>
```
// src/lib/server-fns.js
… // existing server functions unchanged
export const getTask = createServerFn({ method: "GET" })
  .validator(z.object({ id: z.string() }))
  .handler(({ data, context }) => context.getBase44().entities.Task.get(data.id)
    .catch((error) => { if (error.status === 404) return null; throw error; }));
```
```
// src/routes/tasks.$taskId.jsx
import { createFileRoute, notFound } from "@tanstack/react-router";
import { getTask } from "@/lib/server-fns";

export const Route = createFileRoute("/tasks/$taskId")({
  ssr: false, // the user's own task
  loader: async ({ params }) => {
    const task = await getTask({ data: { id: params.taskId } });
    if (!task) throw notFound();
    return task;
  },
  head: ({ loaderData }) => ({ meta: [{ title: loaderData?.title ?? "Task" }] }),
  component: TaskDetail,
});

function TaskDetail() {
  const task = Route.useLoaderData();
  … // render the title and the full body/content — wrap content in the right component and pass the value in, never leave it empty
}
```
Each item now opens on its own page with its full details.
</assistant>
</example>
