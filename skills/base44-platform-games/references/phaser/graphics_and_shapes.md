<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: graphics and shapes

<graphics_and_shapes>
Use this when drawing shapes and graphics in Phaser 4: the Graphics game object (lines, rectangles, circles, arcs, polygons, gradients, fill, stroke, generated textures) and Shape game objects (Arc, Curve, Ellipse, Grid, IsoBox, IsoTriangle, Line, Polygon, Rectangle, Star, Triangle).

<quick_start>
```js
// Draw a filled rectangle and stroked circle with Graphics
const gfx = this.add.graphics();

gfx.fillStyle(0x00aa00, 1);
gfx.fillRect(50, 50, 200, 100);

gfx.lineStyle(3, 0xff0000, 1);
gfx.strokeCircle(400, 150, 60);
```

```js
// Same shapes as standalone Shape game objects
const rect = this.add.rectangle(150, 100, 200, 100, 0x00aa00);
const circle = this.add.circle(400, 150, 60);
circle.setStrokeStyle(3, 0xff0000);
```
</quick_start>

<core_concepts>
Phaser offers two approaches for rendering primitives without textures.

**Graphics game object** — created with `this.add.graphics(config?)` where config is `{ x?, y?, lineStyle?, fillStyle? }`. An imperative drawing surface: you call methods like `fillRect`, `strokeCircle`, `beginPath`/`lineTo`/`strokePath` to build a command buffer that replays each frame. Supports paths, arcs, gradients, rounded rectangles, canvas transforms (`translateCanvas`, `scaleCanvas`, `rotateCanvas`), and `save`/`restore`. Can bake a Texture via `generateTexture(key, width, height)`. Expensive to render (its own WebGL shader) — group Graphics objects to minimize batch flushes. Components: AlphaSingle, BlendMode, Depth, Lighting, Mask, RenderNodes, Transform, Visible, ScrollFactor. Does NOT include Origin or GetBounds — position via options or `setPosition`.

**Shape game objects** — individual objects (Arc, Rectangle, Star, etc.) extending the base `Shape` class, each rendering one predefined shape with precomputed path data. Created via dedicated factories (`this.add.rectangle(...)`, `this.add.circle(...)`, etc.). Fully featured: tweenable, scalable, can join groups/containers, enabled for input/physics. Style via `setFillStyle(color, alpha)` and `setStrokeStyle(lineWidth, color, alpha)`. Share the same WebGL batch as Graphics. Do NOT support gradients, path detail threshold, or canvas transforms. Components: AlphaSingle, BlendMode, Depth, GetBounds, Lighting, Mask, Origin, RenderNodes, ScrollFactor, Transform, Visible (include Origin and GetBounds, unlike Graphics).

**When to use which**: use **Graphics** for dynamic drawing, complex paths, multiple shapes on one object, gradients, or generating textures. Use **Shape objects** for individual UI elements, simple indicators, physics-enabled shapes, or anything that benefits from game object features (origin, bounds, input).
</core_concepts>

<common_patterns>
Fill and stroke styles (Graphics) — call style methods BEFORE the corresponding fill/stroke; they are not retroactive:

```js
const gfx = this.add.graphics();

gfx.fillStyle(0xff0000, 1);          // (color, alpha) — before fill*
gfx.lineStyle(4, 0x00ff00, 1);       // (width, color, alpha) — before stroke*

// Gradient fill (WebGL only) — 4 corner colors
gfx.fillGradientStyle(
    0xff0000, 0x00ff00, 0x0000ff, 0xffff00,  // tl, tr, bl, br colors
    1, 1, 1, 1                                 // tl, tr, bl, br alphas
);
gfx.fillRect(0, 0, 300, 200);

gfx.lineGradientStyle(2, 0xff0000, 0x00ff00, 0x0000ff, 0xffff00, 1); // gradient line (WebGL only)
```

Drawing primitives (Graphics):

```js
gfx.fillRect(x, y, width, height);          gfx.strokeRect(x, y, width, height);
gfx.fillCircle(x, y, radius);               gfx.strokeCircle(x, y, radius);
gfx.fillEllipse(x, y, width, height, smoothness);   // smoothness defaults to 32
gfx.strokeEllipse(x, y, width, height, smoothness);
gfx.fillTriangle(x0, y0, x1, y1, x2, y2);   gfx.strokeTriangle(x0, y0, x1, y1, x2, y2);
gfx.fillPoint(x, y, size);                  // size defaults to 1 (draws a small square)
gfx.lineBetween(x1, y1, x2, y2);
```

Rounded rectangles — radius can be a number or a per-corner object; negative values create concave corners (default 20):

```js
gfx.fillRoundedRect(50, 50, 300, 200, 16);
gfx.strokeRoundedRect(50, 50, 300, 200, 16);
gfx.fillRoundedRect(50, 50, 300, 200, { tl: 20, tr: 20, bl: 0, br: 0 });        // per-corner
gfx.fillRoundedRect(50, 50, 300, 200, { tl: -10, tr: -10, bl: -10, br: -10 });  // concave
```

