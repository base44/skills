<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: particles

<particles>
Use this when creating particle effects in Phaser 4: ParticleEmitter creation and configuration, emitter op value formats, gravity wells, emission and death zones, flow vs burst modes, following game objects, and particle callbacks.

<quick_start>
```js
// In a Scene's create() method:

// Basic continuous emitter (flow mode)
const emitter = this.add.particles(400, 300, 'flares', {
    frame: 'red',
    speed: 200,
    lifespan: 2000,
    scale: { start: 1, end: 0 },
    alpha: { start: 1, end: 0 },
    gravityY: 150
});

// One-shot burst (explode mode)
const burst = this.add.particles(400, 300, 'flares', {
    frame: 'blue',
    speed: { min: 100, max: 300 },
    lifespan: 1000,
    scale: { start: 0.5, end: 0 },
    emitting: false   // don't auto-start
});
burst.explode(20);    // emit 20 particles at once
```
</quick_start>

<core_concepts>
`ParticleEmitter` extends `GameObject` and is added directly to the display list — it is both a positionable/scalable/maskable game object and the emitter itself. There is no separate manager; `this.add.particles()` returns a `ParticleEmitter`.
```js
this.add.particles(x, y, texture, config);
// x, y: world position (both optional, default 0)
// texture: string key or Texture instance
// config: ParticleEmitterConfig object (optional, can call setConfig later)
```
Mixins (AlphaSingle, BlendMode, Depth, Lighting, Mask, RenderNodes, ScrollFactor, Texture, Transform, Visible) mean you can call `setPosition()`, `setScale()`, `setDepth()`, `setBlendMode()`, `setMask()`, `setScrollFactor()`, etc.

A `Particle` is a lightweight, internally-pooled object owned by its emitter — you never create them manually. Key properties: `x`, `y`, `velocityX/Y`, `accelerationX/Y`, `scaleX/Y`, `alpha`, `angle`, `rotation`, `tint`, `life` (total ms), `lifeCurrent` (remaining ms), `lifeT` (0-1 normalized), `bounce`, `delayCurrent`, `holdCurrent`.

Most config properties (speed, scale, alpha, angle, x, y, etc.) accept flexible EmitterOp value formats:
```js
x: 400                                        // static value
x: [100, 200, 300, 400]                       // random pick from array
x: { min: 100, max: 700 }                     // random float in range
x: { min: 100, max: 700, int: true }          // random integer
x: { random: [100, 700] }                     // random integer shorthand
scale: { start: 0, end: 1 }                   // ease over lifetime (default linear)
scale: { start: 0, end: 1, ease: 'bounce.out' }  // custom ease
scale: { start: 4, end: 0.5, random: true }   // random start, ease to end
x: { values: [50, 500, 200, 800], interpolation: 'catmull' }  // interpolation
x: { steps: 32, start: 0, end: 576 }          // stepped sequential
x: { steps: 32, start: 0, end: 576, yoyo: true }  // stepped with yoyo
x: {                                           // custom callbacks
    onEmit: (particle, key, t, value) => value,
    onUpdate: (particle, key, t, value) => value
}
x: (particle, key, t, value) => value + 50    // emit-time callback shorthand
```
Emit-only properties (no onUpdate): `angle`, `delay`, `hold`, `lifespan`, `quantity`, `speedX`, `speedY`. Emit + Update (support start/end and onUpdate): `accelerationX/Y`, `alpha`, `bounce`, `maxVelocityX/Y`, `moveToX/Y`, `rotate`, `scaleX/Y`, `tint`, `x`, `y`.

Flow vs Explode: in flow mode (`frequency >= 0`) the emitter emits `quantity` particles every `frequency` ms — default is `frequency: 0` (every frame) with `emitting: true`. In explode mode (`frequency = -1`) it emits a batch all at once, then stops.
```js
emitter.flow(100, 5);           // 5 particles every 100ms
emitter.flow(100, 5, 50);       // auto-stop after 50 total
emitter.explode(30, 200, 400);  // burst 30 at position
emitter.explode(30);            // burst at emitter position
```
</core_concepts>

