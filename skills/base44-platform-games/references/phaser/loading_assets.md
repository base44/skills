<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: loading assets

<loading_assets>
Use this when loading assets in Phaser 4: the Loader plugin (`this.load`) for images, spritesheets, atlases, audio, JSON, tilemaps, bitmap fonts, and more. Assets are queued in `preload()`, loaded in parallel, and placed into global caches accessible by every Scene.

<quick_start>
```js
class GameScene extends Phaser.Scene {
    preload() {
        this.load.image('logo', 'assets/logo.png');
    }
    create() {
        this.add.image(400, 300, 'logo');
    }
}
```
Assets loaded in `preload()` are guaranteed ready when `create()` runs. The Loader starts automatically during the preload phase.
</quick_start>

<core_concepts>
Every Scene can define a `preload()` method. Queued files don't load immediately — the Loader starts when `preload()` completes and waits for all files before calling `create()`:
```js
preload() {
    this.load.image('sky', 'assets/sky.png');
    this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 });
    this.load.audio('jump', 'assets/jump.mp3');
}
create() {
    this.add.image(400, 300, 'sky');
    this.add.sprite(100, 450, 'dude');
    this.sound.play('jump');
}
```

Loading outside `preload()` (e.g. in `create()` or in response to a user action) requires manually starting the Loader:
```js
create() {
    this.load.image('extra', 'assets/extra.png');
    this.load.once('complete', () => { this.add.image(400, 300, 'extra'); });
    this.load.start();
}
```

URL resolution is `baseURL + path + filename`, set via game config or at runtime. The prefix is prepended to the cache key, NOT the URL. Absolute URLs bypass path/baseURL:
```js
preload() {
    this.load.setBaseURL('https://cdn.example.com/');
    this.load.setPath('assets/images/');
    this.load.setPrefix('LEVEL1.');
    // Loads from https://cdn.example.com/assets/images/hero.png, cached as 'LEVEL1.hero'
    this.load.image('hero', 'hero.png');
    this.load.image('cloud', 'https://other-server.com/cloud.png');  // absolute, bypasses path
}
```
These can also be set in the game config under `loader: { baseURL, path, prefix, maxParallelDownloads, crossOrigin, responseType, async, timeout, maxRetries, imageLoadType }`.

Assets go into global game-level caches, not per-Scene — an image loaded in one Scene is available everywhere. Textures go into `this.textures` (the Texture Manager); other data goes into `this.cache` sub-caches (`this.cache.json`, `this.cache.audio`, `this.cache.xml`, etc.).

The Loader emits events throughout the lifecycle — use these for progress bars and loading screens:
```js
preload() {
    this.load.on('progress', (value) => { /* value 0..1 */ });
    this.load.on('complete', () => { console.log('All assets loaded'); });
    this.load.on('loaderror', (file) => { console.warn('Failed to load:', file.key); });
    this.load.image('bg', 'assets/bg.png');
}
```
</core_concepts>

<common_patterns>
Images and sprite sheets:
```js
preload() {
    this.load.image('star', 'assets/star.png');
    this.load.image('brick', ['assets/brick.png', 'assets/brick_n.png']);  // [texture, normalMap]
    this.load.spritesheet('explosion', 'assets/explosion.png', {
        frameWidth: 64, frameHeight: 64, startFrame: 0, endFrame: 23, margin: 0, spacing: 0
    });
    this.load.svg('logo', 'assets/logo.svg', { width: 400, height: 400 });  // optional rasterize size
}
```

Audio — always provide multiple formats for cross-browser support:
```js
preload() {
    this.load.audio('bgm', 'assets/music.mp3');
    this.load.audio('bgm', ['assets/music.ogg', 'assets/music.mp3']);  // first supported wins
    this.load.audioSprite('sfx', 'assets/sfx.json', ['assets/sfx.ogg', 'assets/sfx.mp3']);
}
```

