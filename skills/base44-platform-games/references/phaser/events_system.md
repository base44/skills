<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Phaser 4: events system

<events_system>
Use this when working with the Phaser 4 event system: EventEmitter, scene events, game events, custom events, and event-driven communication between systems. Phaser uses the EventEmitter pattern (via eventemitter3) throughout — every major system (Game, Scene, Input, Loader, Cameras, Sound, Tweens, Physics, Textures, Animations) is or contains an EventEmitter. Events use lowercase string keys, and Phaser provides named constants for all built-in events to avoid typos.

<quick_start>
```js
// on — listen for an event (persists until removed)
this.input.on('pointerdown', (pointer) => {
    console.log('clicked at', pointer.x, pointer.y);
});

// once — listen for an event, auto-removes after first fire
this.events.once('shutdown', () => {
    console.log('scene shutting down');
});

// off — remove a specific listener (must pass same function reference)
const handler = (pointer) => { /* ... */ };
this.input.on('pointerdown', handler);
this.input.off('pointerdown', handler);

// emit — fire a custom event with arguments
this.events.emit('player-died', this.player, this.score);

// removeAllListeners — remove all listeners for an event (or all events)
this.events.removeAllListeners('player-died');
this.events.removeAllListeners(); // all events
```

Always prefer named constants over raw strings to prevent typos:
```js
this.events.on(Phaser.Scenes.Events.UPDATE, (time, delta) => { /* runs every frame */ });
this.input.on(Phaser.Input.Events.POINTER_DOWN, (pointer) => { /* pointer pressed */ });
this.game.events.on(Phaser.Core.Events.BLUR, () => { /* browser tab lost focus */ });
```
</quick_start>

<core_concepts>
`Phaser.Events.EventEmitter` extends eventemitter3 and adds `shutdown()` and `destroy()` (both call `removeAllListeners()`). Full inherited API: `on(event, fn, context?)` (persistent listener, returns `this`), `addListener` (alias for `on`), `once(event, fn, context?)` (one-time, auto-removed after first fire), `off(event, fn?, context?, once?)` (remove listener — must pass the same `fn` reference), `removeListener` (alias for `off`), `removeAllListeners(event?)` (remove all for one event, or all events), `emit(event, ...args)` (returns `true` if it had listeners), `listeners(event)`, `listenerCount(event)`, `eventNames()`.

Every built-in event is a lowercase string exported as a constant; the constant name maps predictably to the string:
```js
Phaser.Scenes.Events.UPDATE        // 'update'
Phaser.Scenes.Events.PRE_UPDATE    // 'preupdate'
Phaser.Scenes.Events.SHUTDOWN      // 'shutdown'
Phaser.Core.Events.BOOT            // 'boot'
Phaser.Input.Events.POINTER_DOWN   // 'pointerdown'
```

Some events use a key-suffix pattern for per-key listening — append the key/type to the prefix constant:
```js
// Loader: listen for a specific file completing — string value: 'filecomplete-image-logo'
this.load.on(Phaser.Loader.Events.FILE_KEY_COMPLETE + 'image-logo', (key, type, data) => {});
// Animations: listen for a specific animation completing — string value: 'animationcomplete-walk'
sprite.on(Phaser.Animations.Events.ANIMATION_COMPLETE_KEY + 'walk', () => {});
// Textures: listen for a specific texture being added — string value: 'addtexture-myTexture'
this.textures.on(Phaser.Textures.Events.ADD_KEY + 'myTexture', () => {});
```

The third argument to `on`/`once` sets `this` inside the callback (defaults to the emitter). Arrow functions ignore this argument since they capture lexical `this`:
```js
this.input.on('pointerdown', function (pointer) {
    this.cameras.main.shake(100); // 'this' = scene (passed as 3rd arg)
}, this);
this.input.on('pointerdown', (pointer) => {
    this.cameras.main.shake(100); // 'this' = enclosing scope (scene in create)
});
```
</core_concepts>

<common_patterns>
Scene lifecycle. Frame loop order: `preupdate` -> `update` -> `Scene.update()` -> `postupdate` -> `prerender` -> `render`. Always clean up on shutdown to prevent leaks on scene restart:
```js
create() {
    this.events.on(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.events.off(Phaser.Scenes.Events.UPDATE, this.onUpdate, this);
        this.input.off('pointerdown', this.onPointerDown, this);
    });
}
```

Game-level events fire on the Game instance, shared across all scenes (accessed via `this.game.events`):
```js
this.game.events.on(Phaser.Core.Events.BLUR, this.handleBlur, this);
this.game.events.on(Phaser.Core.Events.VISIBLE, this.handleVisible, this);
```

