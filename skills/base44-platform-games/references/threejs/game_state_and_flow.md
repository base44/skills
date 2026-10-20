<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Three.js: game state and flow

<game_state_and_flow>
Use this when structuring game phases (menu → playing → game over), score/health state, pause, restart, and saving progress.

<state_home>
Two kinds of state, two homes:
- Discrete/UI state (phase, score, lives, unlocks) — React state in the overlay, updated via EventBus events from gameplay. Low frequency, drives DOM.
- Per-frame gameplay state — refs and module objects read inside `useFrame`. This covers scalars (positions, velocities, timers, mid-run combo counters) AND entity collections with their mutable fields: the live arrays of enemies/towers/projectiles and each entity's hp/target/cooldown. Never React state — beyond re-render stutter, `useFrame` callbacks capture the array from the render that created them, so a tower reading a useState `enemies` list targets a STALE snapshot: damage lands on ghosts and kills never register. Writing game logic as `setState(prev => ...)` updaters (or nesting one setState inside another) is the same failure.
- When state must be BOTH (read every frame in gameplay AND shown reactively in UI), install `zustand` with `install_npm_package`: components subscribe with the hook selector, `useFrame` reads via `getState()` without re-rendering. For simple games, EventBus + a module object is enough — don't add zustand for a single score counter.
- Systems that iterate many entities each frame share ONE live registry, mutated in place:
```js
// src/game/3d/world.js — module scope (or one useRef/context at the scene root)
export const world = { enemies: [], towers: [], projectiles: [] };
```
Spawn = push, death = splice or flag-and-reuse (see projectiles_and_pooling); each system's `useFrame` (targeting, projectiles, wave spawner) reads `world.enemies` live — no props, no copies. Entries hold plain fields plus refs to their body/mesh. The HUD never reads the registry: gameplay emits discrete or throttled (100-250ms) EventBus/zustand snapshots and React renders that copy. On restart, empty the arrays explicitly — the `key={runId}` remount does not clear module scope.
</state_home>

<phases>
- Gate on the phase: the `paused` prop on `<Physics>` when not playing, conditional-render the level subtree, and early-return guards at the top of gameplay `useFrame` callbacks.
- The Canvas stays mounted through every phase — menus render as overlay on top of an idle scene, which also looks better than an empty canvas.
- Restart: remount the play-world subtree with a key (`key={runId}`, incremented on restart). Remounting resets every body, ref, and timer to initial JSX state in one move; manual per-object reset code is a bug farm. This is the ONE place mass unmount/remount is correct — once per run, not per frame.
- UI countdowns and run timers default to the overlay (interval or elapsed-from-start-timestamp); a timer that gameplay itself consumes (physics-coupled time limits, slow-motion) belongs in the loop/physics step instead.
</phases>

<persistence>
Only persistence path: define a Base44 entity schema (for example `base44/entities/HighScore.jsonc`) and read/write it with the SDK (`base44.entities.*`) from React overlay/page code.
- Do not persist game data in `localStorage`, auth profile fields, refs, module globals, config files, or Three.js/R3F state.
- Gameplay emits final/progress data through `EventBus` at phase boundaries; React calls `base44.entities.<Entity>.create/filter/update/delete`.
- React passes loaded entity data back into gameplay as runtime state. Never call the SDK inside `useFrame`, physics callbacks, or render-loop systems.
- Leaderboards use open `read` and owner-scoped writes; never pass owner fields manually.
</persistence>
</game_state_and_flow>
