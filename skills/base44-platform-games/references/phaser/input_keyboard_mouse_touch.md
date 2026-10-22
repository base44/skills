<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: input keyboard mouse touch

<input_keyboard_mouse_touch>
Use this when handling user input in Phaser 4: keyboard keys, mouse clicks and movement, touch events, pointer handling, drag and drop, hit areas, interactive objects, and gamepad support. Input can be handled through event listeners or by polling state each frame.

<quick_start>
```js
class MyScene extends Phaser.Scene {
    create() {
        // Keyboard: create cursor keys (up, down, left, right, space, shift)
        this.cursors = this.input.keyboard.createCursorKeys();

        // Keyboard: listen for a specific key event
        this.input.keyboard.on('keydown-SPACE', (event) => {
            console.log('Space pressed');
        });

        // Pointer: listen for click/tap anywhere on the game canvas
        this.input.on('pointerdown', (pointer) => {
            console.log('Clicked at', pointer.x, pointer.y);
        });

        // Pointer: make a Game Object interactive and clickable
        const sprite = this.add.sprite(400, 300, 'player');
        sprite.setInteractive();
        sprite.on('pointerdown', (pointer, localX, localY, event) => {
            console.log('Sprite clicked at local', localX, localY);
        });
    }

    update() {
        // Poll cursor keys each frame
        if (this.cursors.left.isDown) { /* move left */ }
        if (this.cursors.right.isDown) { /* move right */ }
        if (Phaser.Input.Keyboard.JustDown(this.cursors.space)) {
            // fire once per press
        }
    }
}
```
</quick_start>

<core_concepts>
The input plugin (`this.input`) is an `EventEmitter` accessed in any Scene that handles all input for that Scene. Key properties: `enabled` (toggle input processing), `topOnly` (default `true` — only emit events from the top-most object under the pointer), `keyboard` (KeyboardPlugin), `gamepad` (GamepadPlugin), `mouse` (MouseManager), `activePointer` (most recently active Pointer), `mousePointer` (pointers[0], distinct from pointer1 = first touch), `pointer1`–`pointer10`, `dragDistanceThreshold` (px before drag starts), `dragTimeThreshold` (ms before drag starts), `pollRate` (-1 = poll only on movement, 0 = every frame). Key methods: `addPointer(quantity)` for multi-touch (default 2, max 10), `setHitArea*` family (`setHitAreaCircle`, `setHitAreaEllipse`, `setHitAreaRectangle`, `setHitAreaTriangle`, `setHitAreaFromTexture`), `setDraggable(gameObjects, value)`, `makePixelPerfect(alphaTolerance)`.

A `Pointer` encapsulates both mouse and touch. Key properties: `x`/`y` (screen space), `worldX`/`worldY` (through the most recent Camera), `downX`/`downY`, `upX`/`upY`, `isDown` (any button held), `primaryDown` (primary button held), `button` (0=left, 1=middle, 2=right), `buttons` (bitmask: 1=left, 2=right, 4=middle, 8=back, 16=forward), `wasTouch`, `velocity` (Vector2), `angle`, `distance`, `movementX`/`movementY` (when locked), `deltaX`/`deltaY`/`deltaZ` (wheel), `locked`, `camera`. Methods: `leftButtonDown()` / `rightButtonDown()` / `middleButtonDown()` / `backButtonDown()` / `forwardButtonDown()`, the `*Released()` variants, `getDistance()` / `getDistanceX()` / `getDistanceY()`, `getDuration()`, `getAngle()`, `updateWorldPoint(camera)`, `positionToCamera(camera, output)`.

