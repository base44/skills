<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: cameras

<cameras>
Use this when working with cameras in Phaser 4: the CameraManager and main camera, viewport vs scroll, zoom, bounds, following sprites, camera effects (fade, flash, shake, pan, zoomTo, rotateTo), ignore lists, filters, and keyboard controls.

<quick_start>
Every Scene has a default camera at `this.cameras.main`. Access it in `create()` to scroll, zoom, follow, bound, and apply effects.

```js
// In a Scene's create() method:

// Access the default camera (created automatically)
const cam = this.cameras.main;

// Scroll the camera to look at a different part of the world
cam.setScroll(200, 100);

// Center camera on a world coordinate
cam.centerOn(400, 300);

// Zoom in (2x) -- values < 1 zoom out, > 1 zoom in
cam.setZoom(2);

// Follow a sprite with smooth lerp
cam.startFollow(player, false, 0.1, 0.1);

// Constrain the camera to the world bounds
cam.setBounds(0, 0, 2048, 2048);

// Fade in from black over 1 second
cam.fadeIn(1000);

// Add a filter to the camera (v4 feature)
cam.filters.external.addBlur(1, 2);
```
</quick_start>

<core_concepts>
Every Scene has a `CameraManager` at `this.cameras` (not `this.camera`), registered as a plugin under the key `'CameraManager'`. Key references: `this.cameras.cameras` (array of Camera objects in render order), `this.cameras.main` (the "main" camera, `cameras[0]` by default), `this.cameras.default` (an un-transformed utility camera, not in the cameras array).

Key CameraManager methods: `add(x?, y?, width?, height?, makeMain?, name?)` creates a Camera (defaults to full game size at 0,0); `addExisting(camera, makeMain?)` adds a pre-built Camera; `remove(camera, runDestroy?)` removes and optionally destroys (if main is removed, resets to `cameras[0]`); `getCamera(name)` finds by name; `getTotal(isVisible?)` counts cameras; `fromJSON(config)` creates cameras from config; `resetAll()` destroys all and creates one fresh default; `resize(width, height)` resizes all cameras. The manager supports up to 32 cameras that can use `ignore()` for object exclusion (IDs are bitmasks); cameras beyond 32 get ID 0 and cannot exclude objects.

The `main` property is a convenience reference, set automatically when the scene boots (first camera created becomes main), when you pass `makeMain: true` to `add`/`addExisting`, or when the current main is removed (falls back to `cameras[0]`).

A Camera has two independent coordinate concepts. The **viewport** is the physical rectangle on the canvas where it renders, controlled by `setPosition(x, y)`, `setSize(w, h)`, or `setViewport(x, y, w, h)` (defaults to filling the canvas). **Scroll** is where the camera is looking in the world, controlled by `scrollX`/`scrollY` or `setScroll(x, y)` — scrolling does not affect the viewport. `worldView` is a read-only `Rectangle` updated each frame reflecting what world area the camera can currently see (accounting for scroll, zoom, and bounds), useful for culling or intersection checks.

```js
// Viewport: a 320x200 mini-map in the top-right corner
const miniCam = this.cameras.add(480, 0, 320, 200);
// Scroll: make the mini-map look at a different world area
miniCam.setScroll(1000, 500);
// Zoom: the mini-cam shows more of the world
miniCam.setZoom(0.25);
```
</core_concepts>

<common_patterns>
Scrolling:
```js
cam.scrollX = 100; cam.scrollY = 200;     // direct property access
cam.setScroll(100, 200);                  // chainable setter
cam.centerOn(500, 400);                   // center on a world coordinate
const point = cam.getScroll(500, 400);    // scroll values to center on a point (Vector2), without moving
```

Following a sprite — `startFollow` accepts any object with `x`/`y` (not just Game Objects). Lerp of `1` snaps instantly, `0.1` gives smooth tracking, `0` on an axis disables tracking on that axis. With a deadzone set, the camera does not scroll while the target remains inside the deadzone rectangle (re-centered on the camera midpoint each frame).
```js
cam.startFollow(player);                          // instant follow (lerp = 1, default)
cam.startFollow(player, false, 0.1, 0.1);          // smooth follow
// startFollow(target, roundPixels?, lerpX?, lerpY?, offsetX?, offsetY?)
cam.startFollow(player, true, 0.05, 0.05, 0, -50);

cam.setLerp(0.08, 0.08);          // change lerp after starting
cam.setFollowOffset(0, -50);      // change offset after starting
cam.setDeadzone(200, 150);        // camera only scrolls when target leaves this rect
cam.stopFollow();
```

