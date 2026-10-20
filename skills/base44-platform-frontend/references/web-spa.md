<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 frontend: Web app, Vite SPA

You develop pages and, when needed, components or the app's layout.

<code_conventions>
- Before editing, account for dependent files, earlier changes, and the user's own edits.
- Export every page/component as default, named same as its file.
- shadcn/ui from @/components/ui; Tailwind CSS for styling.
- Icons: lucide-react only, only icons that exist — a nonexistent or unimported icon breaks the whole app.
- Every import must resolve to a real file or package.
- URL params: const urlParams = new URLSearchParams(window.location.search).
- Handle just-registered users with nothing saved on the user entity yet.
- Entities: always the full JSON schema — no comments/placeholders; it replaces the stored schema.
- Let errors bubble up — no try/catch unless asked, since uncaught errors come back to you to fix. Exception: user-facing form/auth flows catch and show inline errors (that behavior is the feature).
</code_conventions>

<available_packages>
<packages_installed>
Only these frontend packages are installed: React; tailwind css; shadcn/ui (all components); lucide-react; moment; recharts; react-quill-new; react-hook-form; react-router-dom; date-fns; lodash; react-markdown; framer-motion; three.js (3d models/games); react-leaflet (maps); @hello-pangea/dnd (drag and drop); @tanstack/react-query (data fetching/query state); @/api/base44Client (pre initialized sdk); @/utils.
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

<app_router>
src/App.jsx is the application router — a page without a Route there is unreachable. On page add/remove, update src/App.jsx in the same change: import near "// Add page imports here" + Route inside Routes.

<navigation>
<Link to="/path"> with route paths from src/App.jsx, not createPageUrl.
</navigation>

<layouts>
No automatic layout wrapping — don't create a root-level src/Layout.jsx. Shared layouts: a component (e.g., src/components/Layout.jsx) with React Router's <Outlet>, used as a layout route:

```jsx
import { Outlet } from 'react-router-dom';
export default function Layout() { return <div><Sidebar /><main><Outlet /></main></div>; }
// src/App.jsx
<Route element={<Layout />}>
  <Route path="/" element={<Home />} />
</Route>
```
</layouts>

<routing_conventions>
- Main/home page on "/" only — no second route under the component name (both "/" and "/Home").
- Changing the main page: the "/" route in src/App.jsx is the source of truth — no platform setting; point "/" at the desired component and import it at the top (don't send the user to dashboard settings).
</routing_conventions>

Keep these framework wrappers in src/App.jsx intact — auth, data fetching, routing, and toasts run through them:
- <AuthProvider>, <QueryClientProvider>, <BrowserRouter>/<Router>, <Toaster />
- AuthenticatedApp and its auth logic (loading states, UserNotRegisteredError)
- ProtectedRoute from @/components/ProtectedRoute for per-route auth guarding

</app_router>

<tailwind_class_names>
Write Tailwind classes as literal strings (const maps/arrays included) — the build purges anything not found as a literal substring in source; dynamic names (`bg-${color}-500`, `"bg-" + shade`) silently disappear. `safelist` in `tailwind.config.js` only for runtime-sourced values (entity records, API responses, user input), never for classes in source.
</tailwind_class_names>

<prebuilt_components>
<index_html>
index.html — for page title, meta tags (SEO, Open Graph), external scripts (Analytics, AdSense), favicon, custom fonts. Always preserve: `<head>` (runtime script injection), `<div id="root"></div>` (React mount), `<script type="module" src="/src/main.jsx"></script>` (entry). Once customized, served as-is — no automatic injections (SEO/social tags, canonical URLs, favicons).
</index_html>
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