Call `gameObject.setInteractive()` to enable input — it uses the texture frame as the hit area by default:
```js
sprite.setInteractive();   // default hit area from texture

// Custom shape hit areas
sprite.setInteractive(new Phaser.Geom.Circle(32, 32, 32), Phaser.Geom.Circle.Contains);
sprite.setInteractive(new Phaser.Geom.Ellipse(50, 50, 100, 60), Phaser.Geom.Ellipse.Contains);
sprite.setInteractive(new Phaser.Geom.Triangle(0,64,32,0,64,64), Phaser.Geom.Triangle.Contains);
sprite.setInteractive(new Phaser.Geom.Polygon(points), Phaser.Geom.Polygon.Contains);

// Pixel-perfect hit testing (expensive — use sparingly)
sprite.setInteractive({ pixelPerfect: true, alphaTolerance: 1 });
sprite.setInteractive(this.input.makePixelPerfect());
sprite.setInteractive(this.input.makePixelPerfect(150));   // with alpha tolerance

// Config object with multiple options
sprite.setInteractive({
    draggable: true, dropZone: false, useHandCursor: true,
    cursor: 'pointer', pixelPerfect: true, alphaTolerance: 1
});

// Containers must specify a shape or call setSize first
container.setSize(200, 200);
container.setInteractive();
```
</core_concepts>

<keyboard>
Cursor keys return an object with `up`, `down`, `left`, `right`, `space`, `shift` Key objects:
```js
this.cursors = this.input.keyboard.createCursorKeys();
// In update():
if (this.cursors.up.isDown) { /* held */ }
if (this.cursors.space.isDown) { /* held */ }
```

`addKey` creates a single Key; `addKeys` creates several at once:
```js
const keyW = this.input.keyboard.addKey('W');                                  // by name
const keySpace = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);  // by code
const keyA = this.input.keyboard.addKey('A', true, false);                     // addKey(key, enableCapture, emitOnRepeat)

const keys = this.input.keyboard.addKeys('W,S,A,D');                           // returns { W, S, A, D }
if (keys.W.isDown) { /* ... */ }

const named = this.input.keyboard.addKeys({                                     // object form, custom names
    up: Phaser.Input.Keyboard.KeyCodes.W,
    down: Phaser.Input.Keyboard.KeyCodes.S,
    left: Phaser.Input.Keyboard.KeyCodes.A,
    right: Phaser.Input.Keyboard.KeyCodes.D
});
```

Polling vs events:
```js
// Polling in update()
if (keyW.isDown) { /* currently held */ }
if (keyW.isUp) { /* currently released */ }

// JustDown / JustUp — true only once per press, resets after check
if (Phaser.Input.Keyboard.JustDown(keyW)) { /* fire once */ }
if (Phaser.Input.Keyboard.JustUp(keyW)) { /* released once */ }

// checkDown with duration — throttled polling
if (this.input.keyboard.checkDown(keySpace, 250)) { /* at most once every 250ms while held */ }

// Event-driven
this.input.keyboard.on('keydown-SPACE', (event) => { /* ... */ });
this.input.keyboard.on('keyup-SPACE', (event) => { /* ... */ });
this.input.keyboard.on('keydown', (event) => { console.log(event.key); }); // any key, native DOM event

// Event on a Key object itself
const spaceBar = this.input.keyboard.addKey('SPACE');
spaceBar.on('down', (key, event) => { /* Key object + native event */ });
spaceBar.on('up', (key, event) => { /* ... */ });
```

Key object properties: `isDown`/`isUp`, `keyCode`, modifier state `altKey`/`ctrlKey`/`shiftKey`/`metaKey`, `duration` (ms held in previous cycle), `timeDown`/`timeUp`, `repeats`, `emitOnRepeat` (fires 'down' on each repeat), `enabled`.

Prevent browser defaults (captures are global across all Scenes):
```js
this.input.keyboard.addCapture('SPACE,UP,DOWN,LEFT,RIGHT');
this.input.keyboard.addCapture([ 32, 37, 38, 39, 40 ]);
this.input.keyboard.removeCapture('SPACE');
```

Common KeyCodes (access via `Phaser.Input.Keyboard.KeyCodes.SPACE` etc.): `BACKSPACE(8)`, `TAB(9)`, `ENTER(13)`, `SHIFT(16)`, `CTRL(17)`, `ALT(18)`, `ESC(27)`, `SPACE(32)`, `LEFT(37)`, `UP(38)`, `RIGHT(39)`, `DOWN(40)`, `A-Z(65-90)`, `ZERO-NINE(48-57)`, `F1-F12(112-123)`.

