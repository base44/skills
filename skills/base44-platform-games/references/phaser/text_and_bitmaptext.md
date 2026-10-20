<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Phaser 4: text and bitmaptext

<text_and_bitmaptext>
Use this when displaying text in Phaser 4: the Canvas-based Text game object, TextStyle configuration, word wrap, BitmapText (static and dynamic), retro fonts, alignment, text bounds, and padding.

In Base44 games this section applies to IN-WORLD text: damage numbers, floating labels, speech bubbles anchored to characters, per-frame counters rendered inside the world. Screen-space UI text — menus, score/lives HUD, game-over screens — is built in the React overlay instead (see the screen_space_ui rules in react_phaser_architecture).

<quick_start>
```js
// Canvas-based Text (flexible styling, uses browser fonts)
const title = this.add.text(400, 50, 'Hello World', {
    fontFamily: 'Arial',
    fontSize: '32px',
    color: '#ffffff'
});

// BitmapText (pre-rendered font texture, faster rendering)
// Font must be loaded first: this.load.bitmapFont('myFont', 'font.png', 'font.xml')
const score = this.add.bitmapText(400, 100, 'myFont', 'Score: 0', 32);

// DynamicBitmapText (per-character manipulation via callback)
const fancy = this.add.dynamicBitmapText(400, 200, 'myFont', 'Wavy!', 32);
fancy.setDisplayCallback(function (data) {
    data.y += Math.sin(data.index * 0.5 + fancy.scene.time.now * 0.005) * 10;
    return data;
});
```
</quick_start>

<core_concepts>
**Text vs BitmapText.** `Text` renders via the Canvas 2D API (uploaded as a texture); supports web/CSS fonts, shadows, gradients, strokes, built-in word wrap, justify alignment, and RTL; slower (re-creates the canvas texture on every change). `BitmapText` uses a pre-rendered font texture; no web fonts; drop shadow only (WebGL); `setMaxWidth` wrap; per-character/word tinting (WebGL); fast batched rendering; alignment via `ALIGN_LEFT` (0), `ALIGN_CENTER` (1), `ALIGN_RIGHT` (2). `DynamicBitmapText` is the same as BitmapText plus a per-character `setDisplayCallback` for animation effects (moderate cost).

Rule of thumb: use `Text` for infrequently-updated in-world text needing flexible styling or web fonts. Use `BitmapText` for in-world text that updates frequently or is rendered in large quantities (damage numbers, combo counters). Use `DynamicBitmapText` only when you need per-character animation.

**TextStyle.** The `Text` object delegates all styling to its `TextStyle` instance (`text.style`). Pass a style config when creating the Text, or update it later with setter methods; the style object uses Canvas 2D properties internally. Defaults: `fontFamily` `'Courier'`, `fontSize` `'16px'`, `color` `'#fff'`. The `font` shorthand (e.g. `'bold 24px Arial'`) overrides `fontFamily`, `fontSize`, and `fontStyle` when provided. Other notable style properties: `stroke` + `strokeThickness`, `backgroundColor`, `align` (`left`/`right`/`center`/`justify`), `maxLines`, `fixedWidth` / `fixedHeight`, `resolution`, `rtl`, `wordWrap` (`{ width, callback, callbackScope, useAdvancedWrap }`), `shadow` (`{ offsetX, offsetY, color, blur, stroke, fill }`), `padding`, `lineSpacing`, `letterSpacing`, `metrics` (pre-computed `{ ascent, descent, fontSize }` to skip measurement).
</core_concepts>

<common_patterns>
Basic Text creation:
```js
const label = this.add.text(100, 100, 'Player 1', {
    fontFamily: 'Georgia', fontSize: '24px', color: '#00ff00'
});

// font shorthand (sets fontStyle, fontSize, fontFamily)
const bold = this.add.text(100, 150, 'Bold Text', { font: 'bold 28px Arial' });

// Array of strings creates multi-line text
const multi = this.add.text(100, 200, ['Line 1', 'Line 2', 'Line 3'], {
    fontFamily: 'Arial', fontSize: '18px', color: '#ffffff'
});

// Text origin defaults to (0, 0) -- top-left. Center it:
label.setOrigin(0.5);
```

Styling Text (all setters return `this`):
```js
const text = this.add.text(400, 300, 'Styled', {
    fontFamily: 'Verdana', fontSize: '48px', color: '#ff0000',
    stroke: '#000000', strokeThickness: 4, backgroundColor: '#333333',
    shadow: { offsetX: 2, offsetY: 2, color: '#000', blur: 4, stroke: false, fill: true }
});

text.setColor('#00ffff');
text.setFontSize(64);
text.setFontFamily('Courier');
text.setFontStyle('italic');
text.setStroke('#ff00ff', 6);
text.setShadow(3, 3, '#000', 5, false, true);
text.setBackgroundColor('#222');
text.setStyle({ fontSize: '64px', fontFamily: 'Arial', color: '#ffffff', align: 'center' });  // replace all

// Canvas gradients and patterns work as fill/stroke
const gradient = text.context.createLinearGradient(0, 0, 0, text.height);
gradient.addColorStop(0, '#ff0000');
gradient.addColorStop(1, '#0000ff');
text.setFill(gradient);
```