JSON and tilemaps:
```js
preload() {
    this.load.json('levelData', 'assets/level1.json');
    this.load.json('enemies', 'assets/data.json', 'enemies');         // dataKey extracts a sub-object
    this.load.tilemapTiledJSON('map', 'assets/map.json');             // Tiled JSON
    this.load.tilemapCSV('csvmap', 'assets/level.csv');
    this.load.tilemapImpact('impactmap', 'assets/level.js');
}
create() {
    const data = this.cache.json.get('levelData');
    const map = this.make.tilemap({ key: 'map' });
}
```

Atlases:
```js
preload() {
    this.load.atlas('sprites', 'assets/sprites.png', 'assets/sprites.json');  // TexturePacker JSON
    this.load.atlasXML('ui', 'assets/ui.png', 'assets/ui.xml');               // Starling/Sparrow
    this.load.multiatlas('world', 'assets/world.json', 'assets/');            // split across textures
    this.load.unityAtlas('chars', 'assets/chars.png', 'assets/chars.txt');
    this.load.aseprite('knight', 'assets/knight.png', 'assets/knight.json');
}
create() {
    this.add.sprite(400, 300, 'sprites', 'walk_01');
}
```

Bitmap fonts (need both a texture and an XML/JSON data file), video, and web fonts:
```js
preload() {
    this.load.bitmapFont('pixels', 'assets/font.png', 'assets/font.xml');
    this.load.video('intro', 'assets/intro.mp4');
    this.load.video('bg_loop', 'assets/loop.mp4', true);   // third arg = noAudio
    this.load.font('myFont', 'assets/myfont.ttf', 'truetype');
    this.load.font('boldFont', 'assets/bold.woff2', 'woff2', { weight: 'bold', style: 'normal' });
}
create() {
    this.add.bitmapText(100, 100, 'pixels', 'Hello World', 32);
}
```

Pack files — a JSON manifest describing multiple assets to load at once:
```js
preload() { this.load.pack('pack1', 'assets/pack.json'); }
```
```json
{
    "section1": {
        "baseURL": "assets/",
        "files": [
            { "type": "image", "key": "bg", "url": "bg.png" },
            { "type": "atlas", "key": "chars", "textureURL": "chars.png", "atlasURL": "chars.json" }
        ]
    }
}
```
Pack data can also be inline instead of from a URL:
```js
preload() {
    this.load.pack('manifest', {
        section1: {
            prefix: '', path: 'assets/', defaultType: 'image',
            files: [
                { type: 'image', key: 'bg', url: 'bg.png' },
                { type: 'spritesheet', key: 'player', url: 'player.png', frameConfig: { frameWidth: 32, frameHeight: 32 } }
            ]
        }
    });
}
```

Progress bar:
```js
preload() {
    const progressBar = this.add.graphics();
    const progressBox = this.add.graphics();
    progressBox.fillStyle(0x222222, 0.8);
    progressBox.fillRect(240, 270, 320, 50);

    this.load.on('progress', (value) => {
        progressBar.clear();
        progressBar.fillStyle(0xffffff, 1);
        progressBar.fillRect(250, 280, 300 * value, 30);
    });
    this.load.on('complete', () => { progressBar.destroy(); progressBox.destroy(); });

    this.load.image('sky', 'assets/sky.png');
    // ... more assets
}
```

All `this.load` methods accept positional arguments or a single config object, and an array of config objects to batch-load. Available file types: textures (`image`, `spritesheet`, `atlas`, `atlasXML`, `multiatlas`, `unityAtlas`, `aseprite`, `svg`, `htmlTexture`, `texture`), audio/video (`audio`, `audioSprite`, `video`), data (`json`, `xml`, `text`, `binary`, `html`, `css`, `glsl`), fonts (`bitmapFont`, `font`), tilemaps (`tilemapTiledJSON`, `tilemapCSV`, `tilemapImpact`), and `animation`, `pack`, `script`, `scripts`, `plugin`, `scenePlugin`, `sceneFile`.
</common_patterns>

