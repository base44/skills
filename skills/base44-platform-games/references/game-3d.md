<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: 3D game (Three.js): architecture, assets, analytics and the Three.js reference

<game_architecture>
The game project is a standard React/Base44 app with a game layer under `src/game/`.

<file_structure>
The game template ships this skeleton ALREADY WIRED: `src/App.jsx` routes `/` to GamePage, `GamePage.jsx` renders `<GameContainer />` (the engine-agnostic mount that owns the `#game-container` div), and `src/game/main.js` re-exports the active engine flavor. Build the game by EDITING these files in place — never recreate them or build a parallel structure elsewhere. The skeleton files are small and self-documenting: read them before changing them instead of relying on a from-memory picture of their contents.

- `src/game/3d/` - ALL gameplay code for this game: scenes, game objects, systems, spawning, scoring, enemy AI. The starter scene is `scenes/GameScene.jsx` — gameplay code starts THERE; add further scene files under `scenes/` and reusable game-object files (e.g. `objects/`) alongside it.
- `src/game/main.js` - one-line engine switch re-exporting the active flavor's `Game` component; must point at `@/game/3d/Game` for this game.
- `src/game/config.js` - create for tunable game constants (see configuration).
- `src/game/EventBus.js` - engine-agnostic event emitter for React <-> game communication; rarely needs editing.
- `src/pages/GamePage.jsx` - React page that mounts the game; edit to build the HUD/menu overlay.
- `src/components/game/GameContainer.jsx` - mount wrapper; rarely needs editing.
- `src/App.jsx` - React router and Base44 shell; already mounts GamePage at `/` — edit only to add MORE routes.
- `src/main.jsx` - React bootstrap. Do not edit this for game routing.

An older game may have a flatter layout — no `2d/`/`3d/` flavor split, a `PhaserGame`/`ThreeGame` mount instead of `GameContainer`. Follow the existing wiring in that case; the placement and boundary rules below still apply.

Placement rule: ALL gameplay code lives under `src/game/`. `src/components/game/` holds ONLY the mount wrapper. React overlay UI components go in `src/components/` (or inline in GamePage.jsx) and contain no gameplay logic.
</file_structure>

<boundary_rules>
- Put Base44 SDK calls, auth-aware data loading, navigation, and ALL screen-space UI — start/pause/settings menus, game-over and victory screens, score/lives/level readouts, buttons, dialogs, leaderboards, forms — in React files as a DOM overlay over the canvas (see screen_space_ui below). Do not build these inside the game world.
- Put gameplay state, physics, collisions, animation, game input, cameras, render-loop behavior, and world-anchored text (floating damage numbers, speech bubbles above characters, pickup labels) in `src/game`. React overlay state is a display copy fed by events — never the authoritative home for gameplay data.
- Use `src/game/EventBus.js` for ALL React <-> game communication, in both directions: the game emits gameplay events (score changed, game over) that React UI renders; React emits commands (restart, pause, resume) that the game acts on.
- Persist durable game data (high scores, saves, progress, leaderboards) through Base44 entities from React — never call the SDK inside the game loop or a scene; bridge gameplay events to React via `EventBus`.
- Preserve the `current-scene-ready` event pattern: the active scene emits it once it is mounted so `GameContainer` can track its handle. This event does NOT mean the first playable frame rendered and must not drive `window.game.ready`.

</boundary_rules>

<screen_space_ui>
Decision rule: if an element would look and behave correctly as a DOM element positioned over the canvas with CSS, build it in React (Tailwind + shadcn/ui). If it must track a world position, move with the camera, or update every frame in lockstep with rendering, build it in the game world.
- React overlay: menus, pause/game-over/victory screens, score-lives-level HUD readouts, buttons, settings, instructions, dialogs, leaderboards, forms.
- Game world: damage numbers, world-anchored labels and speech bubbles, and per-frame readouts tightly coupled to the render loop.

Overlay structure: overlay elements are SIBLINGS of `<GameContainer />` inside the game frame wrapper (`.game-frame` is already `position: relative`). The overlay layer is `absolute inset-0 pointer-events-none` so gameplay clicks reach the canvas; interactive children re-enable `pointer-events-auto`:
```jsx
<div className="game-frame">
  <GameContainer />
  <div className="absolute inset-0 pointer-events-none">
    <div className="absolute top-3 left-3 text-white text-base sm:text-xl font-bold">Score: {score}</div>
    {phase === 'game-over' && (
      <div className="absolute inset-0 grid place-items-center bg-black/60 pointer-events-auto">
        <Button onClick={() => EventBus.emit('restart-game')}>Play Again</Button>
      </div>
    )}
  </div>
</div>
```

