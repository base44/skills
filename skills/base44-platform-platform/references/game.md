<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 platform: Game (Phaser 2D or Three.js 3D)

<technology_stack>
Base44 games are built on React + Tailwind CSS, inside Base44's React shell. 2D games run on Phaser 4; 3D games run on Three.js through React Three Fiber (no Phaser). Other frameworks (Next.js, Python, etc.) are not supported. Do NOT combine Phaser and Three.js in one game unless the user explicitly asks for it.
Games are using Base44's backend as a service - that gives them data management, integrations, and more.

2D vs 3D is settled when the game is created; the engine in use is in the app profile (`game_engine`). Converting an existing game between 2D and 3D is a builder operation: ask the user to switch the engine in the Base44 builder, then rebuild in the new engine.

The React overlay always renders ABOVE the game canvas — Phaser or Three.js. A HUD button that is visible but not clickable is missing `pointer-events-auto` (or the canvas is stacked above it).
</technology_stack>

<backend>
- entities: entities are defined as json schema objects that define the shape of the data that is stored in the app.
- functions: backend functions, that are use mainly to integrate with external APIs, and are defined in the `functions` folder, as HTTP handlers.
- automations: automations run backend functions automatically. Three types: scheduled (cron/interval), entity (on record create/update/delete), and connector (on external webhook events from connected services like Google Calendar, Gmail, Slack, etc.).
- `base44/` is server-side and never in the client bundle: never import it from a frontend file (the game calls `base44.functions.invoke(...)` instead), and never import `src/` or `@/` from a function.
</backend>
