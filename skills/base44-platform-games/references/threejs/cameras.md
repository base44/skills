<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Three.js: cameras

<cameras>
Use this when setting up game cameras: follow/chase cameras, first-person, fixed/isometric angles, orbiting, and camera feedback (shake).

<follow_camera>
- When the user didn't specify a camera style, default to a damped follow rig: a component whose `useFrame` eases `state.camera.position` toward an offset from the target each frame and then `lookAt`s the target.
- Use frame-rate-independent exponential smoothing — lerp with a factor of `1 - Math.exp(-k * delta)` (k ≈ 4; higher = snappier). A constant-factor lerp is a trap: it speeds up on high-refresh screens.
- The target position comes from the player RigidBody's `translation()` (or the mesh position in non-physics games); reuse one module-level scratch Vector3 rather than allocating per frame.
- Vary the offset for genre — top-down (0, 14, ~0) (the ~0 keeps the lookAt off dead-vertical, which would leave screen-up — and with it the key mapping — ambiguous), side-scroller (0, 3, 12) with a fixed lookAt height, isometric-style (8, 10, 8) with a lower fov (~35). Keep the offset in `src/game/config.js`.
- The offset either stays FIXED in world space (top-down, isometric, side-view, lane runner — the camera follows position only, never rotated) or rotates with the target's heading (chase rig — rotate the offset by the target's quaternion). In a chase rig, "behind" means a positive local-Z offset for a −Z-facing target, looking at a point ahead of it along −Z; left/right mirrored in play almost always means the camera is in FRONT of the facing — fix the offset sign. In a fixed rig, mirrored or 90°-rotated controls are a key→world mapping bug — fix the input mapping, not the camera.
</follow_camera>

<control_helpers>
- `<OrbitControls makeDefault />` — inspect/orbit games (the template default). Constrain for gameplay: `minDistance`/`maxDistance`, `maxPolarAngle` just under PI/2 so the camera never goes below ground, `enablePan={false}`. In aim-and-power games the shot direction derives from the orbit camera's azimuth or the pointer hit point — one recorded source, like any other direction convention.
- `<PointerLockControls />` — first-person mouse look; the canvas captures the pointer on click, Esc releases. Pair with a capsule player body; show a "click to play" overlay hint while unlocked (`onLock`/`onUnlock`).
- A follow rig and OrbitControls fight each other — pick one. When mixing modes (orbit in menus, follow in play), gate them on the game phase.
- Cutscene-style pans and zoom-to-target: drei `<CameraControls makeDefault />` — its async API (`setLookAt` with the transition flag) animates smoothly.
</control_helpers>

<feedback>
drei `<CameraShake>` adds impact feedback — mount it briefly on hits/explosions (small `maxYaw/maxPitch/maxRoll`, `decay` on), triggered by a short-lived state from an EventBus event. Small and brief reads as impact; constant shake reads as broken.
</feedback>
</cameras>
