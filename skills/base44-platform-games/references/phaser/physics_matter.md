<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: physics matter

<physics_matter>
Use this when working with Matter.js physics in Phaser 4: rigid bodies, compound bodies, constraints (joints/springs), composites, sensors, collision filtering, pointer dragging, tilemap integration, and debug rendering.

<quick_start>
Enable Matter physics in the game config, then create bodies via `this.matter.add`.

```js
class GameScene extends Phaser.Scene {
    create() {
        // Matter sprite (dynamic, has animation support)
        this.player = this.matter.add.sprite(400, 200, 'player');
        this.player.setBounce(0.5);
        this.player.setFriction(0.05);

        // Matter image (dynamic, no animation)
        const box = this.matter.add.image(300, 100, 'crate');

        // Static body from raw shape
        this.matter.add.rectangle(400, 580, 800, 40, { isStatic: true });

        // Enable pointer dragging on all bodies
        this.matter.add.mouseSpring();

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-5);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(5);
        }
        if (this.cursors.up.isDown && this.player.body.velocity.y > -0.1) {
            this.player.setVelocityY(-10);
        }
    }
}

// Enable Matter physics in game config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'matter',
        matter: {
            gravity: { y: 1 },
            enableSleeping: true,
            debug: true,
            setBounds: true    // walls around canvas edges
        }
    },
    scene: GameScene
};

const game = new Phaser.Game(config);
```
</quick_start>

<core_concepts>
The `MatterPhysics` class is the scene-level plugin (`this.matter`). Key properties: `this.matter.add` (Factory for creating bodies, constraints, and Game Objects, auto-added to world), `this.matter.world` (the `World` instance managing the engine, bounds, and debug rendering; extends EventEmitter), `this.matter.body` / `bodies` / `composite` / `composites` / `constraint` (direct references to Matter.js modules for low-level use), and `this.matter.bodyBounds` (helper for aligning bodies by visual bounds).

The `World` (`this.matter.world`) exposes `engine` (the `MatterJS.Engine`), `localWorld` (the `MatterJS.World` composite containing all bodies/constraints), `enabled` (false pauses simulation), `autoUpdate` (true = engine updates each game step), and `walls` (`{ left, right, top, bottom }` boundary wall bodies, or null). World config passed under `physics.matter`: `gravity` (default `{ x: 0, y: 1 }`, set `false` to disable), `setBounds` (`true` or `{ x, y, width, height, thickness, left, right, top, bottom }`), `enableSleeping` (allow bodies to sleep when at rest), `positionIterations` (default 6), `velocityIterations` (default 4), `constraintIterations` (default 2), `timing.timeScale` (1 normal, 0 freezes, 0.5 slow-motion), `autoUpdate` (default true), `debug` (`true` or a MatterDebugConfig object), `runner` (use `runner.fps` for fixed timestep).

Phaser provides two physics-aware Game Object classes plus a function to add physics to any Game Object: `Phaser.Physics.Matter.Sprite` (extends Sprite with all Matter components, supports animations, created via `this.matter.add.sprite(x, y, key, frame, options)`); `Phaser.Physics.Matter.Image` (extends Image, no animation, lighter weight, via `this.matter.add.image(...)`); and `MatterGameObject(world, gameObject, options)` (injects all Matter components into any existing Game Object, via `this.matter.add.gameObject(mySprite, options)`). Both MatterSprite and MatterImage default to a rectangle body matching the texture size — pass `options.shape` to override.

All Matter Game Objects have these component methods mixed in: Velocity (`setVelocity`, `setVelocityX/Y`, `getVelocity`, `setAngularVelocity`, `setAngularSpeed`, ...), Force (`applyForce`, `applyForceFrom`, `thrust`, `thrustLeft/Right/Back`), Bounce (`setBounce` — restitution 0-1), Friction (`setFriction(value, air?, fstatic?)`, `setFrictionAir`, `setFrictionStatic`), Mass (`setMass`, `setDensity`, `centerOfMass`), Gravity (`setIgnoreGravity`), Sensor (`setSensor`, `isSensor`), Static (`setStatic`, `isStatic`), Sleep (`setToSleep`, `setAwake`, `setSleepThreshold`, `setSleepEvents`), Collision (`setCollisionCategory`, `setCollisionGroup`, `setCollidesWith`, `setOnCollide`, `setOnCollideEnd`, `setOnCollideActive`, `setOnCollideWith`), and SetBody (`setRectangle`, `setCircle`, `setPolygon`, `setTrapezoid`, `setBody`, `setExistingBody`).
</core_concepts>