<common_patterns>
Scale, alpha, and color over lifetime:
```js
this.add.particles(400, 300, 'spark', {
    lifespan: 2000, speed: 100,
    scale: { start: 1, end: 0, ease: 'power2' },
    alpha: { start: 1, end: 0, ease: 'cubic.in' }
});
```

Color interpolation — the `color` array interpolates over lifetime and overrides `tint`:
```js
this.add.particles(400, 300, 'spark', {
    lifespan: 2000, speed: 100, scale: { start: 0.5, end: 0 },
    color: [0xfacc22, 0xf89800, 0xf83600, 0x9f0404], colorEase: 'quad.out'
});
```

Tinting:
```js
this.add.particles(400, 300, 'spark', { tint: 0xff0000 });                           // static
this.add.particles(400, 300, 'spark', { tint: { start: 0xffffff, end: 0xff0000 } }); // over lifetime
```

Gravity wells apply inverse-square gravitational force, pulling (or repelling with negative `power`) particles toward a point:
```js
const emitter = this.add.particles(400, 300, 'spark', {
    speed: 100, lifespan: 4000, scale: { start: 0.4, end: 0 }, quantity: 2
});
const well = emitter.createGravityWell({ x: 400, y: 300, power: 2, epsilon: 100, gravity: 50 });
well.x = 300;
well.power = -1;  // negative = repel

// Or create manually and add
const well2 = new Phaser.GameObjects.Particles.GravityWell(500, 200, 3, 100, 50);
emitter.addParticleProcessor(well2);
emitter.removeParticleProcessor(well2);
```
GravityWell properties: `x`, `y` (world position), `power` (force strength, negative to repel), `epsilon` (min distance for force calc, default 100), `gravity` (gravitational constant, default 50), `active`. Constructor: `new GravityWell(x, y, power, epsilon, gravity)` or `new GravityWell({ x, y, power, epsilon, gravity })`.

Emission zones (random) — a RandomZone spawns particles at random positions within a shape. The source needs a `getRandomPoint(point)` method; all Phaser geometry classes support it, or provide a custom source:
```js
this.add.particles(400, 300, 'spark', {
    speed: 50, lifespan: 2000,
    emitZone: { type: 'random', source: new Phaser.Geom.Circle(0, 0, 100) }
});
emitter.addEmitZone({
    type: 'random',
    source: {
        getRandomPoint: (point) => {
            const a = Math.random() * Math.PI * 2;
            point.x = Math.cos(a) * 100;
            point.y = Math.sin(a) * 50;
            return point;
        }
    }
});
```

Emission zones (edge) — an EdgeZone places particles sequentially along shape edges. The source needs `getPoints(quantity, stepRate)`; Curves, Paths, and all geometry shapes support it:
```js
this.add.particles(400, 300, 'spark', {
    lifespan: 1500, speed: 20,
    emitZone: {
        type: 'edge',
        source: new Phaser.Geom.Circle(0, 0, 150),
        quantity: 48,     // number of points on edge (use 0 with stepRate instead)
        yoyo: false,      // reverse direction at ends
        seamless: true    // remove duplicate endpoint
    }
});
emitter.addEmitZone({ type: 'edge', source: geom, quantity: 50, yoyo: false, seamless: true });
```
Multiple emission zones: pass an array to `emitZone` or call `addEmitZone()` repeatedly. Zones iterate in sequence; the `total` property controls how many particles emit before rotating to the next zone (-1 = never rotate).
```js
this.add.particles(400, 300, 'spark', {
    emitZone: [
        { type: 'random', source: new Phaser.Geom.Circle(0, 0, 50) },
        { type: 'random', source: new Phaser.Geom.Circle(200, 0, 50) }
    ]
});
```

