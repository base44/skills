<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: sprites and images

<sprites_and_images>
Use this when creating or manipulating Sprite and Image game objects in Phaser 4: factory methods, texture/frame selection, the component mixin system, and visual operations (position, scale, rotation, tint, flip, alpha, origin, depth).

<quick_start>
```js
// In a Scene's create() method:

// Static image (no animation support, slightly cheaper)
const bg = this.add.image(400, 300, 'background');

// Sprite (supports animations)
const player = this.add.sprite(100, 200, 'player', 'idle-0');

// Common operations -- all methods return `this` for chaining
player.setPosition(200, 300);
player.setScale(2);
player.setAngle(45);
player.setTint(0xff0000);
player.setAlpha(0.8);
player.setOrigin(0, 1);       // bottom-left
player.setDepth(10);
player.setFlip(true, false);  // flip horizontally
player.setVisible(false);

// Chained
this.add.sprite(100, 100, 'coin')
    .setScale(0.5)
    .setTint(0xffff00)
    .play('spin');
```
</quick_start>

<core_concepts>
**Sprite vs Image.** Both extend `GameObject` and share the same set of component mixins. The only difference: Sprite includes an `AnimationState` instance (`sprite.anims`) and animation methods (`play`, `stop`, `chain`). Image has no animation support, no per-frame `preUpdate`, and is not added to the Scene `updateList`. Both support static texture display, tint/alpha/flip/scale/rotate, physics bodies, and input/hit areas.

Rule of thumb: use `Image` for anything that does not need frame-by-frame animation -- it skips the per-frame `preUpdate` cost and has a smaller API surface. Use `Sprite` only when you need the Animation component.

**The component mixin system.** Phaser builds Game Object classes by mixing component objects into the prototype. Both Sprite and Image share an identical Mixins array: Alpha, BlendMode, Depth, Flip, GetBounds, Lighting, Mask, Origin, RenderNodes, ScrollFactor, Size, TextureCrop, Tint, Transform, Visible, plus a render-specific mixin (SpriteRender / ImageRender). The base `GameObject` itself mixes in Filters and RenderSteps. When you see a method like `setAlpha()` on a Sprite, it comes from `Components.Alpha`, not the Sprite class itself.

**Texture and frame** come from the `TextureCrop` component: `texture` (the Texture instance), `frame` (current Frame instance), `setTexture(key, frame)`, `setFrame(frame, updateSize, updateOrigin)`, `setCrop(x, y, width, height)`, and `isCropped`. The `texture` param accepts a string key or a `Phaser.Textures.Texture` instance. The `frame` param accepts a string name or numeric index; if omitted, the base frame (`'__BASE'`) is used.

```js
// Change texture at runtime
sprite.setTexture('enemies', 'goblin-walk-1');

// Change only the frame (must belong to current texture)
sprite.setFrame('goblin-walk-2');

// setFrame(frame, updateSize=true, updateOrigin=true) -- pass false to skip resize/origin recalc
sprite.setFrame('small-frame', false, false);

// Crop to a 50x50 region starting at (10, 10); call setCrop() with no args to reset
sprite.setCrop(10, 10, 50, 50);
sprite.setCrop();
```
</core_concepts>

<common_patterns>
Position and size (Transform + Size components):
```js
sprite.x, sprite.y                    // position (read/write; default 0)
sprite.z                              // z position (does NOT control render order -- use depth)
sprite.setPosition(x, y, z, w)        // y defaults to x if omitted
sprite.setRandomPosition(x, y, w, h)  // random within area; defaults to game size
sprite.copyPosition(source)           // copy from any {x, y} object

sprite.width, sprite.height           // native (un-scaled) size
sprite.displayWidth, sprite.displayHeight  // scaled size (read/write -- setting adjusts scale)
sprite.setSize(width, height)         // internal size (not visual)
sprite.setDisplaySize(width, height)  // visual size (adjusts scale)
sprite.setSizeToFrame(frame)          // reset size to match frame
```

Scaling and rotation (Transform):
```js
sprite.scale                  // uniform scale (getter returns average of scaleX+scaleY)
sprite.scaleX, sprite.scaleY  // default 1
sprite.setScale(x, y)         // y defaults to x if omitted

sprite.rotation               // radians (clockwise: 0=right, PI/2=down)
sprite.angle                  // degrees (0=right, 90=down, 180/-180=left, -90=up)
sprite.setRotation(radians)
sprite.setAngle(degrees)
```

Tinting (Tint component, WebGL only):
```js
sprite.tint                   // getter returns tintTopLeft
sprite.tintTopLeft / tintTopRight / tintBottomLeft / tintBottomRight  // default 0xffffff
sprite.tintMode               // default Phaser.TintModes.MULTIPLY
sprite.isTinted               // read-only

sprite.setTint(topLeft, topRight, bottomLeft, bottomRight)  // single arg applies to all four corners
sprite.setTintMode(mode)      // MULTIPLY | FILL | ADD | SCREEN | OVERLAY | HARD_LIGHT
sprite.clearTint()            // resets to 0xffffff + MULTIPLY
```
Phaser 4 change: `setTintFill()` is removed -- use `setTint(color).setTintMode(Phaser.TintModes.FILL)`.

