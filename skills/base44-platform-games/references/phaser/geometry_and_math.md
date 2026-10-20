<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Phaser 4: geometry and math

<geometry_and_math>
Use this when using Phaser 4 math and geometry utilities: Geom classes (Circle, Ellipse, Line, Polygon, Rectangle, Triangle), intersection tests, vectors and matrices, angles, distance, interpolation, easing, random number generation, snapping, clamping, and color utilities.

<quick_start>
```js
// Geometry objects are data only — not renderable
const rect = new Phaser.Geom.Rectangle(10, 20, 200, 100);
const circle = new Phaser.Geom.Circle(400, 300, 50);
const line = new Phaser.Geom.Line(0, 0, 100, 100);

rect.contains(50, 50);     // true — point containment
circle.contains(410, 310); // true
Phaser.Geom.Intersects.CircleToRectangle(circle, rect); // boolean

// Math utilities
const v = new Phaser.Math.Vector2(3, 4);
v.length();      // 5
v.normalize();   // {x: 0.6, y: 0.8}

const dist = Phaser.Math.Distance.Between(0, 0, 100, 100);
const angle = Phaser.Math.Angle.Between(0, 0, 100, 100);
const clamped = Phaser.Math.Clamp(150, 0, 100); // 100
```
</quick_start>

<core_concepts>
Geometry objects are pure data containers holding coordinates and dimensions. They are NOT game objects and cannot be added to the display list — to render geometry, use the Graphics game object or Shape game objects. Every geom class has a `type` property set to a `Phaser.Geom` constant for fast type checks.

All geom classes share a common instance method pattern: `contains(x, y)` (point-in-shape), `getPoint(position, output?)` (point at normalized 0-1 position on perimeter), `getPoints(quantity, stepRate?, output?)` (evenly spaced perimeter points), `getRandomPoint(output?)` (random point inside), `setTo(...)`, `setEmpty()`, `setPosition(x, y)`. Each geom type also has a folder of static helper functions (e.g. `Phaser.Geom.Rectangle.Contains`, `Phaser.Geom.Circle.Area`).
</core_concepts>

<geometry_classes>
Constructors and key properties:
- **Circle** `Phaser.Geom.Circle(x, y, radius)` — `x`, `y`, `radius`, `diameter`, `left`, `right`, `top`, `bottom`.
- **Ellipse** `Phaser.Geom.Ellipse(x, y, width, height)` — `x`, `y`, `width`, `height`, edges.
- **Line** `Phaser.Geom.Line(x1, y1, x2, y2)` — `x1`, `y1`, `x2`, `y2`, edges.
- **Polygon** `Phaser.Geom.Polygon(points)` — `area`, `points` (array of Vector2Like).
- **Rectangle** `Phaser.Geom.Rectangle(x, y, width, height)` — `x`, `y`, `width`, `height`, edges, `centerX`, `centerY`.
- **Triangle** `Phaser.Geom.Triangle(x1, y1, x2, y2, x3, y3)` — three vertex pairs.

The Polygon constructor accepts multiple `points` formats: space-separated string (`'40 0 40 20 100 20'`), array of `{x, y}` objects, flat number array (`[x1, y1, x2, y2, ...]`), or array of `[x, y]` sub-arrays.

Each type has a rich set of static helpers under `Phaser.Geom.<Type>.*` — e.g. Rectangle: Area, CenterOn, Contains, ContainsRect, FitInside, FitOutside, Inflate, Intersection, MarchingAnts, Offset, Overlaps, Perimeter, Random, Scale, Union; Circle: Area, Circumference, CircumferencePoint, Contains, GetBounds, GetPoint, Random; Line: Angle, BresenhamPoints, Extend, GetMidPoint, GetNearestPoint, GetNormal, Length, Rotate, SetToAngle, Slope; Triangle: Area, BuildEquilateral, BuildRight, Centroid, CircumCenter, CircumCircle, InCenter, Rotate.
</geometry_classes>

<intersection_tests>
All under `Phaser.Geom.Intersects`.

Boolean tests (return `true`/`false`): `CircleToCircle(a, b)`, `CircleToRectangle(circle, rect)`, `LineToCircle(line, circle)`, `LineToLine(l1, l2, out?)` (writes point to `out`), `LineToRectangle(line, rect)`, `PointToLine(point, line, lineThickness?)`, `PointToLineSegment(point, line)`, `RectangleToRectangle(a, b)`, `RectangleToTriangle(rect, tri)`, `RectangleToValues(rect, left, right, top, bottom, tolerance?)`, `TriangleToCircle(tri, circle)`, `TriangleToLine(tri, line)`, `TriangleToTriangle(a, b)`.

