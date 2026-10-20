<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Phaser 4: game object components

<game_object_components>
Use this when working with Phaser 4 game object components and the mixin system: Transform, Alpha, Tint, Origin, Depth, Flip, Mask, GetBounds, Lighting, ScrollFactor, Size, Texture, Visible, PathFollower, and the v4 filter components.

<quick_start>
Every Game Object gets its component methods via mixins — just call them directly on any game object:

```js
const sprite = this.add.sprite(400, 300, 'hero');

sprite.setAlpha(0.5);                          // Alpha
sprite.setBlendMode(Phaser.BlendModes.ADD);    // BlendMode
sprite.setDepth(10);                           // Depth
sprite.setFlip(true, false);                   // Flip
sprite.setOrigin(0, 0);                        // Origin
sprite.setScrollFactor(0);                     // ScrollFactor (HUD)
sprite.setDisplaySize(64, 64);                 // Size
sprite.setTexture('hero', 'walk-1');           // Texture
sprite.setTint(0xff0000);                      // Tint
sprite.setPosition(100, 200);                  // Transform
sprite.setVisible(false);                      // Visible
sprite.setScale(2);                            // Transform
sprite.setAngle(45);                           // Transform

sprite.setAlpha(1, 0.5, 0.5, 1);   // per-corner alpha (WebGL only)
sprite.setCrop(0, 0, 32, 32);      // crop a texture region

// Enable WebGL filters (post-processing)
sprite.enableFilters();
sprite.filters.internal.addBlur(1, 2, 2, 1);

sprite.setLighting(true);          // Lighting (WebGL only, v4 feature)
```
</quick_start>

<core_concepts>
Phaser uses `Phaser.Class` with a `Mixins` array to compose Game Objects from reusable component objects. Each component is a plain JS object whose properties and methods are copied onto the class prototype at class-definition time — this is property copying, NOT prototypal inheritance. Components are mixed in per-class, not per-instance.

```js
// How Phaser defines Sprite internally:
var Sprite = new Class({
    Extends: GameObject,
    Mixins: [
        Components.Alpha, Components.BlendMode, Components.Depth,
        Components.Flip, Components.GetBounds, Components.Lighting,
        Components.Mask, Components.Origin, Components.RenderNodes,
        Components.ScrollFactor, Components.Size, Components.TextureCrop,
        Components.Tint, Components.Transform, Components.Visible,
        SpriteRender
    ],
    initialize: function Sprite (scene, x, y, texture, frame) { /* ... */ }
});
```

Key rules:
- Most setter methods return `this` for chaining: `sprite.setAlpha(0.5).setDepth(10).setPosition(100, 200)`.
- Many properties use getters/setters internally (`alpha`, `depth`, `visible`, `scale`, `rotation`). Setting `alpha = 0` or `scale = 0` clears render flags, skipping rendering entirely.
- `renderFlags` is a bitmask: bit 0 = visible, bit 1 = alpha, bit 2 = scale, bit 3 = texture. All bits must be set for the object to render.
- **Alpha vs AlphaSingle**: `Alpha` supports per-corner alpha (WebGL); `AlphaSingle` only supports a single global alpha. Containers use `AlphaSingle`.
- **Texture vs TextureCrop**: `TextureCrop` extends `Texture` with `setCrop()` support. Sprites and Images use `TextureCrop`; some objects use plain `Texture`.
- **Filters and RenderSteps** are v4-only, WebGL-only systems for post-processing.
</core_concepts>

<components>
**Alpha** — per-corner transparency (Sprite, Image, Text, most renderables). `alpha` (0-1, setting also sets all four corners; 0 disables rendering), `alphaTopLeft`/`alphaTopRight`/`alphaBottomLeft`/`alphaBottomRight` (WebGL only), `setAlpha(topLeft?, topRight?, bottomLeft?, bottomRight?)` (one arg = uniform, four = per-corner), `clearAlpha()` (resets to 1).

**AlphaSingle** — simplified alpha, no per-corner support (used by Container). `alpha` (0-1), `setAlpha(value?)`, `clearAlpha()`.

**BlendMode** — how pixels composite. `blendMode` (accepts `Phaser.BlendModes` const, string, or integer), `setBlendMode(value)`. WebGL modes: `NORMAL`, `ADD`, `MULTIPLY`, `SCREEN`, `ERASE`. Canvas supports additional browser-dependent modes.

