<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: physics arcade

<physics_arcade>
Use this when working with Arcade Physics in Phaser 4: enabling physics, velocity, acceleration, gravity, collisions (collide/overlap), world bounds, physics groups, static bodies, body properties, and collision categories.

<quick_start>
Enable Arcade Physics in the game config, then create physics-enabled sprites via `this.physics.add`.

```js
class GameScene extends Phaser.Scene {
    create() {
        // Physics sprite (dynamic body, affected by gravity)
        this.player = this.physics.add.sprite(100, 300, 'player');
        this.player.setCollideWorldBounds(true);
        this.player.setBounce(0.2);

        // Static group (immovable platforms)
        this.platforms = this.physics.add.staticGroup();
        this.platforms.create(400, 568, 'ground').setScale(2).refreshBody();

        // Register a persistent collider (checked every frame automatically)
        this.physics.add.collider(this.player, this.platforms);

        this.cursors = this.input.keyboard.createCursorKeys();
    }

    update() {
        if (this.cursors.left.isDown) {
            this.player.setVelocityX(-160);
        } else if (this.cursors.right.isDown) {
            this.player.setVelocityX(160);
        } else {
            this.player.setVelocityX(0);
        }
    }
}

// Enable Arcade Physics in game config
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 300 },
            debug: false
        }
    },
    scene: GameScene
};

const game = new Phaser.Game(config);
```
</quick_start>

<core_concepts>
The `Phaser.Physics.Arcade.World` (`this.physics.world`) manages all bodies. Key properties: `gravity` (Vector2 applied to all dynamic bodies each step — set via config or `world.gravity.y = 300`), `bounds` (Rectangle, defaults to canvas size), `bodies` / `staticBodies` (Sets of bodies), `colliders` (registered Collider objects), `fps` (steps/sec, default 60, change via `world.setFPS(120)`), `fixedStep` (true = fixed timestep, false = sync to render fps), `timeScale` (1.0 normal, 2.0 = half speed, 0.5 = double), `isPaused` (toggle via `world.pause()` / `world.resume()`), `useTree` (RTree spatial index, disable for 5000+ bodies), `drawDebug` (set via config `debug: true`).

A dynamic `Body` is created automatically when you use `this.physics.add.sprite()` or `.image()`; access it via `gameObject.body`. Key body properties: `velocity` (px/sec), `acceleration` (px/sec^2), `drag` (deceleration, applied only when acceleration is zero), `gravity` (per-body, added to world gravity), `bounce` (rebound factor relative to 1), `friction` (default `(1, 0)`, velocity imparted by immovable body to riding body), `maxVelocity` (default `(10000, 10000)`) / `maxSpeed` (scalar cap, default -1 = none), `mass` (default 1, affects collision momentum), `immovable` (if true, never moved by collisions), `pushable` (if false, reflects velocity to colliding body), `moves` (if false, position not updated by physics), `enable` (false removes from simulation), `useDamping` (when true, drag is a 0-1 multiplier instead of linear), `collideWorldBounds`, and the event opt-ins `onWorldBounds` / `onCollide` / `onOverlap`.

Body shape: `isCircle` (via `setCircle`), `width`/`height`, `offset` (Vector2), `center` (read-only midpoint). Collision state (read-only, reset each step): `touching` / `blocked` / `wasTouching` — each `{ none, up, down, left, right }`; `embedded` (both overlapping with zero velocity). Angular: `angularVelocity` (deg/sec), `angularAcceleration`, `angularDrag`, `maxAngular` (default 1000), `allowRotation` (default true).

A `StaticBody` never moves and is unaffected by gravity or velocity; it uses an optimized RTree for fast spatial lookups. Created via `this.physics.add.staticSprite()`, `.staticImage()`, or `.staticGroup()`. After changing the parent Game Object's position or scale, call `body.reset()` or `gameObject.refreshBody()` to sync — static bodies do not auto-sync. They have `collisionCategory` and `collisionMask` like dynamic bodies but no velocity, acceleration, drag, or gravity.
</core_concepts>

<common_patterns>
Enabling physics on existing Game Objects:
```js
this.physics.add.existing(mySprite);           // dynamic body
this.physics.add.existing(mySprite, true);     // static body

// Or via the world directly
this.physics.world.enable(mySprite);           // dynamic
this.physics.world.enable(mySprite, Phaser.Physics.Arcade.STATIC_BODY);
```