Get intersection points (return `Vector2[]`, accept an optional `out` array): `GetCircleToCircle`, `GetCircleToRectangle`, `GetLineToCircle`, `GetLineToLine` (single point), `GetLineToPoints`, `GetLineToPolygon` (closest intersection), `GetLineToRectangle`, `GetRaysFromPointToPolygon(x, y, polygon)`, `GetRectangleIntersection` (overlapping region), `GetRectangleToRectangle`, `GetRectangleToTriangle`, `GetTriangleToCircle`, `GetTriangleToLine`, `GetTriangleToTriangle`.
</intersection_tests>

<math_functions>
All under `Phaser.Math` unless noted.

**Constants**: `TAU` (PI * 2, v4 addition), `PI_OVER_2`, `EPSILON` (1.0e-6), `DEG_TO_RAD` (PI / 180), `RAD_TO_DEG` (180 / PI), `RND` (global `RandomDataGenerator`, seeded via game config `seed`).

**Angle** (`Phaser.Math.Angle.*`): `Between(x1, y1, x2, y2)`, `BetweenPoints(p1, p2)`, `BetweenY` / `BetweenPointsY` (from vertical axis), `CounterClockwise(angle)`, `GetClockwiseDistance(from, to)`, `GetCounterClockwiseDistance`, `GetShortestDistance` (signed), `Normalize(angle)` (to [0, 2PI)), `Random()`, `RandomDegrees()`, `Reverse(angle)` (add PI), `RotateTo(current, target, lerp?)`, `ShortestBetween(a1, a2)` (degrees), `Wrap(angle)` (to (-PI, PI]), `WrapDegrees(angle)` (to (-180, 180]).

**Distance** (`Phaser.Math.Distance.*`): `Between(x1, y1, x2, y2)` (Euclidean), `BetweenPoints(a, b)`, `BetweenPointsSquared`, `Chebyshev` (chessboard), `Power(x1, y1, x2, y2, pow)` (Minkowski), `Snake` (Manhattan/taxicab), `Squared` (squared Euclidean — avoids sqrt).

**Interpolation** (`Phaser.Math.Interpolation.*`): `BezierInterpolation(v, k)`, `CatmullRomInterpolation(v, k)`, `CubicBezierInterpolation(t, p0, p1, p2, p3)`, `LinearInterpolation(v, k)`, `QuadraticBezierInterpolation(t, p0, p1, p2)`, `SmoothStepInterpolation(t, min, max)`, `SmootherStepInterpolation(t, min, max)`.

**Snap** (`Phaser.Math.Snap.*`): `To(value, gap, start?, divide?)` (nearest increment), `Floor(...)` (down), `Ceil(...)` (up).

**Fuzzy** (`Phaser.Math.Fuzzy.*`): `Equal(a, b, epsilon?)`, `LessThan`, `GreaterThan`, `Ceil(value, epsilon?)`, `Floor(value, epsilon?)`.

**Easing** (`Phaser.Math.Easing.*`, used primarily by tweens via string names like `'Sine.easeOut'`): each type has `.In`, `.Out`, `.InOut` variants — Back, Bounce, Circular (`Circ`), Cubic, Elastic, Expo, Quadratic (`Quad`), Quartic (`Quart`), Quintic (`Quint`), Sine. No-variant types: `Linear`, `Stepped`. Power aliases: `Power0` = Linear, `Power1` = Quad.Out, `Power2` = Cubic.Out, `Power3` = Quart.Out, `Power4` = Quint.Out. Short names default to `.Out` (`'Quad'` = Quad.Out).