Word wrap and alignment:
```js
const wrapped = this.add.text(50, 50, 'Long text here...', {
    fontFamily: 'Arial', fontSize: '20px', color: '#fff', wordWrap: { width: 300 }
});
wrapped.setWordWrapWidth(300);
wrapped.setWordWrapWidth(300, true);  // advanced: collapses spaces, trims whitespace
wrapped.setWordWrapCallback(function (text, textObject) {
    return text.split(' ').join('\n');  // return string with \n or array of lines
});
const lines = wrapped.getWrappedText();

// Alignment only affects multi-line text: 'left' (default), 'right', 'center', 'justify'
const aligned = this.add.text(400, 100, 'Line 1\nLonger Line 2\nLine 3', {
    fontFamily: 'Arial', fontSize: '24px', color: '#fff', align: 'center'
});
aligned.setAlign('right');
// For center alignment to look correct, combine with a fixed width:
aligned.setFixedSize(300, 0);
aligned.setAlign('center');
```

Dynamic updates, padding, fixed size, spacing:
```js
const comboText = this.add.text(10, 10, 'Combo: 0', { fontFamily: 'Arial', fontSize: '24px', color: '#fff' });
comboText.setText('Combo: 12');
comboText.setText(['Combo: 12', 'Best: 30']);   // joins with \n
comboText.appendText('Extra line');             // prepends \n by default
comboText.appendText(' more', false);           // no carriage return
const current = comboText.text;

// Padding adds space around text inside the canvas
const padded = this.add.text(100, 100, 'Padded', {
    fontFamily: 'Arial', fontSize: '24px', color: '#fff', backgroundColor: '#333',
    padding: { left: 10, right: 10, top: 5, bottom: 5 }
});
padded.setPadding({ x: 10, y: 5 });  // shorthand: x=left+right, y=top+bottom
padded.setPadding(10, 5, 10, 5);     // left, top, right, bottom
padded.setPadding(10);               // single value = all sides

// Fixed dimensions create a text canvas of exact size
const fixed = this.add.text(100, 100, 'Fixed box', {
    fontFamily: 'Arial', fontSize: '18px', color: '#fff',
    fixedWidth: 200, fixedHeight: 100, wordWrap: { width: 200 }, align: 'center'
});
fixed.setMaxLines(3);

// Line and letter spacing
const spaced = this.add.text(100, 200, 'Spaced\nLines', {
    fontFamily: 'Arial', fontSize: '24px', color: '#fff', lineSpacing: 10, letterSpacing: 2
});
spaced.setLineSpacing(20);
spaced.setLetterSpacing(5);
```

BitmapText creation, alignment, shadow, tinting:
```js
// Load in preload: this.load.bitmapFont('pixelFont', 'font.png', 'font.xml');
const bmpText = this.add.bitmapText(100, 100, 'pixelFont', 'Hello', 32);

// align: 0 = left, 1 = center, 2 = right
const aligned = this.add.bitmapText(100, 200, 'pixelFont', 'Line 1\nLine 2', 24, 1);
bmpText.setLeftAlign();
bmpText.setCenterAlign();
bmpText.setRightAlign();

bmpText.setText('Updated!');   // or: bmpText.text = 'Also works';
bmpText.setFontSize(48);       // or: bmpText.fontSize = 48;
bmpText.setLetterSpacing(2);
bmpText.setLineSpacing(5);
bmpText.setMaxWidth(200);      // word wrap by max pixel width

// Drop shadow (WebGL only, static BitmapText only); call with no args to clear
bmpText.setDropShadow(2, 2, 0x000000, 0.5);
bmpText.setDropShadow();

// Tint characters/words (WebGL only)
// setCharacterTint(start, length, tintMode, color) -- length -1 = all from start
bmpText.setCharacterTint(0, 5, Phaser.TintModes.MULTIPLY, 0xff0000);
bmpText.setWordTint('Score', -1, Phaser.TintModes.MULTIPLY, 0x00ff00);  // by string match or word index
```

DynamicBitmapText:
```js
const dynamic = this.add.dynamicBitmapText(100, 100, 'pixelFont', 'Dynamic!', 32);

// Per-character display callback -- invoked each render frame per character
// data: { parent, tint, index, charCode, x, y, scale, rotation, data }
dynamic.setDisplayCallback(function (data) {
    data.x += Math.sin(data.index + dynamic.scene.time.now * 0.01) * 5;
    data.y += Math.cos(data.index + dynamic.scene.time.now * 0.01) * 5;
    return data;
});

// Scrolling text window
dynamic.setSize(200, 50);   // crop region in pixels
dynamic.setScrollX(10);
dynamic.setScrollY(0);
```