Alpha (Alpha component):
```js
sprite.alpha                  // global alpha 0-1 (default 1)
sprite.alphaTopLeft / alphaTopRight / alphaBottomLeft / alphaBottomRight  // per-corner (WebGL only)
sprite.setAlpha(topLeft, topRight, bottomLeft, bottomRight)  // single arg applies to whole object
sprite.clearAlpha()           // resets to 1 (fully opaque)
```
Setting `alpha` to 0 clears the render flag so the object is not drawn; any non-zero value restores it.

Flipping (Flip component) -- a rendering toggle only; does not affect physics bodies, hit areas, or scale value:
```js
sprite.flipX, sprite.flipY    // boolean (default false)
sprite.setFlipX(value)
sprite.setFlipY(value)
sprite.setFlip(x, y)
sprite.toggleFlipX()
sprite.toggleFlipY()
sprite.resetFlip()            // both to false
```

Origin and depth (Origin + Depth components):
```js
sprite.originX, sprite.originY        // normalized 0-1 (default 0.5, center)
sprite.displayOriginX, sprite.displayOriginY  // pixel value (originX * width)
sprite.setOrigin(x, y)                // y defaults to x; defaults to 0.5
sprite.setDisplayOrigin(x, y)         // set origin in pixels
sprite.setOriginFromFrame()           // use Frame pivot if set, else 0.5

sprite.depth                          // default 0 (higher = renders on top)
sprite.setDepth(value)                // queues a depth sort
sprite.setToTop()                     // move to top of display list (no depth change)
sprite.setToBack()
sprite.setAbove(gameObject)
sprite.setBelow(gameObject)
```
`setToTop`/`setToBack`/`setAbove`/`setBelow` change display list position without modifying the `depth` value.

Additional components:
```js
sprite.visible, sprite.setVisible(value)        // Visible -- invisible objects skip render but still update
sprite.scrollFactorX, sprite.scrollFactorY      // ScrollFactor (default 1: moves with camera)
sprite.setScrollFactor(x, y)                    // 0 = fixed to camera; y defaults to x
sprite.blendMode, sprite.setBlendMode(value)    // BlendMode (NORMAL, ADD, MULTIPLY, SCREEN, ERASE)
```
Performance: changing blend mode breaks WebGL batches. Group objects by blend mode when possible to minimize draw calls.

Destroying:
```js
sprite.destroy();             // removes from display + update lists, cleans up
sprite.ignoreDestroy = true;  // prevent destruction (you manage lifecycle)
sprite.isDestroyed;           // boolean, true after destroy()
```
For Sprites, `destroy()` also calls `this.anims.destroy()` to clean up the AnimationState.
</common_patterns>

<factory_methods>
```js
// this.add.sprite(x, y, texture, frame) -> Phaser.GameObjects.Sprite
this.add.sprite(x, y, texture, frame);

// this.add.image(x, y, texture, frame) -> Phaser.GameObjects.Image
this.add.image(x, y, texture, frame);
```
`x`, `y` are world coordinates (required). `texture` is a string key or Texture instance (required). `frame` is a string name or numeric index (optional). Both constructors run the same init sequence: `setTexture` -> `setPosition` -> `setSizeToFrame` -> `setOriginFromFrame` -> `initRenderNodes`. The factory does `this.displayList.add(new Sprite/Image(...))`.
</factory_methods>

<specialized_game_objects>
**NineSlice** -- scalable UI panels with fixed-size corners and stretchable edges/center. Ideal for buttons, panels, dialog boxes that resize without distorting borders:
```js
// nineslice(x, y, texture, frame, width, height, leftWidth, rightWidth, topHeight, bottomHeight)
const panel = this.add.nineslice(400, 300, 'panel', null, 300, 200, 20, 20, 20, 20);
panel.setSize(500, 400);  // corners stay fixed, edges stretch
```

**TileSprite** -- repeating texture that fills an area. Supports atlas frames and a `tileRotation` property in v4:
```js
const bg = this.add.tileSprite(400, 300, 800, 600, 'grass');
// Scroll in update() for parallax backgrounds
bg.tilePositionX += 0.5;
bg.tilePositionY += 0.25;
bg.tileRotation = 0.1;  // v4: rotate the tile pattern
```

**Blitter** -- high-performance batched rendering for large numbers of static/semi-static sprites. Children (Bobs) have no rotation, scale, or physics, but render significantly faster:
```js
const blitter = this.add.blitter(0, 0, 'particles');
for (let i = 0; i < 1000; i++) {
    const bob = blitter.create(
        Phaser.Math.Between(0, 800),
        Phaser.Math.Between(0, 600),
        'particle_01'   // frame name within the texture
    );
    bob.setAlpha(Math.random());
}
```

**Video** -- video playback as a game object with position, scale, and filter support:
```js
this.load.video('intro', 'intro.mp4');   // in preload
const video = this.add.video(400, 300, 'intro');  // in create
video.play();
```
</specialized_game_objects>
</sprites_and_images>
