<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Phaser 4: data manager

<data_manager>
Use this when storing runtime key-value data on game objects, scenes, or globally in Phaser 4, listening for data change events, or managing reactive game state. The DataManager provides runtime key-value storage with event-driven change tracking at three levels: per-GameObject (`sprite.setData`/`getData`), per-Scene (`this.data`), and global (`this.registry`).

<quick_start>
```js
// Per-GameObject data (auto-creates DataManager on first use)
const gem = this.add.sprite(100, 100, 'gem');
gem.setData('value', 50);
gem.setData({ color: 'red', level: 2 });
gem.getData('value');            // 50
gem.getData(['value', 'color']); // [50, 'red']

// Increment / toggle helpers
gem.incData('value', 10);       // value is now 60
gem.incData('value', -5);       // value is now 55 (negative to decrement)
gem.toggleData('active');        // false -> true (starts from false if unset)

// Scene-level data (this.data is a DataManagerPlugin)
this.data.set('score', 0);
this.data.get('score');          // 0
this.data.values.score += 100;   // triggers changedata event

// Global registry (shared across ALL scenes)
this.registry.set('highScore', 9999);
this.registry.get('highScore');  // 9999, readable from any scene
```
</quick_start>

<core_concepts>
`Phaser.Data.DataManager` is the base class storing key-value pairs in an internal `list` object. Core methods: `set(key, value)` (stores a value; emits `setdata` for a new key or `changedata` + `changedata-{key}` for an existing one; accepts an object to set multiple keys), `get(key)` (retrieves a value, or pass an array of keys for an array of values), `inc(key, amount)` (increments numeric value, default +1, creates from 0 if missing), `toggle(key)` (flips a boolean, creates from `false` if missing), `remove(key)` (deletes a key, emits `removedata`, accepts an array), `has(key)`, `getAll()` (shallow copy of all pairs as a plain object), `query(regex)` (entries whose keys match a RegExp), `each(callback, context, ...args)` (iterates; callback `(parent, key, value, ...args)`), `merge(data, overwrite)` (bulk import; `overwrite` defaults `true`), `pop(key)` (get and delete in one call), `reset()` (clears all data and unfreezes), `freeze` / `setFreeze(bool)` (when frozen, all writes silently no-op), and `count` (read-only entry count).

The `values` proxy object allows direct property access with event emission:
```js
// After set('gold', 100), you can do:
data.values.gold += 50; // emits changedata and changedata-gold
// But you MUST use set() to create a key first — direct assignment
// to values for a new key will NOT set up the event proxy.
```

`Phaser.Data.DataManagerPlugin` extends DataManager and is registered as the `data` scene plugin (`this.data` in any Scene). It uses the Scene's event emitter (`scene.sys.events`), so data events fire on the Scene's event bus:
```js
this.data.set('lives', 3);
this.events.on('changedata-lives', (scene, value, previousValue) => {
    console.log('Lives changed from', previousValue, 'to', value);
});
```
The plugin auto-cleans on scene shutdown (removes its shutdown listener) and fully destroys on scene destroy.

The registry is a plain `DataManager` instance on the `Game` object (`game.registry`), with its own dedicated `EventEmitter` (not shared with any scene). Every scene gets a reference as `this.registry`. It persists for the lifetime of the Game and is never automatically cleared on scene restart or shutdown:
```js
this.registry.set('currentLevel', 1);                 // Scene A sets
const level = this.registry.get('currentLevel');      // Scene B reads
// Listen for registry changes (events fire on registry.events, NOT this.events)
this.registry.events.on('changedata-currentLevel', (game, value, previousValue) => {});
```

GameObjects do NOT have a DataManager by default — it is created lazily on first call to `setData()`, `getData()`, `incData()`, or `toggleData()` (or explicitly via `setDataEnabled()`). The DataManager's event emitter is the GameObject itself, so data events fire directly on the GameObject:
```js
const player = this.add.sprite(0, 0, 'player');
player.setData('hp', 100);
player.on('changedata-hp', (gameObject, value, previousValue) => {
    if (value <= 0) { gameObject.destroy(); }
});
```
</core_concepts>

