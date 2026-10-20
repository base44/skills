---
name: base44-platform-integrations-sdk
description: "Base44 built-in integrations on the SDK client: InvokeLLM, SendEmail, file uploads (public and private), signed URLs, data extraction and image generation, with every Core endpoint's input schema, plus analytics event tracking. Use when a feature needs AI, email, files or analytics without a third-party service."
---
<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 integrations sdk

Core integrations are callable from the browser SDK and from server code; the endpoint schemas below are the ones the platform serves today.

## Pick the reference for this app

Determine the app profile first. Call `GET /api/apps/{app_id}/agent-profile` (over the Base44 MCP `execute_api`
tool, or with your Base44 CLI token); it returns the framework, app type, runtime,
entitlements and the exact reference files to read. Without it, detect from the project files:
`src/routes/__root.*` and `src/routeTree.gen.ts` mean TanStack Start; `app/_layout.*` means a
native mobile (Expo) app; `src/game/2d/` or `src/game/3d/` means a game; otherwise it is a Vite SPA.

| Profile | Read |
|---|---|
| Web app, Vite SPA (the default web template) | [Integrations and analytics SDK (web apps)](references/web.md) |
| Web app, TanStack Start | [Integrations and analytics SDK (web apps)](references/web.md) |
| Native mobile app (Expo, React Native) | [Integrations SDK (mobile apps)](references/mobile.md) |