Key combos listen for a sequence of keys:
```js
this.input.keyboard.createCombo('PHASER');                          // string-based
this.input.keyboard.createCombo(                                    // array of codes (Konami)
    [ 38, 38, 40, 40, 37, 39, 37, 39, 66, 65, 13 ],
    { resetOnMatch: true }
);
this.input.keyboard.on('keycombomatch', (keyCombo, event) => { console.log('Combo matched!'); });
```
`createCombo(keys, config)` — `keys` is a string (each char a key) or array of codes/Key objects. Config: `resetOnWrongKey` (default true), `maxKeyDelay` (max ms between presses, 0 = no limit), `resetOnMatch` (default false), `deleteOnMatch` (default false).
</keyboard>

<mouse_and_pointer>
Scene-level pointer events fire anywhere on the canvas:
```js
this.input.on('pointerdown', (pointer, currentlyOver) => {
    // currentlyOver: array of interactive Game Objects under the pointer
});
this.input.on('pointerup', (pointer, currentlyOver) => { /* ... */ });
this.input.on('pointermove', (pointer, currentlyOver) => { /* ... */ });
this.input.on('wheel', (pointer, currentlyOver, deltaX, deltaY, deltaZ) => { /* ... */ });
```

Game Object pointer events require `setInteractive`:
```js
sprite.setInteractive();
sprite.on('pointerdown', (pointer, localX, localY, event) => {
    // localX/localY relative to the object's top-left; event.stopPropagation() halts further dispatch
});
sprite.on('pointerup',   (pointer, localX, localY, event) => { /* ... */ });
sprite.on('pointermove', (pointer, localX, localY, event) => { /* ... */ });
sprite.on('pointerover', (pointer, localX, localY, event) => { /* ... */ });
sprite.on('pointerout',  (pointer, event) => { /* ... */ });
sprite.on('wheel',       (pointer, deltaX, deltaY, deltaZ, event) => { /* ... */ });
```

Pointer events fire at three levels: (1) Game Object — `gameObject.on('pointerdown', (pointer, localX, localY, event) => {})`; (2) Scene per-object — `this.input.on('gameobjectdown', (pointer, gameObject, event) => {})`; (3) Scene global — `this.input.on('pointerdown', (pointer, currentlyOver) => {})`.

Right-click and context menu:
```js
this.input.on('pointerdown', (pointer) => {
    if (pointer.rightButtonDown()) { /* right-click */ }
});
this.input.mouse.disableContextMenu();
```

Pointer lock (FPS-style mouse capture):
```js
this.input.on('pointerdown', () => { this.input.mouse.requestPointerLock(); });
this.input.on('pointerlockchange', (event, locked) => { /* locked: boolean */ });
// Read relative movement while locked: pointer.movementX, pointer.movementY
```

Debug, topOnly, and multi-touch:
```js
this.input.enableDebug(gameObject);              // visualize hit areas
this.input.enableDebug(gameObject, 0xff00ff);
this.input.removeDebug(gameObject);

this.input.topOnly = false;                      // let all objects under pointer receive events
this.input.setTopOnly(false);
```
Multi-touch: set `config.input.activePointers` to reserve slots at startup, or call `this.input.addPointer(num)` at runtime. Access via `this.input.pointer1` through `pointer10`.
</mouse_and_pointer>

