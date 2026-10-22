<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: audio and sound

<audio_and_sound>
Use this when adding audio or sound to a Phaser 4 game: loading audio, playing sounds and music, volume and panning, looping, markers, audio sprites, spatial audio, and the SoundManager.

<quick_start>
`this.sound` is the SoundManager, available in any Scene. Use `play()` for fire-and-forget sounds or `add()` to retain a reference for ongoing control. Assets loaded via `this.load.audio()` in `preload()` are ready by the time `create()` runs; provide an array of URLs for cross-browser format fallback.

```js
class GameScene extends Phaser.Scene {
    preload() {
        this.load.audio('bgm', 'assets/music.mp3');
        this.load.audio('coin', ['assets/coin.ogg', 'assets/coin.mp3']);
    }

    create() {
        // Fire-and-forget (auto-destroys when complete)
        this.sound.play('coin');

        // Retained reference for ongoing control
        this.music = this.sound.add('bgm', { loop: true, volume: 0.5 });
        this.music.play();
    }
}
```
</quick_start>

<core_concepts>
Phaser auto-selects the best backend via `SoundManagerCreator.create()`. If `config.audio.noAudio` is true or the device supports neither backend, a **NoAudioSoundManager** is created (all calls are no-ops). If the device supports Web Audio and `disableWebAudio` is not true, a **WebAudioSoundManager** is created (preferred). Otherwise an **HTML5AudioSoundManager** is the fallback. Force a backend via game config: `audio: { disableWebAudio: true }` or `audio: { noAudio: true }`. Pass `audio: { context: existingAudioContext }` to reuse a WebAudio context in SPAs.

WebAudio advantages: precise timing, gapless looping, stereo panning (`StereoPannerNode`), spatial audio (`PannerNode`), per-sound gain nodes, runtime `decodeAudio()`. HTML5 Audio limitations: no spatial audio, no real stereo panning (pan fires events but no audible effect), less precise looping, and it requires an `instances` count at load time for simultaneous playback.

The SoundManager (`this.sound`) is a single shared instance across the entire game. It handles adding/playing/removing sound instances, global volume/mute/rate/detune, automatic pause/resume on tab blur (`pauseOnBlur`, default `true`), mobile audio unlocking, and the spatial audio listener position (WebAudio only).

Sound instances are created via `this.sound.add(key, config)`. A sound must exist in the audio cache (loaded via the Loader) before it can be added. Each instance has its own playback state and `volume`, `rate`, `detune`, `loop`, `pan`, and `seek` properties. State flags: `isPlaying`, `isPaused`.

```js
const sfx = this.sound.add('explosion', { volume: 0.8 });
sfx.play();        // returns boolean
sfx.pause();       // only works if isPlaying
sfx.resume();      // only works if isPaused
sfx.stop();        // resets to stopped state
sfx.destroy();     // marks for removal from manager
```
</core_concepts>

<common_patterns>
Playing sounds — fire-and-forget (`this.sound.play(key, config?)` adds, plays, and auto-destroys on completion) or retained reference (`this.sound.add(key, config?)` then `play()`):
```js
this.sound.play('explosion');
this.sound.play('powerup', { volume: 0.5, rate: 1.2 });

const laser = this.sound.add('laser');
laser.play();
// Later: laser.stop(), laser.volume = 0.3, etc.
```

Volume, rate, and detune — settable per-sound or globally on the manager; values combine (rate/detune multiply via `calculateRate()`). The effective playback rate is `sound.rate * manager.rate * detuneRate` where `detuneRate = Math.pow(1.0005777895065548, sound.detune + manager.detune)`. All `set*` methods return `this` for chaining.
```js
// Per-sound
sound.volume = 0.5;          // 0 to 1
sound.setVolume(0.5);        // chainable
sound.rate = 1.5;            // 0.5 = half speed, 2.0 = double speed
sound.detune = 200;          // cents, -1200 to 1200

// Global (affects all sounds)
this.sound.volume = 0.8;
this.sound.rate = 1.0;
this.sound.detune = 0;
```

Looping — `LOOPED` fires each time the sound loops; `LOOP` fires when the loop property changes:
```js
const bgm = this.sound.add('music', { loop: true });
bgm.play();
bgm.loop = false;
bgm.setLoop(false);  // chainable
```

