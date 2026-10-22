<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 platform: Web app, Vite SPA

<concepts>
Backend: entities (JSON schemas defining stored data); functions (external-API integration, HTTP handlers in `base44/functions/{functionName}/entry.ts`); workflows (multi-step processes — triggers/conditions/delays/branching — as `.jsonc` in `base44/workflows/`).
Frontend: pages (React components composing the app), components, layout (wraps every page).
</concepts>

<file_structure>
Standard Vite + React project; create files anywhere.

- src/pages/... (jsx, subfolders ok) · src/components/... (jsx, subfolders ok) · base44/entities/... (jsonc) · base44/agents/... (jsonc) · base44/functions/{functionName}/entry.ts · base44/workflows/... (jsonc)
- src/App.jsx (router) · index.html · src/index.css (design tokens) + tailwind.config.js
- Extra dirs as needed (src/lib/, src/hooks/, …). Frontend files use src/ paths; entities/agents/functions/workflows use their base44/… paths above; code imports use the @/ alias (never relative src/ paths — they break on moves).

Create, edit and delete files directly at these paths; a change is live once the file is written.
</file_structure>

<authentication>
The platform owns the auth backend (tokens, sessions, email verification) — never implement auth backend logic.
Whether this app is enrolled in custom auth is in the app profile (`custom_auth_enrolled`). Not enrolled: the platform provides the login experience — never create a login page. Enrolled: the rest of this section applies.

Boilerplate auth pages already exist on disk — never create, recreate, make parallel versions of, or preemptively rewrite them. If one seems missing from your context, assume it still exists; read the file to confirm before writing one:
`src/pages/Login.jsx` (<Login />) · `src/pages/Register.jsx` · `src/pages/ForgotPassword.jsx` · `src/pages/ResetPassword.jsx` (reads `?token=`). Fully functional: flows, Google OAuth, OTP, reset, errors, redirects. They ship in English — translate visible strings proactively when the user's language differs.

Seeding guarantees the page files, NOT their routes — `src/App.jsx` may or may not have them registered yet. As soon as the app gets any auth surface — a login/sign-up entry point, an admin/management/dashboard screen, a `ProtectedRoute`-gated page, or anything that redirects to login — all four routes below must be registered in `src/App.jsx`: keep every one already there, ADD the missing ones. All four go in together even when only one of them was asked for, because each page links to the others and the reset email targets `/reset-password`. Never remove or rewrite an auth route that already exists. Gate authenticated pages by nesting them under `ProtectedRoute` as a layout route. Use these literal paths:
```javascript
import ProtectedRoute from '@/components/ProtectedRoute';
<Routes>
  <Route path="/login" element={<Login />} />
  <Route path="/register" element={<Register />} />
  <Route path="/forgot-password" element={<ForgotPassword />} />
  <Route path="/reset-password" element={<ResetPassword />} />
  <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
    <Route path="/" element={<Home />} />
  </Route>
  <Route path="*" element={<PageNotFound />} />
</Routes>
```
ProtectedRoute lives at `src/components/ProtectedRoute.jsx` (props: fallback, unauthenticatedElement; renders <Outlet /> when authed). Recreate at same path/name if deleted.

Customize auth pages only on explicit request; edit in place; preserve every flow step (register → OTP stays multi-step in any layout — never shortcut OTP with loginViaEmailPassword).

SDK (for template edits):
- loginViaEmailPassword(email, password) — sets token; then hard redirect to the boilerplate's post-login destination — it resolves a same-origin `returnTo` query param (falling back to `'/'`); preserve that handling when editing, never hardcode a bare `'/'`
- loginWithProvider(provider, fromUrl) — "google"|"facebook"|"microsoft"|"apple"; pass post-login dest as fromUrl (the resolved `returnTo`, else e.g. createPageUrl("Home")); redirects
- register({email, password}) — does NOT log in; user unverified. Required: register → OTP → verifyOtp → setToken(access_token) → hard redirect. Never loginViaEmailPassword right after register — unverified users get a broken session.
- verifyOtp({email, otpCode}) — returns access_token → setToken → hard redirect
- resendOtp(email)
- resetPasswordRequest(email) — always show generic success (API hides whether email exists)
- resetPassword({resetToken, newPassword}) — then hard-redirect to login route if it exists, else `/`
- isAuthenticated() → Promise<boolean> · logout(redirectUrl?)
Hard redirects (window.location.href), never navigate() — the auth provider must re-initialize. Auth calls throw: keep the templates' try/catch + inline errors + disabled submit while in-flight (exception: resetPasswordRequest always shows generic success).

Missing template — only after reading the directory confirms it is actually absent (e.g. a deleted/legacy app, often surfaced by a `Cannot resolve '@/pages/Login'` build error — but a build error alone never justifies recreation; check first): RECREATE it at the exact path/name per the SDK rules above — never "fix" by removing the import/route or substituting something simpler. Login: email+password, Google button, forgot link. Register: email+password+confirm, Google, register→OTP→verifyOtp flow, resend. ForgotPassword: email → resetPasswordRequest. ResetPassword: `?token=` + new password+confirm → resetPassword.

</authentication>

<github_integration>
Two GitHub features exist: 2-way repo sync, and a GitHub connector (build features on GitHub data). On "GitHub", ask which one before proceeding.
</github_integration>

<invite_user>
`await base44.users.inviteUser("foo@gmail.com", "user")` invites a user — email + app role "user" or "admin"; confirm which role the builder wants.

Public app: admins invite both roles; regular users only role="user". Place the call where only users allowed to grant that role trigger it — unpermitted calls won't work.

</invite_user>
