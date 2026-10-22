<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: 2D game (Phaser 4): architecture, assets, analytics and the Phaser reference

<game_architecture>
The game project is a standard React/Base44 app with a game layer under `src/game/`.

<file_structure>
The game template ships this skeleton ALREADY WIRED: `src/App.jsx` routes `/` to GamePage, `GamePage.jsx` renders `<GameContainer />` (the engine-agnostic mount that owns the `#game-container` div), and `src/game/main.js` re-exports the active engine flavor. Build the game by EDITING these files in place — never recreate them or build a parallel structure elsewhere. The skeleton files are small and self-documenting: read them before changing them instead of relying on a from-memory picture of their contents.

- `src/game/2d/` - ALL gameplay code for this game: scenes, game objects, systems, spawning, scoring, enemy AI. The starter scene is `scenes/GameScene.js` — gameplay code starts THERE; add further scene files under `scenes/` and reusable game-object files (e.g. `objects/`) alongside it.
- `src/game/main.js` - one-line engine switch re-exporting the active flavor's `Game` component.
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
- When adding scenes, register them in the `scene` array of the Phaser config (`src/game/2d/main.js`).
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
- React -> Phaser (commands): the scene registers listeners in `create()` and MUST remove them on shutdown — EventBus outlives scenes, so leftover listeners stack up on every restart:
```js
// in GameScene.create()
const onRestart = () => this.scene.restart();
const onPause = () => this.scene.pause();
const onResume = () => this.scene.resume();
EventBus.on('restart-game', onRestart);
EventBus.on('pause-game', onPause);
EventBus.on('resume-game', onResume);
this.events.once('shutdown', () => {
  EventBus.off('restart-game', onRestart);
  EventBus.off('pause-game', onPause);
  EventBus.off('resume-game', onResume);
});
```
- React side: subscribe in `useEffect` with stable named handlers and matching `EventBus.off` cleanup.

Overlay fonts: the template maps `font-display`, `font-heading`, `font-body`, and `font-mono` to `--font-*` CSS variables — to use a custom font, add `@import url('...')` at the very top of `src/index.css` (before `@tailwind base;`) and change the matching `--font-*` variable in `:root`. Never `@apply` a class that is not a built-in Tailwind utility or one mapped in `tailwind.config.js` — the build fails with "The `X` class does not exist".
Overlay color token syntax must match its consumer: `hsl(var(--token))` requires HSL channels such as `0 0% 100%`; an RGB tuple such as `248 250 252` requires `rgb(var(--token))`. Never put unitless RGB channels into an HSL token.
</screen_space_ui>

<import_path_rules>
Import app and game modules with the `@/` alias rooted at `src/`. This is the style the skeleton files already use — mirror it in every file you create or edit.

