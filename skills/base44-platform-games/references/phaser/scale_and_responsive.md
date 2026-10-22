<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: scale and responsive

<scale_and_responsive>
Use this when making a Phaser 4 game responsive or handling display scaling: the ScaleManager, scale modes (FIT, RESIZE, EXPAND, ENVELOP), auto-center, zoom, fullscreen, orientation handling, and browser resize.

<quick_start>
Scale-to-fit with centering — the most common setup for responsive games:

```js
const config = {
    type: Phaser.AUTO,
    scale: {
        parent: 'game-container',
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 800,
        height: 600
    },
    scene: MyScene
};

const game = new Phaser.Game(config);
```

The `scale` config is parsed into a `Phaser.Core.Config` instance that the ScaleManager reads during boot. The ScaleManager sets the canvas element size and applies CSS scaling to fit it within its parent.
</quick_start>

<core_concepts>
The ScaleManager is created during the Game boot sequence and is accessible at `game.scale` or `this.scale` from within a Scene. It extends EventEmitter.

Three internal Size components drive all calculations: `gameSize` (`game.scale.gameSize`) is the unmodified game dimensions from config, used for world bounds and cameras (read via `game.scale.width` / `.height`); `baseSize` is the auto-rounded gameSize that sets the actual `canvas.width` / `canvas.height` attributes; `displaySize` is the CSS-scaled canvas size after applying scale mode, parent bounds, and zoom, setting `canvas.style.width` / `.height`. Scaling works by keeping the canvas element dimensions fixed (baseSize) and stretching it via CSS (displaySize) — equivalent to CSS `transform-scale` but without prefix issues. The `displayScale` property (Vector2) holds `baseSize / canvasBounds` and is used internally for input coordinate transformation.

Scale modes (`Phaser.Scale.ScaleModes`, set via `scale.mode`; shorthand constants like `Phaser.Scale.FIT` also exist directly on `Phaser.Scale`):
- `NONE` (0) — no automatic scaling. Canvas uses config width/height; you manage sizing yourself. If you resize the canvas externally, call `game.scale.resize(w, h)` to update internals.
- `WIDTH_CONTROLS_HEIGHT` (1) — height adjusts automatically to maintain aspect ratio based on width.
- `HEIGHT_CONTROLS_WIDTH` (2) — width adjusts automatically to maintain aspect ratio based on height.
- `FIT` (3) — scales to fit inside parent while preserving aspect ratio. May leave empty space (letterbox/pillarbox). Most commonly used.
- `ENVELOP` (4) — scales to cover the entire parent while preserving aspect ratio. May extend beyond parent bounds (content gets cropped).
- `RESIZE` (5) — the canvas element itself is resized to fill parent. No CSS scaling, 1:1 pixel mapping; `gameSize`, `baseSize`, and `displaySize` all change to match parent. Beware GPU fill-rate on large displays.
- `EXPAND` (6) — hybrid of RESIZE and FIT: the visible area resizes to fill the parent, and the canvas scales to fit inside that area. Added in v3.80.

Center modes (set via `scale.autoCenter`; centering uses CSS `marginLeft`/`marginTop` on the canvas): `NO_CENTER` (0, default), `CENTER_BOTH` (1), `CENTER_HORIZONTALLY` (2), `CENTER_VERTICALLY` (3). The parent element must have calculable bounds — if it has no defined width/height, centering will not work correctly.

Zoom (set via `scale.zoom`, multiplies the display size): `NO_ZOOM` (1, default), `ZOOM_2X` (2, good for pixel art at low base resolution), `ZOOM_4X` (4), `MAX_ZOOM` (-1, automatically calculates the largest integer zoom that fits the parent). You can also pass any numeric value. Zoom affects CSS display size but not canvas resolution.

Orientation (read via `game.scale.orientation`, string values): `Phaser.Scale.Orientation.LANDSCAPE` = `'landscape-primary'`, `LANDSCAPE_SECONDARY` = `'landscape-secondary'`, `PORTRAIT` = `'portrait-primary'`, `PORTRAIT_SECONDARY` = `'portrait-secondary'`. Convenience booleans: `isPortrait`, `isLandscape` (device orientation), `isGamePortrait`, `isGameLandscape` (game dimensions).
</core_concepts>

