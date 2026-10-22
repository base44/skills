<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: filters and postfx

<filters_and_postfx>
Use this when applying visual filters or post-processing effects in Phaser 4: bloom, blur, glow, color matrix, barrel distortion, displacement, masks, custom shaders, and the filter pipeline. Filters are GPU-based, WebGL-only effects applied after an object or camera renders to a texture.

<quick_start>
```js
// Add a glow to a sprite
const sprite = this.add.sprite(400, 300, 'player');
sprite.enableFilters();                            // Step 1: enable filters (WebGL only)
sprite.filters.internal.addGlow(0xff00ff, 4, 0, 1); // Step 2: add via .filters.internal or .filters.external

// Add a blur to the camera (cameras have filters enabled by default)
const camera = this.cameras.main;
camera.filters.internal.addBlur(0, 2, 2, 1);
```
</quick_start>

<core_concepts>
Each filter runs a shader pass over the rendered texture, producing the final visual output. The rendering pipeline for a camera with filters: (1) objects render to a texture the size of the camera; (2) **internal filters** process that texture in object/camera local space; (3) the texture is drawn to a context-sized texture, applying camera transforms (position, rotation, zoom); (4) **external filters** process that context texture in screen space; (5) the final texture is composited into the output.

Every `FilterList` exposes two sub-lists, `filters.internal` and `filters.external`, controlling **when** the filter runs relative to the camera/object transform:
- **Internal** — applied before the camera transform, operating in the object's local coordinate space. A horizontal blur on a rotated object appears rotated with the object. Internal filters only cover the object/camera region, so they are cheaper. Use internal wherever possible.
- **External** — applied after the camera transform, operating in screen space. A horizontal blur on a rotated object always blurs horizontally on screen. External filters are full-screen and more expensive.

`FilterList` (`Phaser.GameObjects.Components.FilterList`) is the container holding filter controllers. It provides `add(filter, index)` (add a Controller at an optional index), `remove(filter, forceDestroy)`, `clear()` (remove and destroy all), `getActive()` (all filters where `active === true`), `list` (raw array of Controllers, safe to reorder), and convenience factories like `addBlur()`, `addGlow()`, `addMask()`.

Every filter is a `Phaser.Filters.Controller` subclass. Common properties: `active` (toggle on/off without removing), `camera` (the owning camera), `renderNode` (shader render node ID), `paddingOverride` (override automatic padding), `ignoreDestroy` (if true the filter survives when its FilterList is destroyed, for reuse). Key methods: `setActive(bool)`, `setPaddingOverride(left, top, right, bottom)`, `getPadding()`, `destroy()`.

Cameras have filters by default; game objects do not — you must call `enableFilters()` first:
```js
const sprite = this.add.sprite(400, 300, 'hero');
sprite.enableFilters();           // creates an internal filterCamera, returns this for chaining
sprite.filters.internal.addGlow();
sprite.filters.external.addVignette();
```
After enabling, related game-object properties: `filterCamera` (the internal camera used for filter rendering), `filters` ({internal, external} FilterList pair), `renderFilters` (master toggle, default true), `filtersAutoFocus` (auto-adjust camera to follow the object, default true), `filtersFocusContext` (focus the rendering context instead of object bounds, default false), `filtersForceComposite` (always draw to a framebuffer even with no active filters, default false), `maxFilterSize` (max texture size for filter framebuffers). Use `willRenderFilters()` to check if any active filters will actually render.
</core_concepts>

<common_patterns>
Adding and modifying filters on game objects:
```js
const sprite = this.add.sprite(400, 300, 'enemy');
sprite.enableFilters();

const glow = sprite.filters.internal.addGlow(0x00ff00, 4);
glow.outerStrength = 8;            // modify at runtime
glow.color = 0xff0000;
glow.setActive(false);             // temporarily disable
sprite.filters.internal.remove(glow); // remove and destroy
```

Camera filters:
```js
const camera = this.cameras.main;
const blur = camera.filters.internal.addBlur(0, 2, 2, 1);          // camera-local space
const vignette = camera.filters.external.addVignette(0.5, 0.5, 0.5, 0.5); // screen space
const cm = camera.filters.internal.addColorMatrix();
cm.colorMatrix.sepia();            // color grading
```

Chaining — filters execute in list order; each receives the output of the previous one:
```js
const cam = this.cameras.main;
const cm = cam.filters.internal.addColorMatrix();
cm.colorMatrix.brightness(0.2);                   // first: color grading
cam.filters.internal.addBlur(1, 2, 2, 1);          // second: blur the color-graded result
cam.filters.external.addVignette(0.5, 0.5, 0.5, 0.8); // third: vignette on top
```

