<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: scenes

<scenes>
Use this when working with Phaser 4 scenes: scene lifecycle methods, transitions, parallel scenes, scene communication, sleeping, pausing, restarting, and the SceneManager.

<quick_start>
Each Scene has its own lifecycle (init, preload, create, update), its own injected systems (`this.add`, `this.input`, `this.cameras`, etc.), and can be started, stopped, paused, slept, or run in parallel with other Scenes. The ScenePlugin (`this.scene`) controls all multi-scene orchestration.

```js
// Minimal scene with all lifecycle methods
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
    }

    init(data) {
        // Called first. Receives data passed via scene.start('GameScene', { level: 1 })
        this.level = data.level || 1;
    }

    preload() {
        // Called after init. Load assets here.
        this.load.image('logo', 'assets/logo.png');
    }

    create(data) {
        // Called after preload completes. Set up game objects.
        // 'data' is the same object passed to init.
        this.add.image(400, 300, 'logo');
    }

    update(time, delta) {
        // Called every frame while scene is RUNNING.
        // time: current time (ms), delta: ms since last frame (smoothed)
    }
}

const config = {
    width: 800,
    height: 600,
    scene: [GameScene]
};

const game = new Phaser.Game(config);
```
</quick_start>

<core_concepts>
Scene lifecycle states (constants on `Phaser.Scenes`): PENDING (0, registered but not started) -> INIT (1, `scene.init(data)`) -> START (2, `Systems.start()`, emits `start` and `ready`) -> LOADING (3, `scene.preload()` + loader runs) -> CREATING (4, `scene.create(data)`, same `data` as init) -> RUNNING (5, `scene.update(time, delta)` each frame, renders) -> PAUSED (6, no update but still renders) -> SLEEPING (7, no update, no render, state preserved) -> SHUTDOWN (8, emits `shutdown`, can restart) -> DESTROYED (9, fully destroyed, cannot restart).

Flow with no preload: `init()` -> `create()` -> `update()` loop. Flow with preload: `init()` -> `preload()` -> loader runs -> `create()` -> `update()` loop.

Scene-injected properties come via the InjectionMap. Global managers (shared across all scenes): `this.game`, `this.renderer`, `this.anims`, `this.cache`, `this.plugins`, `this.registry` (shared data manager), `this.scale`, `this.sound`, `this.textures`. Scene-specific systems (unique per scene): `this.sys` (never overwrite), `this.events` (scene event emitter), `this.cameras`, `this.add` (factory: creates and adds to display list), `this.make` (creator: creates but does NOT add), `this.scene` (ScenePlugin), `this.children` (display list), `this.lights`, `this.data` (scene data manager), `this.input`, `this.load`, `this.time`, `this.tweens`, `this.physics` (if configured), `this.matter` (if configured).

Rename injected properties via scene config:
```js
const config = {
    key: 'MyScene',
    map: {
        add: 'makeStuff',   // this.makeStuff instead of this.add
        load: 'loader'      // this.loader instead of this.load
    }
};
```

The `SceneManager` is a game-level system. Do not call its methods directly -- use `this.scene` (the ScenePlugin) instead. It maintains an ordered array of scenes (determines render/update order) and processes a queue of operations at the start of each game step. All ScenePlugin methods are queued, not immediate -- they execute next frame.
</core_concepts>

<common_patterns>
Switching between scenes:
```js
// start() -- shuts down current scene, starts target (target gets full lifecycle)
this.scene.start('LevelTwo', { score: 100 });

// restart() -- shuts down and restarts the same scene
this.scene.restart({ score: 0 });

// switch() -- sleeps current scene, starts/wakes target (current state preserved)
this.scene.switch('PauseMenu', { fromScene: 'GameScene' });

// transition() -- animated transition with duration
this.scene.transition({
    target: 'LevelTwo',
    duration: 1000,
    moveAbove: true,        // render target above this scene
    sleep: false,           // false = stop this scene (default), true = sleep it
    remove: false,          // true = remove this scene from manager after transition
    allowInput: false,      // allow input on this scene during transition
    data: { score: 100 },
    onUpdate: function (progress) { /* progress: 0 to 1 over duration */ }
});
```