Path drawing — Graphics `arc`/`slice` take angles in RADIANS:

```js
gfx.beginPath();
gfx.moveTo(100, 100);
gfx.lineTo(200, 50);
gfx.lineTo(300, 100);
gfx.lineTo(250, 200);
gfx.closePath();
gfx.strokePath();       // or gfx.stroke() — alias

gfx.fillStyle(0x00aaff);
gfx.beginPath();
gfx.moveTo(100, 100);
gfx.lineTo(200, 50);
gfx.lineTo(300, 100);
gfx.closePath();
gfx.fillPath();         // or gfx.fill() — alias

// Arc within a path (x, y, radius, startAngle, endAngle, anticlockwise, overshoot)
gfx.beginPath();
gfx.arc(200, 200, 80, 0, Math.PI / 2, false, 0);
gfx.strokePath();

// Pie slice — auto begins/closes path
gfx.slice(200, 200, 80, 0, Math.PI / 3, false);
gfx.fillPath();

// From point arrays
gfx.strokePoints(points, closeShape, closePath, endIndex);
gfx.fillPoints(points, closeShape, closePath, endIndex);
```

Geom shape helpers — Graphics accepts `Phaser.Geom` objects directly: `fillCircleShape(circle)`, `strokeCircleShape(circle)`, `fillRectShape(rect)`, `strokeRectShape(rect)`, `fillTriangleShape(tri)`, `strokeTriangleShape(tri)`, `strokeLineShape(line)`, `fillEllipseShape(ellipse, smoothness)`, `strokeEllipseShape(ellipse, smoothness)`.

Canvas transforms (Graphics):

```js
gfx.save();
gfx.translateCanvas(100, 100);
gfx.rotateCanvas(0.5);           // radians
gfx.scaleCanvas(2, 2);
gfx.fillStyle(0xff0000);
gfx.fillRect(0, 0, 50, 50);      // drawn at translated/rotated/scaled position
gfx.restore();
```

Generating textures from Graphics — gradient fills do NOT appear in generated textures (Canvas API limitation):

```js
const gfx = this.add.graphics();
gfx.fillStyle(0xff0000);
gfx.fillCircle(32, 32, 32);
gfx.generateTexture('redCircle', 64, 64);
gfx.destroy();

this.add.image(400, 300, 'redCircle');   // now a regular texture
```

Shape objects — fill and stroke:

```js
const rect = this.add.rectangle(200, 150, 100, 80, 0xff0000, 1);

rect.setFillStyle(0x00ff00, 0.8);        // change fill later
rect.setStrokeStyle(3, 0xffffff, 1);     // add stroke (not set by default)
rect.setFillStyle();                     // no args = isFilled becomes false
rect.setStrokeStyle();                   // no args = isStroked becomes false

// Direct property access
rect.fillColor = 0x0000ff;  rect.fillAlpha = 0.5;
rect.strokeColor = 0xffffff;  rect.strokeAlpha = 1;  rect.lineWidth = 2;
rect.isFilled = true;  rect.isStroked = true;
rect.closePath = true;   // close stroke path (default true)
```
</common_patterns>

<shape_types>
Factory methods (all after `x, y`); defaults in parentheses:
- `this.add.arc(x, y, radius, startAngle, endAngle, anticlockwise, fillColor, fillAlpha)` — class Arc. radius=128, startAngle=0, endAngle=360 (DEGREES), anticlockwise=false. Fill + stroke.
- `this.add.circle(x, y, radius, fillColor, fillAlpha)` — Arc with 0-360 angles. radius=128. Fill + stroke.
- `this.add.curve(x, y, curve, fillColor, fillAlpha)` — Curve, takes a `Phaser.Curves.Curve`. Has `smoothness` / `setSmoothness()`. Fill + stroke.
- `this.add.ellipse(x, y, width, height, fillColor, fillAlpha)` — width=128, height=128 (equal renders as circle). Has `smoothness`. Fill + stroke.
- `this.add.grid(x, y, width, height, cellWidth, cellHeight, fillColor, fillAlpha, outlineFillColor, outlineFillAlpha)` — width/height=128, cellWidth/cellHeight=32. `altFillColor`/`altFillAlpha` for checkerboard; outline via outlineFillColor. Fill only.
- `this.add.isobox(x, y, size, height, fillTop, fillLeft, fillRight)` — size=48, height=32, fillTop=0xeeeeee, fillLeft=0x999999, fillRight=0xcccccc. `showTop`/`showLeft`/`showRight`/`projection`. Fill only.
- `this.add.isotriangle(x, y, size, height, reversed, fillTop, fillLeft, fillRight)` — isometric pyramid. size=48, height=32, reversed=false. Fill only.
- `this.add.line(x, y, x1, y1, x2, y2, strokeColor, strokeAlpha)` — x1=0, y1=0, x2=128, y2=0. STROKE ONLY; constructor takes stroke color (not fill).
- `this.add.polygon(x, y, points, fillColor, fillAlpha)` — points as array of Vec2, `[x,y,...]` pairs, or `[[x,y],...]`. Fill + stroke.
- `this.add.rectangle(x, y, width, height, fillColor, fillAlpha)` — width/height=128, change via `width`/`height`. Fill + stroke.
- `this.add.star(x, y, points, innerRadius, outerRadius, fillColor, fillAlpha)` — points=5, innerRadius=32, outerRadius=64 (4 points = diamond, more = spikier). Fill + stroke.
- `this.add.triangle(x, y, x1, y1, x2, y2, x3, y3, fillColor, fillAlpha)` — x1=0,y1=128, x2=64,y2=0, x3=128,y3=128. Always closed (use Polygon for open shapes). Fill + stroke.
</shape_types>