Seeking — setting seek on a stopped sound has no effect:
```js
sound.seek = 5.0;        // jump to 5 seconds in
sound.setSeek(5.0);      // chainable
console.log(sound.seek);  // current playback position in seconds
```

Stereo panning — uses `StereoPannerNode` on WebAudio; on HTML5 Audio the property fires events but has no audible effect:
```js
sound.pan = -1;   // full left
sound.pan = 0;    // center
sound.pan = 1;    // full right
sound.setPan(0.5); // chainable
```

Audio sprites combine multiple sounds into one file with a JSON config (from the `audiosprite` tool); the JSON must be loaded separately. Its `spritemap` entries auto-convert to markers. You can also add markers manually to any sound via `addMarker(marker)`, `updateMarker(marker)`, `removeMarker(name)`.
```js
// In preload
this.load.audioSprite('sfx', 'assets/sfx.json', ['assets/sfx.ogg', 'assets/sfx.mp3']);

// In create
this.sound.playAudioSprite('sfx', 'explosion');
this.sound.playAudioSprite('sfx', 'coin', { volume: 0.5 });

// Or add for retained control
const sprite = this.sound.addAudioSprite('sfx');
sprite.play('explosion');

// Manual markers on any sound
const sound = this.sound.add('longtrack');
sound.addMarker({ name: 'intro', start: 0, duration: 5 });
sound.addMarker({ name: 'loop', start: 5, duration: 20, config: { loop: true } });
sound.play('intro');
sound.play('loop');   // later
```

Background music — `pauseOnBlur` (default `true`) auto-pauses all sounds when the tab loses focus:
```js
this.bgm = this.sound.add('theme', { loop: true, volume: 0.4 });
this.bgm.play();
// Stop on scene shutdown: this.bgm.stop();
```

Spatial audio (WebAudio only) uses a `PannerNode` to position sounds relative to a listener. Set `sound.x`/`sound.y` directly to reposition at any time; if `follow` is set, the position updates each frame. `setListenerPosition()` with no arguments defaults to the canvas center.
```js
this.sound.setListenerPosition(400, 300);
// Or: this.sound.listenerPosition.set(x, y);

const enemy = this.sound.add('roar', {
    source: {
        x: 800, y: 300,
        refDistance: 50, maxDistance: 2000, rolloffFactor: 1,
        distanceModel: 'inverse', panningModel: 'equalpower',
        follow: enemySprite  // auto-track a Game Object's x/y
    }
});
enemy.play();
```

Muting (per-sound or global):
```js
sound.mute = true;          sound.setMute(true);
this.sound.mute = true;     this.sound.setMute(true);
```

Querying sounds:
```js
this.sound.get('coin');          // first sound with key, or null
this.sound.getAll('coin');       // all sounds with key
this.sound.getAll();             // every sound in the manager
this.sound.getAllPlaying();      // all currently playing sounds
this.sound.isPlaying('coin');    // true if any 'coin' sound is playing
this.sound.isPlaying();          // true if any sound is playing
```

Removing and stopping:
```js
this.sound.stopAll();            // stop all, fires STOP_ALL
this.sound.stopByKey('coin');    // stop all with key, returns count
this.sound.pauseAll();           // fires PAUSE_ALL
this.sound.resumeAll();          // fires RESUME_ALL

this.sound.remove(soundInstance);  // destroy + remove specific sound
this.sound.removeByKey('coin');    // destroy + remove all with key, returns count
this.sound.removeAll();            // destroy + remove everything
```

Decoding audio at runtime (WebAudio only):
```js
this.sound.decodeAudio('key', base64StringOrArrayBuffer);
// Batch: this.sound.decodeAudio([{ key: 'sfx1', data: buf1 }, { key: 'sfx2', data: buf2 }]);
this.sound.on('decoded', (key) => { /* one done */ });
this.sound.on('decodedall', () => { /* all done */ });
```
</common_patterns>

