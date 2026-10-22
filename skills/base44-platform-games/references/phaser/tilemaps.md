<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: tilemaps

<tilemaps>
Use this when working with tilemaps in Phaser 4: loading Tiled JSON maps, creating tilemap layers, tile collision, dynamic tiles, tile properties, object layers, and orthogonal/isometric/hexagonal/staggered maps.

<quick_start>
A `Tilemap` holds parsed map data (layers, tilesets, objects) and provides methods to add tilesets, create layers, set collision, and query tiles. Layers (`TilemapLayer` or `TilemapGPULayer`) are the Game Objects that actually render tiles.

```js
class GameScene extends Phaser.Scene {
    preload() {
        // Load the Tiled JSON and the tileset image
        this.load.tilemapTiledJSON('map', 'assets/level1.json');
        this.load.image('tiles', 'assets/tilesheet.png');
    }

    create() {
        // Create the tilemap from cached JSON
        const map = this.add.tilemap('map');

        // Link the tileset image to the tileset name used in Tiled
        const tileset = map.addTilesetImage('tilesheet', 'tiles');

        // Create a layer - layerID must match the layer name in Tiled
        const ground = map.createLayer('Ground', tileset);

        // Enable collision on specific tile indexes
        ground.setCollision([1, 2, 3]);
    }
}
```

The flow is always: load JSON + image, create tilemap, add tileset image, create layer(s), set collision.
</quick_start>

<core_concepts>
**Tilemap vs Layer.** A `Tilemap` is a data container, not a display object -- it stores parsed map data and provides methods that operate on it. A `TilemapLayer` or `TilemapGPULayer` is the actual Game Object added to the display list that renders tiles. `this.add.tilemap(key)` is a factory on `GameObjectFactory` that delegates to `ParseToTilemap`, reading from the cache and returning a `Tilemap`.

```js
const map = this.add.tilemap('map');               // Data container (not rendered)
const layer = map.createLayer('Ground', tileset);  // Game Object (rendered)
```

**Tilesets.** A `Tileset` links a tileset name (from Tiled) to a loaded texture; it stores `firstgid`, tile dimensions, margin, and spacing.
```js
// tilesetName: the name in Tiled's tileset panel; key: the Phaser texture key (defaults to tilesetName)
const tileset = map.addTilesetImage('tilesetName', 'textureKey');
// Override tile dimensions, margin, and spacing if needed
const tileset = map.addTilesetImage('name', 'key', 16, 16, 1, 2);
```
`addTilesetImage(tilesetName, key, tileWidth, tileHeight, tileMargin, tileSpacing, gid, tileOffset)` -- if the tileset name already exists in the parsed map data, it updates the existing Tileset with the texture; otherwise (non-Tiled maps) it creates a new one. The Phaser Tiled parser does NOT support "Collection of Images" tilesets -- all tiles must be in a single tileset image per tileset.

**The Tile class.** Each cell in a layer is a `Tile`. Key properties: `index` (tile index in the tileset, -1 for empty), `x`/`y` (tile coordinates, not pixels), `pixelX`/`pixelY` (pixel position relative to layer origin), `width`/`height` (pixels), `properties` (custom properties object from Tiled), `collideLeft`/`Right`/`Up`/`Down` (per-edge collision flags), `faceLeft`/`Right`/`Top`/`Bottom` (interesting-face flags for collision optimization), `collisionCallback` (per-tile callback), `tint` (default `0xffffff`), `tintMode` (default `TintModes.MULTIPLY`), `rotation`, `physics` (engine-specific data e.g. bodies), and inherited `alpha`/`visible`/`flipX`/`flipY`.

**TilemapGPULayer (v4.0.0)** is a high-performance WebGL-only alternative to `TilemapLayer`, rendering the entire layer as a single quad via a shader (almost entirely GPU-bound). Pass `gpu: true` as the 5th arg to `createLayer`:
```js
const layer = map.createLayer('Ground', tileset, 0, 0, true);
```
Capabilities: single tileset per layer only, max 4096x4096 tiles, max unique tile IDs 2^23, supports tile flip and tile animation, orthographic maps only, smooth borders with LINEAR filtering or sharp pixels with NEAREST. Restrictions: layer edits do NOT display automatically -- call `generateLayerDataTexture()` after modifying tiles; WebGL only (no Canvas fallback); cannot use multiple tilesets.
```js
gpuLayer.putTileAt(5, 10, 10);
gpuLayer.generateLayerDataTexture();  // required after edits
```