<common_patterns>
Setting and getting:
```js
sprite.setData('speed', 200);
sprite.getData('speed'); // 200
sprite.setData({ speed: 200, direction: 'left', hp: 100 }); // object form
const [speed, hp] = sprite.getData(['speed', 'hp']);         // batch get
sprite.data.values.speed = 300; // emits changedata event (after initial set)
```

Listening for changes — prefer key-specific listeners for performance:
```js
sprite.on('changedata', (gameObject, key, value, previousValue) => {}); // ANY change
sprite.on('changedata-hp', (gameObject, value, previousValue) => {       // SPECIFIC key (preferred)
    this.hpBar.setValue(value);
});
sprite.on('setdata', (gameObject, key, value) => {});    // new key set (first time)
sprite.on('removedata', (gameObject, key, value) => {}); // key removed
```

Global registry for cross-scene state:
```js
// HUD scene watches for score changes set by the Game scene
this.registry.events.on('changedata-score', (game, value) => {
    this.scoreText.setText('Score: ' + value);
});
this.events.once('shutdown', () => {
    this.registry.events.off('changedata-score');
});
// In GameScene.update():
this.registry.set('score', this.score);
```

Complex data and the object-mutation trap:
```js
sprite.setData('inventory', ['sword', 'shield']);
sprite.setData('stats', { str: 10, dex: 8, int: 12 });

// CAUTION: mutating a stored object/array does NOT trigger changedata
const inv = sprite.getData('inventory');
inv.push('potion');                  // No event fired! The reference didn't change.
sprite.setData('inventory', [...inv]); // new array reference triggers changedata
```

Merging, querying, and freezing:
```js
sprite.data.merge({ hp: 100, speed: 200, armor: 0 }, false); // only sets keys that don't exist
sprite.data.merge(savedState, true);                          // overwrite existing

this.data.set('enemy_1_hp', 50);
this.data.set('enemy_2_hp', 80);
this.data.set('player_hp', 100);
const enemyData = this.data.query(/^enemy_/); // { enemy_1_hp: 50, enemy_2_hp: 80 }

sprite.data.freeze = true;       // set, remove, inc, toggle all become no-ops
sprite.setData('hp', 0);          // silently ignored
sprite.data.freeze = false;
sprite.data.setFreeze(true);      // chainable equivalent
```
</common_patterns>

<persistence>
The DataManager, `this.data`, and `this.registry` are runtime state only. They are not persistence and must not be used as storage that survives reloads.

Only persistence path: define a Base44 entity schema (for example `base44/entities/GameScore.jsonc`) and read/write it with the SDK (`base44.entities.*`) from React (`GamePage.jsx` or the game parent). A Phaser scene must never import `@/api/base44Client` or call the SDK.

Do not persist game data in `localStorage`, auth profile fields, `this.registry`, `this.data`, module globals, config files, or asset URLs.

Flow:
1. Phaser emits an `EventBus` event with final/progress data.
2. React handles the event and calls `base44.entities.<Entity>.create/filter/update/delete`.
3. React passes loaded entity data back into Phaser through `EventBus` as runtime state.

```js
// Phaser scene: emit data, do not import or call the SDK here.
EventBus.emit('score-final', { score: this.score, level: this.level });

const onScoresLoaded = (scores) => this.registry.set('leaderboard', scores);
EventBus.on('scores-loaded', onScoresLoaded);
this.events.once('shutdown', () => EventBus.off('scores-loaded', onScoresLoaded));
```

```jsx
// React page/parent: the only persistence layer.
import { base44 } from '@/api/base44Client';
import { EventBus } from '@/game/EventBus';

useEffect(() => {
  const saveScore = ({ score, level }) => {
    void base44.entities.GameScore.create({ score, level });
  };
  const loadScores = async () => {
    const scores = await base44.entities.GameScore.filter({}, '-score', 10);
    EventBus.emit('scores-loaded', scores);
  };

  EventBus.on('score-final', saveScore);
  void loadScores();
  return () => EventBus.off('score-final', saveScore);
}, []);
```

