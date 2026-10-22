<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: render textures

<render_textures>
Use this when drawing game objects to off-screen textures in Phaser 4: the RenderTexture game object, DynamicTexture for shared textures, the Stamp helper, command-buffer rendering, snapshots, procedural generation, and minimaps.

<quick_start>
```js
// In a Scene's create() method:

// 1. RenderTexture -- a visible game object with its own DynamicTexture
const rt = this.add.renderTexture(400, 300, 256, 256);
rt.draw('player', 128, 128);          // draw a texture by key at center
rt.fill(0x222244, 0.5);               // semi-transparent fill
rt.render();                           // flush the command buffer

// 2. DynamicTexture -- a shared texture in the Texture Manager
const dt = this.textures.addDynamicTexture('composite', 512, 512);
dt.stamp('coin', null, 64, 64, { scale: 2, angle: 45 });
dt.render();
this.add.image(400, 300, 'composite'); // any game object can use it

// 3. Stamp game object -- lightweight Image that ignores camera scroll
const hud = this.add.stamp(10, 10, 'heart');
```
</quick_start>

<core_concepts>
Phaser 4 splits texture-drawing into two layers. A **RenderTexture** is an Image game object with an auto-created DynamicTexture — created via `this.add.renderTexture(x, y, w, h)`, visible on its own, has position/scale/alpha (all Image components), but belongs to one Scene (no cross-scene use; share across objects via `saveTexture(key)`). A **DynamicTexture** is a texture in the Texture Manager — created via `this.textures.addDynamicTexture(key, w, h)`, not visible on its own (must be assigned to a game object), shared by key, and usable cross-scene since textures are global.

Use **RenderTexture** when you need a single visible surface you draw onto (paint canvas, trail effect, composite sprite). Use **DynamicTexture** when many game objects share the same generated texture, you need a texture for masks/shaders, or you need cross-scene access.

RenderTexture is a thin proxy — `draw()`, `stamp()`, `fill()`, `clear()`, `erase()`, `snapshot()` all delegate to its underlying `this.texture` (a DynamicTexture). It extends Image, so its origin defaults to (0.5, 0.5); call `rt.setOrigin(0, 0)` for top-left positioning (common for full-screen or minimap RTs).

The command buffer (v4 architecture): drawing calls (`draw`, `stamp`, `fill`, `clear`, `erase`, `repeat`, `capture`) do NOT execute immediately — they push commands into a `commandBuffer` array. You must call `.render()` to flush and execute it:
```js
rt.clear();
rt.fill(0x000000);
rt.draw(sprite, 128, 128);
rt.render();  // REQUIRED -- nothing appears without this
```

For RenderTexture game objects, the `renderMode` property controls automatic rendering: `'render'` (default) draws the texture contents to the frame each tick, you call `render()` manually when content changes; `'redraw'` calls `render()` automatically every frame but does NOT display itself (useful for textures reused by other objects); `'all'` calls `render()` every frame AND draws itself. Set via `rt.setRenderMode('all')` or `rt.setRenderMode('all', true)` (same, plus preserve the command buffer).

Preserve mode: by default the command buffer clears after `render()`. Call `preserve(true)` to keep commands between renders so the same drawing replays each frame:
```js
rt.preserve(true);
rt.clear();
rt.draw(sprite);
// On every subsequent render(), clear + draw will repeat
```

The `Stamp` game object (`this.add.stamp(x, y, texture, frame)`) is a lightweight Image subclass that ignores camera scroll and transform during rendering. It is used internally by DynamicTexture for drawing operations and is also useful for HUD elements. Note this is different from the `stamp()` method: `rt.stamp(key, frame, x, y, config)` draws a texture frame onto the surface with transform options, while `this.add.stamp(x, y, texture, frame)` creates a Stamp game object on the display list.
</core_concepts>