**Core helpers** (directly on `Phaser.Math`): `Between(min, max)` (random int), `FloatBetween(min, max)` (random float), `Clamp(value, min, max)`, `Wrap(value, min, max)`, `Within(a, b, tolerance)`, `Percent(value, min, max, upperMax?)`, `FromPercent(percent, min, max)`, `DegToRad(degrees)`, `RadToDeg(radians)`, `Linear(p0, p1, t)` (lerp), `LinearXY(v1, v2, t, out?)`, `SmoothStep(x, min, max)`, `SmootherStep(x, min, max)`, `Average(values)`, `Median(values)`, `CeilTo(value, place?, base?)`, `FloorTo`, `RoundTo`, `RoundAwayFromZero(value)`, `MaxAdd(value, amount, max)`, `MinSub(value, amount, min)`, `Difference(a, b)`, `IsEven(value)`, `IsEvenStrict(value)`, `Factorial(value)`, `Rotate(point, angle)`, `RotateAround(point, cx, cy, angle)`, `RotateAroundDistance(point, cx, cy, angle, dist)`, `TransformXY(x, y, posX, posY, rotation, scaleX, scaleY, output?)`, `GetSpeed(distance, time)`, `RandomXY(vector, scale?)`.

**Power-of-Two** (`Phaser.Math.Pow2.*`): `GetPowerOfTwo(value)`, `IsValuePowerOfTwo(value)`, `IsSizePowerOfTwo(width, height)`.
</math_functions>

<vectors_and_matrices>
**Vector2** (`Phaser.Math.Vector2`) — 2D vector for positions, velocities, directions. Constructor: `new Vector2(x?, y?)` or `new Vector2({x, y})`; if only `x` given, `y` defaults to `x`. Methods mutate in place and return `this` for chaining: `set`/`setTo(x, y)`, `setToPolar(angle, length?)`, `copy(src)` / `setFromObject(obj)`, `clone()`, `add`/`subtract(src)`, `multiply`/`divide(src)`, `scale(value)`, `negate()`, `normalize()`, `normalizeRightHand()` / `normalizeLeftHand()` (perpendiculars), `limit(max)`, `setLength(length)`, `length()`, `lengthSq()`, `distance(src)`, `distanceSq(src)`, `dot(src)`, `cross(src)` (2D scalar), `angle()` (radians from +x axis), `setAngle(angle)`, `rotate(delta)`, `lerp(src, t)`, `reflect(normal)`, `mirror(axis)`, `project(src)`, `equals(v)`, `fuzzyEquals(v, epsilon?)`, `ceil()` / `floor()` / `invert()`, `reset()`, `transformMat3(mat)`, `transformMat4(mat)`. Static constants: `Vector2.ZERO`, `RIGHT`, `LEFT`, `UP`, `DOWN`, `ONE`.

**Vector3** (`Phaser.Math.Vector3`) — for camera projections, lighting, 3D math. Same patterns as Vector2 plus: `up()`, `min(v)`, `max(v)`, `addVectors(a, b)`, `subVectors(a, b)`, `crossVectors(a, b)`, `cross(v)`, `addScalar(s)`, `addScale(v, scale)`, `fromArray(array, offset?)`, `setFromMatrixPosition(mat4)`, `setFromMatrixColumn(mat4, index)`, `applyMatrix3(mat)`, `applyMatrix4(mat)`, `transformCoordinates(mat)`, `transformQuat(q)`, `project(mat)`, `projectViewMatrix(view, proj)`, `unproject(viewport, invProjView)`.

**Matrix4** (`Phaser.Math.Matrix4`) — 4x4 matrix for 3D transforms, projection, and view matrices, backed by `Float32Array(16)`. Constructor `new Matrix4(m?)` copies an existing Matrix4 or defaults to identity. Key methods: `clone()`, `set`/`copy(src)`, `identity()`, `transpose()`, `invert()`, `adjoint()`, `determinant()`, `multiply`/`multiplyLocal(src)`, `translate(v)`, `scale(v)`, `rotate(angle, axis)`, `rotateX`/`rotateY`/`rotateZ(angle)`, `fromRotationTranslation(q, v)`, `fromQuat(q)`, `frustum(...)`, `perspective(fovy, aspect, near, far)`, `perspectiveLH(width, height, near, far)`, `ortho(left, right, bottom, top, near, far)`, `lookAt(eye, center, up)`, `lookAtRH(eye, target, up)`, `setWorldMatrix(rotation, position, scale, viewMatrix?, projectionMatrix?)`. Also `Phaser.Math.Matrix3` — 3x3 matrix for 2D transforms and normal matrices.
</vectors_and_matrices>

<random_data_generator>
`Phaser.Math.RandomDataGenerator` — seeded PRNG. Global instance at `Phaser.Math.RND` (seeded via game config `seed`). Provide seeds for reproducible sequences: `new RandomDataGenerator(['level-42'])`.