<events>
Sound instance events (emitted on a Sound object): `PLAY` `'play'` `(sound)`, `PAUSE` `'pause'` `(sound)`, `RESUME` `'resume'` `(sound)`, `STOP` `'stop'` `(sound)`, `COMPLETE` `'complete'` `(sound)` (non-looping finish), `LOOPED` `'looped'` `(sound)`, `LOOP` `'loop'` `(sound, value)`, `MUTE` `'mute'` `(sound, value)`, `VOLUME` `'volume'`, `RATE` `'rate'`, `DETUNE` `'detune'`, `SEEK` `'seek'`, `PAN` `'pan'`, `DESTROY` `'destroy'` `(sound)`.

SoundManager events (emitted on `this.sound`): `PAUSE_ALL` `'pauseall'`, `RESUME_ALL` `'resumeall'`, `STOP_ALL` `'stopall'` (each `(manager)`); `GLOBAL_MUTE` `'globalmute'`, `GLOBAL_VOLUME` `'globalvolume'`, `GLOBAL_RATE` `'globalrate'`, `GLOBAL_DETUNE` `'globaldetune'` (each `(manager, value)`); `UNLOCKED` `'unlocked'` `(manager)` (audio system unlocked after user interaction); `DECODED` `'decoded'` `(key)` and `DECODED_ALL` `'decodedall'` `()` (WebAudio decoding).

```js
const sfx = this.sound.add('bang');
sfx.on('complete', (sound) => {
    console.log(sound.key, 'finished');
});
sfx.play();
```
</events>

<gotchas>
Browser autoplay policy — browsers block audio until user interaction, and Phaser handles unlocking automatically. On WebAudio the `AudioContext` starts suspended and Phaser listens for touch/mouse/key events on `document.body` to call `context.resume()`; the `locked` property is true until unlocked and `UNLOCKED` fires once resolved. On HTML5 Audio, locked tags queue actions until the first touch. You do not need to handle unlocking manually, but you can wait for readiness:
```js
if (this.sound.locked) {
    this.sound.once('unlocked', () => { this.sound.play('bgm'); });
} else {
    this.sound.play('bgm');
}
```

Audio format support — no single format works everywhere. Provide multiple formats: `this.load.audio('bgm', ['assets/bgm.ogg', 'assets/bgm.mp3'])`. MP3 has broadest support; OGG Vorbis lacks Safari support; AAC/M4A works on Safari/iOS; WebM/Opus has excellent quality but limited older-browser support.

HTML5 Audio simultaneous playback uses a pool of `<audio>` tags. Specify `instances` when loading for simultaneous playback: `this.load.audio('shot', 'assets/shot.mp3', { instances: 4 })` (default 1). If all tags are in use and `manager.override` is true (default), the sound with the most progress is hijacked. WebAudio has no such limit.

iOS/Safari specifics — `StereoPannerNode` is unsupported, so `pan` has no audible effect (events still fire). iOS 17/18+ can interrupt audio on background; Phaser handles this via `context.suspend()`/`context.resume()` on the `VISIBLE` game event. `setListenerPosition()` and spatial audio are WebAudio-only.

WebAudio context reuse — for SPAs that recreate the game without a full page reload, pass `audio: { context: existingAudioContext }` in config. You can also swap contexts at runtime via `this.sound.setAudioContext(newContext)` (WebAudio only).

SoundManager is shared (global) — one per game, not per scene. Sounds are not automatically cleaned up on scene shutdown; you must stop/remove them yourself. Looping sounds continue across scene changes unless explicitly stopped.

Fire-and-forget vs persistent — `this.sound.play(key)` creates a sound that auto-destroys on completion and cannot be controlled afterward. Use `this.sound.add(key)` when you need to pause, stop, adjust, or listen for events.

Spatial audio is WebAudio only — the `source` config is silently ignored on HTML5 Audio. Do not rely on spatial positioning for gameplay-critical cues if HTML5 fallback must be supported.

Web Audio Analyser (WebAudio only) — access the underlying `AudioContext` to create an `AnalyserNode` for frequency/waveform visualization. Check `this.sound.context` exists first.
```js
const analyser = this.sound.context.createAnalyser();
analyser.fftSize = 256;
this.sound.masterVolumeNode.connect(analyser);
analyser.connect(this.sound.context.destination);

const dataArray = new Uint8Array(analyser.frequencyBinCount);
// In update loop:
analyser.getByteFrequencyData(dataArray);   // drive visual effects from dataArray
```
</gotchas>
</audio_and_sound>