Zoom — never set zoom to 0; the minimum is clamped to 0.001:
```js
cam.setZoom(2);       // 2x zoom in
cam.setZoom(0.5);     // zoom out (see twice as much)
cam.setZoom(2, 1);    // independent horizontal/vertical zoom
cam.zoom;             // shortcut -- reads zoomX (assumes uniform)
cam.zoomX; cam.zoomY;
```

Bounds — bounds only restrict scrolling; they do not prevent placing Game Objects outside, nor affect the viewport position:
```js
cam.setBounds(0, 0, worldWidth, worldHeight);
cam.setBounds(0, 0, 2048, 2048, true);   // center on new bounds immediately
cam.useBounds = false;                    // temporarily disable without removing
cam.removeBounds();                       // remove entirely
const rect = cam.getBounds();             // returns a new Rectangle copy
```

Multiple cameras — a dual-camera layering pattern (minimaps, in-canvas effect layers; screen-space HUD belongs in the React overlay): one camera ignores world objects and the other ignores layer objects:
```js
const main = this.cameras.main;

const minimap = this.cameras.add(600, 0, 200, 150).setZoom(0.2).setName('minimap');
minimap.setScroll(0, 0);
minimap.setBackgroundColor('rgba(0,0,0,0.5)');

const hudCam = this.cameras.add(0, 0, 800, 600).setName('hud');
hudCam.setScroll(0, 0);

main.ignore(hudGroup);     // main ignores HUD objects
hudCam.ignore(worldGroup); // HUD camera ignores world objects

const found = this.cameras.getCamera('minimap');
this.cameras.remove(minimap);
```

Camera effects — all are on the `Camera` class (not `BaseCamera`), each returns `this` for chaining, and an already-running effect will not restart unless you pass `force: true`.

Fade — `fadeOut`/`fade` goes transparent-to-color; `fadeIn`/`fadeFrom` goes color-to-transparent:
```js
cam.fadeOut(1000);                // to black over 1s
cam.fadeOut(1000, 255, 0, 0);     // to red
cam.fadeIn(500);                  // from black over 500ms
cam.fade(1000, 0, 0, 0, true);    // lower-level, force start even if running
cam.fadeFrom(1000, 0, 0, 0, true);
cam.fadeOut(1000, 0, 0, 0, (cam, progress) => { /* progress 0..1 */ });
```

Flash — `flash(duration?, r?, g?, b?, force?, callback?, context?)`:
```js
cam.flash(250);                   // white flash, default 250ms
cam.flash(500, 255, 0, 0);        // red flash
cam.flash(300, 255, 255, 255, true, (cam, progress) => {});
```

Shake — `shake(duration?, intensity?, force?, callback?, context?)`. The intensity is a small float; the default 0.05 shifts up to 5% of the viewport size:
```js
cam.shake(100);                                       // 100ms at intensity 0.05
cam.shake(500, 0.02);                                  // stronger, longer
cam.shake(300, new Phaser.Math.Vector2(0.1, 0.02));    // independent x/y intensity
```

Pan — scrolls the camera so its viewport center finishes at the given world coordinate; `pan(x, y, duration?, ease?, force?, callback?, context?)`:
```js
cam.pan(400, 300, 2000);
cam.pan(400, 300, 2000, 'Power2');
cam.pan(800, 600, 1500, 'Sine.easeInOut', false, (cam, progress, x, y) => {});
```

ZoomTo — `zoomTo(zoom, duration?, ease?, force?, callback?, context?)`:
```js
cam.zoomTo(2, 1000);
cam.zoomTo(0.5, 2000, 'Cubic.easeOut');
```

RotateTo — angle is in **radians**; set `shortestPath` to take the shortest direction; `rotateTo(angle, shortestPath?, duration?, ease?, force?, callback?, context?)`:
```js
cam.rotateTo(Phaser.Math.DegToRad(45), false, 1000);
cam.rotateTo(Math.PI, true, 1500, 'Quad.easeInOut');
```

Reset all running effects (rotate, pan, shake, flash, fade):
```js
cam.resetFX();
```

