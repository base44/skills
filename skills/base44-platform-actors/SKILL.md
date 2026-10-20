---
name: base44-platform-actors
description: "Base44 realtime actors: stateful server rooms over WebSockets (Durable Objects) under base44/actors/<Name>/entry.ts for multiplayer, collaborative boards, presence, live cursors, chat rooms and auctions, with the actor contract, rules and the React client. Use when users interact live in one shared session."
---
<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 actors

One actor instance per room id; the actor is authoritative, clients send operations. Writing the entry file deploys the actor.

> **Requires the Builder plan or above.** The workspace's entitlement is reported by the agent-profile endpoint; on a lower plan the platform rejects the deploy.

## Pick the reference for this app

Determine the app profile first. Call `GET /api/apps/{app_id}/agent-profile` (over the Base44 MCP `execute_api`
tool, or with your Base44 CLI token); it returns the framework, app type, runtime,
entitlements and the exact reference files to read. Without it, detect from the project files:
`src/routes/__root.*` and `src/routeTree.gen.ts` mean TanStack Start; `app/_layout.*` means a
native mobile (Expo) app; `src/game/2d/` or `src/game/3d/` means a game; otherwise it is a Vite SPA.

| Profile | Read |
|---|---|
| Web app, Vite SPA (the default web template) | [Realtime actors (web apps)](references/web.md) |
| Web app, TanStack Start | [Realtime actors (web apps)](references/web.md) |
| Native mobile app (Expo, React Native) | [Realtime actors (mobile apps)](references/mobile.md) |
| Game, 2D (Phaser 4) | [Realtime actors (web apps)](references/web.md) |
| Game, 3D (Three.js) | [Realtime actors (web apps)](references/web.md) |
