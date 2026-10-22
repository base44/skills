<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: curves and paths

<curves_and_paths>
Use this when working with curves and paths in Phaser 4: creating paths from curves (splines, bezier, lines, ellipses), getting points along them, drawing them with Graphics, and making sprites follow paths automatically with PathFollower.

<quick_start>
```js
// In a Scene's create() method:

// 1. Create a Path starting at (50, 300)
const path = this.add.path(50, 300);

// 2. Add curves to the path
path.lineTo(200, 100);
path.splineTo([ new Phaser.Math.Vector2(300, 400), new Phaser.Math.Vector2(500, 200) ]);
path.lineTo(700, 300);

// 3. Draw the path using Graphics
const graphics = this.add.graphics();
graphics.lineStyle(2, 0xffffff, 1);
path.draw(graphics, 64);

// 4. Create a PathFollower sprite that moves along the path
const follower = this.add.follower(path, 50, 300, 'ship');
follower.startFollow({
    duration: 5000,
    rotateToPath: true,
    repeat: -1,
    yoyo: true
});
```
</quick_start>

<core_concepts>
A `Phaser.Curves.Path` is a container that combines multiple Curves into one continuous compound curve. Curves in a Path do not need to be connected end-to-end; only their order affects point calculations. Created via `this.add.path(x, y)` where x/y is the starting point. Key properties: `curves` (array of `Phaser.Curves.Curve`), `startPoint` (Vector2), `autoClose` (if true, `getPoints()` appends the first point at the end), `defaultDivisions` (default 12, divisions per curve for `getPoints()`), `name`.

All curve types extend `Phaser.Curves.Curve`. Every curve supports: `getPoint(t, out)` (point at parameter t 0-1), `getPointAt(u, out)` (point at arc-length position u 0-1, evenly spaced), `getPoints(divisions, stepRate, out)`, `getSpacedPoints(divisions, stepRate, out)` (equidistant by arc length), `getDistancePoints(distance)`, `getLength()`, `getBounds(out, accuracy)`, `getTangent(t, out)` / `getTangentAt(u, out)` (unit tangent vector), `getStartPoint(out)` / `getEndPoint(out)`, `getRandomPoint(out)`, `draw(graphics, pointsTotal)`, and `active` (when false, the parent Path skips this curve).

A `Phaser.GameObjects.PathFollower` is a Sprite with the `Components.PathFollower` mixin. It uses an internal Tween (a number counter from 0 to 1) to advance along a Path each frame. Created via `this.add.follower(path, x, y, texture, frame)`. The component provides: `path` (the Path being followed), `pathTween` (internal Tween driving movement), `pathOffset` (Vector2 offset added to path coordinates), `pathVector` (current position on path), `pathDelta` (distance traveled since last frame), `rotateToPath` (auto-rotate to face path direction), `pathRotationOffset` (degrees added to auto-rotation).
</core_concepts>

<common_patterns>
Path has convenience methods that create curves starting from the previous end point:
```js
const path = this.add.path(100, 500);

path.lineTo(300, 100);                          // straight line
path.cubicBezierTo(500, 100, 350, 50, 450, 50); // cubic bezier (endX, endY, cp1X, cp1Y, cp2X, cp2Y)
path.quadraticBezierTo(700, 400, 600, 100);     // quadratic bezier (endX, endY, cpX, cpY)
path.splineTo([                                  // spline through points
    new Phaser.Math.Vector2(750, 300),
    new Phaser.Math.Vector2(600, 500)
]);
path.ellipseTo(50, 80, 0, 270, false, 0);       // ellipse arc (xRadius, yRadius, startAngle, endAngle, clockwise, rotation)
path.circleTo(40);                               // shortcut for ellipseTo with equal radii and 0-360

// Jump to a new position without drawing (creates a gap)
path.moveTo(400, 400);
path.lineTo(500, 400);

// Close the path by connecting end to start
path.closePath();
```

Adding pre-constructed standalone curve objects:
```js
const path = new Phaser.Curves.Path(0, 0);

const line = new Phaser.Curves.Line(new Phaser.Math.Vector2(0, 0), new Phaser.Math.Vector2(200, 200));
path.add(line);

const spline = new Phaser.Curves.Spline([ 200, 200, 300, 100, 400, 300 ]);
path.add(spline);

const ellipse = new Phaser.Curves.Ellipse(400, 300, 100, 60, 0, 360, false, 0);
path.add(ellipse);
```

Getting points along a path:
```js
const points = path.getPoints();        // array of points (uses defaultDivisions per curve)
const detailed = path.getPoints(32);     // explicit divisions per curve
const spaced = path.getSpacedPoints(100); // equally spaced points along entire path
const midpoint = path.getPoint(0.5);      // single point at normalized position (0-1)
const tangent = path.getTangent(0.5);     // tangent vector at a position
const length = path.getLength();          // total path length in pixels
const bounds = path.getBounds();          // bounding rectangle
```

Drawing paths with Graphics:
```js
const graphics = this.add.graphics();

// Draw entire path
graphics.lineStyle(2, 0x00ff00, 1);
path.draw(graphics, 64); // 64 = points per curve for smoothness

// Draw individual curves
graphics.lineStyle(1, 0xff0000, 1);
path.curves[0].draw(graphics, 32);

// Draw debug points
const points = path.getSpacedPoints(50);
points.forEach(p => {
    graphics.fillStyle(0xffff00, 1);
    graphics.fillCircle(p.x, p.y, 3);
});
```