<common_patterns>
Drawing sprites and game objects — `draw()` accepts renderable game objects, Groups, Containers, Display Lists, other RenderTextures/DynamicTextures, Texture Frames, texture key strings, or arrays of any of these:
```js
const rt = this.add.renderTexture(0, 0, 800, 600);

rt.draw(sprite, 100, 100);                  // single object at offset
rt.draw([sprite1, sprite2, sprite3]);       // array
rt.draw(enemyGroup);                        // group/container (only visible children drawn)
rt.draw(myContainer, 50, 50);               // offset added to children positions
rt.draw(this.children);                     // entire Scene display list
rt.draw('explosion', 200, 200);             // texture by string key
rt.render();
```
The `alpha` and `tint` parameters on `draw()` only apply to Texture Frames/strings — game objects use their own alpha and tint when drawn.

Stamping textures with config — the frame is centered on x/y by default (origin 0.5):
```js
rt.stamp('bullet', null, 100, 100, {
    alpha: 0.8,
    tint: 0xff0000,
    angle: 45,          // degrees (takes precedence over rotation)
    scale: 2,           // uniform scale
    scaleX: 1.5,        // overrides scale for X
    scaleY: 0.5,
    originX: 0,         // top-left origin
    originY: 0,
    blendMode: 0
});
rt.render();
```

Capture — draws a game object with temporary property overrides, restoring originals afterward (useful for drawing at a different position/scale without modifying the object):
```js
rt.capture(player, {
    x: 64,
    y: 64,
    scale: 0.5,
    alpha: 0.8,
    rotation: Math.PI / 4,
    transform: 'world',    // 'local', 'world', or a TransformMatrix
    camera: someCamera     // optional camera override
});
rt.render();
```

Filling and clearing:
```js
rt.fill(0xff0000);                      // solid red
rt.fill(0x000000, 0.5);                 // semi-transparent black
rt.fill(0x00ff00, 1, 10, 10, 100, 50);  // green rect at (10,10) size 100x50
rt.clear();                             // clear everything (transparent)
rt.clear(10, 10, 100, 50);              // clear a region
rt.render();
```

Erasing uses ERASE blend mode to cut holes:
```js
rt.fill(0xffffff);                  // white background
rt.erase(circleSprite, 100, 100);   // punch a hole shaped like the sprite
rt.render();
```

Repeating / tiling a texture:
```js
rt.repeat('grass', null);                  // tile the whole surface
rt.repeat('brick', null, 0, 0, 256, 128);  // tile a specific region
rt.repeat('tile', 'frame2', 0, 0, 512, 512, {
    tileScaleX: 2,
    tileScaleY: 2,
    tilePositionX: 16,
    alpha: 0.8
});
rt.render();
```

Snapshots read pixel data from the framebuffer — they are expensive and blocking (use `readPixels`), so use sparingly:
```js
// Full texture snapshot -- callback receives an HTMLImageElement
rt.snapshot(function (image) {
    document.body.appendChild(image);
});

// Area snapshot
rt.snapshotArea(0, 0, 128, 128, function (image) {
    // image is 128x128 region from top-left
}, 'image/jpeg', 0.8);

// Single pixel -- callback receives a Phaser.Display.Color (cheaper than full snapshot)
rt.snapshotPixel(64, 64, function (color) {
    console.log(color.r, color.g, color.b, color.a);
});
```

Using as a texture source for other objects — for a RenderTexture, register it via `saveTexture`; for a DynamicTexture, the key is set at creation:
```js
const rt = this.add.renderTexture(0, 0, 256, 256);
rt.draw(complexScene);
rt.render();
rt.saveTexture('composited');     // register in the Texture Manager
this.add.image(400, 300, 'composited');
this.add.sprite(100, 100, 'composited');
// Updates to the RenderTexture automatically reflect on all users

const dt = this.textures.addDynamicTexture('terrain', 1024, 1024);
dt.repeat('grass', null);
dt.render();
this.add.image(512, 512, 'terrain');  // already keyed
```

Procedural generation:
```js
const dt = this.textures.addDynamicTexture('starfield', 800, 600);
dt.fill(0x000011);
for (let i = 0; i < 200; i++) {
    const x = Phaser.Math.Between(0, 800);
    const y = Phaser.Math.Between(0, 600);
    const brightness = Phaser.Math.FloatBetween(0.3, 1);
    dt.stamp('star', null, x, y, { alpha: brightness, scale: Phaser.Math.FloatBetween(0.5, 1.5) });
}
dt.render();
this.add.image(400, 300, 'starfield');
```

