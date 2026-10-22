<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: animations

<animations>
Use this when creating or controlling sprite animations in Phaser 4: spritesheets, atlases, the AnimationManager and AnimationState, play/stop/chain, frame callbacks, and animation events.

<quick_start>
Load a spritesheet in `preload`, define a global animation in `create` via `this.anims.create`, then play it on a sprite.

```js
// In preload -- load a spritesheet
this.load.spritesheet('explosion', 'explosion.png', {
    frameWidth: 64,
    frameHeight: 64
});

// In create -- define a global animation
this.anims.create({
    key: 'explode',
    frames: this.anims.generateFrameNumbers('explosion', { start: 0, end: 11 }),
    frameRate: 24,
    repeat: 0
});

// Play it on a sprite
const sprite = this.add.sprite(400, 300, 'explosion');
sprite.play('explode');
```
</quick_start>

<core_concepts>
Phaser has two distinct animation objects. The **AnimationManager** (`this.anims` in a Scene, or `this.game.anims`) is a global singleton owned by the Game — it creates and stores animation definitions, available across every Scene. The **AnimationState** (`sprite.anims`) is a per-sprite instance that controls playback on one Game Object. An `Animation` is a sequence of `AnimationFrame` objects plus timing data, created via `this.anims.create(config)` (global) or `sprite.anims.create(config)` (local to one sprite).

When `sprite.anims.play(key)` is called, it first checks for a local animation with that key, then falls back to the global AnimationManager — local takes priority. Use local for sprite-specific animations; use global when shared across sprites.

```js
// Global animation -- available to all sprites
this.anims.create({ key: 'walk', frames: 'player_walk', frameRate: 12, repeat: -1 });

// Local animation -- only on this sprite
sprite.anims.create({ key: 'walk', frames: 'npc_walk', frameRate: 10, repeat: -1 });

// This plays the LOCAL version because local takes priority
sprite.play('walk');
```

Duration vs frameRate priority: if both are null it defaults to 24 fps; if only `duration` is set, frameRate is calculated as `totalFrames / (duration / 1000)`; if `frameRate` is set (even alongside duration), frameRate wins and duration is derived. Sprite shorthand methods `sprite.play()`, `sprite.playReverse()`, `sprite.chain()`, `sprite.stop()` wrap their `sprite.anims.*` equivalents.
</core_concepts>

<common_patterns>
Spritesheet animation uses `generateFrameNumbers` (numeric frame indices). Config keys: `start` (default 0), `end` (default -1 = last frame), `first` (single frame to prepend), `frames` (explicit array, overrides start/end).
```js
this.load.spritesheet('dude', 'dude.png', { frameWidth: 32, frameHeight: 48 });

// All frames
this.anims.create({
    key: 'run',
    frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 7 }),
    frameRate: 10,
    repeat: -1
});

// Custom frame sequence
this.anims.create({
    key: 'idle',
    frames: this.anims.generateFrameNumbers('dude', { frames: [0, 1, 2, 1] }),
    frameRate: 6,
    repeat: -1
});
```

Atlas animation uses `generateFrameNames` (string frame names). Config keys: `prefix`, `suffix`, `start`, `end`, `zeroPad` (left-pad numbers to length with zeros), `frames` (explicit, overrides range). Calling `generateFrameNames(key)` with no config returns all frames.
```js
this.load.atlas('gems', 'gems.png', 'gems.json');

this.anims.create({
    key: 'ruby_sparkle',
    frames: this.anims.generateFrameNames('gems', {
        prefix: 'ruby_',
        start: 1,
        end: 6,
        zeroPad: 4   // produces ruby_0001 through ruby_0006
    }),
    frameRate: 12,
    repeat: -1
});
```

Pass a texture key string as `frames` to use all frames from that texture, sorted numerically by default (`sortFrames: false` disables sorting):
```js
this.anims.create({ key: 'walk', frames: 'player_walk', frameRate: 12, repeat: -1 });
```

Yoyo and repeat — when `yoyo` is true the animation plays forward then reverses, and the full cycle counts as one play. `repeat: -1` means forever.
```js
this.anims.create({
    key: 'pulse',
    frames: this.anims.generateFrameNumbers('orb', { start: 0, end: 5 }),
    frameRate: 10,
    yoyo: true,
    repeat: -1,
    repeatDelay: 500   // ms pause between each repeat cycle
});
```

Chaining is per-sprite — chained animations start after `animationcomplete` or `animationstop`. An animation with `repeat: -1` never completes, so call `stop()` to trigger the chain.
```js
sprite.play('attack');
sprite.chain('idle');                        // play idle after attack completes
sprite.chain(['fall', 'land', 'idle']);       // chain multiple
sprite.anims.chain();                        // clear the chain queue
```

Reverse playback: `sprite.playReverse('walk')` sets `forward = false`/`inReverse = true`; `sprite.anims.reverse()` toggles direction mid-playback.

Play variants:
```js
sprite.play('walk', true);                   // ignoreIfPlaying = true
sprite.anims.playAfterDelay('walk', 1000);   // play after 1s delay
sprite.anims.playAfterRepeat('walk', 2);     // play after current anim repeats 2x
```

Animation mixing adds a transition delay between two specific animations, set globally on the manager. Mixes apply only with `sprite.play()`, not `playAfterDelay`/`playAfterRepeat`.
```js
this.anims.addMix('idle', 'walk', 200);
this.anims.addMix('walk', 'idle', 300);

sprite.play('idle');
sprite.play('walk');   // 200ms mix delay applied automatically

this.anims.removeMix('idle', 'walk');   // remove specific pair
this.anims.removeMix('idle');           // remove all mixes for 'idle'
```