<common_patterns>
Runtime setup and world configuration:
```js
this.matter.world.setGravity(0, 2);          // x, y, scale (default 0.001)
this.matter.world.disableGravity();
this.matter.world.setBounds(0, 0, 1600, 1200, 64, true, true, true, true);

this.matter.set60Hz();                        // fixed timestep
this.matter.world.autoUpdate = false;         // then manual: this.matter.step(16.666);
this.matter.pause();
this.matter.resume();
```

Creating Matter sprites and images:
```js
const player = this.matter.add.sprite(200, 300, 'hero');  // default rect body matching texture

// Custom body shapes via options.shape
const ball = this.matter.add.image(400, 100, 'ball', null, { shape: { type: 'circle', radius: 24 } });
const hex = this.matter.add.sprite(300, 100, 'hex', null, { shape: { type: 'polygon', sides: 6, radius: 32 } });
const ship = this.matter.add.sprite(400, 200, 'ship', null, {
    shape: { type: 'fromVerts', verts: '0 0 40 0 40 40 20 60 0 40' }
});

// PhysicsEditor shape data
const shapes = this.cache.json.get('shapes');
const enemy = this.matter.add.sprite(500, 200, 'enemy', null, { shape: shapes.enemy });

// Add Matter physics to an existing Game Object
const existingSprite = this.add.sprite(100, 100, 'box');
this.matter.add.gameObject(existingSprite, { restitution: 0.8 });
```

Body config options (`MatterBodyConfig`) — pass as the `options` parameter to any factory method or Matter Game Object: `label`, `isStatic`, `isSensor`, `angle` (radians), `timeScale`, `ignoreGravity`, `ignorePointer`, `density` (0.001 default, auto-calculates mass), `mass`, `restitution` (bounce 0-1), `friction` (0-1), `frictionAir`, `frictionStatic`, `slop` (overlap tolerance), `chamfer` (`{ radius: 5 }` for rounded corners), `collisionFilter: { category, mask, group }`, `onCollideCallback` / `onCollideEndCallback` / `onCollideActiveCallback`, and `shape` (for Game Objects).

Velocity, forces, and thrust — note forces use very small values (`0.01`-`0.1`) and velocity is in units per step, not pixels/sec:
```js
sprite.setVelocity(3, -5);
sprite.setVelocityX(-3);
sprite.setAngularVelocity(0.05);
const vel = sprite.getVelocity();   // { x, y }

sprite.applyForce({ x: 0.05, y: 0 });
sprite.applyForceFrom(position, { x: 0.02, y: -0.02 });

sprite.thrust(0.05);       // forward (relative to body angle)
sprite.thrustBack(0.05);
sprite.thrustLeft(0.03);
sprite.thrustRight(0.03);

// Batch operations via this.matter
this.matter.setVelocity(arrayOfBodies, 2, -3);
this.matter.applyForce(arrayOfBodies, { x: 0.01, y: 0 });
```

Constraints (joints and springs) — `constraint(bodyA, bodyB, length?, stiffness?, options?)`, aliases `joint` / `spring`:
```js
const rigid = this.matter.add.constraint(bodyA, bodyB, 100, 1);        // rigid joint
const spring = this.matter.add.constraint(bodyA, bodyB, 200, 0.02, { damping: 0.05 });
const pin = this.matter.add.constraint(bodyA, bodyB, 0, 0.9);          // pin joint

// World constraint (one body pinned to a world point)
this.matter.add.worldConstraint(body, 50, 0.5, { pointA: { x: 400, y: 100 } });

// Offset attachment points
this.matter.add.constraint(bodyA, bodyB, 80, 1, {
    pointA: { x: 20, y: 0 },   // offset from bodyA center
    pointB: { x: -20, y: 0 }   // offset from bodyB center
});

this.matter.getConstraintLength(constraint);      // distance between anchor points
this.matter.world.removeConstraint(constraint);
```

Composites (stacks, chains, soft bodies):
```js
const stack = this.matter.add.stack(100, 100, 5, 4, 10, 10, (x, y) => {
    return this.matter.bodies.rectangle(x, y, 40, 40);
});
const imageStack = this.matter.add.imageStack('crate', null, 100, 100, 5, 4, 5, 5);
this.matter.add.chain(stack, 0.5, 0, -0.5, 0, { stiffness: 0.7 });
this.matter.add.mesh(stack, 5, 4, true, { stiffness: 0.5 });   // grid with constraints + cross braces
this.matter.add.softBody(200, 100, 5, 5, 0, 0, true, 10, { friction: 0.1 }, { stiffness: 0.5 });

// Pre-built composites
this.matter.add.newtonsCradle(300, 50, 5, 20, 200);
this.matter.add.car(400, 300, 120, 30, 25);
```