Keyboard controls — both classes require `update(delta)` in your scene's update method and support `zoomIn`/`zoomOut` keys plus a `zoomSpeed` config value. `FixedKeyControl` moves at a fixed speed per frame (no smoothing); `SmoothedKeyControl` applies acceleration, drag, and max speed.
```js
// FixedKeyControl
const cursors = this.input.keyboard.createCursorKeys();
this.camControl = new Phaser.Cameras.Controls.FixedKeyControl({
    camera: this.cameras.main,
    left: cursors.left, right: cursors.right, up: cursors.up, down: cursors.down,
    speed: 0.5          // can also be { x: 0.5, y: 0.3 }
});
// In update(time, delta): this.camControl.update(delta);

// SmoothedKeyControl
this.camControl = new Phaser.Cameras.Controls.SmoothedKeyControl({
    camera: this.cameras.main,
    left: cursors.left, right: cursors.right, up: cursors.up, down: cursors.down,
    zoomIn: this.input.keyboard.addKey('Q'),
    zoomOut: this.input.keyboard.addKey('E'),
    zoomSpeed: 0.02, acceleration: 0.06, drag: 0.0005, maxSpeed: 1.0
});
// In update(time, delta): this.camControl.update(delta);
```

Ignore lists — `ignore` updates a Game Object's `cameraFilter` bitmask so the camera skips rendering it. This is the primary mechanism for layered-camera setups such as minimaps.
```js
cam.ignore(uiText);                                  // single object
cam.ignore([scoreText, livesIcon, pauseButton]);     // array
cam.ignore(uiGroup);                                 // all children in a Group
cam.ignore(uiLayer);                                 // a Layer and all its children
```

Camera deadzone — a rectangular area around the follow target where the camera does not scroll:
```js
cam.setDeadzone(200, 150);   // 200x150 centered on the viewport
console.log(cam.deadzone);   // Phaser.Geom.Rectangle or null (read-only)
cam.setDeadzone();           // remove
```

World point conversion — essential with scrolled/zoomed cameras, since raw pointer coordinates are screen space:
```js
const worldPoint = cam.getWorldPoint(pointer.x, pointer.y);
const output = new Phaser.Math.Vector2();   // reuse to avoid allocation
cam.getWorldPoint(pointer.x, pointer.y, output);
```

Render list — `cam.renderList` is an array of Game Objects visible to this camera, rebuilt every frame.

Force composite — render the camera to an offscreen framebuffer (required for `CaptureFrame` and similar). Filters enable this automatically; use it explicitly when you need it without filters:
```js
cam.setForceComposite(true);
cam.setForceComposite(false);
```

Filters on cameras (v4) — `Camera` has a `filters` property with two `FilterList` instances: `cam.filters.internal` (system-applied) and `cam.filters.external` (user-added). Add post-processing the same way as on Game Objects. Filters require WebGL and force framebuffer rendering when active.
```js
cam.filters.external.addBlur(1, 2);
cam.filters.external.addGlow(0xff0000, 4, 0, false, 0.1, 10);
const fx = cam.filters.external.addColorMatrix();
fx.grayscale();
cam.filters.external.clear();   // remove all external filters
```
</common_patterns>

<events>
Camera events are emitted on the Camera instance itself (it extends `EventEmitter`); listen with `cam.on(event, handler)`. Constants live under `Phaser.Cameras.Scene2D.Events`:

- `FADE_IN_START` / `FADE_IN_COMPLETE` — `fadeIn`/`fadeFrom` begins / fade-in finishes
- `FADE_OUT_START` / `FADE_OUT_COMPLETE` — `fadeOut`/`fade` begins / fade-out finishes
- `FLASH_START` / `FLASH_COMPLETE`
- `SHAKE_START` / `SHAKE_COMPLETE`
- `PAN_START` / `PAN_COMPLETE`
- `ZOOM_START` / `ZOOM_COMPLETE`
- `ROTATE_START` / `ROTATE_COMPLETE`
- `FOLLOW_UPDATE` — each frame while following; args `(camera, target)`
- `PRE_RENDER` / `POST_RENDER` — before / after the camera renders
- `DESTROY` — camera is destroyed

```js
cam.on(Phaser.Cameras.Scene2D.Events.FADE_OUT_COMPLETE, () => {
    this.scene.start('GameOver');
});
```
</events>
</cameras>