Two-way EventBus contract:
- Game -> React (state): emit on DISCRETE gameplay events only — `EventBus.emit('score-changed', score)` when the score actually changes, `EventBus.emit('game-over', { score })` once. NEVER emit from the per-frame update loop to drive React state; a value that changes every frame stays rendered in the game world, or its emit is throttled (e.g. every 100-250ms).
- Ticking overlay state (run timers, cooldown readouts — anything on an interval or throttled emit) lives in a LEAF component that owns its own state, never in the page component: overlay components are React ancestors of the game mount, so state there re-renders the Canvas/game subtree every tick and the whole scene reconciles at that rate.
- React -> Game (commands): the scene/game component registers listeners in a `useEffect` and removes them in its cleanup — EventBus outlives remounts, so leftover listeners stack up.
- React side: subscribe in `useEffect` with stable named handlers and matching `EventBus.off` cleanup.

Overlay fonts: the template maps `font-display`, `font-heading`, `font-body`, and `font-mono` to `--font-*` CSS variables — to use a custom font, add `@import url('...')` at the very top of `src/index.css` (before `@tailwind base;`) and change the matching `--font-*` variable in `:root`. Never `@apply` a class that is not a built-in Tailwind utility or one mapped in `tailwind.config.js` — the build fails with "The `X` class does not exist".
Overlay color token syntax must match its consumer: `hsl(var(--token))` requires HSL channels such as `0 0% 100%`; an RGB tuple such as `248 250 252` requires `rgb(var(--token))`. Never put unitless RGB channels into an HSL token.
</screen_space_ui>

<import_path_rules>
Import app and game modules with the `@/` alias rooted at `src/`. This is the style the skeleton files already use — mirror it in every file you create or edit.

- Examples: `import { EventBus } from '@/game/EventBus';`, `import { GameScene } from '@/game/3d/scenes/GameScene';`, `import { GameContainer } from '@/components/game/GameContainer';`, `import { SHOP_ITEMS } from '@/game/config';`, `import { base44 } from '@/api/base44Client';`.
- A relative import (`./sibling`) is fine for a file in the same directory, but prefer `@/` for anything that crosses directories.
- Never import app modules with bare paths like `game/EventBus` or `components/game/GameContainer` — the build treats those as npm packages and fails to resolve them.
</import_path_rules>

<configuration>
For non-trivial games, create `src/game/config.js` and keep tunable game constants there:
- dimensions, speeds, gravity, score values, colors, asset keys, art style, and perspective.
- Import constants from `src/game/config.js` into scenes and the engine setup.
- When the user asks to tune behavior ("faster", "more gravity", "larger world"), prefer editing config constants instead of scattering magic numbers.
</configuration>

<testability>
- Every player- or AI-initiated gameplay capability must be callable independently of rendering and its physical input binding. Human-input and AI handlers are thin wrappers over the same gameplay functions. Represent sustained or analog controls with explicit control-state setters (press/release or normalized values); never add verification-only movement that bypasses the real update, timing, or physics path. Do not write the tests themselves
- Route all gameplay randomness through one seedable RNG (a small seeded generator in `src/game`). Vary the seed per run; a pinned seed is for reproducible verification.
- Expose and MAINTAIN the game API on `window.game`: `ready`, side-effect-free state getters (phase, score, key entities), and the capability/control functions required to exercise the primary playable loop. Initialize/reset `ready` to false before boot and restart; set it true only after required assets/async systems have finished and at least one playable frame rendered. The readiness signal belongs inside the final Suspense/physics boundary and completes after that world participates in its first render frame. Keep the API current as the game grows — a stale API is worse than none.
- HUD and menus stay in the React DOM overlay (see screen_space_ui) — that is the automated-verifiable surface.
</testability>
</game_architecture>

<game_assets>
By default, build game visuals programmatically in code with Three.js meshes, materials, and lights; for richer visuals than code shapes can produce (detailed characters, creatures, props, tiles, full backgrounds), generate images with the runtime `GenerateImage` integration or use assets the user provides, describing the project's `ART_STYLE` in every prompt so assets share one look, and store each image URL in `src/game/config.js` to load as textures — reference the saved URL on every run rather than regenerating on each build.

Composing the 3D world itself (geometry, materials, lighting, procedural textures) is covered in the Three.js reference.

<style_consistency>
Pick one cohesive look before building: a vibrant color palette and a shape language
(e.g. neon, blocky), and keep it consistent across the whole world. Store the
choices in `src/game/config.js` (e.g. `PALETTE`, `ART_STYLE`, `CAMERA_MODE`) when
that file exists or when you create it, and read from it everywhere.

The camera mode shapes how you build and light the world — first-person, third-person
follow, orbit, or a fixed angle. Settle it up front and keep it consistent.
</style_consistency>

Do not mix inconsistent visual styles in the same scene unless the user explicitly wants that contrast.
</game_assets>

To opt-out, set `{"analytics":{"enabled":false}}` when initializing the base44 SDK (supported from 0.8.46).