Both `TilemapLayer` and `TilemapGPULayer` extend `TilemapLayerBase` (which extends `GameObject`). The base class provides all tile query, manipulation, and collision methods, with these mixins: Alpha, BlendMode, ComputedSize, Depth, ElapseTimer, Flip, GetBounds, Lighting, Mask, Origin, RenderNodes, Transform, Visible, ScrollFactor, and Arcade Physics Collision.
</core_concepts>

<common_patterns>
Creating from Tiled JSON and multiple layers:
```js
const map = this.add.tilemap('map');
const tileset = map.addTilesetImage('TilesetNameInTiled', 'tiles');
const layer = map.createLayer('LayerNameInTiled', tileset);

// Multiple layers render in creation order; use depth for finer control
const background = map.createLayer('Background', tileset);
const ground = map.createLayer('Ground', tileset);
const foreground = map.createLayer('Foreground', tileset);
foreground.setDepth(10);

// A CPU layer can use multiple tilesets
const tiles1 = map.addTilesetImage('terrain', 'terrain-img');
const tiles2 = map.addTilesetImage('objects', 'objects-img');
const multi = map.createLayer('Ground', [tiles1, tiles2]);
```
The `layerID` passed to `createLayer` must match the layer name in Tiled exactly. Group layer children are flattened with a `'ParentGroup/Layer'` naming convention.

Blank layer for procedural maps:
```js
// createBlankLayer(name, tileset, x, y, width, height, tileWidth, tileHeight)
const layer = map.createBlankLayer('dynamic', tileset, 0, 0, 50, 50, 32, 32);
layer.fill(1);               // fill entire layer with tile index 1
layer.putTileAt(5, 10, 10);  // place tile index 5 at tile coord (10, 10)
```

Collision setup (several ways):
```js
layer.setCollision([1, 2, 3]);                    // by specific indexes
layer.setCollisionBetween(1, 50);                 // by range (inclusive)
layer.setCollisionByProperty({ collides: true }); // by Tiled property; supports arrays: { type: ['stone', 'lava'] }
layer.setCollisionByExclusion([-1, 0]);           // collide on all tiles EXCEPT these (-1 empty, 0 often background)
layer.setCollisionFromCollisionGroup();           // from Tiled collision editor shapes
```
All collision methods on `TilemapLayerBase` mirror methods on `Tilemap` but without a `layer` param. On the `Tilemap` you can use the "current layer" or specify one explicitly:
```js
map.setLayer('Ground');
map.setCollision([1, 2, 3]);                 // applies to current layer
map.setCollision([1, 2, 3], true, true, 'Ground');  // explicit layer
```

Physics integration (Arcade) -- the layer must have collision set for physics to detect it:
```js
this.physics.add.collider(player, groundLayer);
this.physics.add.collider(player, groundLayer, (sprite, tile) => {
    if (tile.index === 5) { /* hit a special tile */ }
});
this.physics.add.overlap(player, groundLayer, (sprite, tile) => { /* overlapping */ });
```
The layer has `collisionCategory` and `collisionMask` properties for collision filtering.

Tile properties and callbacks (callbacks require an active physics collider/overlap between body and layer):
```js
const tile = layer.getTileAt(10, 5);
console.log(tile.properties.damage, tile.properties.type);  // custom props from Tiled
layer.setCollisionByProperty({ type: ['wall', 'rock'] });

// Callback by tile index -- fires when a physics body overlaps these tiles
map.setTileIndexCallback([5, 6, 7], (sprite, tile) => { /* ... */ }, this);
// Callback by tile location -- fires for tiles in a rectangular area
map.setTileLocationCallback(10, 10, 5, 5, (sprite, tile) => { /* ... */ }, this);
// Per-tile callback
layer.getTileAt(10, 5).collisionCallback = (sprite, tile) => { /* ... */ };
```

Querying tiles:
```js
const tile = layer.getTileAt(10, 5);                 // by tile coords (or null)
const tile = layer.getTileAt(10, 5, true);           // nonNull: Tile with index -1 instead of null
const tile = layer.getTileAtWorldXY(worldX, worldY); // by world coords
const exists = layer.hasTileAt(10, 5);

const tiles = layer.getTilesWithin(0, 0, 10, 10);      // tile coord region
const tiles = layer.getTilesWithinWorldXY(x, y, w, h); // world coord region
const tiles = layer.getTilesWithinShape(circle);       // shape overlap

const water = layer.filterTiles(t => t.properties.type === 'water');
const spawn = layer.findTile(t => t.properties.isSpawn);
layer.forEachTile(t => { /* iterate all tiles */ });
```