<common_patterns>
FIT mode with centering (most common) — maintains aspect ratio and centers within the parent; empty space appears as letterbox/pillarbox bars (style the parent's background to control bar appearance):
```js
scale: {
    parent: 'game-container',
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 1280,
    height: 720
}
```

Responsive resize (dynamic canvas size) — width/height accept percentage strings that resolve against the parent size (falling back to `window.innerWidth`/`innerHeight` if the parent has no size):
```js
scale: {
    parent: 'game-container',
    mode: Phaser.Scale.RESIZE,
    width: '100%',
    height: '100%'
}
```
```js
// In your scene -- respond to size changes:
create() {
    this.scale.on('resize', this.handleResize, this);
}

handleResize(gameSize, baseSize, displaySize) {
    this.cameras.resize(gameSize.width, gameSize.height);
    // Reposition UI elements based on new dimensions
}
```

Fullscreen toggle — must be called from a `pointerup` gesture (not `pointerdown`):
```js
this.input.on('pointerup', () => {
    if (this.scale.isFullscreen) {
        this.scale.stopFullscreen();
    } else {
        this.scale.startFullscreen();
    }
});

// Or the convenience method:
this.input.on('pointerup', () => {
    this.scale.toggleFullscreen();
});
```
`startFullscreen(fullscreenOptions)` requests browser fullscreen (default options `{ navigationUI: 'hide' }`), `stopFullscreen()` exits, `toggleFullscreen(fullscreenOptions)` toggles, `isFullscreen` is the read-only state. If no `fullscreenTarget` is configured, Phaser creates a temporary `<div>`, moves the canvas into it, and sends that div fullscreen (the div is removed when leaving). For iframes, the `allowfullscreen` attribute is required.

Mobile orientation handling:
```js
create() {
    this.scale.on('orientationchange', (orientation) => {
        if (orientation === Phaser.Scale.LANDSCAPE) {
            // Show game UI
        } else {
            // Show "rotate device" message
        }
    });

    // Lock orientation (mobile browsers only, limited support):
    this.scale.lockOrientation('landscape');
}
```

Fixed size (no scaling) — in NONE mode, if you change the canvas size externally you must call `game.scale.resize(newWidth, newHeight)` to update all internal components including input coordinates:
```js
scale: {
    mode: Phaser.Scale.NONE,
    width: 800,
    height: 600
}
```

Pixel art with max zoom — `MAX_ZOOM` calculates the largest integer multiplier that fits in the parent; combined with `pixelArt: true` (which disables anti-aliasing) this gives crisp pixel rendering:
```js
scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 320,
    height: 240,
    zoom: Phaser.Scale.MAX_ZOOM
},
pixelArt: true
```

Snap values for grid alignment — when the browser resizes, dimensions snap down to the nearest grid multiple (floor). Best with FIT mode. Can also be set at runtime via `game.scale.setSnap(16, 16)` or reset with `game.scale.setSnap()`:
```js
scale: {
    mode: Phaser.Scale.FIT,
    width: 800,
    height: 600,
    snap: { width: 16, height: 16 }
}
```

Min/max size constraints — the display size is clamped to these bounds during scaling calculations:
```js
scale: {
    mode: Phaser.Scale.FIT,
    width: 800,
    height: 600,
    min: { width: 400, height: 300 },
    max: { width: 1600, height: 1200 }
}
```

Other `scale` config properties: `expandParent` (default true, allows the ScaleManager to set parent/body CSS height to 100%), `parent` (DOM element or its ID; `undefined` = `document.body`, `null` = no parent so you manage canvas placement), `autoRound` (default false, floors display/style sizes for low-powered devices), `resizeInterval` (default 500ms, between parent size checks for fallback polling), `fullscreenTarget` (element to send fullscreen; if unset, Phaser creates a wrapper div).

Useful runtime methods: `resize(width, height)` (NONE mode only — sets game/base/display sizes directly and updates the canvas + CSS), `setGameSize(width, height)` (scaled modes — changes base game size and re-applies scaling), `setParentSize(width, height)`, `setZoom(value)`, `setMaxZoom()`, `getMaxZoom()`, `setSnap(w, h)`, `getViewPort(camera?, out?)`, `refresh(prevW?, prevH?)` (forces recalculation and emits RESIZE), `transformX(pageX)` / `transformY(pageY)` (DOM-to-game coordinate), `getParentBounds()`, `updateCenter()`, `updateBounds()`.
</common_patterns>

<events>
All events are on `Phaser.Scale.Events` and are emitted by the ScaleManager (`game.scale`):

- `'resize'` (RESIZE) — any resize, refresh, or scale change. Args `(gameSize, baseSize, displaySize, previousWidth, previousHeight)`; the three Size params have `.width`, `.height`, `.aspectRatio`.
- `'orientationchange'` (ORIENTATION_CHANGE) — device orientation changes. Args `(orientation)`, a string constant from `Phaser.Scale.Orientation`.
- `'enterfullscreen'` (ENTER_FULLSCREEN) — browser successfully enters fullscreen.
- `'leavefullscreen'` (LEAVE_FULLSCREEN) — browser leaves fullscreen (via code or user ESC).
- `'fullscreenfailed'` (FULLSCREEN_FAILED) — fullscreen request denied. Args `(error)`.
- `'fullscreenunsupported'` (FULLSCREEN_UNSUPPORTED) — browser lacks the Fullscreen API.
</events>

<gotchas>
1. Parent element must have dimensions. The ScaleManager relies on the parent's computed CSS size. An unstyled `<div>` has zero height, which breaks centering and scaling. Give it explicit CSS dimensions or rely on `expandParent: true` (default) to set body/parent to 100% height.
2. No padding on the parent. The ScaleManager does not account for parent padding. Apply padding to a wrapper element instead, or use margins on the parent's parent.
3. Do not style the canvas directly. The ScaleManager controls `canvas.style.width`, `.height`, `marginLeft`, and `marginTop`. External CSS on the canvas will conflict.
4. Fullscreen requires `pointerup`, not `pointerdown`. On touch devices, `pointerdown` fullscreen requests are blocked unless the document already received touch input. Always use `pointerup`.
5. Fullscreen in iframes needs `allowfullscreen`. Without this attribute on the iframe, fullscreen requests silently fail.
6. RESIZE mode and GPU fill-rate. RESIZE creates a 1:1 pixel canvas matching the parent; on high-resolution displays this can be very large. Monitor performance on low-end devices.
7. `resize()` vs `setGameSize()`. Use `resize()` only in NONE mode (it sets everything directly); use `setGameSize()` with FIT/ENVELOP/etc. (it preserves the scale mode calculations).
8. iOS height quirks. When the parent is the window on iOS, the ScaleManager uses `GetInnerHeight` to work around Safari's dynamic toolbar affecting `getBoundingClientRect`.
9. Percentage strings require a sized parent. `width: '100%'` / `height: '100%'` resolve against `parentSize`; if the parent has no size, they fall back to `window.innerWidth`/`innerHeight`.
10. `resizeInterval` is a fallback poll. Modern browsers dispatch `resize` events, but the ScaleManager also polls every `resizeInterval` ms (default 500) to catch edge cases on older browsers.
</gotchas>
</scale_and_responsive>