Minimap pattern:
```js
create() {
    this.minimap = this.add.renderTexture(700, 50, 150, 100);
    this.minimap.setScrollFactor(0);  // fixed to camera
    this.minimap.setRenderMode('all'); // auto-render every frame
    this.minimap.preserve(true);
}

// In update or a callback:
this.minimap.clear();
this.minimap.fill(0x111111);
this.minimap.capture(player, { x: px * 0.1, y: py * 0.1, scale: 0.1 });
// render() is automatic in 'all' mode
```

Callbacks in the command buffer — insert logic between draw commands that executes during `render()`:
```js
rt.clear();
rt.draw(background);
rt.callback(() => { sprite.setTint(0xff0000); });   // runs during render, after background
rt.draw(sprite);
rt.callback(() => { sprite.setTint(0xffffff); });    // restore after drawing
rt.render();
```

Resizing erases all content and recreates the framebuffer:
```js
rt.resize(512, 512);
rt.resize(513, 513, false);  // disable force-even rounding
```

Internal camera — both RenderTexture and DynamicTexture have a `.camera` property that controls how game objects are positioned when drawn. Scroll/zoom/rotate it to transform drawn content. Note `stamp()` ignores the camera; only `draw()` and game object rendering respect it:
```js
rt.camera.setScroll(100, 50);
rt.camera.setZoom(2);
rt.draw(sprite);  // sprite drawn with camera transform applied
rt.render();
```

Factory methods:
```js
this.add.renderTexture(x, y, width?, height?)                       // default 32x32
this.add.stamp(x, y, texture, frame?)
this.textures.addDynamicTexture(key, width?, height?, forceEven?)   // default 256x256
```
DynamicTexture also exposes `setSize(w, h?, forceEven?)`, `camera`, `commandBuffer`, `drawingContext` (WebGL DrawingContext with framebuffer), and `getWebGLTexture()`. The `stamp()` config supports `alpha`, `tint`, `angle` (degrees, overrides `rotation` if non-zero), `rotation` (radians), `scale`, `scaleX`/`scaleY`, `originX`/`originY` (default 0.5), `blendMode`. The `capture()` config supports `transform`, `camera`, `x`/`y`/`alpha`/`tint`/`angle`/`rotation`, `scale`/`scaleX`/`scaleY`, `originX`/`originY`, `blendMode`.
</common_patterns>

<gotchas>
1. Must call `render()`. In Phaser 4 drawing methods buffer commands — nothing appears until `render()` is called (unless using `renderMode: 'all'` or `'redraw'`).
2. Cannot draw to itself. A DynamicTexture/RenderTexture silently skips entries that reference itself.
3. Command buffer clears after render. Call `preserve(true)` before drawing if you need the same commands to replay each frame.
4. `stamp()` ignores the internal camera. Only game objects drawn via `draw()` or `capture()` respect the `.camera` property; texture stamps are positioned absolutely.
5. Default sizes differ. RenderTexture defaults to 32x32; DynamicTexture defaults to 256x256.
6. `forceEven` rounds dimensions up. Width/height are rounded to even numbers for rendering quality by default — pass `false` as the last argument for exact odd dimensions.
7. Snapshots are expensive. They use `readPixels` (WebGL) which blocks the GPU pipeline. Avoid per-frame snapshots; `snapshotPixel` is cheaper than full `snapshot`.
8. WebGL1 has no anti-aliasing on framebuffers. Shapes and Graphics drawn to a RenderTexture may have jagged edges — use pre-rendered sprite textures instead.
9. `resize()` erases content. Resizing destroys and recreates the framebuffer.
10. `saveTexture` renames, does not copy. It assigns the DynamicTexture to the Texture Manager under that key; calling again with a different key renames it. Destroying the RenderTexture without saving first destroys the texture.
11. `draw()` alpha/tint params only affect Texture Frames. When drawing game objects, they use their own alpha and tint.
12. WebGL context loss. DynamicTexture contents are lost on context loss — listen for the `restorewebgl` event to redraw.
13. Groups/Containers: x, y offset is additive. With `rt.draw(group, x, y)`, the offset is added to each child's position — children at (100, 50) drawn with offset (10, 10) appear at (110, 60).
</gotchas>
</render_textures>
