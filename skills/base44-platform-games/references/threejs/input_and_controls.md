<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Three.js: input and controls

<input_and_controls>
Use this when handling player input: keyboard movement/actions, clicking or hovering 3D objects, and touch controls on mobile.

<keyboard>
- Map physical keys to named actions once with drei `<KeyboardControls map={...}>` wrapping the scene root inside the Canvas — actions like forward/back/left/right/jump, each listing its key codes (`KeyW`, `ArrowUp`, `Space`, ...).
- For per-frame input, use the imperative tuple form exactly: `const [, getKeys] = useKeyboardControls();`, then inside `useFrame` read fresh state with `const keys = getKeys();`. This does NOT re-render. Convert the booleans to a -1/0/1 axis and scale movement by `delta` (or feed the physics API).
- The selector form returns the selected value directly: `const jump = useKeyboardControls((s) => s.jump);` makes `jump` a boolean and re-renders on change, so use it only for discrete UI-ish reactions, never for movement. NEVER call a selector result — `const getKeys = useKeyboardControls((s) => s); getKeys()` is invalid because `getKeys` is a state object, not a function.
- Apply axis signs in ONE place, derived from the convention recorded in config. The trap is double negation: an axis computed `left − right` and then negated again downstream "for feel" leaves A steering right.
- Two control models, picked per game and independent of the camera: DIRECT ( twin-stick, platformer — a key means a direction) and STEERED (car, plane, boat — A/D turn the heading, W/S throttle along it, under ANY camera including top-down). After wiring, trace one key end-to-end: direct — D must move toward screen-right as the player sees it (a fixed world direction under a fixed camera; rotated by the camera yaw under a rotating chase/first-person camera); steered — D must turn the vehicle toward ITS OWN right (clockwise seen from above; increasing `rotation.y` turns LEFT), even when it faces the camera and that reads as screen-left.
- Match the scheme to the vehicle when the user didn't specify: aircraft and ships don't reverse — W/S are throttle up/down (floored at zero or a stall speed), not forward/backward; cars reverse; runners steer lanes and never move backwards. Under direct control, rotate the avatar MESH to face its velocity (or the aim, in twin-stick) — the keys move the body, not the facing.
</keyboard>

<pointer>
- Meshes take pointer events directly (`onClick`, `onPointerOver/Out/Down`) — R3F raycasts for you; no manual Raycaster. `e.stopPropagation()` blocks hits on objects behind; `e.point` is the world-space hit position — the standard way to aim or place things by click (click-to-move on a ground plane is just an `onClick` on it).
- Set `document.body.style.cursor` in `onPointerOver`/`Out` for hover affordance.
</pointer>

<touch>
- If the user didn't specify mobile controls, a DOM joystick in the React overlay is a good default — but match the genre: tap-to-move/tap targets suit point-and-click and board games, swipe suits runners.
- Wire touch input through a shared module object (e.g. `src/game/input.js` exporting a mutable state the overlay writes on touch events and gameplay reads in `useFrame`) — never React state per move event.
- Keep touch targets comfortably large (~64px). Show touch controls only on coarse pointers: `window.matchMedia('(pointer: coarse)').matches`.
</touch>
</input_and_controls>