Running scenes in parallel:
```js
// launch() -- starts another scene in parallel (does NOT stop current scene)
this.scene.launch('UIScene', { lives: 3 });

// run() -- smart launcher: starts if not running, resumes if paused, wakes if sleeping
this.scene.run('UIScene', { lives: 3 });

// Control render order of parallel scenes
this.scene.bringToTop('UIScene');      // render last (on top)
this.scene.sendToBack('Background');   // render first (behind)
this.scene.moveAbove('GameScene', 'UIScene');  // UIScene renders above GameScene
this.scene.moveBelow('GameScene', 'Background');
this.scene.moveUp('UIScene');
this.scene.moveDown('UIScene');
this.scene.swapPosition('SceneA', 'SceneB');
```

Passing data between scenes:
```js
// Method 1: Pass data via start/launch/restart/switch/wake/run -- available in both init(data) and create(data)
this.scene.start('LevelScene', { level: 5, score: 1200 });

// Method 2: Access data later via sys.getData()
const data = this.sys.getData(); // returns settings.data

// Method 3: Global registry (shared across ALL scenes)
this.registry.set('playerHP', 100);
const hp = this.registry.get('playerHP'); // 100, from any scene

// Method 4: Scene-specific data manager
this.data.set('localValue', 42);
this.data.get('localValue'); // 42

// Method 5: Direct scene reference
const otherScene = this.scene.get('OtherScene');
otherScene.somePublicProperty;

// Method 6: Events on the global registry
this.registry.events.on('changedata-playerHP', (parent, value, previousValue) => { /* react */ });
this.registry.set('playerHP', 50); // triggers the event in any listening scene
```

Pausing, sleeping, stopping:
```js
this.scene.pause();               // stops update loop, still renders
this.scene.resume('OtherScene', { message: 'welcome back' });
this.scene.sleep();               // no update AND no render, state preserved
this.scene.wake('OtherScene', { data: 'here' });
this.scene.stop();                // full shutdown, clears display list and timers

// State checks
this.scene.isActive('OtherScene');
this.scene.isPaused('OtherScene');
this.scene.isSleeping('OtherScene');
this.scene.isVisible('OtherScene');

// Control visibility/activity independently
this.scene.setActive(false);          // pause
this.scene.setActive(true);           // resume
this.scene.setVisible(false);         // hide but still update
this.scene.setVisible(true);
```

Adding and removing scenes at runtime:
```js
// add(key, sceneConfig, autoStart, data)
this.scene.add('BonusLevel', BonusLevelScene, false, { someData: true });
this.scene.remove('BonusLevel');   // destroyed, cannot be restarted

// Spawn multiple instances from one class
for (let i = 0; i < 5; i++) {
    this.scene.add('Level' + i, new LevelScene('Level' + i), false);
}
```

Cross-scene event communication -- one scene emits, another listens, decoupled. (In Base44 games, score/HUD readouts belong in the React overlay via EventBus — see the screen_space_ui rules; use this pattern when a second Phaser scene genuinely needs to react to gameplay, e.g. a background or effects layer. The UIScene below illustrates the mechanics.)
```js
// GameScene emits events
class GameScene extends Phaser.Scene {
    collectCoin(coin) {
        coin.destroy();
        this.events.emit('addScore', 10);
    }
}

// UIScene listens (launched in parallel with { active: true })
class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: 'UIScene', active: true });
    }

    create() {
        this.score = 0;
        this.scoreText = this.add.text(10, 10, 'Score: 0');
        const gameScene = this.scene.get('GameScene');
        gameScene.events.on('addScore', (points) => {
            this.score += points;
            this.scoreText.setText('Score: ' + this.score);
        });
    }
}
```

Configuring plugins per scene:
```js
super({ key: 'MinimalScene', plugins: [] });  // disable all default plugins (no load/tweens/time/input/data/lights)
super({ key: 'PreloadScene', plugins: ['Loader'] });  // only this.load available
```

