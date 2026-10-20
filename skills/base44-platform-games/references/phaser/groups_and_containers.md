<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Phaser 4: groups and containers

<groups_and_containers>
Use this when organizing game objects in Phaser 4: Groups for logical collections and object pooling, Containers for visual grouping with inherited transforms, Layers for render-order bucketing, plus batch operations and nested transforms.

<quick_start>
```js
// In a Scene's create() method:

// --- Group: logical collection, no transform, great for pooling ---
const enemies = this.add.group();
enemies.create(100, 200, 'enemy');       // creates Sprite at (100,200)
enemies.create(300, 200, 'enemy');

// --- Container: visual parent with inherited transform ---
const hud = this.add.container(10, 10);
const icon = this.add.image(0, 0, 'heart');
const label = this.add.text(20, 0, 'x3');
hud.add([icon, label]);                  // children move/scale/rotate with hud

// --- Layer: render-ordering bucket, no position/scale ---
const bgLayer = this.add.layer();
const fgLayer = this.add.layer();
bgLayer.add(this.add.image(400, 300, 'sky'));
fgLayer.add(this.add.sprite(400, 300, 'player'));
```
</quick_start>

<core_concepts>
Three ways to organize objects, each with a different purpose:

**Group** (`this.add.group()`): a logical collection / pool. NOT on the display list — its children render individually on the Scene. No shared position, rotation, scale, or alpha. Members can belong to many Groups at once. Supports object pooling (`getFirstDead`, `kill`, `killAndHide`). Use for collections of similar objects (enemies, bullets, coins) and physics-group collisions. Children stored in a `children` Set (unordered, no index access).

**Container** (`this.add.container(x, y)`): a visual parent on the display list that renders its children, which inherit its position, rotation, scale, and alpha. Exclusive by default — adding a child removes it from its previous Container (use `setExclusive(false)` to override). Use for composite UI (health bars, inventory slots), moving/rotating clusters as one unit, and nested transforms. Children stored in a `list` Array. Each child costs matrix math per frame, and deep nesting multiplies that cost — prefer Group or Layer when transforms aren't needed.

**Layer** (`this.add.layer()`): a lightweight render-order bucket on the display list. No position, rotation, scale, scroll factor, input, or physics. Applies shared alpha/blend/mask. Children render in layer order, then by depth within the layer. Cannot be added to a Container (but Containers can be added to Layers).

At a glance: if children must move/rotate together, use Container. If you need pooling or multi-membership, use Group. If you only need render ordering and shared effects, use Layer.
</core_concepts>

<common_patterns>
Creating and populating Groups:
```js
// Empty group, add existing objects
const gems = this.add.group();
gems.add(existingSprite);
gems.addMultiple([sprite1, sprite2, sprite3]);

// Group with config -- creates children automatically
const coins = this.add.group({
    classType: Phaser.GameObjects.Sprite,
    key: 'coin',
    quantity: 10,           // overrides frameQuantity
    setXY: { x: 50, y: 300, stepX: 60 },
    setScale: { x: 0.5, y: 0.5 }
});

// Custom class type with pool limit
const bullets = this.add.group({
    classType: Bullet,       // must accept (scene, x, y, key, frame)
    maxSize: 30,
    defaultKey: 'bullet',
    runChildUpdate: true     // calls child.update() each frame
});
```

Object pooling with `get` / `getFirstDead` — deactivate objects instead of destroying them, then reuse inactive ones:
```js
const bullets = this.add.group({
    classType: Phaser.GameObjects.Sprite,
    defaultKey: 'bullet',
    maxSize: 30
});

// Fire a bullet -- get() finds first inactive member or creates one
function fireBullet(x, y) {
    const bullet = bullets.get(x, y);
    if (bullet) {
        bullet.setActive(true);
        bullet.setVisible(true);
        bullet.body.velocity.y = -300;   // if physics enabled
    }
}

// Deactivate when off-screen or on hit
function killBullet(bullet) {
    bullets.killAndHide(bullet);         // sets active=false, visible=false
    // If using physics, also reset the body: bullet.body.stop();
}

// Manual queries
const inactive = bullets.getFirst(false);       // first where active===false
const active = bullets.getFirstAlive();          // first where active===true
const dead = bullets.getFirstDead(true, x, y);   // first inactive, create if null
```
Pool methods: `get(x, y, key, frame)` (shortcut for `getFirst(false, true, ...)`), `getFirstAlive`, `getFirstDead`, `getLast` (searches back-to-front), `kill` (active=false), `killAndHide` (active=false + visible=false), `countActive`, `getTotalUsed`, `getTotalFree` (remaining capacity), `isFull`.

Physics Groups extend Group with automatic body assignment:
```js
// Arcade Physics group -- every member gets a dynamic body
const enemies = this.physics.add.group({
    key: 'enemy', quantity: 5, setXY: { x: 100, y: 100, stepX: 80 }
});

// Static physics group -- immovable bodies
const platforms = this.physics.add.staticGroup();
platforms.create(400, 568, 'ground');

this.physics.add.collider(player, platforms);
this.physics.add.overlap(bullets, enemies, onHit);
```