Inter-scene communication has three idioms:
```js
// METHOD 1: game.events — a global event bus accessible from all scenes
this.game.events.emit('score-changed', this.score);                              // Scene A
this.game.events.on('score-changed', (score) => { this.scoreText.setText(score); }); // Scene B

// METHOD 2: this.registry — a shared DataManager across all scenes
this.registry.set('score', 100);                                                  // Scene A
this.registry.events.on('changedata-score', (parent, value, previousValue) => {   // Scene B
    this.scoreText.setText(value);
});

// METHOD 3: Direct scene access via ScenePlugin
this.scene.get('UIScene').events.emit('update-health', hp);
```

Custom events carry arbitrary data arguments:
```js
this.events.emit('player-died', this.player, { lives: this.lives });
this.events.on('player-died', (player, data) => {
    console.log('Lives remaining:', data.lives);
});
```

A standalone EventEmitter can be created for your own buses:
```js
const bus = new Phaser.Events.EventEmitter();
bus.on('inventory-changed', (items) => { console.log(items.length); });
bus.emit('inventory-changed', this.inventory);
```
</common_patterns>

<event_namespaces>
**Scene Events** (`Phaser.Scenes.Events`) — emitter `this.events`: `BOOT` `'boot'`, `READY` `'ready'`, `START` `'start'`, `CREATE` `'create'`, `PRE_UPDATE` `'preupdate'`, `UPDATE` `'update'`, `POST_UPDATE` `'postupdate'`, `PRE_RENDER` `'prerender'`, `RENDER` `'render'`, `PAUSE` `'pause'`, `RESUME` `'resume'`, `SLEEP` `'sleep'`, `WAKE` `'wake'`, `SHUTDOWN` `'shutdown'` (stopping, may restart), `DESTROY` `'destroy'` (permanent), `ADDED_TO_SCENE` `'addedtoscene'`, `REMOVED_FROM_SCENE` `'removedfromscene'`, plus transition events (`TRANSITION_INIT`/`START`/`OUT`/`COMPLETE`/`WAKE`).

**Game Events** (`Phaser.Core.Events`) — emitter `this.game.events`: `BOOT` `'boot'`, `READY` `'ready'`, `SYSTEM_READY` `'systemready'`, `PRE_STEP`/`STEP`/`POST_STEP`, `PRE_RENDER`/`POST_RENDER`, `PAUSE`/`RESUME`, `BLUR` `'blur'` (tab lost focus), `FOCUS` `'focus'`, `HIDDEN`/`VISIBLE` (Page Visibility API), `CONTEXT_LOST` `'contextlost'` (WebGL context lost), `DESTROY` `'destroy'`.

**Input Events** (`Phaser.Input.Events`) — emitter `this.input` (scene-level) or interactive GameObjects. Scene-level pointer: `POINTER_DOWN`/`UP`/`MOVE`/`OVER`/`OUT`, `POINTER_WHEEL` `'wheel'`, `POINTER_DOWN_OUTSIDE`/`UP_OUTSIDE`. Scene-level gameobject: `GAMEOBJECT_DOWN`/`UP`/`MOVE`/`OVER`/`OUT`/`WHEEL`. Per-GameObject (emitted on the GameObject, requires `setInteractive()`): `GAMEOBJECT_POINTER_DOWN` `'pointerdown'` etc. Drag (on `this.input` and on GameObjects): `DRAG_START`/`DRAG`/`DRAG_END`/`DRAG_ENTER`/`DRAG_OVER`/`DRAG_LEAVE`/`DROP`. Other: `GAME_OUT`, `GAME_OVER`, `POINTERLOCK_CHANGE`.

**Loader Events** (`Phaser.Loader.Events`) — emitter `this.load`: `ADD` `'addfile'`, `START`, `PROGRESS` (0-1), `FILE_LOAD` `'load'`, `FILE_PROGRESS`, `FILE_COMPLETE`, `FILE_KEY_COMPLETE` `'filecomplete-'` (append `type-key`), `FILE_LOAD_ERROR` `'loaderror'`, `POST_PROCESS`, `COMPLETE`.

**Animation Events** (`Phaser.Animations.Events`) — emitter individual sprites or `this.anims`: `ADD_ANIMATION`, `REMOVE_ANIMATION`, `PAUSE_ALL`/`RESUME_ALL`, `ANIMATION_START`/`RESTART`/`REPEAT`/`UPDATE`/`COMPLETE`/`STOP`, `ANIMATION_COMPLETE_KEY` `'animationcomplete-'` (append key).

**Camera Events** (`Phaser.Cameras.Scene2D.Events`) — emitter individual camera (e.g. `this.cameras.main`); each effect has a START/COMPLETE pair: `DESTROY`, `FADE_IN_START`/`COMPLETE`, `FADE_OUT_START`/`COMPLETE`, `FLASH_START`/`COMPLETE`, `PAN_START`/`COMPLETE`, `ROTATE_START`/`COMPLETE`, `SHAKE_START`/`COMPLETE`, `ZOOM_START`/`COMPLETE`, `FOLLOW_UPDATE`, `PRE_RENDER`/`POST_RENDER`.