Death zones kill particles on entering (or leaving) a region. The source needs a `contains(x, y)` method:
```js
// Kill particles entering a rectangle
this.add.particles(400, 100, 'spark', {
    speed: 200, lifespan: 5000, gravityY: 100,
    deathZone: { type: 'onEnter', source: new Phaser.Geom.Rectangle(300, 400, 200, 50) }
});
// Kill particles leaving a circle (confine to area)
this.add.particles(400, 300, 'spark', {
    speed: 100, lifespan: 5000,
    deathZone: { type: 'onLeave', source: new Phaser.Geom.Circle(400, 300, 150) }
});
emitter.addDeathZone({ type: 'onEnter', source: { contains: (x, y) => x > 600 && y > 400 } });
```

Following a game object:
```js
const player = this.add.sprite(100, 100, 'player');
const emitter = this.add.particles(0, 0, 'spark', { speed: 50, lifespan: 800, scale: { start: 0.5, end: 0 } });
emitter.startFollow(player);                       // follow position
emitter.startFollow(player, 10, -20);              // with offset
emitter.startFollow(player, 0, 0, true);           // track visibility too
emitter.stopFollow();
// Or via config:
this.add.particles(0, 0, 'spark', { follow: player, followOffset: { x: 0, y: -20 } });
```

Particle callbacks and iteration:
```js
const emitter = this.add.particles(400, 300, 'spark', {
    speed: 100, lifespan: 2000,
    emitCallback: (particle, emitter) => { /* on emit */ },
    deathCallback: (particle) => { /* on death */ }
});
emitter.onParticleEmit((particle, emitter) => { /* ... */ });
emitter.onParticleDeath((particle) => { /* ... */ });
emitter.forEachAlive((particle, emitter) => { /* particle.x, particle.lifeT */ });
```

Duration, stopAfter, and advance (pre-warm):
```js
this.add.particles(400, 300, 'spark', { speed: 100, duration: 3000 });  // auto-stop after 3s; alive particles finish
this.add.particles(400, 300, 'spark', { speed: 100, stopAfter: 50 });    // emit exactly 50 then stop
this.add.particles(400, 300, 'spark', { speed: 100, lifespan: 2000, advance: 2000 }); // fast-forward 2s on creation
// Or manually: emitter.fastForward(2000, 50);
```

Particle bounds (bounce):
```js
this.add.particles(400, 300, 'spark', {
    speed: 200, lifespan: 5000, bounce: 0.8,
    bounds: { x: 100, y: 100, width: 600, height: 400 },
    collideLeft: true, collideRight: true, collideTop: true, collideBottom: true
});
// Or: emitter.addParticleBounds(100, 100, 600, 400);
```

Texture frames and animations:
```js
this.add.particles(400, 300, 'flares', { frame: ['red', 'green', 'blue'] });           // random frame per particle
this.add.particles(400, 300, 'flares', { frame: { frames: ['red', 'green', 'blue'], cycle: true, quantity: 4 } }); // sequential cycling
this.add.particles(400, 300, 'explosion', { anim: 'explode_anim', lifespan: 1000 });   // play anim over lifetime
this.add.particles(400, 300, 'sheet', { anim: { anims: ['fire', 'smoke'], cycle: false, quantity: 1 } }); // multiple anims, random
```

Sorting:
```js
this.add.particles(400, 300, 'spark', { sortProperty: 'y', sortOrderAsc: true });
// Or: sortCallback: (a, b) => a.y - b.y
```

Custom particle processor — extend `ParticleProcessor` for per-particle logic each frame via `update(particle, delta, step, t)`:
```js
class WindProcessor extends Phaser.GameObjects.Particles.ParticleProcessor {
    constructor (windX, windY) { super(0, 0); this.windX = windX; this.windY = windY; }
    update (particle, delta, step, t) {
        particle.velocityX += this.windX * step;
        particle.velocityY += this.windY * step;
    }
}
emitter.addParticleProcessor(new WindProcessor(0.5, 0));
```

Custom particle class — extend `Particle`, override `update`, and set via `particleClass`:
```js
class TrailParticle extends Phaser.GameObjects.Particles.Particle {
    update (delta, step, processors) {
        const result = super.update(delta, step, processors);
        this.alpha = this.lifeT;  // custom: alpha matches life progress
        return result;            // must return true if particle is still alive
    }
}
this.add.particles(400, 300, 'spark', { particleClass: TrailParticle, speed: 100, lifespan: 2000 });
```