Scene config in constructor -- per-scene physics, loader path, or files preloaded before `preload()`:
```js
class Level1 extends Phaser.Scene {
    constructor() {
        super({
            key: 'Level1',
            physics: { arcade: { debug: true, gravity: { y: 200 } } },
            loader: { path: 'assets/levels/1/' },
            // 'pack' loads files before preload() runs -- good for progress bar assets
            pack: { files: [{ type: 'image', key: 'bar', url: 'loaderBar.png' }] }
        });
    }
}
```

Safely restarting scenes -- reset state in `init()`, not the constructor. The constructor runs once; `init()` runs every start:
```js
class GameScene extends Phaser.Scene {
    constructor() {
        super('GameScene');
        // BAD: this.gameOver = false; -- only set once, not on restart
    }

    init() {
        // GOOD: reset state every time the scene starts
        this.gameOver = false;
        this.score = 0;
    }

    create() {
        // Clean up on shutdown to avoid stale references
        this.events.once('shutdown', () => {
            this.enemies = [];
        });
    }
}
```
</common_patterns>

<events>
All events are emitted on `this.events` (the scene-specific EventEmitter). Listen via `this.events.on('eventname', callback)`.

Lifecycle events: `'boot'` (sys; once, when scene first instantiated), `'start'` (sys; systems start), `'ready'` (sys, data; after start, for user code), `'create'` (scene; after `create()` runs, scene now RUNNING), `'preupdate'` / `'update'` / `'postupdate'` (time, delta; each frame), `'prerender'` / `'render'` (renderer; around scene render).

State-change events: `'pause'` (sys, data), `'resume'` (sys, data), `'sleep'` (sys, data), `'wake'` (sys, data), `'shutdown'` (sys, data), `'destroy'` (sys).

Transition events: `'transitionout'` (targetScene, duration; on source scene), `'transitioninit'` (fromScene, duration; on target during init), `'transitionstart'` (fromScene, duration; on target after create), `'transitionwake'` (fromScene, duration; on target if woken from sleep), `'transitioncomplete'` (scene; on target when done).

Game object events: `'addedtoscene'` (gameObject, scene), `'removedfromscene'` (gameObject, scene).
</events>

<gotchas>
- **Operations are queued, not immediate.** `this.scene.start('X')` happens at the next SceneManager update, not synchronously. Do not rely on the target scene's state within the same frame.
- **`start()` shuts down the calling scene.** It stops the current scene and starts X. To keep both running, use `launch()` or `run()`.
- **`switch()` sleeps, `start()` shuts down.** `switch()` preserves the current scene in memory (sleep); `start()` triggers a full shutdown. Sleeping scenes keep their events and references live.
- **`switch()` restarts a paused scene, never resumes it.** If you need resume behavior, use `run()` instead.
- **Paused scenes still render.** `pause()` only stops the update loop. Use `sleep()` to stop both update and render.
- **Do not overwrite `this.sys`.** It will break everything.
- **`this.scene.start()` with no key restarts the current scene** -- equivalent to `this.scene.restart()`.
- **Sleeping scenes still receive events from other scenes.** If Scene A is sleeping but Scene B emits on the global registry, Scene A's listeners still fire. Be careful with active listeners on sleeping scenes.
- **Scene render order = array order.** Scenes later in the array render on top. Use `bringToTop()`, `sendToBack()`, `moveAbove()`, `moveBelow()` to control layering. Scenes update in reverse order (top updates first, gets input priority) but render in forward order (appears on top).
- **`shutdown` vs `destroy`.** Shutdown puts a scene into hibernation (can restart); destroy permanently removes it. Listen to `'shutdown'` to free resources recreated on restart, `'destroy'` for final cleanup.
- **`this.physics` and `this.matter` are only available if the physics system is configured** -- otherwise undefined.
- **The `create` event fires AFTER the `create()` method returns**, and after the status changes to RUNNING. Listen for it if you need post-create setup.
- **Reset state in `init()`, not the constructor.** The constructor runs once; `init()` runs every start/restart.
- **Clean up on `shutdown`** via `this.events.once('shutdown', ...)` to clear arrays holding game objects and remove external listeners. Stale references to destroyed objects cause errors on restart.
</gotchas>
</scenes>