Compound bodies combine multiple shapes into one body — the first part is the parent. Parts share position, angle, and velocity, and constraints must target the parent, not the parts:
```js
const partA = this.matter.bodies.rectangle(0, 0, 60, 20);
const partB = this.matter.bodies.circle(0, -30, 15);
const compoundBody = this.matter.body.create({ parts: [partA, partB] });

const player = this.matter.add.sprite(400, 200, 'hero');
player.setExistingBody(compoundBody);
```

Sleep system — bodies at rest can sleep to skip simulation (requires `enableSleeping: true`):
```js
if (body.isSleeping) { /* body is at rest */ }
sprite.setSleepThreshold(30);      // lower = falls asleep faster (default 60)
sprite.setToSleep();
sprite.setAwake();
sprite.setSleepEvents(true, true); // enable sleepstart/sleepend events

this.matter.world.on('sleepstart', (event, body) => {});
this.matter.world.on('sleepend', (event, body) => {});
```

Sensors detect collisions but do not physically react — useful for trigger zones and pickups. They fire normal collision events (use `collisionstart`/`end` to detect entry/exit):
```js
const trigger = this.matter.add.rectangle(400, 300, 100, 100, { isSensor: true, isStatic: true });
sprite.setSensor(true);
sprite.isSensor();
```

Collision categories and filtering use bitmasks: `category` (which group this body belongs to, power of 2), `mask` (which categories it collides with), and `group` (shortcut: same positive = always collide, same negative = never collide, 0 = use category/mask):
```js
const PLAYER = this.matter.world.nextCategory();  // 0x0002 (32 max)
const ENEMY = this.matter.world.nextCategory();    // 0x0004
const GROUND = this.matter.world.nextCategory();   // 0x0008

player.setCollisionCategory(PLAYER);
player.setCollidesWith([ENEMY, GROUND]);

bullet.setCollisionCategory(0x0010);
bullet.setCollidesWith([ENEMY, GROUND]);  // bullets skip player

// Collision groups: same negative = never collide with each other
const noCollide = this.matter.world.nextGroup(true);
spriteA.setCollisionGroup(noCollide);
spriteB.setCollisionGroup(noCollide);

// Via body config: collisionFilter: { category, mask, group }
// Batch: this.matter.setCollisionCategory([bodyA, bodyB], ENEMY);
```

Collision callbacks — per-body callbacks on Matter Game Objects, plus Game Object-level events:
```js
player.setOnCollide((pair) => { /* pair.bodyA, pair.bodyB */ });
player.setOnCollideEnd((pair) => {});
player.setOnCollideActive((pair) => {});
player.setOnCollideWith(enemy, (body, pair) => {});

player.on('collide', (bodyA, bodyB, pair) => {});
player.on('collideEnd', (bodyA, bodyB, pair) => {});
```

Tilemap integration — collision MUST be set first via `setCollisionByProperty` etc.:
```js
const map = this.make.tilemap({ key: 'level' });
const tileset = map.addTilesetImage('tiles', 'tiles-img');
const layer = map.createLayer('Ground', tileset, 0, 0);

layer.setCollisionByProperty({ collides: true });  // MUST set collision first
this.matter.world.convertTilemapLayer(layer);       // creates MatterTileBody per colliding tile

// Uses Tiled collision shapes if defined, otherwise tile bounds.
// Access: tile.physics.matterBody
// Individual tile: this.matter.add.tileBody(tile, { isStatic: true, friction: 0.5 });
// After map changes: this.matter.world.convertTiles([tile1, tile2]);
```

Friction types — Matter has three independent friction values:
```js
sprite.setFriction(0.1);             // dynamic: resistance during motion (0-1)
sprite.setFrictionStatic(0.5);       // static: resistance before motion starts
sprite.setFrictionAir(0.05);         // air: environmental drag (default 0.01)
sprite.setFriction(0.1, 0.02, 0.3);  // set all three: dynamic, air, static
```

