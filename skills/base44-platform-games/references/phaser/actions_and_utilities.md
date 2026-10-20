<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Phaser 4: actions and utilities

<actions_and_utilities>
Use this when you need batch operations on arrays of Game Objects, alignment and grid layout, or the Phaser.Utils array/object/string helper functions.

<quick_start>
`Phaser.Actions` runs batch operations over arrays of Game Objects. The first argument is always an array, every action returns the same array, and Groups work by passing `group.getChildren()`.

```js
// Create 20 sprites and batch-position them in a grid
const sprites = [];
for (let i = 0; i < 20; i++) {
    sprites.push(this.add.sprite(0, 0, 'gem'));
}

// Arrange into a 5x4 grid
Phaser.Actions.GridAlign(sprites, {
    width: 5,
    height: 4,
    cellWidth: 64,
    cellHeight: 64,
    x: 100,
    y: 100
});

// Fade alpha from 0 to 1 across all sprites
Phaser.Actions.Spread(sprites, 'alpha', 0, 1);

// Offset each sprite's x by 10, with a step of 2 per item
Phaser.Actions.IncX(sprites, 10, 2);

// Works with Groups too
const group = this.add.group({ key: 'star', repeat: 11 });
Phaser.Actions.PlaceOnCircle(group.getChildren(), new Phaser.Geom.Circle(400, 300, 200));
```
</quick_start>

<core_concepts>
Every Action in `Phaser.Actions` follows the same shape: the first argument is an array of Game Objects (or any objects with the required public properties like `x`, `y`, `alpha`); it returns the same array for chaining/pass-through; it works with Groups via `group.getChildren()`; and it is a one-shot batch operation that stores no state.

Most Set/Inc actions delegate to two core functions. `PropertyValueSet(items, key, value, step, index, direction)` sets `items[i][key] = value + (i * step)`. `PropertyValueInc(items, key, value, step, index, direction)` adds `items[i][key] += value + (i * step)`. The `step` parameter adds an incremental offset per item (multiplied by iteration index, not cumulative). The `index` and `direction` parameters control the iteration start point and order (1 = forward, -1 = backward).

Placement actions like `PlaceOnCircle`, `PlaceOnLine`, `RandomRectangle` accept Phaser geometry objects (`Phaser.Geom.Circle`, `Phaser.Geom.Line`), NOT Game Object shapes. If using a `Phaser.GameObjects.Circle`, pass its `.geom` property instead.

Action categories: property setters (`SetX`, `SetXY`, `SetAlpha`, `SetScale`, `SetTint`, `SetVisible`, generic `PropertyValueSet`); property incrementers (`IncX`, `IncXY`, `Angle`, `Rotate`, `ScaleXY`, generic `PropertyValueInc`); placement on geometry (`PlaceOnCircle/Ellipse/Line/Rectangle/Triangle`, `RandomCircle/Ellipse/Line/Rectangle/Triangle`); layout and alignment (`GridAlign`, `AlignTo`, `FitToRegion`); distribution (`Spread`, `SmoothStep`, `SmootherStep`); rotation and movement (`RotateAround`, `RotateAroundDistance`, `ShiftPosition` for snake-like trailing, `WrapInRectangle`); queries and iteration (`GetFirst`, `GetLast`, `Call`, `Shuffle`, `ToggleVisible`, `PlayAnimation`); and v4 filter effects (`AddEffectBloom`, `AddEffectShine`, `AddMaskShape`, which return arrays of created effects rather than the input array).

`Phaser.Utils.Array` offers array manipulation: `Add`, `AddAt`, `Remove`, `RemoveAt`, `RemoveBetween`, `RemoveRandomElement`, `Replace`, `Swap`, `BringToTop`, `SendToBack`, `MoveUp`, `MoveDown`, `MoveAbove`, `MoveBelow`, `MoveTo`, `RotateLeft`, `RotateRight`, `Each`, `EachInRange`, `GetAll`, `GetFirst`, `GetRandom`, `CountAllMatching`, `SetAll`, `Shuffle`, `StableSort`, `SortByDigits`, `QuickSelect`, `FindClosestInSorted`, `Flatten`, `NumberArray`, `NumberArrayStep`, `Range`, `SafeRange`, `SpliceOne`. There is also a `Phaser.Utils.Array.Matrix` sub-namespace for 2D matrix operations.