Masks in v4 are implemented as filters — they use a texture's or game object's alpha channel to control visibility. Internal masks match the object being filtered; external masks match the camera context. Use a `viewCamera` parameter to control which camera renders the mask game object:
```js
sprite.enableFilters();
sprite.filters.internal.addMask('maskTexture');   // static texture

const maskShape = this.add.circle(0, 0, 100, 0xffffff);
const mask = sprite.filters.internal.addMask(maskShape); // game object (renders to DynamicTexture)
mask.invert = true;
mask.autoUpdate = true;            // default: re-renders each frame
mask.needsUpdate = true;           // force a one-time update
sprite.filters.external.addMask(maskShape, false, this.cameras.main); // specific viewing camera
```

Wipe / reveal transitions — animate `progress` via tween:
```js
const wipe = camera.filters.external.addWipe(0.1, 0, 0);
this.tweens.add({ targets: wipe, progress: 1, duration: 2000, ease: 'Linear' });
wipe.setLeftToRight();
wipe.setTopToBottom();
wipe.setRevealEffect();            // reveal mode
wipe.setWipeEffect();              // wipe mode
wipe.setTexture('nextSceneCapture'); // wipe to another texture (scene transitions)
```

ParallelFilters splits the input into two paths, processes each independently, then blends — this replaces the dedicated Bloom filter from v3:
```js
const pf = camera.filters.internal.addParallelFilters();
pf.top.addThreshold(0.5, 1);       // top path: threshold bright areas...
pf.top.addBlur();                  // ...then blur them
pf.blend.blendMode = Phaser.BlendModes.ADD; // configure how top combines onto bottom
pf.blend.amount = 0.5;
// Bottom path: left empty = uses original input
```

CaptureFrame captures the current render state at the point it appears in the display list — objects rendered before it are captured, objects after are not (requires composite mode on the camera):
```js
this.cameras.main.setForceComposite(true);
const bg = this.add.image(400, 300, 'background'); // rendered before CaptureFrame -> captured
const capture = this.add.captureFrame('myCapture');
const display = this.add.image(400, 300, 'myCapture'); // display the captured texture with filters
display.enableFilters();
display.filters.internal.addBlur(0, 4, 4, 2);
```
</common_patterns>

<built_in_filters>
All accessible via FilterList factory methods (`addX(...)`):
- **Barrel** `addBarrel(amount)` — pinch/expand distortion; `amount=1` is neutral.
- **Blend** `addBlend(texture, blendMode, amount, color)` — blend another texture using a blend mode (supports modes not available in standard WebGL).
- **Blocky** `addBlocky(config)` — pixelation that preserves original colors (no blending); best without anti-aliasing.
- **Blur** `addBlur(quality, x, y, strength, color, steps)` — Gaussian blur; quality 0=low, 1=medium, 2=high.
- **Bokeh** `addBokeh(radius, amount, contrast)` — depth-of-field bokeh blur.
- **ColorMatrix** `addColorMatrix()` — color manipulation via matrix; access `.colorMatrix` for presets.
- **CombineColorMatrix** `addCombineColorMatrix(texture)` — combine channels from two textures via color matrices (e.g. alpha transfer).
- **Displacement** `addDisplacement(texture, x, y)` — pixel displacement via a displacement map; values are very small floats (e.g. 0.005).
- **Glow** `addGlow(color, outerStrength, innerStrength, scale, knockout, quality, distance)` — luminous halo around edges; supports inner/outer glow and knockout mode.
- **GradientMap** `addGradientMap(config)` — recolor image using a ColorRamp based on brightness.
- **ImageLight** `addImageLight(config)` — image-based lighting using a panorama environment map and normal map.
- **Key** `addKey(config)` — chroma key: remove or isolate a color. Config `{ color, threshold, feather, isolate }`.
- **Mask** `addMask(mask, invert, viewCamera, viewTransform, scaleFactor)` — alpha masking via texture or game object.
- **NormalTools** `addNormalTools(config)` — manipulate normal maps: rotate, adjust facing power, output grayscale facing data.
- **PanoramaBlur** `addPanoramaBlur(config)` — spherically-correct blur for panorama images (for use with ImageLight; very slow).
- **ParallelFilters** `addParallelFilters()` — split input into two filter paths, blend results; use for custom bloom.
- **Pixelate** `addPixelate(amount)` — mosaic/pixelation; pixel size = 2 + amount; blends colors (unlike Blocky).
- **Quantize** `addQuantize(config)` — reduce color palette; supports RGBA/HSVA modes, gamma, offset, dithering.
- **Sampler** `addSampler(callback, region)` — extract pixel data from the render; does not alter the image; expensive.
- **Shadow** `addShadow(x, y, decay, power, color, samples, intensity)` — drop shadow with offset, decay, and color.
- **Threshold** `addThreshold(edge1, edge2, invert)` — binary threshold per channel; edges can be arrays for per-channel control.
- **TiltShift** `addTiltShift(radius, amount, contrast, blurX, blurY, strength)` — miniature/tilt-shift effect (uses Bokeh internally).
- **Vignette** `addVignette(x, y, radius, strength, color, blendMode)` — edge darkening/coloring; supports NORMAL, ADD, MULTIPLY, SCREEN blend modes.
- **Wipe** `addWipe(wipeWidth, direction, axis, reveal, wipeTexture)` — wipe/reveal transition; animate `progress` via tween.