Containers with nested transforms:
```js
// HUD that follows camera
const hud = this.add.container(10, 10);
hud.setScrollFactor(0);     // pinned to camera
const healthBar = this.add.rectangle(0, 0, 200, 20, 0x00ff00);
const healthText = this.add.text(210, -5, '100 HP');
hud.add([healthBar, healthText]);

hud.setPosition(50, 50);    // move everything at once
hud.setScale(1.5);          // scale propagates to children
hud.setRotation(0.1);       // rotation propagates to children
hud.setAlpha(0.8);          // alpha affects all children

// Nested containers
const inventory = this.add.container(300, 500);
for (let i = 0; i < 5; i++) {
    const slot = this.add.container(i * 55, 0);
    slot.add([
        this.add.rectangle(0, 0, 48, 48, 0x333333),
        this.add.image(0, 0, `item-${i}`)
    ]);
    inventory.add(slot);    // Container inside Container
}
```
Key Container methods: `add` / `addAt` (removes child from display list), `remove(child, destroyChild)`, `getAt` / `getIndex`, `getByName` / `getFirst(prop, val)`, `getAll` / `count`, ordering (`sort`, `swap`, `moveTo`, `moveUp`/`moveDown`, `sendToBack`/`bringToTop`), `each` / `iterate` (iterate passes index), `setScrollFactor(x, y, updateChildren)` (pass `true` to apply to children), `getBounds`, `pointToContainer` (world → local), `setExclusive`, `replace`, `setSize(w, h)` (required before `setInteractive`), `length` (read-only count).

Layers for render ordering:
```js
const bgLayer = this.add.layer();
const entityLayer = this.add.layer();
const uiLayer = this.add.layer();

bgLayer.add(this.add.image(400, 300, 'sky'));
entityLayer.add(player);
entityLayer.add(enemy);
uiLayer.add(scoreText);

bgLayer.setDepth(0);        // depth of layers themselves
entityLayer.setDepth(1);
uiLayer.setDepth(2);
enemy.setDepth(5);          // depth within entityLayer, not the Scene

// Shared effects to the entire layer
entityLayer.setAlpha(0.5);
entityLayer.setVisible(false);
entityLayer.setBlendMode(Phaser.BlendModes.ADD);
```

Bulk creation with `createMultiple` (accepts a config or array of configs):
```js
const coins = this.add.group();
coins.createMultiple({
    key: 'coin',
    quantity: 20,
    setXY: { x: 50, y: 100, stepX: 40, stepY: 0 },
    setScale: { x: 0.5, y: 0.5 },
    setRotation: { value: 0, step: 0.1 },   // each rotated 0.1 more than previous
    setAlpha: { value: 1 },
    setOrigin: { x: 0.5, y: 0.5 },
    setDepth: { value: 5 },
    gridAlign: { width: 5, height: 4, cellWidth: 48, cellHeight: 48, x: 100, y: 200 }
});
```

Iterating and batch operations on Groups. Many setters support a step argument that distributes incremental values across members:
```js
const enemies = this.add.group();
const all = enemies.getChildren();              // array snapshot
const active = enemies.getMatching('active', true);

enemies.setXY(200, 300);
enemies.incX(5);                                // add 5 to each member's x
enemies.setVisible(false);
enemies.propertyValueSet('tintTopLeft', 0xff0000);
enemies.playAnimation('walk');

// Stepping: first member gets base value, each subsequent adds the step
enemies.setX(100, 50);                          // x = 100, 150, 200...
enemies.setXY(100, 200, 50, 30);                // combined X and Y stepping
enemies.angle(0, 15);                           // 0, 15, 30 deg...
enemies.setAlpha(1, -0.1);                      // 1.0, 0.9, 0.8...
enemies.setScale(1, 0, 0.1, 0);                 // scaleX: 1.0, 1.1, 1.2...
enemies.setDepth(0, 1);                         // depth 0, 1, 2, 3...
enemies.setTint(0xff0000);
enemies.shuffle();                              // randomize order
```
</common_patterns>

<gotchas>
- Group is NOT on the display list. Its children appear on the Scene individually. Moving a Group does nothing visually — use a Container for that.
- Container has performance overhead — every child requires extra matrix math per frame, multiplied by nesting depth. Avoid Containers when a Group or Layer suffices.
- Container origin is always 0,0 and cannot be changed. Position children relative to (0,0).
- Container children lose Scene-level depth control. A child's `depth` only orders within the Container; the Container's own depth positions it in the Scene.
- Physics + Container is problematic. If a Container is not at (0,0), physics bodies on children are offset. Avoid physics bodies on Container children.
- Container children cannot be individually masked in Canvas rendering — only the Container itself can have a mask, and masks don't stack for nested Containers. Masks DO stack in WebGL.
- `Group.get(x, y)` is shorthand for `getFirst(false, true, x, y)` — finds first inactive member and creates if none. `getFirst(state)` defaults to `active===false` without auto-creating.
- Layer cannot go inside a Container (only the reverse).
- Group children Set is unordered — no index access; use `getChildren()` for an array snapshot.
- Phaser 4 removed `children.each` / `children.iterate` from Group — Container still has them, Group does not. `children.forEach` replaces them, but `return false` no longer breaks out of it.
- `killAndHide` does NOT remove from the group — it only sets `active=false` and `visible=false`. The object stays for reuse.
- `Container.setScrollFactor` does not auto-propagate. Pass `true` as the third argument to also update children: `container.setScrollFactor(0, 0, true)`.
- `Group.create()` adds to the Scene display list, but `group.add()` does NOT unless you pass `true` as the second argument.
- Container needs `setSize(width, height)` before `setInteractive()` will work with a hit area — Containers have no implicit size.
</gotchas>
</groups_and_containers>