Key ParticleEmitter methods — Lifecycle: `start(advance?, duration?)`, `stop(kill?)`, `pause()`, `resume()`, `flow(frequency, count?, stopAfter?)`, `explode(count?, x?, y?)`, `emitParticleAt(x?, y?, count?)`, `emitParticle(count?, x?, y?)`, `fastForward(time, delta?)`. Config: `setConfig`, `updateConfig`. Following: `startFollow`, `stopFollow`. Zones: `addEmitZone`/`removeEmitZone`/`clearEmitZones`, `addDeathZone`/`removeDeathZone`/`clearDeathZones`. Processors: `createGravityWell`, `addParticleProcessor`, `removeParticleProcessor`, `getProcessors`. Bounds: `addParticleBounds`. Callbacks/iteration: `onParticleEmit`, `onParticleDeath`, `killAll`, `forEachAlive`, `forEachDead`. Counts: `getAliveParticleCount`, `getDeadParticleCount`, `getParticleCount`, `atLimit`, `reserve`. Property setters: `setParticleSpeed`, `setParticleScale`, `setParticleGravity`, `setParticleAlpha`, `setParticleTint`, `setParticleLifespan`, `setEmitterAngle`, `setQuantity`, `setFrequency`, `setRadial`, `setEmitterFrame`, `setAnim`. Sorting: `setSortProperty`, `setSortCallback`, `depthSort`. Utility: `getBounds`, `overlap`.
</common_patterns>

<events>
All events are emitted on the `ParticleEmitter` instance:
- `'start'` `(emitter)` — `start()` is called and the emitter begins emitting
- `'stop'` `(emitter)` — `stop()` is called, or a duration/stopAfter limit is reached
- `'complete'` `(emitter)` — the final alive particle dies after the emitter has stopped
- `'explode'` `(emitter, particle)` — `explode()` is called
- `'deathzone'` `(emitter, particle, zone)` — a death zone kills a particle

```js
emitter.on('stop', (emitter) => { /* stopped emitting */ });
emitter.on('complete', (emitter) => { /* all particles dead */ });
emitter.on('deathzone', (emitter, particle, zone) => { /* ... */ });
```
</events>

<gotchas>
- No ParticleEmitterManager — removed in v3.60. `this.add.particles()` returns a `ParticleEmitter` directly.
- `speed` vs `speedX`/`speedY`: `speed` sets speedX and deactivates speedY (radial mode). `speedX`/`speedY` switches to point mode (`radial: false`).
- `scale` vs `scaleX`/`scaleY`: `scale` applies to scaleX and deactivates scaleY. Use both for non-uniform scaling.
- `color` overrides `tint` — they're mutually exclusive; the color array wins.
- `moveToX`/`moveToY`: both must be set to activate; overrides `angle` and `speed`.
- `emitting` vs `active`: `emitting: false` stops new particles but alive ones still update; `active: false` freezes the entire emitter.
- `stop` vs `complete`: `'stop'` fires when emission stops; `'complete'` fires when the last alive particle dies.
- `frequency: 0` means emit every frame (max rate), not "never." Use `emitting: false` to prevent emission.
- `frequency: -1` puts the emitter in explode mode — it won't flow automatically; use `explode()` for bursts.
- `hold` keeps a particle visible and frozen for the given ms after its lifespan expires, before it dies — useful for trail/lingering effects.
- `advance` fast-forwards by simulating the given ms on creation so particles are already visible on the first frame.
- `reserve(count)` (or `reserve` in config) pre-allocates particle objects upfront, avoiding GC spikes during gameplay.
- Zone source method requirements: RandomZone needs `getRandomPoint(point)`, EdgeZone needs `getPoints(quantity, stepRate)`, DeathZone needs `contains(x, y)`.
- `maxParticles` limits total objects (not alive count); use `maxAliveParticles` for the visible limit.
- The emitter needs a valid texture key; use the `frame` config for multi-frame textures.
</gotchas>
</particles>