<threejs_reference>
This game is 3D: the world runs on Three.js through React Three Fiber (R3F) — there is NO Phaser in this game. The stack:
- `three` — the engine (always installed).
- `@react-three/fiber` — renders the Three.js scene graph as React components and owns the canvas and render loop.
- `@react-three/drei` — ready-made helpers (controls, cameras, loaders, text, sky, ...). Reach for drei before hand-rolling a helper.
- `@react-three/rapier` — physics (`<Physics>`, `<RigidBody>`, colliders).

<dependencies>
Never install or re-pin a package already in `package.json`, and never import a package that is not in it.
</dependencies>

<legacy_3d_games>
An older 3D game may mount Three.js manually — a component owning a `WebGLRenderer` and a `requestAnimationFrame` loop — instead of R3F. Follow that existing structure when editing such a game; do not rewrite it onto R3F unless the user asks.
</legacy_3d_games>

<r3f_essentials>
- Scene content is JSX: `<mesh position={[0, 1, 0]}><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="#38bdf8" /></mesh>`. `args` are constructor arguments; nested properties use dashed "pierced" props (`shadow-mapSize`, `shadow-camera-left`, `position-x`).
- Per-frame gameplay runs in `useFrame((state, delta) => ...)` inside components under the Canvas. Scale all movement by `delta` (seconds) so speed is frame-rate independent.
- NEVER set React state per frame, and NEVER hold live gameplay data — entity arrays (enemies, projectiles), hp, cooldowns — in useState: `useFrame` closures capture the render-time snapshot, so systems iterate a stale list and hits/targeting silently break. Mutate refs and shared module objects in `useFrame` (`meshRef.current.position.x += speed * delta`); React state only mirrors discrete events (phase changes, score).
- `useThree` gives the root state (scene, camera, gl, size). R3F hooks (`useFrame`, `useThree`, `useTexture`) only work in components rendered inside the Canvas — the React overlay outside cannot use them.
- Anything that loads asynchronously (textures, models) suspends — wrap it in `<Suspense fallback={null}>`.
- Structure the world as small components under `src/game/3d/` (Player, Enemies, Level, Effects) composed in the scene; keep tunables in `src/game/config.js`.
</r3f_essentials>

<coordinates>
- The three.js frame: +X right, +Y up, and a camera looks down its −Z axis — "forward" / into the screen is −Z; +Z points at the viewer.
- The control convention is DERIVED from the camera rig and control scheme settled for this game, never assumed — record it once in `src/game/config.js` as signed constants the gameplay formulas import (forward/flow sign, spawn distance, camera offset), not just a `CAMERA_MODE` label: labels document, only consumed numbers keep files in agreement. A file that invents its own sign inline instead of importing it is how one subsystem ships mirrored against the rest. Chase/first-person (camera yaw follows the avatar): avatar faces −Z, camera behind at a positive local-Z offset, input camera-relative. Fixed rig (camera yaw never changes — top-down, isometric, side-view, lane runner): keys map to the camera's screen axes projected onto the ground, fixed world-direction constants. Aim/pointer games (pool, golf, board/puzzle): there may be no movement keys at all — don't bolt WASD on.
- Every system must derive from that one convention — input signs, model orientation, camera offset, spawn/flow direction, cull windows. A single flipped sign in one file reads as mirrored controls or a world scrolling backwards; fix a wrong direction at its source instead of negating it downstream.
</coordinates>

<physics_rapier>
Use rapier when the game needs physical simulation — gravity, stacking, bouncing, knock-back, vehicles. Grid/board/puzzle games and simple arcade motion move meshes directly in `useFrame` without `<Physics>`. Wrap the physical world in `<Physics>` inside `<Suspense>` (the rapier WASM module initializes asynchronously); bodies, colliders, forces, and collision/trigger events are covered in the injected `physics_dynamics` and `triggers_and_collisions` reference sections.
</physics_rapier>

<drei_helpers>
Common picks: `OrbitControls` (add `makeDefault`), `PerspectiveCamera`/`OrthographicCamera`, `KeyboardControls`, `Text`/`Billboard`, `Sky`, `Stars`, `Environment`, `useTexture`, `Html` — each is detailed in its injected reference section.
</drei_helpers>

<visuals>
Compose visuals from primitives (`boxGeometry`, `sphereGeometry`, `cylinderGeometry`, `coneGeometry`, `planeGeometry`, `torusGeometry`, `capsuleGeometry`) inside `<group>`s for characters and props; share geometries/materials and vary color, scale, and rotation per instance. Image-tool URLs load as textures via `useTexture(url)` — art direction, palette, and asset rules are in the game assets guidance; lighting, shadows, and atmosphere in the injected `scene_and_rendering` reference section.
</visuals>
</threejs_reference>