**Sound Events** (`Phaser.Sound.Events`) — emitter individual sounds or `this.sound`. Per-sound: `PLAY`/`PAUSE`/`RESUME`/`STOP`/`COMPLETE`/`LOOP`/`LOOPED`/`SEEK`/`MUTE`/`VOLUME`/`RATE`/`DETUNE`/`PAN`/`DECODED`/`DESTROY`. SoundManager-level (on `this.sound`): `GLOBAL_MUTE`/`GLOBAL_VOLUME`/`GLOBAL_RATE`/`GLOBAL_DETUNE`, `PAUSE_ALL`/`RESUME_ALL`/`STOP_ALL`, `DECODED_ALL`, `UNLOCKED`.

**Tween Events** (`Phaser.Tweens.Events`) — emitter individual tweens: `TWEEN_ACTIVE`/`START`/`UPDATE`/`YOYO`/`REPEAT`/`LOOP`/`PAUSE`/`RESUME`/`COMPLETE`/`STOP`.

**Arcade Physics Events** (`Phaser.Physics.Arcade.Events`) — emitter `this.physics.world`: `COLLIDE`, `OVERLAP`, `TILE_COLLIDE`, `TILE_OVERLAP`, `WORLD_BOUNDS`, `WORLD_STEP`, `PAUSE`, `RESUME`.

**Texture Events** (`Phaser.Textures.Events`) — emitter `this.textures`: `ADD` `'addtexture'`, `ADD_KEY` `'addtexture-'` (append key), `REMOVE`/`REMOVE_KEY`, `LOAD` `'onload'`, `ERROR` `'onerror'`, `READY`.

**GameObject Events** (`Phaser.GameObjects.Events`) — emitter individual GameObjects: `ADDED_TO_SCENE`, `REMOVED_FROM_SCENE`, `DESTROY`. Video GameObjects also emit `VIDEO_PLAY`/`PLAYING`/`COMPLETE`/`LOOP`/`STOP`/`CREATED`/`ERROR`/`LOCKED`/`UNLOCKED`/`METADATA`/`SEEKED`/`SEEKING`/`STALLED`/`TEXTURE`/`UNSUPPORTED`.

**Time Events** (`Phaser.Time.Events`) — emitter `Phaser.Time.TimerEvent` instances: `COMPLETE` `'complete'` (TimerEvent finishes all repeats).
</event_namespaces>

<gotchas>
- **Memory leaks from unremoved listeners** — the most common bug. `on()` does not auto-remove, so if a scene restarts via `scene.restart()`, old listeners persist and each restart adds duplicates. Always clean up in a `SHUTDOWN` handler, or use `once()` for events you only need fired once:
```js
// BAD: leaks listeners on every scene restart
create() { this.input.on('pointerdown', this.shoot, this); }

// GOOD: clean up in shutdown
create() {
    this.input.on('pointerdown', this.shoot, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.input.off('pointerdown', this.shoot, this);
    });
}
```

- **shutdown vs destroy.** `SHUTDOWN` fires when a scene stops but can restart later — clean up listeners here. `DESTROY` fires when a scene is permanently removed — use for final cleanup. A scene restart fires `SHUTDOWN` then `START` then `CREATE`; it does NOT fire `DESTROY`.

- **Context binding.** The third argument to `on`/`once` sets `this` inside the callback. Without it, `this` defaults to the emitter, not the scene. Pass `this` with regular functions, or use arrow functions (which capture lexical `this`).

- **`off()` requires exact references.** It only works if you pass the exact same function reference (and context) used with `on()`. Anonymous or inline arrow functions cannot be removed — store a reference or use a class method:
```js
// BAD: arrow function cannot be removed later
this.events.on('update', () => { this.doStuff(); });
// GOOD: named method can be removed
this.events.on('update', this.onUpdate, this);
this.events.off('update', this.onUpdate, this);
```

- **`once()` auto-removes** the listener after first fire — no manual cleanup needed.

- **Input event hierarchy.** Input events fire in order: (1) `GAMEOBJECT_POINTER_DOWN` on the GameObject, (2) `GAMEOBJECT_DOWN` on `this.input`, (3) `POINTER_DOWN` on `this.input`. Higher handlers can stop propagation.

- **Game events vs scene events.** `this.game.events` and `this.events` are different emitters. Game events fire once per game loop tick across all scenes; scene events fire per-scene. Listeners on `game.events` persist across scene restarts — always clean them up on `SHUTDOWN`:
```js
create() {
    this.game.events.on(Phaser.Core.Events.BLUR, this.onBlur, this);
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
        this.game.events.off(Phaser.Core.Events.BLUR, this.onBlur, this);
    });
}
```
</gotchas>
</events_system>