<events>
All events are emitted on the Loader instance (`this.load`):
- `'addfile'` `(key, type, loader, file)` — a file was added to the queue
- `'start'` `(loader)` — Loader started, progress is zero
- `'load'` `(file)` — a single file finished downloading (before processing/caching)
- `'fileprogress'` `(file, percentComplete)` — per-file download progress (0-1); only fires if the browser provides `lengthComputable`
- `'progress'` `(value)` — overall load progress (0-1)
- `'postprocess'` `(loader)` — all files loaded and processed, before internal cleanup
- `'filecomplete'` `(key, type, data)` — any file finished loading and processing
- `'filecomplete-{type}-{key}'` `(key, type, data)` — a specific file finished (e.g. `'filecomplete-image-hero'`)
- `'loaderror'` `(file)` — a file failed to load
- `'complete'` `(loader, totalComplete, totalFailed)` — all files done

Lifecycle order: `start` → `fileprogress` (repeats per file) → `load` → `filecomplete-{type}-{key}` → `filecomplete` → `progress` → `postprocess` → `complete`.
</events>

<advanced>
Scene payload — load files before `preload()` runs by defining a `pack` in the Scene constructor (useful for progress-bar assets):
```js
class BootScene extends Phaser.Scene {
    constructor() {
        super({
            key: 'BootScene',
            pack: { files: [ { type: 'image', key: 'bar', url: 'loaderBar.png' } ] }
        });
    }
    // 'bar' is already available in preload()
}
```

Adding files mid-load — chain dependent loads via the per-file completion event:
```js
preload() {
    this.load.json('level1', 'level1.json');
    this.load.on('filecomplete-json-level1', (key, type, data) => {
        this.load.image(data.images);
        this.load.spritesheet(data.spritesheets);
    });
}
```

Cache system — loaded assets go into global caches shared across Scenes. Textures live in `this.textures`; other types in typed sub-caches under `this.cache` (`text`, `json`, `audio`, `binary`, `shader`, `xml`):
```js
const json = this.cache.json.get('levelData');
const text = this.cache.text.get('dialogue');

this.cache.json.exists('levelData');   // or .has('levelData')
this.textures.exists('hero');

this.textures.remove('hero');          // free memory
this.cache.audio.remove('bgm');

this.textures.on('addtexture-mapKey', (texture) => {
    // Another scene loaded 'mapKey' — now available here
});
```
</advanced>

<gotchas>
- Keys must be unique within their type. A second `this.load.image('bg', ...)` is silently ignored if `'bg'` already exists. Remove the old texture (`this.textures.remove`) first to replace it.
- A sprite sheet is not an atlas. Use `spritesheet()` for fixed-size grids referenced by index; use `atlas()` for packed textures with named frames.
- Outside `preload()` the Loader does NOT auto-start — call `this.load.start()` manually.
- Path must end with `/`. `this.load.setPath()` appends the slash automatically; setting `this.load.path` directly requires the trailing slash yourself.
- Always provide multiple audio formats (OGG + MP3 minimum) — the Loader picks the first the browser supports.
- Pack file sections can each override `baseURL`/`path`/`prefix`; those apply only within the section and are restored after.
- The cache key includes the prefix. With `setPrefix('MENU.')`, an image keyed `'bg'` is cached as `'MENU.bg'` — reference it by the full key.
- `maxRetries` (default 2) is captured per-file at creation time; changing it afterward has no effect on already-queued files.
- `imageLoadType: 'HTMLImageElement'` in the loader config uses `<img>` tag loading instead of XHR blobs, which can help with CORS in some environments.
- `file://` and `capacitor://` are treated as local schemes (via `localSchemes`) and skip CORS headers.
- Set `crossOrigin: 'anonymous'` (or `this.load.setCORS('anonymous')`) when loading from another domain, especially for WebGL textures.
- Keys are case-sensitive and scoped per type — `'Player'` ≠ `'player'`; an image and audio asset can share key `'player'`.
- Scene `update()` does NOT fire during preload (it's paused), but `preupdate`, `postupdate`, and `render` still fire.
- Progress can decrease — if files are added mid-load (e.g. via `filecomplete` chaining), the value drops because total count rose.
</gotchas>
</loading_assets>
