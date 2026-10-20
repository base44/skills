<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Phaser 4: time and timers

<time_and_timers>
Use this when working with timers and time-based events in Phaser 4: the Clock plugin, TimerEvents, delayed calls, looping timers, Timeline event sequencing, pausing time, time scaling, and delta time.

<quick_start>
`this.time` is the scene's `Clock` instance (registered as the `'Clock'` plugin under the key `time`). It creates and manages `TimerEvent` objects that fire callbacks based on game time.

```js
// In a Scene's create() method:

// One-shot delayed call (fires once after 1 second)
this.time.delayedCall(1000, () => {
    console.log('One second later');
});

// Repeating timer (fires 5 times, once every 500ms)
this.time.addEvent({
    delay: 500,
    callback: () => { console.log('tick'); },
    repeat: 4   // 4 repeats = 5 total fires
});

// Infinite loop timer
this.time.addEvent({
    delay: 1000,
    callback: this.spawnEnemy,
    callbackScope: this,
    loop: true
});
```
</quick_start>

<core_concepts>
The Clock (`this.time`) is a Scene-level plugin that tracks game time and updates all of its TimerEvents each frame. Key properties: `now` (current time in ms, equivalent to `time` passed to the scene `update` method), `startTime` (timestamp when the scene started), `timeScale` (multiplier applied to delta time, default `1` — above 1 speeds up all timers, below 1 slows them down, `0` freezes time), and `paused` (when `true`, no TimerEvents are updated). The Clock listens to `PRE_UPDATE` (to flush pending additions/removals) and `UPDATE` (to tick active events). It is automatically shut down and destroyed with the scene.

A TimerEvent accumulates elapsed time each frame: `elapsed += delta * clock.timeScale * event.timeScale`. When `elapsed >= delay`, the callback fires. After all repeats are exhausted the event is removed from the Clock on the next frame. Config keys: `delay`, `repeat`, `loop`, `callback`, `callbackScope`, `args`, `timeScale`, `startAt`, `paused`. TimerEvent and Clock do not emit EventEmitter events — timers use the `callback` property directly.

A Timeline (`this.add.timeline`) is a sequencer for scheduling actions at specific points in time. Unlike the Clock (which manages independent timers), a Timeline runs a linear sequence of events keyed by absolute or relative timestamps:

```js
const timeline = this.add.timeline([
    { at: 0,    run: () => { /* immediate */ } },
    { at: 1000, run: () => { /* at 1s */ } },
    { at: 2500, tween: { targets: sprite, alpha: 0, duration: 500 } }
]);
timeline.play();
```

Timelines always start **paused** — you must call `play()` to start them. They are created via the GameObjectFactory and destroyed automatically when the scene shuts down.
</core_concepts>

<common_patterns>
Delayed call shorthand (fires once, no repeat):
```js
this.time.delayedCall(2000, () => {
    this.scene.start('GameOver');
});
```

Repeating timer with a finite count (`repeat: 9` means 10 total fires — 1 initial + 9 repeats):
```js
const timer = this.time.addEvent({
    delay: 200,
    callback: this.fireBullet,
    callbackScope: this,
    repeat: 9
});

timer.getRepeatCount();       // repeats remaining
timer.getOverallProgress();   // 0..1 across all repeats
```

Infinite loop (`repeat: -1` is equivalent to `loop: true`):
```js
const spawner = this.time.addEvent({
    delay: 3000,
    callback: this.spawnWave,
    callbackScope: this,
    loop: true
});

spawner.remove();          // stop it later, or spawner.paused = true to pause
```

First-fire shortcut with `startAt` (pre-fills elapsed so the first fire happens sooner):
```js
// First fire after 100ms, then every 2s
this.time.addEvent({
    delay: 2000,
    callback: this.heartbeat,
    callbackScope: this,
    loop: true,
    startAt: 1900
});
```

Stopping and removing timers:
```js
const timer = this.time.addEvent({ delay: 1000, loop: true, callback: fn });

timer.remove();            // schedules removal next frame, silently expires
timer.remove(true);        // fires callback one last time, then expires
this.time.removeEvent(timer);
this.time.removeAllEvents();
```

Pausing and resuming — pause the entire Clock (`this.time.paused = true`) to freeze all timers, or pause a single timer (`timer.paused = true`).

Time scaling (slow motion / fast forward) — effective scale is `clock.timeScale * event.timeScale`:
```js
this.time.timeScale = 0.5;  // slow all timers in this scene to half speed
timer.timeScale = 2;        // speed up a single timer to 2x (net 1x here)
```

Reading timer state:
```js
timer.getProgress();              // 0..1 for current iteration
timer.getOverallProgress();       // 0..1 across all repeats
timer.getElapsed();               // ms elapsed this iteration
timer.getElapsedSeconds();        // seconds elapsed this iteration
timer.getRemaining();             // ms until next fire
timer.getRemainingSeconds();      // seconds until next fire
timer.getOverallRemaining();      // ms until final fire
timer.getOverallRemainingSeconds(); // seconds until final fire
timer.getRepeatCount();           // repeats left
```

A completed `TimerEvent` can be reset with a new config and re-added to the Clock — `reset()` alone does not schedule it:
```js
const timer = this.time.addEvent({
    delay: 1000, callback: this.phase1, callbackScope: this, repeat: 2
});

// Later, after it completes, reconfigure and re-add:
timer.reset({
    delay: 500, callback: this.phase2, callbackScope: this, repeat: 4
});
this.time.addEvent(timer);  // must re-add; reset() does not schedule it
```
</common_patterns>