Pause, resume, and stop. All stop methods fire `animationstop` (not `animationcomplete`), and chained animations trigger after stop.
```js
sprite.anims.pause();                 // pause per-sprite
sprite.anims.resume();                // resume per-sprite
this.anims.pauseAll();                // global pause
this.anims.resumeAll();               // global resume

sprite.anims.stop();                  // stop immediately
sprite.anims.stopAfterDelay(2000);    // stop after 2 seconds
sprite.anims.stopAfterRepeat(1);      // stop after 1 more repeat
sprite.anims.stopOnFrame(frame);      // stop when a specific frame is reached
```

Animation events all share the signature `(animation, frame, gameObject, frameKey)`. Available: `animationstart`, `animationcomplete`, `animationcomplete-{key}`, `animationupdate`, `animationstop`, `animationrepeat`, `animationrestart`. Manager-level events on `this.anims`: `addanimation`, `removeanimation`, `pauseall`, `resumeall`.
```js
sprite.on('animationcomplete', (anim, frame, gameObject, frameKey) => {
    console.log('completed:', anim.key);
});

// Key-specific complete -- only fires for the named animation
sprite.on('animationcomplete-explode', (anim, frame, gameObject, frameKey) => {
    gameObject.destroy();
});

// Frame-level callback via animationupdate
sprite.on('animationupdate', (anim, frame, gameObject, frameKey) => {
    if (anim.key === 'attack' && frame.index === 4) {
        this.checkHit(gameObject);
    }
});
```

Per-frame duration (ms) is added on top of the base msPerFrame:
```js
this.anims.create({
    key: 'combo',
    frames: [
        { key: 'fighter', frame: 'punch1', duration: 50 },
        { key: 'fighter', frame: 'kick', duration: 200 },   // hold longer
        { key: 'fighter', frame: 'recover', duration: 100 }
    ],
    frameRate: 24
});
```

Visibility, random start, and timeScale:
```js
this.anims.create({
    key: 'appear', frames: 'sparkle', frameRate: 12,
    showOnStart: true,      // sprite.visible = true when anim starts (after delay)
    hideOnComplete: true,   // sprite.visible = false when anim completes
    showBeforeDelay: true   // show first frame immediately even during delay
});

this.anims.create({
    key: 'ambient', frames: 'fire', frameRate: 10, repeat: -1,
    randomFrame: true       // each sprite begins on a different frame
});

sprite.anims.timeScale = 2;                         // 2x speed
sprite.play({ key: 'walk', timeScale: 0.5 });       // half speed via config
this.anims.globalTimeScale = 0.5;                    // affects ALL animations
```

Staggered playback across a group — each sprite starts after the previous (pass `staggerFirst: false` to skip the delay on the first):
```js
const enemies = this.add.group({ key: 'enemy', repeat: 9 });
this.anims.staggerPlay('walk', enemies.getChildren(), 100);
```

JSON export/import and existence checks:
```js
const data = this.anims.toJSON();
this.anims.fromJSON(data);        // import
this.anims.fromJSON(data, true);  // pass true to clear existing first

if (!this.anims.exists('walk')) {
    this.anims.create({ key: 'walk', frames: 'player_walk', frameRate: 12, repeat: -1 });
}
```

Modifying animation frames at runtime:
```js
const anim = this.anims.get('walk');
anim.addFrame(this.anims.generateFrameNumbers('player', { start: 8, end: 10 }));   // append
anim.addFrameAt(this.anims.generateFrameNumbers('player', { frames: [5] }), 2);    // insert at index
anim.removeFrame(anim.frames[3]);   // remove a frame object
anim.removeFrameAt(0);              // remove frame at index
```

Aseprite support creates animations from Aseprite tags:
```js
this.load.aseprite('paladin', 'paladin.png', 'paladin.json');
// In create:
this.anims.createFromAseprite('paladin');               // all tags
this.anims.createFromAseprite('paladin', ['walk']);      // specific tags only
sprite.play('walk');                                     // play by tag name
```
</common_patterns>

<gotchas>
1. Animations are global by default. `this.anims.create()` registers across all Scenes. Do not recreate in every Scene — it logs a warning and returns the existing one.
2. `repeat: -1` never fires `animationcomplete`. Use `stop()` to end infinite animations; listen for `animationstop` instead.
3. `frameRate` beats `duration`. If both are set, frameRate wins. Set only `duration` (leave frameRate null) to control total length.
4. Per-frame `duration` is additive — added on top of base msPerFrame, not a replacement.
5. `play()` stops the current animation (fires `animationstop`). Use `play(key, true)` to skip if already playing.
6. Mix delays only work with `play()`. `playAfterDelay`/`playAfterRepeat` bypass mixes.
7. Local animations override global. Same key on a sprite's local map takes priority.
8. Sprite shorthand methods (`sprite.play()`, `sprite.playReverse()`, `sprite.chain()`, `sprite.stop()`) wrap `sprite.anims.*`.
9. Chained anims fire after stop too. Clear the queue with `sprite.anims.chain()` before stopping if unwanted.
10. `generateFrameNumbers` end=-1 means last frame. The `__BASE` frame is excluded automatically.
</gotchas>
</animations>