Creating physics sprites and images:
```js
const player = this.physics.add.sprite(100, 200, 'player');       // dynamic body
const coin = this.physics.add.image(300, 100, 'coin');            // dynamic body
const wall = this.physics.add.staticImage(400, 300, 'wall');      // static body
const platform = this.physics.add.staticSprite(400, 500, 'plat'); // static body

// Standalone bodies (no Game Object)
const sensor = this.physics.add.body(200, 200, 32, 32);           // dynamic Body
const zone = this.physics.add.staticBody(100, 100, 64, 64);       // static Body
```

Velocity and gravity:
```js
player.setVelocity(200, -300);          // x=200 px/s, y=-300 px/s (upward)
player.setVelocityX(200);
player.body.velocity.set(200, -300);    // equivalent via Vector2

player.setAcceleration(100, 0);
player.setMaxVelocity(300, 600);

player.body.gravity.y = 200;            // per-body gravity (added to world gravity)
player.body.allowGravity = false;       // exempt from world gravity

player.setDrag(300);                    // linear deceleration (acceleration must be zero)
player.body.useDamping = true;
player.setDrag(0.05);                   // damping mode: keeps 5% velocity/sec

player.setBounce(0.5);                  // both axes
player.setBounceY(1);                   // full vertical bounce
```

Collide and overlap — two approaches: persistent Colliders (checked every frame automatically, preferred) or one-shot checks (called manually in `update()`):
```js
// --- Persistent Colliders ---
const collider = this.physics.add.collider(player, platforms);
const overlap = this.physics.add.overlap(player, coins, collectCoin, null, this);

function collectCoin (player, coin) {
    coin.disableBody(true, true); // disable physics and hide
}

collider.active = false;   // temporarily disable
collider.destroy();        // remove permanently

// With processCallback (must return boolean to allow collision)
this.physics.add.collider(player, enemies, onHit, canCollide, this);
function canCollide (player, enemy) {
    return !player.getData('invincible');
}

// --- One-shot checks (in update) ---
this.physics.collide(player, platforms);
this.physics.overlap(player, coins, collectCoin, null, this);

// Self-collision within a single group
this.physics.add.collider(enemies, enemies);
```
`collide` performs separation (pushes bodies apart); `overlap` only detects intersection without moving anything — use `overlap` for triggers like pickups.

Groups — dynamic group members get dynamic bodies automatically; static group members get static bodies:
```js
const bullets = this.physics.add.group({
    classType: Phaser.Physics.Arcade.Sprite,  // default: ArcadeSprite
    maxSize: 20,
    collideWorldBounds: true,
    bounceX: 1,
    bounceY: 1,
    velocityX: 200,
    allowGravity: false,
    immovable: false
});

const platforms = this.physics.add.staticGroup();
platforms.create(400, 568, 'ground');
platforms.create(600, 400, 'ground');

// After modifying a static group member's transform, refresh:
platforms.create(400, 568, 'ground').setScale(2).refreshBody();

// Group velocity helpers
bullets.setVelocity(200, 0);       // all members
bullets.setVelocityX(200);
bullets.setVelocityY(0, 10);       // with step increment per member
```
PhysicsGroup config keys (applied as defaults to new members at creation only — changing them later does NOT retroactively update existing members): `collideWorldBounds`, `bounceX/Y`, `accelerationX/Y`, `dragX/Y`, `gravityX/Y`, `frictionX/Y`, `velocityX/Y`, `angularVelocity`, `angularAcceleration`, `angularDrag`, `maxVelocityX/Y`, `maxSpeed`, `mass`, `immovable`, `allowDrag`, `allowGravity`, `allowRotation`, `useDamping`, `enable`.

World bounds:
```js
this.physics.world.setBounds(0, 0, 1600, 1200, true, true, false, true);
this.physics.world.setBoundsCollision(true, true, false, true); // which edges collide

player.setCollideWorldBounds(true);
player.body.setBoundsRectangle(new Phaser.Geom.Rectangle(100, 100, 600, 400));
player.body.worldBounce = new Phaser.Math.Vector2(0.5, 0.5);

// Detect world bounds hit via event (requires opt-in)
player.body.onWorldBounds = true;
this.physics.world.on('worldbounds', (body, up, down, left, right) => {
    console.log('Hit edge:', { up, down, left, right });
});
```

Body properties:
```js
player.body.setSize(24, 32, true);     // width, height, re-center on GO
player.body.setOffset(4, 0);           // offset from GO position
player.body.setCircle(16);             // circular body, radius 16
player.body.setCircle(16, 4, 4);       // circular with offset

player.body.setImmovable(true);        // not moved by collisions
player.body.setPushable(false);        // reflects velocity to collider
player.body.slideFactor.set(0, 0);     // Sokoban-style: stops after push
player.body.setMass(2);                // affects momentum exchange

player.disableBody(true, true);             // disable body + hide Game Object
player.enableBody(true, x, y, true, true);  // re-enable at position + show

player.body.checkCollision.up = false; // don't collide from above
player.body.syncBounds = true;         // auto-sync size to texture
```

