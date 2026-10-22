<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: tweens

<tweens>
Use this when animating properties over time in Phaser 4: tweens, tween chains, easing functions, stagger, yoyo, repeat, callbacks, number tweens, and the TweenManager.

<quick_start>
`this.tweens` is the scene's `TweenManager`, available in every Scene. `add()` creates a tween, adds it to the manager, and starts playback immediately.

```js
// In a Scene's create() method:
const logo = this.add.image(100, 300, 'logo');

// Move the logo to x:600 over 2 seconds
this.tweens.add({
  targets: logo,
  x: 600,
  duration: 2000,
  ease: 'Power2'
});
```
</quick_start>

<core_concepts>
Tween lifecycle: Created -> Active (`onActive`) -> Start Delayed (`delay`) -> Playing (`onStart`, `onUpdate` per frame) -> Yoyo/Repeat (`onYoyo`, `onRepeat`) -> Loop (`onLoop`) -> Complete (`onComplete`, then auto-destroyed unless `persist: true`).

Tweens are fire-and-forget. They auto-destroy after completion, so you do not need to store a reference unless you want to control them later. Set `persist: true` to keep a tween alive for replay via `tween.play()` / `tween.restart()` — you must then call `tween.destroy()` yourself when done.

`targets` accepts a single object, an array of objects, or a function returning either. Targets are usually Game Objects but can be any JS object with numeric properties. A tween will not manipulate any property whose name begins with an underscore.

Property values support several forms:
```js
this.tweens.add({
  targets: sprite,
  x: 400,                  // absolute value
  y: '-=100',              // relative (subtract 100 from current)
  rotation: '+=3.14',      // relative (add to current)
  alpha: { value: 0, duration: 300, ease: 'Cubic.easeIn' },  // per-property config
  scale: [0.5, 1.5, 1],    // array: interpolates through values over duration
  angle: function (target, key, value, targetIndex, totalTargets, tween) {
    return targetIndex * 90;   // function: called once per target
  },
  duration: 1000
});
```
Array values use linear interpolation by default; override with the `interpolation` config (`'linear'`, `'bezier'`, `'catmull'`).
</core_concepts>

<common_patterns>
Multiple properties with per-property config:
```js
this.tweens.add({
  targets: this.enemy,
  x: { value: 600, duration: 1500, ease: 'Bounce.easeOut' },
  y: { value: 200, duration: 1000, ease: 'Power2' },
  alpha: { value: 0.5, duration: 500, delay: 1000 }
});
```

Yoyo and repeat:
```js
this.tweens.add({
  targets: this.coin,
  y: '-=50',
  duration: 600,
  ease: 'Sine.easeInOut',
  yoyo: true,         // returns to start value after reaching end
  hold: 200,          // pause 200ms at the end value before yoyo-ing back
  repeat: -1,         // -1 = infinite, 0 = play once, 1 = play twice, etc.
  repeatDelay: 300    // pause 300ms before each repeat
});
```
`repeat` is per-property (a `repeat` of 1 plays the property twice total). `loop` restarts the entire tween from scratch. Use `repeat` for property-level looping, `loop` for tween-level looping.

Stagger offsets a value across multiple targets via `this.tweens.stagger()`:
```js
delay: this.tweens.stagger(100)                      // 100ms between each target
delay: this.tweens.stagger(200, { from: 'center' })  // from center outward
delay: this.tweens.stagger([0, 1000])                // distribute 0-1000ms across targets
delay: this.tweens.stagger(500, { grid: [10, 6], from: 'center', ease: 'Cubic.easeOut' })
```
StaggerConfig: `start` (offset), `ease`, `from` (`'first'`/`'center'`/`'last'`/index), `grid` ([w, h]).

A TweenChain plays tweens in sequence — each starts after the previous completes:
```js
this.tweens.chain({
  targets: this.player,
  tweens: [
    { x: 300, duration: 1000, ease: 'Power2' },
    { y: 500, duration: 800, ease: 'Bounce.easeOut' },
    { scale: 2, duration: 500 },
    { alpha: 0, duration: 400 }
  ],
  loop: 1,          // loop the entire chain once (plays twice total)
  loopDelay: 500,
  onComplete: function () { }
});
```
Chain-level config supports `loop`, `loopDelay`, `completeDelay`, `paused`, `persist`, and chain-level callbacks. Use `chain.add(tweenConfigs)` to append dynamically.

Callbacks and events:
```js
this.tweens.add({
  targets: sprite,
  x: 600,
  duration: 2000,
  // All callbacks receive (tween, targets, ...params)
  onStart: function (tween, targets) { },
  onUpdate: function (tween, targets) { },   // per-property, per-target, per-frame
  onComplete: function (tween, targets) { },
  onCompleteParams: ['extra', 'args'],
  callbackScope: this
});

// Event emitter style (tweens extend EventEmitter)
tween.on('complete', function (tween, targets) { });
```

Number tweens have no target — they tween between two numeric values:
```js
const counter = this.tweens.addCounter({
  from: 0,
  to: 100,
  duration: 2000,
  ease: 'Linear',
  onUpdate: function (tween) {
    const value = tween.getValue();   // 0 ... 100
  }
});
```

Controlling and killing tweens:
```js
const tween = this.tweens.add({ targets: sprite, x: 600, duration: 2000, persist: true });
tween.pause();   tween.resume();   tween.stop();   tween.restart();
tween.seek(1000);            // seek to 1000ms (suppresses events by default)
tween.complete();            // immediately complete; fires onComplete
tween.updateTo('x', 800);    // change end value mid-tween

this.tweens.killAll();
this.tweens.killTweensOf(sprite);
this.tweens.isTweening(sprite);
this.tweens.pauseAll();   this.tweens.resumeAll();
this.tweens.setGlobalTimeScale(0.5);
```
</common_patterns>

<easing_functions>
Easing names are case-insensitive. Use the string name in the `ease` config property.

Power aliases: `Power0` = `Linear`, `Power1` = `Quad.easeOut`, `Power2` = `Cubic.easeOut`, `Power3` = `Quart.easeOut`, `Power4` = `Quint.easeOut`.

Each type supports `.easeIn`, `.easeOut`, `.easeInOut` variants; the bare name defaults to Out.
Types: `Quad`, `Cubic`, `Quart`, `Quint`, `Sine`, `Expo`, `Circ`, `Elastic`, `Back`, `Bounce`.
Special: `Linear` (no easing), `Stepped` (discrete steps — `easeParams: [numSteps]`).
Custom: `ease: function (t) { return t * t; }` where `t` is 0 to 1.
</easing_functions>

<gotchas>
- Underscore properties are ignored. A tween skips any property whose name starts with `_`.
- Tweens auto-destroy. Using a stored reference after completion may fail. Set `persist: true` to keep it alive, then `destroy()` it yourself when done.
- `repeat` vs `loop`: `repeat` is per-property; `loop` restarts the entire tween. A `repeat` of 1 means the property plays twice total.
- `loop: -1` means `onComplete` never fires. Use `completeAfterLoop()` to end an infinite tween gracefully.
- Seeking suppresses events unless you pass `true` as the third argument to `tween.seek()`.
- Stagger only has a visible effect with multiple targets.
- Destroyed targets: a tween completes early if its target has `isDestroyed === true`. Clean up tweens before destroying objects they reference.
- Manager and tween time scales multiply: effective speed is `managerTimeScale * tweenTimeScale`. Either at 0 freezes the tween.
- Duration cannot be zero — it is clamped to a minimum of 0.01ms.
- TweenChain `targets` are inherited by child tweens unless a child specifies its own.
</gotchas>
</tweens>