- Examples: `import { EventBus } from '@/game/EventBus';`, `import { GameScene } from '@/game/2d/scenes/GameScene';`, `import { GameContainer } from '@/components/game/GameContainer';`, `import { SHOP_ITEMS } from '@/game/config';`, `import { base44 } from '@/api/base44Client';`.
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
- Route all gameplay randomness through one seedable RNG (Phaser's game-config `seed` / `Phaser.Math.RND`). Vary the seed per run; a pinned seed is for reproducible verification.
- Expose and MAINTAIN the game API on `window.game`: `ready`, side-effect-free state getters (phase, score, key entities), and the capability/control functions required to exercise the primary playable loop. Initialize/reset `ready` to false before boot and restart; set it true only after required assets/async systems have finished and at least one playable frame rendered. Set readiness after preload/create completes and the following game render, not from `current-scene-ready` inside `create()`. Keep the API current as the game grows — a stale API is worse than none.
- HUD and menus stay in the React DOM overlay (see screen_space_ui) — that is the automated-verifiable surface.
</testability>
</game_architecture>

<game_assets>
By default, build game visuals programmatically in code with Phaser's built-in primitives; for richer visuals than code shapes can produce (detailed characters, creatures, props, tiles, full backgrounds), generate images with the runtime `GenerateImage` integration or use assets the user provides, describing the project's `ART_STYLE` in every prompt so assets share one look, and store each image URL in `src/game/config.js` to load in `preload()` — reference the saved URL on every run rather than regenerating on each build.

<programmatic_visuals>
Create visuals from code:
- Shapes: `this.add.rectangle(...)`, `this.add.circle(...)`, `this.add.triangle(...)`, `this.add.star(...)`.
- Graphics: `const g = this.add.graphics()` then `g.fillStyle(0x...)`, `g.fillRect(...)`, `g.fillCircle(...)`, `g.lineStyle(...)`, `g.strokePath(...)`.
- Reusable textures: draw with a Graphics object, bake it with `g.generateTexture('key', w, h)`, then use `'key'` in sprites, physics bodies, groups, particles, and animations.
- Text: `this.add.text(...)` (web/system fonts — no font files).
- Variety from a few textures: vary tint (`sprite.setTint(0x...)`), alpha, rotation, and scale.
</programmatic_visuals>

<style_consistency>
Pick one cohesive look before drawing: a vibrant color palette and a shape language
(e.g. flat-geometric, neon, blocky), and keep it consistent across scenes. Store the
choices in `src/game/config.js` (e.g. `PALETTE`, `ART_STYLE`, `GAME_PERSPECTIVE`) when
that file exists or when you create it, and read from it everywhere.

Perspective shapes how you draw and move things:
- `top-down` - camera looks straight down; flat/tiled ground, no horizon.
- `side-view` - side-scroller / platformer; a horizon and layered background are fine.
- `isometric` - 3/4 diamond-aligned view.
</style_consistency>

<image_orientation>
A generated image is static — at runtime you can't tell which way it was drawn. So decide an object's facing
when you generate it, bake it into the image prompt, and write the movement code to match: say
"a fighter jet seen from above, nose pointing up", not just "a fighter jet". This matters for anything with a
heading (characters, vehicles, projectiles, creatures); backgrounds, tiling textures, and symmetric pickups
(coins, gems) don't need it.

Choose the facing from how the object MOVES, not from what it is:
- Travels in a fixed direction without turning → draw it facing that direction. A vertical shooter's ship and
  its bullets go up, so draw them pointing up; a runner's hero moves right, so draw it facing right.
- Turns to aim or steer (your code rotates it toward its target or velocity) → draw it facing right; the
  rotation then needs no offset. E.g. a homing missile, a twin-stick player, a turret, a top-down car.
- Faces several ways (a walking character) → draw one facing and mirror it for the opposite side; generate
  the other facings as separate images only if the game needs them.

Enemies usually face the opposite way to the player, so they confront it: if the hero faces right, patrolling
enemies face left. (An enemy that chases by rotating toward the player is the "turns to aim" case above.)

Examples by perspective:
- top-down: terrain and props seen from straight above; a shooter ship/asteroid reads from overhead (nose up);
  top-down-RPG characters are drawn from a high angle so the face still shows, not a hat seen from above.
- side-view: side profiles on the ground — hero faces right, enemies face left, trees and buildings upright.
- isometric: drawn at the 3/4 iso angle, aligned to the diamond grid.
- UI/HUD icons: flat and front-on, no game perspective.
</image_orientation>

<backgrounds>
Whether a background should REPEAT depends on whether the game SCROLLS — not on the
perspective. When generating or sourcing one, pick the matching
kind and wire the result accordingly:

- Scrolling games (camera moves through a world larger than the screen — a platformer
  level, a scrolling overworld): a large image with seamless edges, tiled with
  `this.add.tileSprite(...)` and scrolled via `tilePosition*` with the camera. Top-down
  tiles on both axes; side-view tiles horizontally only (a horizon must not repeat
  vertically — stretch it to fill the height with `tileScaleY`).

- Static, single-screen games (a board, an arena, a menu, a one-screen puzzle): do NOT
  tile. Use a large single image that COVERS the viewport — one `this.add.image(...)`
  scaled by `Math.max(GAME_WIDTH / w, GAME_HEIGHT / h)` (preserve aspect, crop overflow),
  or `setDisplaySize(GAME_WIDTH, GAME_HEIGHT)` to stretch.

Simple backgrounds can still be drawn programmatically — a solid fill, a Graphics
gradient, or shapes — matching the chosen perspective.
</backgrounds>

Do not mix inconsistent visual styles in the same scene unless the user explicitly wants that contrast.
</game_assets>

To opt-out, set `{"analytics":{"enabled":false}}` when initializing the base44 SDK (supported from 0.8.46).

<phaser_reference>
Deep Phaser reference sections (physics, particles, tilemaps, etc.) are the files under `references/phaser/`; read the one for the mechanic you are building before writing it.

<scene_basics>
Every Phaser scene must import Phaser or the Phaser classes it extends/uses.

Valid patterns:
```js
import Phaser from 'phaser';
export class GameScene extends Phaser.Scene {}
```

```js
import { Scene } from 'phaser';
export class GameScene extends Scene {}
```

Scene lifecycle:
- `preload()` loads assets.
- `create()` creates objects, physics, input handlers, cameras, and emits readiness events.
- `update(time, delta)` runs every frame.
</scene_basics>

<arcade_physics_default>
Default to Arcade physics for top-down games, platformers, runners, shooters, and most action games.

Common Arcade patterns:
```js
this.physics.add.existing(sprite);
sprite.body.setVelocityX(200);
sprite.body.setGravityY(300);
sprite.body.setCollideWorldBounds(true);

const platforms = this.physics.add.staticGroup();
this.physics.add.collider(player, platforms);
this.physics.add.overlap(player, coins, collectCoin, null, this);
```
</arcade_physics_default>

<input>
Support keyboard and pointer/touch where reasonable.

```js
this.cursors = this.input.keyboard.createCursorKeys();
this.input.on('pointerdown', (pointer) => {});
```
</input>

<cameras>
```js
this.cameras.main.startFollow(player);
this.cameras.main.setBounds(0, 0, worldWidth, worldHeight);
this.cameras.main.setZoom(1.5);
```
</cameras>

<animation>
```js
this.anims.create({
  key: 'walk',
  frames: this.anims.generateFrameNumbers('player', { start: 0, end: 3 }),
  frameRate: 10,
  repeat: -1,
});
sprite.play('walk');
```
</animation>

<tweens_timers_and_scenes>
```js
this.tweens.add({ targets: sprite, y: sprite.y - 50, duration: 500, yoyo: true });
this.time.addEvent({ delay: 1000, callback: spawnEnemy, loop: true });
this.scene.start('NextScene');
this.scene.launch('EffectsScene'); // parallel world-layer scene — screen-space UI lives in the React overlay, not a Phaser scene
this.registry.set('score', 0);
this.registry.get('score');
```
</tweens_timers_and_scenes>

<fallback_textures>
If an asset has not loaded yet, the game should still run. Create fallback textures before using keys:
```js
createFallbackTexture(key, width, height, color) {
  if (this.textures.exists(key)) return;
  const graphics = this.add.graphics();
  graphics.fillStyle(color, 1);
  graphics.fillRect(0, 0, width, height);
  graphics.generateTexture(key, width, height);
  graphics.destroy();
}
```
</fallback_textures>

<sprite_sheets>
Load sprite sheets with frame dimensions. Never load a sprite sheet as a single image.

```js
this.load.spritesheet('player', '/assets/game/player.png', {
  frameWidth: 256,
  frameHeight: 256,
});

this.player = this.physics.add.sprite(400, 300, 'player', 0);
```

The sprite displays one frame at a time. Phaser slices the grid into frames.

Common mistakes to avoid:
- Do not use `this.load.image()` for sprite sheets.
- Do not omit `{ frameWidth, frameHeight }`.
- Do not forget an initial frame when creating the sprite.
- Stop walk animations when idle, otherwise characters keep walking in place.
- Use `setFlipX` when reusing a side-facing row for left/right movement.
</sprite_sheets>

<audio>
Browsers block autoplay. Start or resume audio after a user click/tap.
</audio>
</phaser_reference>

<phaser_v4_guide>
This project uses Phaser 4 (the template ships `phaser@^4.1.0`). Several common Phaser 3 APIs were removed or changed in v4 — always use the v4 forms below, not the older v3 equivalents. These rules apply to every change; deeper per-topic detail is in the files under `references/phaser/`.

<v3_apis_removed_use_v4>
These Phaser 3 APIs are GONE in v4 — calling them throws or silently no-ops. Use the v4 form:

- Mesh / Plane game objects are removed. There is NO `this.add.mesh()` or `this.add.plane()`, and `Phaser.Geom.Mesh` perspective helpers (`GenerateGridVerts`, `panZ`, `modelRotation`, `hideCCW`) are gone. For a 3D LOOK in a 2D Phaser game use pseudo-3D (depth scaling, parallax, isometric sorting) — see mesh_and_3d_elements.
- `setTintFill(color)` is removed → `sprite.setTint(color).setTintMode(Phaser.TintModes.FILL)`. Tint mode is now separate from tint color (modes: `MULTIPLY` (default), `FILL`, `ADD`, `SCREEN`, `OVERLAY`, `HARD_LIGHT`).
- `preFX` / `postFX` are removed → the Filters system. Call `sprite.enableFilters()` first (cameras already have filters), then add via `sprite.filters.internal.addX()` (object-local, cheaper) or `sprite.filters.external.addX()` (screen-space). e.g. `sprite.preFX.addGlow()` becomes `sprite.enableFilters(); sprite.filters.internal.addGlow()`.
- `setPipeline('Light2D')` is removed → `sprite.setLighting(true)` (per-object Lighting component; optional `setSelfShadow(...)`). Custom WebGL `Pipeline`s are gone too (replaced internally by RenderNodes) — do not hand-write a v3 pipeline; use Filters for post-processing.
- WebGL masks: `new Phaser.Display.Masks.BitmapMask(...)` + `setMask()` are removed for WebGL → `sprite.enableFilters(); sprite.filters.internal.addMask(maskTextureOrObject)`. (GeometryMask survives on the Canvas renderer only.)
- `Phaser.Geom.Point` is removed → use `Phaser.Math.Vector2` or a plain `{ x, y }` object.
- `Phaser.Structs.Set` is removed → use native JS `Set` (`add`/`has`/`delete`/`forEach`). (`Phaser.Structs.Map` still exists in v4, but native `Map` is fine for plain key/value storage.)
- `Phaser.Math.PI2` is removed → `Phaser.Math.TAU` (NOTE: in v4 `TAU` equals 2π, not π/2; for π/2 use `Phaser.Math.PI_OVER_2`).
- `RenderTexture` / `DynamicTexture` drawing is now buffered — `draw`/`stamp`/`fill`/`erase` push commands and you MUST call `.render()` to flush them (or set `renderMode: 'all'`); they no longer paint immediately.
- There is no dedicated Bloom FX → use `Phaser.Actions.AddEffectBloom(...)` or ParallelFilters (Threshold + Blur + `ADD` blend).
- `Phaser.Create.GenerateTexture` and the Create palettes are removed → build textures with a Graphics object + `generateTexture(key, w, h)` (the Graphics method still exists; the Create utility does not).
- `roundPixels` now defaults to `false` (v3 defaulted to `true`) — set it explicitly in the game/camera config when you need crisp pixel art.

When tempted to reach for a v3-era API not listed here, prefer the documented v4 component/method and do not assume a v3 signature.
</v3_apis_removed_use_v4>

<v4_capabilities_to_use>
v4 adds GPU-accelerated systems worth reaching for. One-liners below; full usage is in the matching `references/phaser/` file:
- Filters (`filters.internal` / `filters.external` after `enableFilters()`): modern post-processing on any object or camera — glow, blur, bloom, color matrix, displacement, vignette, masks. See filters_and_postfx.
- Lighting + self-shadow (`setLighting(true)`, `setSelfShadow(...)`): cheap 2D lighting with no pipeline. See game_object_components.
- New tint modes (`setTintMode(Phaser.TintModes.ADD | SCREEN | OVERLAY | HARD_LIGHT)`): additive glows and blends without filters.
- SpriteGPULayer (`this.add.spriteGPULayer(...)`): renders huge numbers of quads (up to millions) in a single draw call — reach for it on bullet-hell, dense particles-as-sprites, forests, starfields. See sprites_and_images.
- TilemapGPULayer (create the layer with the GPU option enabled): GPU tilemap whose cost is per-pixel, not per-tile, with no seams in LINEAR filtering. See tilemaps.
- Gradient and Noise game objects (`this.add.gradient(...)`, `this.add.noiseSimplex2D(...)`, etc.): GPU-generated gradients and procedural noise for skies, fog, water, and fire. See graphics_and_shapes / render_textures.
- CaptureFrame (`this.add.captureFrame(key)`): snapshot the framebuffer at a point in the display list into a texture, for echo/feedback effects.
</v4_capabilities_to_use>
</phaser_v4_guide>