Define the entity schema in the same response as the code that uses it so `base44.entities.<Entity>` exists. Leaderboards use open `read` and owner-scoped writes; never pass owner fields manually.
</persistence>

<events>
All data events are defined in `Phaser.Data.Events`. The emitter depends on context: for GameObjects it is the GameObject itself; for scene data it is `scene.sys.events` (so `this.events`); for the registry it is `registry.events`.

- `SET_DATA` (`'setdata'`) — a new key is created. Args `(parent, key, value)`.
- `CHANGE_DATA` (`'changedata'`) — an existing key's value changes. Args `(parent, key, value, previousValue)`.
- `CHANGE_DATA_KEY` (`'changedata-'`) — a specific key changes; append the key name. Args `(parent, value, previousValue)` — note `key` is omitted.
- `REMOVE_DATA` (`'removedata'`) — a key is removed. Args `(parent, key, value)`.
- `DESTROY` (`'destroy'`) — the DataManager's parent is destroyed. No args.

The `parent` argument is the owner of the DataManager (the GameObject, Scene, or Game instance). `CHANGE_DATA_KEY` is a prefix — the actual event string is `'changedata-'` + the key name (e.g. setting `score` emits `'changedata-score'`). The key-specific `changedata-{key}` fires only for that exact key; the generic `changedata` fires for every key change.
</events>

<copies_vs_live_references>
Understanding `get()` vs `values` is critical for correct updates:
```js
// get() returns a copy for primitives — modifying the local variable does NOT update the DataManager
let score = this.data.get('score');
score += 10;  // local copy only, DataManager still has the old value

// values provides a live proxy — assignment triggers CHANGE_DATA event
this.data.values.score += 10;  // updates the DataManager AND emits changedata-score

// For objects, get() returns the stored reference (not a deep copy)
const stats = this.data.get('stats');
stats.hp -= 10; // mutates the stored object but does NOT trigger events
this.data.set('stats', { ...stats }); // re-set with new reference to trigger event
```
</copies_vs_live_references>

<gotchas>
- **Keys are case-sensitive.** `'gold'` and `'Gold'` are two different keys. Be consistent.

- **`values` proxy requires `set()` first.** You must call `set(key, value)` to create a key before modifying it via `data.values.key`. Direct assignment to `values` for a brand-new key creates a plain property that emits no events.

- **Object/array mutation does not trigger events.** Mutating a stored object/array in place does not emit `changedata` because the reference has not changed. Re-set the key with a new reference to trigger the event.

- **Registry listeners persist across scene restarts.** The registry lives on the Game object, so listeners on `this.registry.events` are NOT cleaned up on scene restart. Always remove them on `SHUTDOWN`:
```js
create() {
    const handler = (game, value) => { this.updateHUD(value); };
    this.registry.events.on('changedata-score', handler);
    this.events.once('shutdown', () => {
        this.registry.events.off('changedata-score', handler);
    });
}
```

- **Frozen DataManagers fail silently.** When `freeze` is `true`, all writes (`set`, `remove`, `inc`, `toggle`, `pop`, `merge`) silently do nothing — no error, no event. `setFreeze(true)` takes effect immediately, so freezing mid-batch silently no-ops subsequent writes; freeze only after all writes are complete.

- **Scene Data Plugin shutdown vs destroy.** The plugin removes its shutdown listener on shutdown but does NOT clear data on shutdown — data persists across restart. It only fully resets on scene destroy. For a clean slate on restart, manually `this.data.reset()` in a shutdown listener.

- **`inc()` on non-numeric values.** `inc()` uses the `+` operator: on strings it concatenates, on booleans they coerce to 0/1. Only use it on keys you know hold numbers.

- **`reset()` emits no events.** It clears all data silently — no `removedata` fires for the deleted keys. If you need removal events, iterate and call `remove()` per key.

- **`getAll()` returns a snapshot.** It returns a new plain object each time, a shallow copy — primitives are independent but object/array values still share references with internal storage.

- **First argument differs by event.** The generic `changedata` callback receives `(parent, key, value, previousValue)`; the key-specific `changedata-{key}` callback omits `key`: `(parent, value, previousValue)`.
</gotchas>
</data_manager>