```js
const rnd = Phaser.Math.RND;

rnd.integer();              // random integer in [0, 2^32]
rnd.frac();                 // random float in [0, 1)
rnd.between(1, 10);         // random integer in [1, 10]
rnd.integerInRange(1, 10);  // alias for between
rnd.realInRange(0.5, 1.5);  // random float in [0.5, 1.5]
rnd.normal();               // normal distribution around 0
rnd.angle();                // random angle in radians (-PI to PI)
rnd.rotation();             // random rotation in radians (same range)
rnd.pick(array);            // random element
rnd.weightedPick(array);    // weighted toward end of array
rnd.sign();                 // -1 or 1
rnd.uuid();                 // RFC4122 v4 UUID string
rnd.shuffle(array);         // in-place Fisher-Yates shuffle
rnd.state(state?);          // get/set deterministic RNG state string
```
</random_data_generator>

<color_utilities>
**Color class** (`Phaser.Display.Color`) — mutable RGBA color with automatic conversion to WebGL floats, HSV, CSS strings, and packed integers.

```js
const color = new Phaser.Display.Color(255, 0, 0, 255);     // RGBA (0-255)

// Creation helpers (return Color instances)
const c1 = Phaser.Display.Color.ValueToColor('#ff0000');    // hex string, integer, or object
const c2 = Phaser.Display.Color.HexStringToColor('#ff0000');
const c3 = Phaser.Display.Color.RGBStringToColor('rgb(255,0,0)');
const c4 = Phaser.Display.Color.HSVToRGB(0.5, 1, 1);        // returns { r, g, b, color }

// Properties
color.r; color.g; color.b; color.a;                         // 0-255 integers
color.redGL; color.greenGL; color.blueGL; color.alphaGL;    // 0-1 floats (WebGL)
color.color;    // packed 24-bit integer (0xRRGGBB)
color.color32;  // packed 32-bit integer (0xAARRGGBB)
color.rgba;     // CSS string 'rgba(r,g,b,a)'
color.h; color.s; color.v;  // HSV (read-only, auto-updated)
```

Manipulation (amount typically 0-100, returns the Color): `brighten(25)`, `saturate(50)`, `desaturate(30)`, `lighten(20)`, `darken(10)`, `random()` (optional min/max range), `gray(128)`. Setting values: `setTo(255, 128, 0, 255)`, `setFromRGB({ r, g, b, a })`, `setFromHSV(0.1, 0.8, 1.0)` (HSV 0-1).

Interpolation (`Phaser.Display.Color.Interpolate`, returns `{ r, g, b, a, color }`):

```js
const result = Phaser.Display.Color.Interpolate.RGBWithRGB(255, 0, 0, 0, 0, 255, 100, 50); // midpoint purple
const mid = Phaser.Display.Color.Interpolate.ColorWithColor(color1, color2, 100, 50);
const hsvResult = Phaser.Display.Color.Interpolate.HSVWithHSV(0, 1, 1, 0.5, 1, 1, 100, 50); // v4 smooth hue
```
</color_utilities>

<gotchas>
- **Geom objects are not game objects**: no `scene`, no display-list `setPosition`, no texture. Use Graphics or Shape game objects to render them.
- **Point class removed in v4**: use `Phaser.Math.Vector2` or plain `{x, y}` objects. The `GEOM_CONST.POINT` (3) exists but the Point class does not.
- **Angles are in radians** throughout the math API. Use `DegToRad()` / `RadToDeg()` to convert. `Phaser.Math.TAU` (2 * PI) is new in v4.
- **Vector2 methods mutate in place** and return `this`. Call `.clone()` first to preserve the original: `const result = v.clone().add(other)`.
- **Squared distance is faster** than Euclidean (avoids `Math.sqrt`). Use `Distance.Squared` or `vec.distanceSq()` for comparisons where the actual distance value isn't needed.
- **Intersection Get* functions allocate arrays**: pass a reusable `out` array to avoid GC pressure in hot loops.
- **EaseMap short names default to `.Out`**: `'Quad'` means `Quadratic.Out`, not `.In`. Use full keys like `'Quad.easeIn'` for other variants.
- **RandomDataGenerator state is serializable**: `rnd.state()` returns a string; if it must survive reloads, persist that string only as a field in a Base44 entity.
- **Polygon.contains uses ray-casting** (even/odd rule). Complex self-intersecting polygons may give unexpected results.
- **Matrix4.val is a Float32Array**: access elements via `mat.val[index]` in column-major order (OpenGL convention).
</gotchas>
</geometry_and_math>