**Depth** — rendering order (z-index); higher renders on top. `depth` (setting queues a depth sort, default 0), `setDepth(value)`, `setToTop()`, `setToBack()`, `setAbove(gameObject)`, `setBelow(gameObject)`.

**Flip** — visual mirroring without affecting physics bodies. `flipX`/`flipY` (default false), `setFlipX(value)`, `setFlipY(value)`, `setFlip(x, y)`, `toggleFlipX()`, `toggleFlipY()`, `resetFlip()`.

**GetBounds** — positions and bounding rects regardless of origin. `getCenter`, `getTopLeft`, `getTopCenter`, `getTopRight`, `getLeftCenter`, `getRightCenter`, `getBottomLeft`, `getBottomCenter`, `getBottomRight` (all `(output?, includeParent?)` returning `Vector2Like`), `getBounds(output?)` returning `Rectangle`. Pass `includeParent = true` to factor in parent Container transforms.

**Lighting** (v4, WebGL only) — light-based rendering. `lighting` (default false), `selfShadow` (`{ enabled, penumbra, diffuseFlatThreshold }`), `setLighting(enable)`, `setSelfShadow(enabled?, penumbra?, diffuseFlatThreshold?)` (pass `null` for enabled to use game config default).

**Mask** (Canvas only in v4) — geometry masking for the Canvas renderer; in WebGL use `Filters.addMask()` instead. `mask` (current GeometryMask or null), `setMask(mask)` (Canvas only; logs a warning in WebGL), `clearMask(destroyMask?)`, `createGeometryMask(graphics?)`.

**Origin** — anchor point for position/rotation/scale, normalized 0-1. `originX`/`originY` (default 0.5 = center), `displayOriginX`/`displayOriginY` (pixels; setting recalculates normalized origin), `setOrigin(x?, y?)` (y defaults to x), `setOriginFromFrame()`, `setDisplayOrigin(x?, y?)`, `updateDisplayOrigin()`.

**ScrollFactor** — how camera scrolling affects rendered position. `scrollFactorX`/`scrollFactorY` (default 1), `setScrollFactor(x, y?)`. Key values: `0` = fixed to camera (HUD), `1` = moves with camera, `0.5` = parallax half-speed.

**Size** — native and display dimensions. `width`/`height` (native, un-scaled), `displayWidth`/`displayHeight` (scaled; setting adjusts scaleX/scaleY), `setSize(width, height)` (native size, does NOT affect rendered size), `setDisplaySize(width, height)` (rendered size via scale), `setSizeToFrame(frame?)`.

**Texture** — texture and frame for rendering. `texture`, `frame`, `setTexture(key, frame?, updateSize?, updateOrigin?)`, `setFrame(frame, updateSize?, updateOrigin?)` (name, index, or Frame instance; updates size and origin by default).

**TextureCrop** — Texture plus cropping (Sprite, Image). Adds `isCropped` and `setCrop(x?, y?, width?, height?)` (no args clears; accepts a `Rectangle` as first arg). `setFrame` also updates crop UVs when cropped.

**Tint** (WebGL only) — color tinting via per-corner vertex colors. `tint` (uniform, default 0xffffff), `tintTopLeft`/`tintTopRight`/`tintBottomLeft`/`tintBottomRight`, `tintMode` (default `Phaser.TintModes.MULTIPLY`), `isTinted` (readonly), `setTint(topLeft?, topRight?, bottomLeft?, bottomRight?)`, `setTintMode(mode)` (`MULTIPLY`, `FILL`, `ADD`, `SCREEN`, `OVERLAY`, `HARD_LIGHT`), `clearTint()`. v4 change: `setTintFill()` is removed — use `setTint(color).setTintMode(Phaser.TintModes.FILL)`.

**Transform** — position, scale, rotation, coordinate transforms. `x`/`y`/`z`/`w` (`z` is NOT rendering order — use `depth`), `scale` (get returns average of scaleX/scaleY), `scaleX`/`scaleY` (default 1), `angle` (degrees, clockwise, 0 = right), `rotation` (radians). Methods: `setPosition(x?, y?, z?, w?)`, `copyPosition(source)`, `setRandomPosition(x?, y?, width?, height?)`, `setRotation(radians?)`, `setAngle(degrees?)`, `setScale(x?, y?)`, `setX`/`setY`/`setZ`/`setW`, `getLocalTransformMatrix(tempMatrix?)`, `getWorldTransformMatrix(tempMatrix?, parentMatrix?)`, `getLocalPoint(x, y, point?, camera?)`, `getWorldPoint(point?, tempMatrix?, parentMatrix?)`, `getParentRotation()`.

