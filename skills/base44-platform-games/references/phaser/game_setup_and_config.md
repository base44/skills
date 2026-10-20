<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Phaser 4: game setup and config

<game_setup_and_config>
Use this when creating a new Phaser 4 game instance or configuring GameConfig options: renderer selection, canvas setup, scaling, pixel art, FPS settings, boot sequence, and config sub-objects.

<quick_start>
The simplest possible Phaser 4 game — a single scene with the default 1024×768 canvas:

```js
class MyScene extends Phaser.Scene {
    preload() { this.load.image('logo', 'assets/logo.png'); }
    create() { this.add.image(400, 300, 'logo'); }
}

const config = {
    type: Phaser.AUTO,
    scene: MyScene
};

const game = new Phaser.Game(config);
```

`new Phaser.Game(config)` triggers the entire boot sequence: config parsing, renderer creation, DOM insertion, and the game loop (`TimeStep`). The game waits for `DOMContentLoaded` before booting.
</quick_start>

<core_concepts>
**Boot sequence**: `new Phaser.Game(config)` parses config into a `Phaser.Core.Config` instance, then creates the global managers (`AnimationManager`, `TextureManager`, `CacheManager`, `InputManager`, `SceneManager`, `ScaleManager`, `SoundManager`, `TimeStep`, `PluginManager`). After `DOMContentLoaded` it calls `boot()` — which creates the renderer, adds the canvas to the DOM, prints the debug header, and emits `BOOT`. Once textures are ready (`TextureManager` emits `READY`), it emits `READY` and calls `start()`, which begins the `TimeStep` loop, sets up the `VisibilityHandler`, and calls `config.postBoot`.

**Config parsing**: the `Config` constructor reads a flat `GameConfig` object and resolves defaults. Some properties can be specified at top level OR nested in sub-objects (e.g. `width` can be top-level or under `scale.width`; `pixelArt` can be top-level or under `render`). The nested sub-object (`scale`, `render`) takes priority when both are present.

**Renderer constants** (set via `config.type`, default `Phaser.AUTO`):
- `Phaser.AUTO` (0) — WebGL if supported, else falls back to Canvas.
- `Phaser.CANVAS` (1) — force Canvas renderer.
- `Phaser.WEBGL` (2) — force WebGL, no fallback if unsupported.
- `Phaser.HEADLESS` (3) — no renderer (DOM still required). For unit testing only.
</core_concepts>

<common_patterns>
Pixel art game — when `pixelArt` is `true`, Config automatically sets `antialias: false`, `antialiasGL: false`, and `roundPixels: true`:

```js
const config = {
    type: Phaser.AUTO,
    width: 320,
    height: 240,
    pixelArt: true,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        zoom: Phaser.Scale.ZOOM_2X
    },
    scene: MyScene
};
```

Smooth pixel art (WebGL only) — preserves blocky pixels but smooths edges between them when scaled up. When `smoothPixelArt` is `true`, Config sets `antialias: true`, `antialiasGL: true`, and `pixelArt: false`:

```js
const config = {
    type: Phaser.WEBGL,
    width: 320,
    height: 240,
    smoothPixelArt: true,
    scene: MyScene
};
```

Full-window responsive game:

```js
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game-container',
        width: '100%',
        height: '100%'
    },
    scene: MyScene
};
```

Fixed aspect ratio with FIT (letterboxing):

```js
const config = {
    type: Phaser.AUTO,
    scale: {
        mode: Phaser.Scale.FIT,
        parent: 'game-container',
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
        min: { width: 640, height: 360 },
        max: { width: 1920, height: 1080 }
    },
    backgroundColor: '#2d2d2d',
    scene: MyScene
};
```

Custom FPS limit:

```js
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    fps: { target: 60, limit: 30, forceSetTimeOut: false, smoothStep: true },
    scene: MyScene
};
```

Transparent canvas over HTML — when `transparent` is `true`, `backgroundColor` is forced to `0x000000` with alpha `0`:

```js
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    transparent: true,
    parent: 'game-container',
    scene: MyScene
};
```

Pre-existing canvas element:

```js
const canvas = document.getElementById('my-canvas');
const config = {
    type: Phaser.WEBGL,
    canvas: canvas,
    width: 800,
    height: 600,
    scene: MyScene
};
```

Multiple scenes — only the first scene starts automatically; others start only if they have `{ active: true }` in their scene config:

```js
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    scene: [BootScene, PreloadScene, MenuScene, GameScene],
    physics: { default: 'arcade', arcade: { gravity: { y: 300 } } }
};
```

Boot callbacks:

```js
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    callbacks: {
        preBoot: function (game) { /* before boot; game systems not yet available */ },
        postBoot: function (game) { /* after boot; all systems ready, loop starting */ }
    },
    scene: MyScene
};
```

Disabling input subsystems:

```js
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    input: {
        keyboard: true, mouse: true, touch: false,
        gamepad: false, activePointers: 1, windowEvents: true
    },
    disableContextMenu: true,
    scene: MyScene
};
```

**Scale modes** (`scale.mode`): `NONE` (0, no scaling), `WIDTH_CONTROLS_HEIGHT` (1), `HEIGHT_CONTROLS_WIDTH` (2), `FIT` (3, fit inside parent keeping aspect ratio — letterbox), `ENVELOP` (4, cover parent keeping aspect ratio — may overflow), `RESIZE` (5, fill parent ignoring aspect ratio), `EXPAND` (6, RESIZE for visible area + FIT for canvas scale). **Center modes** (`scale.autoCenter`): `NO_CENTER` (0), `CENTER_BOTH` (1), `CENTER_HORIZONTALLY` (2), `CENTER_VERTICALLY` (3). **Zoom constants** (`scale.zoom`): `NO_ZOOM` (1), `ZOOM_2X` (2), `ZOOM_4X` (4), `MAX_ZOOM` (-1, max integer zoom that fits in parent).
</common_patterns>

<lifecycle_and_globals>
Listen on `game.events` (or `this.game.events` from a Scene) for visibility and focus changes (use named constants `Phaser.Core.Events.BLUR`, `FOCUS`, `HIDDEN`, `VISIBLE`, `PAUSE`, `RESUME`):

```js
game.events.on('blur', () => { /* tab lost focus */ });
game.events.on('focus', () => { /* tab regained focus */ });
game.events.on('hidden', () => { /* Page Visibility API: page hidden */ });
game.events.on('visible', () => { /* Page Visibility API: page visible */ });
game.events.on('pause', () => { /* game.pause() was called */ });
game.events.on('resume', () => { /* game.resume() was called */ });
```

Pause, resume, and destroy:

```js
game.pause();   game.resume();
if (game.isPaused) { /* game loop is not running */ }

game.destroy(true);          // remove canvas from DOM and clean up
game.destroy(true, true);    // noReturn=true: NEVER creating another instance
```

`destroy(removeCanvas, noReturn)` is asynchronous — it flags the game for destruction on the next frame. Listen for `Phaser.Core.Events.DESTROY` to react to completion.

The `Game` instance exposes key managers as properties, accessible from any Scene via `this.game`: `game.config` (parsed Config, read-only after boot), `game.scene` (SceneManager — start/stop/switch scenes), `game.registry` (DataManager — shared runtime data manager across all scenes), `game.anims` (global animation definitions), `game.cache` (loaded non-texture assets), `game.textures` (loaded textures and sprite sheets), `game.sound` (global sound manager).

```js
this.game.registry.set('highScore', 9999);   // shared registry from any scene
this.game.scene.start('MenuScene');           // scene manager
```
</lifecycle_and_globals>

<gotchas>
- **scale vs top-level config**: `width`, `height`, `zoom`, and `parent` can be set at top level or inside `scale`; the `scale` sub-object wins. Avoid setting both.
- **Phaser.WEBGL has no fallback**: unlike `AUTO`, it will not fall back to Canvas if WebGL is unavailable — the game fails silently.
- **parent: null vs parent: undefined**: `undefined` (or omitted) appends the canvas to `document.body`. `null` means Phaser does not add the canvas to the DOM at all — you must do it yourself.
- **transparent overrides backgroundColor**: when `transparent: true`, the background is forced to `rgba(0,0,0,0)` regardless of what you set.
- **fps.target does not enforce frame rate**: it is advisory only. Use `fps.limit` to actually cap. The browser's display refresh rate is always the upper bound.
- **fps.limit only slows down, never speeds up**: `limit: 120` on a 60Hz display still results in 60 FPS.
- **DOM Container requires a parent**: `dom.createContainer: true` without a `parent` element will not work.
- **smoothPixelArt is WebGL-only**: no effect with the Canvas renderer.
- **window.FORCE_WEBGL / window.FORCE_CANVAS**: Config.js checks these globals at the end of parsing and overrides the `type` setting (intended for development/testing).
- **Game.destroy() is asynchronous**: it flags destruction on the next frame; listen for the `DESTROY` event. Pass `noReturn: true` only if you will never create another Phaser instance on the same page.
</gotchas>
</game_setup_and_config>