Modifying tiles at runtime:
```js
layer.putTileAt(5, 10, 10);                  // place tile index 5 at (10, 10)
layer.putTileAtWorldXY(5, worldX, worldY);   // place by world coords
layer.putTilesAt([[1, 2], [3, 4]], 10, 10);  // place a 2x2 grid
layer.removeTileAt(10, 10);
layer.fill(1, 0, 0, 10, 10);                 // fill 10x10 region with index 1
layer.replaceByIndex(5, 10);                 // replace all index-5 with index-10
layer.copy(0, 0, 5, 5, 20, 20);              // copy 5x5 from (0,0) to (20,20)
layer.randomize(0, 0, 10, 10, [1, 2, 3, 4]);
layer.weightedRandomize([{ index: 1, weight: 4 }, { index: 2, weight: 1 }], 0, 0, 10, 10);
layer.shuffle(0, 0, 10, 10);
```

Coordinate conversion:
```js
const tileXY = layer.worldToTileXY(worldX, worldY);
const worldXY = layer.tileToWorldXY(tileX, tileY);

// Reuse a vector to avoid allocation
const vec = new Phaser.Math.Vector2();
layer.worldToTileXY(worldX, worldY, true, vec);  // snapToFloor = true
```

Object layers (Tiled) -- use `createFromObjects` to turn points/rectangles/sprite placements into Game Objects:
```js
// Match by tile GID, with a custom class extending Sprite
const enemies = map.createFromObjects('Enemies', { gid: 26, classType: Enemy });
// Match by name
const coins = map.createFromObjects('Items', { name: 'coin', key: 'coin-texture', frame: 0 });
// Match by type
const spawns = map.createFromObjects('Spawns', { type: 'player-spawn' });

// Access raw object layer data
const objectLayer = map.getObjectLayer('Enemies');
objectLayer.objects.forEach(obj => console.log(obj.name, obj.x, obj.y, obj.properties));
```
`createFromObjects(layerName, config, useTileset)` config options: `id`, `gid`, `name`, `type`, `classType` (default `Sprite`), `scene`, `container`, `key`, `frame`, `ignoreTileset`.

Animated tiles are defined in Tiled's tileset editor and parsed automatically. Both layer types support them; `TilemapLayerBase` uses `ElapseTimer` to track animation time via `preUpdate`.

Isometric, hexagonal, and staggered maps -- the map `orientation` property is set from Tiled data and coordinate conversion functions are selected automatically:
```js
const map = this.add.tilemap('iso-map');
const tileset = map.addTilesetImage('iso-tiles', 'iso-img');
const layer = map.createLayer('Ground', tileset);
const tile = layer.getIsoTileAtWorldXY(worldX, worldY);  // tile at world coords in iso space
// TilemapGPULayer does NOT support iso/hex/staggered -- use TilemapLayer
```
</common_patterns>

<gotchas>
- **Tileset name must match Tiled exactly.** The first arg to `addTilesetImage` is the tileset name as defined in Tiled, not the Phaser texture key. Mismatch returns `null` + a console warning.
- **Layer name must match Tiled exactly.** `createLayer` takes the layer name (or index). Group layer children are prefixed `'GroupName/LayerName'`.
- **Each layer can only be created once.** Calling `createLayer` with the same layer ID twice returns `null` + a warning -- the layer data can only be associated with one Game Object.
- **`setCollision` must be called before physics colliders work.** Without marking tiles as collidable, `this.physics.add.collider()` passes through all tiles.
- **TilemapGPULayer is orthographic only** -- no isometric/hexagonal/staggered, and only a single tileset per layer.
- **TilemapGPULayer requires manual texture regeneration.** After `putTileAt` or other edits, call `generateLayerDataTexture()` or the changes won't appear.
- **"Collection of Images" tilesets are not supported.** The Tiled parser requires all tiles in a tileset to be in a single image; embedded tilesets in the exported JSON are required.
- **Tile index -1 means empty.** Many methods return `null` for empty tiles by default. Pass `nonNull: true` to get a Tile object with `index === -1` instead.
- **`insertNull` in the tilemap factory.** `insertNull: true` stores `null` for empty tiles instead of Tile objects with index -1. Saves memory for large sparse maps but prevents dynamic tile placement in empty cells.
- **Tile callbacks only fire with active physics.** `setTileIndexCallback` and `setTileLocationCallback` require a physics collider or overlap between the body and the layer.
- **Layer position and Tiled offset.** If `x` and `y` are not specified in `createLayer`, they default to the layer offset defined in Tiled, not (0, 0).
</gotchas>
</tilemaps>