**Visible** — whether the object renders (invisible objects still run update logic). `visible` (default true), `setVisible(value)`.

**PathFollower** — follow a `Phaser.Curves.Path` via an internal tween. `path`, `rotateToPath` (default false), `pathRotationOffset`, `pathOffset`, `pathVector`, `pathDelta`, `pathTween`. Methods: `setPath(path, config?)`, `setRotateToPath(value, offset?)`, `isFollowing()`, `startFollow(config?, startAt?)` (config can be a duration number or a PathConfig), `pauseFollow()`, `resumeFollow()`, `stopFollow()`.

**RenderNodes, RenderSteps, Filters, FilterList** (v4, WebGL only) — call `enableFilters()` on game objects before accessing `filters`. Cameras have filters by default. Use `filters.internal` for object-local effects and `filters.external` for screen-space effects.
</components>

<factory_and_display_list>
Register custom game objects on the factory so they can be created via `this.add.myObject()`:

```js
class LaserBeam extends Phaser.GameObjects.Sprite {
    constructor(scene, x, y) { super(scene, x, y, 'laser'); }
}

Phaser.GameObjects.GameObjectFactory.register('laserBeam', function (x, y) {
    const beam = new LaserBeam(this.scene, x, y);
    this.displayList.add(beam);
    return beam;
});

const laser = this.add.laserBeam(100, 200);   // usable in any scene
```

**Factory (`this.add`) vs Creator (`this.make`)**: `this.add` creates AND adds to the display list. `this.make` creates but does NOT add — useful for off-screen prep or deferred display.

```js
const visible = this.add.sprite(100, 100, 'hero');             // on display list
const offscreen = this.make.sprite({ key: 'hero', x: 100, y: 100 });  // not added
this.add.existing(offscreen);                                  // add later
```

`GetAdvancedValue` resolves static values, random arrays, randInt/randFloat ranges, and callbacks from config objects:

```js
{ speed: 100 }                          // static value
{ speed: [100, 200, 300] }              // random from array
{ speed: { randInt: [50, 150] } }       // random integer range
{ speed: { randFloat: [0.5, 1.5] } }    // random float range
{ speed: function () { return Math.random() * 100; } }  // callback
```

Display list ordering: objects added later render on top. Control with `setDepth(10)` (higher = on top, triggers a sort) or display-list position (`setToTop()`, `setToBack()`, `setAbove(otherSprite)`, `setBelow(otherSprite)`). When both are used, `depth` takes priority after the next sort pass.
</factory_and_display_list>

<gotchas>
- **alpha=0 prevents rendering entirely**: setting `alpha` to 0 clears a render flag bit — the object is not drawn at all, not merely transparent. Same for `scale = 0` and `visible = false`.
- **Flip does not affect physics**: flipping is rendering-only; physics bodies remain unchanged. Account for this in collision code.
- **ScrollFactor and physics**: collisions use world position. A scroll factor other than 1 offsets where the texture renders but not where the body is. For HUD elements with scroll factor 0, avoid adding physics bodies.
- **depth vs display list order**: `setDepth()` queues a sort and is the primary z-ordering tool. `setToTop()`/`setAbove()`/etc. reorder the display list without changing `depth`. If you mix both, `depth` wins after the next sort.
- **Mask component is Canvas-only in v4**: for WebGL masking, use `enableFilters()` then `filters.internal.addMask()`. `setMask()` logs a warning in WebGL.
- **setTintFill is removed in v4**: use `setTint(color).setTintMode(Phaser.TintModes.FILL)`.
- **Tint mode is separate from tint color in v4**: modes are `MULTIPLY` (default), `FILL`, `ADD`, `SCREEN`, `OVERLAY`, `HARD_LIGHT`.
- **displayWidth/displayHeight adjusts scale**: setting them modifies `scaleX`/`scaleY`, NOT `width`/`height`.
- **setSize vs setDisplaySize**: `setSize()` changes internal dimensions (frames, physics); `setDisplaySize()` changes rendered size by adjusting scale.
- **Origin default is 0.5**: all Game Objects default to center origin. Use `setOrigin(0, 0)` for top-left positioning. Text and BitmapText instead default to top-left.
- **Transform.z is NOT depth**: `z` is for custom use. Rendering order is `depth` or display list position.
- **Filters are expensive**: each object with active filters needs extra draw calls. Use `renderFilters = false` to temporarily disable. Internal filters are cheaper than external.
</gotchas>
</game_object_components>