`Phaser.Utils.Objects` offers object helpers: `Clone` (shallow), `DeepCopy` (recursive), `Extend` (jQuery-style), `Merge`/`MergeRight`, `Pick`, `GetValue` (dot-path lookup with fallback), `GetFastValue` (top-level-only, faster), `GetAdvancedValue` (resolves random/callback config values), `GetMinMaxValue` (clamped), `SetValue` (dot-path set), `HasValue`, `HasAll`, `HasAny`, `IsPlainObject`.

`Phaser.Utils.String` offers: `Format` (replace `%1`, `%2` markers), `Pad`, `RemoveAt`, `Reverse`, `UppercaseFirst`, `UUID` (RFC4122 v4).
</core_concepts>

<common_patterns>
Using Actions with Groups — always pass the array, not the Group:
```js
const enemies = this.add.group({ key: 'enemy', repeat: 9 });

// Position all children in a grid
Phaser.Actions.GridAlign(enemies.getChildren(), {
    width: 5, height: 2,
    cellWidth: 80, cellHeight: 80,
    x: 100, y: 50
});

// Fan out alpha across all enemies
Phaser.Actions.Spread(enemies.getChildren(), 'alpha', 0.3, 1);
```

The step parameter for staggered values:
```js
// Place sprites starting at x=100, each one 50px further right
Phaser.Actions.SetX(sprites, 100, 50);
// Result: items[0].x=100, items[1].x=150, items[2].x=200, ...

// Increment rotation with increasing step
Phaser.Actions.Rotate(sprites, 0.1, 0.05);
// Result: items[0].rotation += 0.1, items[1].rotation += 0.15, ...
```

Scatter then constrain:
```js
const bounds = new Phaser.Geom.Rectangle(0, 0, 800, 600);
Phaser.Actions.RandomRectangle(sprites, bounds);   // random scatter
Phaser.Actions.WrapInRectangle(sprites, bounds);   // keep wrapped in bounds during update
```

`GetValue` for config parsing:
```js
// Deep property access with fallback
const width = Phaser.Utils.Objects.GetValue(config, 'render.screen.width', 800);

// Fast top-level lookup (no dot-path, better performance)
const speed = Phaser.Utils.Objects.GetFastValue(config, 'speed', 100);
```

`NumberArray` for asset keys:
```js
const keys = Phaser.Utils.Array.NumberArray(1, 10, 'frame_', '.png');
// Result: ['frame_1.png', 'frame_2.png', ..., 'frame_10.png']
```
</common_patterns>

<gotchas>
- Actions operate on plain arrays, not Groups directly. Always call `group.getChildren()` to get the array.
- PlaceOn/Random geometry actions need `Phaser.Geom` objects, not Game Object shapes. For a `Phaser.GameObjects.Circle`, pass `circle.geom`.
- `SetXY` defaults `y` to `x` if `y` is `undefined` or `null`. Pass `0` explicitly if you want y=0 and x=something else.
- `Spread` with a single item places it at the midpoint `(min + max) / 2`, not at `min`.
- `step` is multiplied by iteration index, not added cumulatively. Item 0 gets `value + 0*step`, item 1 gets `value + 1*step`, etc.
- `StableSort` uses native `Array.sort` when the engine supports stable sorting, falling back to merge sort only when needed.
- `Shuffle` (both Actions and Utils.Array) modifies the array in-place and returns it.
- `GetValue` vs `GetFastValue`: use `GetFastValue` when the key is always top-level (no dots) — it skips dot-path parsing and is faster in hot loops.
- `AddEffectBloom` / `AddEffectShine` / `AddMaskShape` are v4-only filter-based effects. They return arrays of created effects instead of the input.
</gotchas>
</actions_and_utilities>