<timelines>
Timelines excel at sequencing mixed actions — callbacks, tweens, sounds, property sets, and custom events:
```js
const timeline = this.add.timeline([
    {
        at: 0,
        run: () => { this.title.setAlpha(1); },
        sound: 'intro'
    },
    {
        at: 2000,
        tween: { targets: this.title, y: 100, duration: 1000 },
        sound: { key: 'whoosh', config: { volume: 0.5 } }
    },
    {
        at: 4000,
        set: { alpha: 0 },
        target: this.title,
        event: 'INTRO_DONE'
    }
]);

timeline.on('INTRO_DONE', (target) => { /* custom event */ });
timeline.on('complete', (tl) => { /* all events ran */ });
timeline.play();
```

Relative timing — `at` is absolute ms from timeline start (default 0); `in` is an offset from the current `elapsed` time (useful when adding events to a running timeline); `from` is an offset from the previous event's start time. Priority: `from` overrides `in`, which overrides `at`. Each `from` is relative to the previous event's resolved time, not the previous `from` value, and events are processed in array order.
```js
const timeline = this.add.timeline([
    { at: 1000, run: stepOne },     // absolute: 1s from start
    { from: 500, run: stepTwo },    // relative: 500ms after previous (1.5s)
    { from: 1000, run: stepThree }  // relative: 1000ms after previous (2.5s)
]);
```

Conditional events — if the `if` callback returns `false`, the event is skipped (marked complete but its actions are not executed):
```js
{ at: 5000, if: () => this.player.health > 0, run: () => { this.showBonusRound(); } }
```

Looping — the `loop` callback on a TimelineEventConfig fires on repeat iterations (not the first run):
```js
timeline.repeat().play();      // infinite loop
timeline.repeat(3).play();     // loop 3 additional times (4 total runs)
timeline.repeat(false).play(); // no looping
```

Control:
```js
timeline.pause();      // freezes elapsed counter and pauses spawned tweens
timeline.resume();     // resumes elapsed counter and unpauses spawned tweens
timeline.stop();       // sets paused=true, complete=true
timeline.reset();      // elapsed=0, all events marked incomplete, starts playing
timeline.isPlaying();  // true if not paused and not complete
timeline.getProgress();// 0..1 based on events completed / total events
timeline.timeScale = 2;   // double speed (does NOT affect spawned tweens)
```

TimelineEventConfig keys: `at` / `in` / `from` (timing), `run` (callback), `loop` (repeat-iteration callback), `if` (guard, return `false` to skip), `event` (emitted on the Timeline with signature `(target)`), `target` (scope for `run`/`loop`/`if` and target for `set`), `set` (key-value pairs applied to `target`), `tween` (config or instance created when the event fires), `sound` (key or `{ key, config }`), `once` (remove this event after it fires), `stop` (stop the entire timeline when this event fires). The Timeline `'complete'` event fires when all events have run.

Full cutscene example:
```js
class CutsceneScene extends Phaser.Scene {
    create() {
        const timeline = this.add.timeline([
            { at: 0,    run: () => { console.log('Start!'); } },
            { at: 1000, tween: { targets: this.player, x: 400, duration: 500, ease: 'Power2' } },
            { at: 1500, sound: 'doorOpen' },
            { at: 2000, set: { visible: true }, target: this.door },
            { from: 500, run: () => { console.log('Relative timing'); } },
            { at: 5000, event: 'cutsceneDone', stop: true }
        ]);

        timeline.on('cutsceneDone', () => { this.scene.start('GameScene'); });
        timeline.play();
    }
}
```
</timelines>

<gotchas>
- **repeat vs total fires.** `repeat: 4` means 5 total callback invocations (1 initial + 4 repeats). A common off-by-one source.
- **Zero delay with repeat throws.** A `TimerEvent` with `delay: 0` and any repeat/loop throws `'TimerEvent infinite loop created via zero delay'`.
- **Timelines start paused.** You must call `timeline.play()` after creation. Forgetting this is a frequent mistake.
- **Timeline timeScale does not affect tweens.** It only scales the timeline's own elapsed counter; tweens created by the timeline run at their own speed. Set tween `timeScale` separately or use the TweenManager.
- **`once` events are removed permanently.** Timeline events with `once: true` are spliced out after firing and will not reappear on `reset()` or when looping.
- **Timer additions are deferred.** `addEvent()` pushes to a pending list processed in `preUpdate`; the timer is not active until the next frame. You can pass an existing `TimerEvent` to `addEvent()`, but it must not be in a completed state.
- **Clock paused vs timeScale 0.** Both freeze timers, but `paused = true` skips the update loop entirely while `timeScale = 0` still runs it with zero delta. Prefer `paused` for a full freeze.
- **callbackScope default.** If you omit `callbackScope`, the TimerEvent itself becomes `this` inside the callback, not the scene. Use arrow functions or pass `callbackScope: this` explicitly.
- **`timer.reset()` does not re-add to Clock.** Calling `timer.reset(config)` reinitializes the timer but does not schedule it — you must call `this.time.addEvent(timer)` again.
- **Scene pause pauses the Timeline.** When a scene is paused (`scene.pause()`), the Timeline's update loop stops too, since Timeline updates are driven by the scene's update step.
</gotchas>
</time_and_timers>