Complex shapes from vertices (concave shapes auto-decomposed):
```js
const body = this.matter.add.fromVertices(400, 300, '0 0 40 0 40 40 20 60 0 40');

const vertexSets = [
    [{ x: 0, y: 0 }, { x: 40, y: 0 }, { x: 40, y: 40 }],
    [{ x: 40, y: 40 }, { x: 20, y: 60 }, { x: 0, y: 40 }]
];
this.matter.add.fromVertices(300, 200, vertexSets);
```

Pointer constraint (mouse/touch dragging):
```js
const pc = this.matter.add.mouseSpring({ stiffness: 0.2, damping: 0.1 });
pc.active = false;           // disable temporarily
body.ignorePointer = true;   // prevent specific body from being dragged
pc.stopDrag();               // release current drag programmatically
pc.destroy();

this.matter.world.on('dragstart', (body, part, constraint) => {});
this.matter.world.on('drag', (body, constraint) => {});
this.matter.world.on('dragend', (body, constraint) => {});
```

Queries (raycasting and hit testing):
```js
const hits = this.matter.intersectPoint(pointer.x, pointer.y);   // bodies at point
const contains = this.matter.containsPoint(body, x, y);           // point-in-body test
const inRegion = this.matter.intersectRect(100, 100, 200, 200);   // bodies in rect
const rayHits = this.matter.intersectRay(0, 300, 800, 300, 1);    // raycast
const colliding = this.matter.intersectBody(playerBody);          // body overlap

this.matter.overlap(playerBody, enemyBodies, (bodyA, bodyB, info) => {
    console.log('Overlapping', bodyA, bodyB);
});
```

Debug rendering — pass options as the `debug` property in the matter config. Boolean flags include `showBody`, `showStaticBody`, `showVelocity`, `showCollisions`, `showSensors`, `showJoint`, `showPositions`, `showBounds`, `showAxes`, `showAngleIndicator`, `showSleeping`, `showConvexHulls`, `showInternalEdges`, `renderFill`, `renderLine`; color/style options include `lineColor`, `lineThickness`, `fillColor`, `staticLineColor`, `staticFillColor`, `sensorLineColor`, `jointColor`, `pinColor`, `springColor`, `anchorColor`, `positionColor`:
```js
this.matter.world.drawDebug = false;            // toggle at runtime
this.matter.world.debugGraphic.visible = false;

this.matter.world.setBodyRenderStyle(body, 0xff0000, 1, 2, 0x00ff00, 0.5);
this.matter.world.setConstraintRenderStyle(constraint, 0xffff00, 1, 2);
```
</common_patterns>

<events>
All events are emitted on `this.matter.world` (which extends EventEmitter):

- `'collisionstart'` `(event, bodyA, bodyB)` — two bodies first start colliding.
- `'collisionactive'` `(event, bodyA, bodyB)` — two bodies are still colliding.
- `'collisionend'` `(event, bodyA, bodyB)` — two bodies stop colliding.
- `'beforeupdate'` / `'afterupdate'` `(event)` — before/after each engine update step.
- `'beforeadd'` / `'afteradd'` / `'beforeremove'` / `'afterremove'` `(event)` — around body/constraint add/remove.
- `'dragstart'` `(body, part, constraint)`, `'drag'` `(body, constraint)`, `'dragend'` `(body, constraint)` — pointer dragging.
- `'sleepstart'` / `'sleepend'` `(event, body)` — body sleeps/wakes (requires `setSleepEvents`).
- `'pause'` / `'resume'` — world paused/resumed. No args.

Collision events include `event.pairs` — an array of collision pair objects with `bodyA`, `bodyB`, collision depth, and normal.
</events>

<gotchas>
- Force values are tiny. Use `0.01`-`0.1` for forces, `1`-`15` for velocity. Not pixel-based.
- `setBody`/`setRectangle`/etc. resets all properties — mass, friction, collision filters, callbacks are wiped. Re-apply after changing shape.
- Constraints must target the parent body, not compound body `parts`.
- 32 collision categories max. Each `nextCategory()` uses one bit.
- `collisionFilter.group` overrides category/mask. Same positive = always collide; same negative = never collide; zero/different = use category/mask.
- Sensors still need matching collision filters to fire events.
- Matter position is the center of mass, not top-left (unlike Arcade Physics).
- Sleep events require opt-in: `sprite.setSleepEvents(true, true)`.
- Tilemap conversion requires collision set first via `setCollisionByProperty` etc.
- Restitution uses `Math.max(bodyA.restitution, bodyB.restitution)` — the bouncier value wins.
- `body.ignorePointer = true` prevents the pointer constraint from dragging that body.
</gotchas>
</physics_matter>