<drag_and_drop>
```js
const sprite = this.add.sprite(400, 300, 'item');
sprite.setInteractive();
this.input.setDraggable(sprite);            // or sprite.setInteractive({ draggable: true });

// Scene-level drag events
this.input.on('dragstart', (pointer, gameObject) => { gameObject.setTint(0xff0000); });
this.input.on('drag', (pointer, gameObject, dragX, dragY) => {
    gameObject.x = dragX;
    gameObject.y = dragY;
});
this.input.on('dragend', (pointer, gameObject) => { gameObject.clearTint(); });

// Drop zones
const zone = this.add.zone(600, 300, 200, 200).setRectangleDropZone(200, 200);
this.input.on('drop', (pointer, gameObject, dropZone) => {
    gameObject.x = dropZone.x;
    gameObject.y = dropZone.y;
});
this.input.on('dragenter', (pointer, gameObject, dropZone) => { /* ... */ });
this.input.on('dragleave', (pointer, gameObject, dropZone) => { /* ... */ });
this.input.on('dragover',  (pointer, gameObject, dropZone) => { /* ... */ });
```

Game Object-level drag events are also available:
```js
sprite.on('drag', (pointer, dragX, dragY) => { sprite.x = dragX; sprite.y = dragY; });
sprite.on('dragstart', (pointer, dragX, dragY) => { /* ... */ });
sprite.on('dragend',   (pointer, dragX, dragY) => { /* ... */ });
sprite.on('drop',      (pointer, dropZone) => { /* ... */ });
```

Drag thresholds:
```js
this.input.dragDistanceThreshold = 16; // must move 16px before drag starts
this.input.dragTimeThreshold = 200;    // must hold 200ms before drag starts
```
</drag_and_drop>

<gamepad>
Enable gamepads in the game config, then access via `this.input.gamepad`. Pads are `pad1` through `pad4`:
```js
const config = { input: { gamepad: true } };

this.input.gamepad.once('connected', (pad) => { console.log('Gamepad connected:', pad.id); });
if (this.input.gamepad.total > 0) {
    const pad = this.input.gamepad.pad1;
}
```

Polling gamepad state in update():
```js
update() {
    const pad = this.input.gamepad.pad1;
    if (!pad) return;

    if (pad.up) { /* d-pad up */ }              // D-pad (boolean)
    if (pad.down) { /* ... */ }
    if (pad.left) { /* ... */ }
    if (pad.right) { /* ... */ }

    if (pad.A) { /* bottom button (Xbox A / PS X) */ }   // face buttons (boolean), Xbox naming
    if (pad.B) { /* right (Xbox B / PS Circle) */ }
    if (pad.X) { /* left (Xbox X / PS Square) */ }
    if (pad.Y) { /* top (Xbox Y / PS Triangle) */ }

    if (pad.L1 > 0) { /* left shoulder (LB) */ }          // shoulders (float 0-1)
    if (pad.L2 > 0) { /* left trigger (LT) */ }
    if (pad.R1 > 0) { /* right shoulder (RB) */ }
    if (pad.R2 > 0) { /* right trigger (RT) */ }

    const lx = pad.leftStick.x;   // analog sticks (Vector2, -1 to 1)
    const ly = pad.leftStick.y;
    const rx = pad.rightStick.x;
    const ry = pad.rightStick.y;

    pad.getAxisValue(0);          // raw axis (float)
    pad.getButtonValue(0);        // raw button (float 0-1)
    pad.isButtonDown(0);          // boolean
    pad.setAxisThreshold(0.1);    // ignore values below threshold
}
```

Gamepad events:
```js
// Plugin-level (any gamepad)
this.input.gamepad.on('connected', (pad, event) => { /* ... */ });
this.input.gamepad.on('disconnected', (pad, event) => { /* ... */ });
this.input.gamepad.on('down', (pad, button, value) => { /* any button on any pad */ });
this.input.gamepad.on('up', (pad, button, value) => { /* ... */ });

// Gamepad-instance
pad.on('down', (index, value, button) => { /* button on this specific pad */ });
pad.on('up',   (index, value, button) => { /* ... */ });
```

Vibration (experimental, hardware/browser dependent):
```js
if (pad.vibration) {
    pad.vibration.playEffect('dual-rumble', {
        duration: 200, strongMagnitude: 1.0, weakMagnitude: 0.5
    });
}
```
</gamepad>
</input_keyboard_mouse_touch>