Retro fonts use a fixed-width character grid from a standard image (no XML/JSON font file):
```js
this.load.image('retroFont', 'retroFont.png');  // in preload

const config = {
    image: 'retroFont',
    width: 8, height: 8,          // character size in pixels
    chars: Phaser.GameObjects.RetroFont.TEXT_SET1,
    charsPerRow: 16,
    offset: { x: 0, y: 0 }, spacing: { x: 0, y: 0 }, lineSpacing: 0
};
this.cache.bitmapFont.add('retroFont', { data: Phaser.GameObjects.RetroFont.Parse(this, config) });
const retro = this.add.bitmapText(100, 100, 'retroFont', 'RETRO TEXT', 8);  // use like any BitmapText
```
Available `Phaser.GameObjects.RetroFont` TEXT_SET constants: `TEXT_SET1` (full ASCII printable), `TEXT_SET2` (space through Z), `TEXT_SET3`-`TEXT_SET11` (subsets of uppercase, digits, punctuation). `TEXT_SET10` is uppercase letters only.

Text bounds (BitmapText) and high-DPI resolution:
```js
const bounds = bmpText.getTextBounds();
// bounds.local      -- { x, y, width, height } at origin 0,0
// bounds.global     -- with scale + world position
// bounds.lines      -- per-line rects
// bounds.words      -- word objects with positions
// bounds.characters -- character objects with positions
console.log(bmpText.width, bmpText.height);  // read-only, computed from global bounds
const char = bmpText.getCharacterAt(pointer.worldX, pointer.worldY);  // for click detection

// Higher resolution for crisp text on HiDPI displays (costs more memory)
const crisp = this.add.text(100, 100, 'Sharp!', {
    fontFamily: 'Arial', fontSize: '24px', color: '#fff', resolution: 2
});
crisp.setResolution(window.devicePixelRatio);
```
</common_patterns>

<factory_methods>
```js
// Text -- Canvas-based. text: string | string[]; style: optional. Returns Phaser.GameObjects.Text
this.add.text(x, y, text, style);

// BitmapText -- static, fast. font: cache key; text: optional; size: optional (defaults to font data size); align: optional (0). Returns Phaser.GameObjects.BitmapText
this.add.bitmapText(x, y, font, text, size, align);

// DynamicBitmapText -- per-character callback. Same args as bitmapText. Returns Phaser.GameObjects.DynamicBitmapText
this.add.dynamicBitmapText(x, y, font, text, size);
```
BitmapText alignment constants: `BitmapText.ALIGN_LEFT` (0), `BitmapText.ALIGN_CENTER` (1), `BitmapText.ALIGN_RIGHT` (2).
</factory_methods>

<gotchas>
- **Text re-renders on every change.** Each `setText`/`setStyle`/`setColor` re-creates the internal canvas and (in WebGL) re-uploads the texture. Batch style changes -- set the style object properties directly and call `updateText()` once at the end.
- **Font must be loaded before use.** Text uses the Canvas `fillText` API, so fonts must be available in the browser (CSS, a web font loader, or already installed). Phaser does not load web fonts.
- **Font names with special characters need quotes.** Names with digits or special characters must be double-quoted: `fontFamily: '"Press Start 2P"'`.
- **Text origin defaults to (0, 0)** (top-left), unlike Sprites (0.5, 0.5). Call `setOrigin(0.5)` to center.
- **Alignment only affects multi-line text.** `align: 'center'` does nothing on a single line -- use `setOrigin(0.5)` or manual positioning.
- **BitmapText font must be in cache.** The key passed to `this.add.bitmapText()` must match a key loaded via `this.load.bitmapFont()`, else a console warning and undefined behavior.
- **BitmapText `setMaxWidth` only wraps on whitespace.** If no whitespace (default char code 32) is found, no wrapping occurs. Change the wrap character with the second argument.
- **DynamicBitmapText is more expensive** -- the display callback runs for every character every frame. Use only when you need per-character manipulation.
- **`setCharacterTint` and `setWordTint` are WebGL only** -- no effect in Canvas renderer.
- **`setDropShadow` is WebGL only and static BitmapText only** -- not DynamicBitmapText or Canvas renderer.
- **`letterSpacing` on Text is expensive** -- non-zero spacing renders each character individually with `fillText`. Use BitmapText for large amounts of letter-spaced text.
- **`setFill` and `setColor` are equivalent** -- both set the `color` property; the style config also accepts `fill` as an alias.
- **`setRTL` must be called BEFORE `setText`.** RTL mode changes how the internal canvas is constructed. Set it in the style config or call `setRTL()` before any `setText()`.
- **BitmapText is much faster for frequently updating content.** Text re-renders the whole canvas and re-uploads the GPU texture on every change; BitmapText just updates vertex data. For damage numbers, combo counters, or any per-frame in-world text, always prefer BitmapText. (Score/timer HUD readouts belong in the React overlay, not Phaser text.)
</gotchas>
</text_and_bitmaptext>