Mask filter API:
```js
const mask = list.addMask('texKey');   // from texture key
const mask = list.addMask(gameObject);  // from game object
mask.invert = true;
mask.autoUpdate = false;                // stop auto-updating GO masks
mask.needsUpdate = true;                // force one update
mask.setTexture('newKey');
mask.setGameObject(newGO);
mask.viewCamera = otherCamera;          // camera for GO rendering
mask.viewTransform = 'local';           // 'local' or 'world'
mask.scaleFactor = 0.5;                 // scale mask texture size
```

ColorMatrix presets (call on `addColorMatrix().colorMatrix`): `sepia()`, `grayscale(1)`, `brightness(0.3)`, `hue(90)`, `saturate(-0.5)`, `contrast(0.3)`, `blackWhite()`, `negative()`, `desaturate()`, `night(0.5)`, `lsd()`, `brown()`, `vintagePinhole()`, `kodachrome()`, `technicolor()`, `polaroid()`, `shiftToBGR()`.
</built_in_filters>

<gotchas>
1. **WebGL only.** Filters do not work in the Canvas renderer. `enableFilters()` returns early if WebGL is unavailable.

2. **`enableFilters()` required for game objects.** Cameras have filters by default; sprites, images, containers, and other game objects require `enableFilters()` before accessing `filters`.

3. **Performance cost.** Each object with active filters creates extra draw calls (one for the base render plus one per active filter). Use sparingly and performance test early.

4. **Internal vs external matters.** Internal filters are cheaper (object-region sized); external filters are full-screen. A blur that should rotate with the object must be internal; a blur that should stay screen-aligned must be external.

5. **Filter order matters.** Filters are applied sequentially in list order — the output of one feeds into the next.

6. **Glow quality and distance are immutable.** `quality` and `distance` on the Glow filter cannot be changed after creation. Destroy and recreate the filter to change them.

7. **CaptureFrame requires forceComposite.** The camera must have `setForceComposite(true)` or otherwise render into a framebuffer for CaptureFrame to work.

8. **Padding for expanding effects.** Blur, Glow, and Shadow can automatically calculate padding to expand the render texture. Override with `setPaddingOverride()` (pass `null` to clear). On a camera, use `camera.getPaddingWrapper(x)` to render more world outside the image edge.

9. **Controller reuse.** By default controllers are destroyed when their FilterList is destroyed. Set `ignoreDestroy = true` to reuse a controller across multiple objects, but then you must manage its lifecycle manually. Works best with external filters.

10. **Mask game object rendering.** When using a game object as a mask source, it renders to a DynamicTexture each frame (if `autoUpdate` is true). For static masks, set `autoUpdate = false` and use `needsUpdate = true` for one-shot updates to improve performance.

11. **No Bloom filter.** v4 has no dedicated Bloom filter. Use ParallelFilters with Threshold + Blur + ADD blend (see Common Patterns), or use `Phaser.Actions.AddEffectBloom` to automate it.
</gotchas>

<v4_changes_from_v3>
- `gameObject.preFX` / `gameObject.postFX` → `gameObject.filters.internal` / `gameObject.filters.external`.
- `camera.postFX` → `camera.filters.internal` / `camera.filters.external` (cameras now have both lists).
- `FX.addBloom()` → use ParallelFilters + Threshold + Blur, or `Phaser.Actions.AddEffectBloom`. No dedicated Bloom filter.
- `FX.addCircle()` → use Vignette (with radius), a circular Mask, or `Phaser.Actions.AddMaskShape`.
- `FX.addGradient()` → use the new Gradient GameObject; add Quantize for steps if wanted.
- Glow `quality` was a 0-1 fraction; it is now an integer (default 10), with stochastic sampling replacing line sampling (higher quality at lower values).
- `camera.setMask()` → `camera.filters.internal.addMask()`; `gameObject.setMask()` → `gameObject.filters.internal.addMask()`. Masks are now filters, not a separate system.
- FX controllers → `Phaser.Filters.Controller` subclasses (same pattern: returned controller objects with mutable properties).
- New in v4: `enableFilters()` is now a required explicit opt-in for game objects; new filters Blocky, Quantize, Key, Blend, CombineColorMatrix, ImageLight, NormalTools, PanoramaBlur, ParallelFilters, Sampler.
</v4_changes_from_v3>
</filters_and_postfx>