Collision categories filter which bodies can collide using bitmask values (max 32 categories):
```js
const CAT_PLAYER = this.physics.nextCategory();   // 0x0002
const CAT_ENEMY  = this.physics.nextCategory();   // 0x0004
const CAT_BULLET = this.physics.nextCategory();   // 0x0008

player.setCollisionCategory(CAT_PLAYER);
enemy.setCollisionCategory(CAT_ENEMY);
bullet.setCollisionCategory(CAT_BULLET);

player.setCollidesWith([CAT_ENEMY]);              // player hits enemies only
enemy.setCollidesWith([CAT_PLAYER, CAT_BULLET]);  // enemies hit player + bullets
bullet.setCollidesWith([CAT_ENEMY]);

player.addCollidesWith(CAT_BULLET);
player.removeCollidesWith(CAT_ENEMY);
player.willCollideWith(CAT_ENEMY);  // returns boolean
player.resetCollisionCategory();    // reset to default (collides with everything)

// Works on Groups too
enemies.setCollisionCategory(CAT_ENEMY);
enemies.setCollidesWith([CAT_PLAYER, CAT_BULLET]);
```
Default: all bodies have category `0x0001` and mask `1`, so everything collides because `(1 & 1) !== 0`. PhysicsGroup defaults to mask `2147483647` (all bits). After changing categories, call `resetCollisionCategory()` to set the mask back to all bits.
</common_patterns>

<events>
All events are emitted on `this.physics.world` and require opt-in per body (set `body.onCollide`, `body.onOverlap`, or `body.onWorldBounds` to `true`):

- `'collide'` (COLLIDE) — two bodies collide and at least one has `onCollide = true`. Args `(gameObject1, gameObject2, body1, body2)`.
- `'overlap'` (OVERLAP) — two bodies overlap and at least one has `onOverlap = true`. Args `(gameObject1, gameObject2, body1, body2)`.
- `'worldbounds'` (WORLD_BOUNDS) — body hits a world edge and has `onWorldBounds = true`. Args `(body, up, down, left, right)`.
- `'tilecollide'` / `'tileoverlap'` — body collides/overlaps a tile. Args `(gameObject, tile, body)`.
- `'worldstep'` — after each physics step. Args `(delta)`.
- `'pause'` / `'resume'` — world paused/resumed. No args.

Useful scene-plugin helpers: `this.physics.accelerateTo`, `moveTo`, `velocityFromAngle`, `velocityFromRotation`, `closest`, `furthest`, `overlapRect`, `overlapCirc`.
</events>

<gotchas>
1. `debug: true` in production — debug rendering is expensive. Always disable for release builds.
2. Static body transform changes — after changing position, scale, or origin of a static body's Game Object, you must call `body.reset()` or `gameObject.refreshBody()`. Static bodies do not auto-sync.
3. `collide` vs `overlap` — `collide` performs separation (pushes bodies apart); `overlap` only detects intersection. Use `overlap` for triggers like pickups.
4. Persistent Collider vs one-shot — `this.physics.add.collider()` is checked every frame automatically; `this.physics.collide()` is a one-shot check you must call each frame in `update()`. Prefer persistent Colliders.
5. Events require opt-in — world events fire only if the relevant body property (`onCollide`, `onOverlap`, `onWorldBounds`) is `true`.
6. Collision categories default — all bodies default to category `0x0001` / mask `1` (PhysicsGroup defaults to mask `2147483647`). Use `this.physics.nextCategory()` for new values; max 32 categories. After changing categories, call `resetCollisionCategory()` to set the mask to all bits.
7. Group defaults only apply at creation — changing a PhysicsGroup's `defaults` later does not retroactively update existing members.
8. `customUpdate: true` in the arcade config stops the world from auto-updating on the Scene UPDATE event — you must call `this.physics.world.update(time, delta)` manually.
9. `useDamping` drag values should be small (e.g. `0.05`) since they act as a multiplier — `0.05` means the body keeps 5% of its velocity per second.
10. Immovable vs pushable — `immovable = true` means never moved by collisions at all; `pushable = false` means it reflects velocity back to the colliding body but can still be separated.
11. Overlap with TilemapLayer — when using `overlapOnly` with a TilemapLayer, every tile is checked regardless of collision settings on individual tiles.
12. RTree threshold — the RTree spatial index (enabled by default) becomes expensive to rebuild with very large numbers of dynamic bodies. Consider `useTree: false` for 5000+ dynamic bodies.
</gotchas>
</physics_arcade>
