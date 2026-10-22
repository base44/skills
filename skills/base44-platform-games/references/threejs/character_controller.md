<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Three.js: character controller

<character_controller>
Use this when the player directly controls a walking/jumping character (platformer, third-person, first-person). This is the most failure-prone 3D pattern — follow these rules exactly.

<capsule_recipe>
A dynamic RigidBody with `colliders={false}` plus an explicit `<CapsuleCollider>` (args are [halfHeight, radius]; capsules slide over small steps where boxes catch), driven by velocity in `useFrame`:
- `lockRotations` — physics must never tip the capsule over. Face the move direction by rotating the child MESH toward the velocity heading, not the body.
- Move with `setLinvel`, setting X/Z from input but PRESERVING the current Y velocity (read `linvel()` first) — overwriting Y kills gravity and jumping.
- Jump only when grounded: cast a short downward ray (`world.castRay` from `useRapier`) from just below the capsule base (~halfHeight + radius below the body's `translation()`); if it hits within ~0.2, set an upward Y velocity.
- `canSleep={false}` — a sleeping body ignores input until something wakes it.
- The wake flag (second argument `true`) on every `setLinvel`/`applyImpulse` call.
- Fall recovery: when `translation().y` drops below the world floor (e.g. -20), teleport back with `setTranslation` and zero the velocity.
- Camera-relative movement (rotating third-person camera): rotate the input vector by the camera yaw (from `camera.getWorldDirection`) before applying it.
</capsule_recipe>

<ecctrl_fast_path>
For a full-featured third-person character (slopes, steps, moving platforms, camera follow modes) skip hand-rolling: install `ecctrl` with `npm install` — the official pmndrs floating-capsule controller built on this exact stack. Wrap the character model in `<Ecctrl>` inside `<Physics>`; it expects the drei `KeyboardControls` action names `forward/backward/leftward/rightward/jump/run`, and its `<EcctrlJoystick />` (rendered OUTSIDE the Canvas, before it) adds mobile touch controls automatically.

Prefer ecctrl when the request is a real third-person game; prefer the capsule recipe for simple arcade movement or side-view platformers where its camera rig is unwanted.
</ecctrl_fast_path>
</character_controller>