<shape_specific_methods>
Star:

```js
const star = this.add.star(400, 300, 5, 32, 64, 0xffff00);
star.setPoints(8);          // change number of points
star.setInnerRadius(20);
star.setOuterRadius(80);
```

Line (tapering — `endWidth` is WebGL only; Canvas uses startWidth only):

```js
const line = this.add.line(400, 300, 0, 0, 200, 100, 0xffffff);
line.setLineWidth(4, 1);    // tapers from 4px to 1px
```

Grid (alternating colors, stroke, padding):

```js
const grid = this.add.grid(400, 300, 320, 240, 32, 32, 0x222222);
grid.setAltFillStyle(0x444444, 1);     // checkerboard; no args = disable alternating cells
grid.setStrokeStyle(1, 0x666666, 1);   // cell outlines (inherited from Shape)
grid.strokeOutside = true;             // v4: stroke the outer border
grid.strokeOutsideIncomplete = false;  // skip partial cells on right/bottom edges
grid.cellPadding = 1;                  // gutter between cells is 2x this value (default 0.5)
```

IsoBox / IsoTriangle:

```js
const box = this.add.isobox(200, 200, 48, 32, 0xeeeeee, 0x999999, 0xcccccc);
box.setFaces(true, true, false);  // showTop, showLeft, showRight
box.setProjection(4);

const tri = this.add.isotriangle(400, 200, 48, 32, false, 0xeeeeee, 0x999999, 0xcccccc);
tri.setReversed(true);            // flip upside down
tri.setFaces(true, true, true);
tri.setProjection(4);
```
</shape_specific_methods>

<gotchas>
- **Graphics arc() uses radians; the Shape arc factory uses degrees.** Graphics `arc` takes start/end angles in radians; `this.add.arc()` takes them in degrees (0-360). Mixing these up is the most common bug.
- **Set style BEFORE drawing.** `fillStyle`/`lineStyle` must be called before the corresponding fill/stroke method — they are not retroactive.
- **Graphics has no Origin or GetBounds.** Use `setPosition(x, y)` and `displayOriginX`/`displayOriginY` instead.
- **Shape isFilled/isStroked defaults.** A shape created with a `fillColor` parameter has `isFilled = true`, but `isStroked` defaults to `false` — call `setStrokeStyle()` explicitly.
- **Line shape is stroke-only.** Its constructor takes `strokeColor`/`strokeAlpha`, not fillColor.
- **IsoBox/IsoTriangle are fill-only.** They cannot be stroked. Grid supports outline strokes via constructor parameters (`outlineFillColor`, `outlineFillAlpha`).
- **generateTexture uses the Canvas API.** Gradient fills (`fillGradientStyle`) will not appear in generated textures — only Canvas-compatible features are captured.
- **Graphics is expensive.** Each frame the command buffer replays and geometry is rebuilt (WebGL decomposes to polygons). For static shapes, `generateTexture` and use the result as a Sprite. Group Graphics objects to minimize batch breaks.
- **pathDetailThreshold (v4 new).** Graphics has a `pathDetailThreshold` property (default -1, uses config `render.pathDetailThreshold`). Path segments below this pixel threshold are combined, improving WebGL performance on complex shapes. Evaluated in screen pixels, so detail emerges when zoomed in.
- **Rounded rect radius can be an object or number.** Pass `{ tl, tr, bl, br }` for per-corner control; negative values create concave corners; default is 20.
- **Shape closePath property** (default `true`) controls whether the stroke path is auto-closed. Set `false` for open stroked shapes.
- **Shape objects do NOT support tint.** Unlike Sprites/Images, they have no `setTint()` or `tint`. Use `setFillStyle(color, alpha)` and `setStrokeStyle(lineWidth, color, alpha)`.
- **Polygon getBounds() is incorrect with negative points.** If any polygon points have negative coordinates, `getBounds()` returns wrong values. Use `Phaser.Geom.Polygon.GetAABB(polygon.geom)` instead and adjust the returned Rectangle position.
</gotchas>
</graphics_and_shapes>