PathFollower sprite with full config:
```js
const path = this.add.path(100, 200);
path.lineTo(400, 400);
path.lineTo(700, 200);

const enemy = this.add.follower(path, 100, 200, 'enemy');

enemy.startFollow({
    duration: 3000,       // ms to traverse path
    positionOnPath: true, // snap to path start position
    rotateToPath: true,   // auto-rotate to face direction
    rotationOffset: 90,   // offset added to auto-rotation (degrees)
    repeat: -1,           // -1 = infinite repeat
    yoyo: true,           // reverse on each repeat
    from: 0,              // start position on path (0-1)
    to: 1,                // end position on path (0-1)
    startAt: 0,           // initial seek position
    ease: 'Sine.easeInOut' // any valid Phaser ease
});

// Control during playback
enemy.pauseFollow();
enemy.resumeFollow();
enemy.stopFollow();
enemy.isFollowing(); // returns boolean

// Change path at runtime
enemy.setPath(newPath);
enemy.setPath(newPath, { duration: 2000 }); // auto-starts

// Set rotation independently
enemy.setRotateToPath(true, 90); // (value, offsetDegrees)
```

The follow config also accepts a bare duration number as shorthand — `enemy.startFollow(5000)` is equivalent to `enemy.startFollow({ duration: 5000 })`. The config additionally accepts all standard Tween properties (`ease`, `repeat`, `yoyo`, `delay`, `hold`, `onComplete`, etc.); defaults are `duration: 1000`, `from: 0`, `to: 1`, `positionOnPath: false`, `rotateToPath: false`, `rotationOffset: 0`, `startAt: 0`.
</common_patterns>

<curve_types>
- **Line** (`Phaser.Curves.Line`): straight segment between two points. Params `(p0, p1)` as Vector2 or `([x0,y0,x1,y1])`.
- **Spline** (`Phaser.Curves.Spline`): Catmull-Rom spline through control points. Params `(points)` as array of Vector2, flat numbers, or nested arrays.
- **CubicBezier** (`Phaser.Curves.CubicBezier`): start, 2 control points, end. Params `(p0, p1, p2, p3)` or `([x0,y0,...x3,y3])`.
- **QuadraticBezier** (`Phaser.Curves.QuadraticBezier`): start, 1 control point, end. Params `(p0, p1, p2)` or `([x0,y0,...x2,y2])`.
- **Ellipse** (`Phaser.Curves.Ellipse`): elliptical arc, angles in degrees, yRadius defaults to xRadius. Params `(x, y, xRadius, yRadius, startAngle, endAngle, clockwise, rotation)` or a config object.

The Ellipse curve has get/set properties for runtime modification: `x`, `y` (center), `xRadius`, `yRadius`, `startAngle`/`endAngle` (degrees — internally converted to/from radians), `clockwise`, `rotation` (radians), `angle` (rotation in degrees, alternative to `rotation`), and `setWidth(value)` / `setHeight(value)` (set radius to value/2).
</curve_types>

<gotchas>
1. **`getPoint(t)` vs `getPointAt(u)` on curves.** `getPoint` uses the raw curve parameter t, which does not produce evenly spaced points on most curve types. `getPointAt` maps through arc length for even spacing. On a Path, `getPoint` already accounts for arc length across the whole path.

2. **Path `moveTo` creates an inactive curve.** The `MoveTo` pseudo-curve has `active: false` and zero length. It only repositions the end point for the next curve — it does not draw anything and is skipped by `getPoints()` and `draw()`.

3. **PathFollower uses a Tween internally.** The `startFollow` config is passed to `scene.tweens.addCounter()`. All tween properties (ease, delay, repeat, yoyo, callbacks) work. The tween is set to `persist: true` automatically.

4. **PathFollower offset behavior.** When `positionOnPath: false` (default), the follower's current position becomes the offset from the path start. When `positionOnPath: true`, the follower snaps to the path's start point and the offset is zeroed.

5. **Ellipse angles are in degrees.** The constructor and `startAngle`/`endAngle` accept degrees (stored internally as radians). The `rotation` property is in radians, but `angle` is in degrees.

6. **`closePath` vs `autoClose`.** `closePath()` adds an explicit Line curve from end to start. `autoClose = true` only affects `getPoints()` and `getSpacedPoints()` output by appending the first point, without adding a curve.

7. **Cached lengths can go stale.** `getCurveLengths()` caches results based on array length only. If you modify a curve's control points, call `path.updateArcLengths()` to force recalculation.

8. **`cubicBezierTo` parameter order with numbers.** When passing numbers: `cubicBezierTo(endX, endY, cp1X, cp1Y, cp2X, cp2Y)` — the end point comes first, not the control points. When passing Vector2 objects: `cubicBezierTo(cp1, cp2, endPoint)`.

9. **Spline needs at least 4 points.** The Catmull-Rom interpolation works best with 4+ points. With fewer, the curve may not behave as expected.

10. **Line curve `arcLengthDivisions` is 1.** Unlike other curves (default 100), Line overrides this to 1 since a line is inherently uniform. No need to adjust it.
</gotchas>
</curves_and_paths>
