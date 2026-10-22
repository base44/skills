<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Three.js: enemies and movement

<enemies_and_movement>
Use this when scripting non-player motion: chasing/patrolling enemies, moving platforms, doors/elevators, orbiting hazards, joints, and worlds that flow past the player.

<world_flow>
When the world moves past a mostly-stationary player (rather than the player traversing a static world):
- Keep the player near the origin and move the world: spawn ahead at negative Z (the horizon), flow toward positive Z past the camera, cull a few units behind it. On screen the world flows from the horizon toward the bottom edge — ground sliding toward the horizon reads as moving backwards.
- Track bookkeeping stays naturally positive (distance run, segment index) — keep it positive, and convert to world space in exactly ONE shared formula that puts ahead at negative Z (`worldZ = traveled − trackZ`), used by EVERY flowing system (ground, obstacles, pickups, scenery). Dropping the negation because positive indices feel cleaner — or re-deriving the formula per file — is how one system ends up negated while the rest are correct and the scene tears in two directions.
- Ahead = negative relative Z, so visibility/cull windows run from −spawnDistance to a few units positive — a mirrored window makes objects invisible until they are already on top of the player.
</world_flow>

<kinematic_movement>
- Script-driven movers are `type="kinematicPosition"` bodies advanced each frame with `setNextKinematicTranslation` — they push/carry dynamic bodies (including the player) but nothing pushes them back. Scale all motion by `delta`.
- Chase: each frame, take the direction from the enemy's `translation()` to the player's on the ground plane (zero the Y component), normalize, scale by speed × delta, and set the next translation. Stop advancing inside melee range and attack instead. Reuse one module-level scratch Vector3 — no per-frame allocation.
- Turret targeting, AoE, nearest-enemy scans: iterate the shared live registry (`world.enemies` — see game_state_and_flow state_home) inside `useFrame`; enemies register on spawn, deregister on death. Never scan a useState array.
- Patrol, platforms, elevators, spinners: drive position from `state.clock.elapsedTime` (sine/cosine of it) rather than accumulating your own offsets — deterministic, no drift. Rotating movers use `setNextKinematicRotation` with a quaternion.
- Simple AI state machines (patrol → chase when within aggro radius → attack in melee range) are a phase field in a ref checked at the top of `useFrame` — no library needed.
</kinematic_movement>

<dynamic_enemies>
Enemies that should be shoved by explosions/hits are dynamic capsules like the player (lockRotations, velocity steering via `setLinvel` toward the target instead of kinematic translation). Kinematic = reliable pursuit that cannot be body-blocked; dynamic = physical comedy and knockback. Pick per game feel.
</dynamic_enemies>

<joints>
Joints connect two RigidBody refs: `useRevoluteJoint` (hinge — doors, flippers), `useSphericalJoint` (ball-socket — swinging ropes, a wrecking ball on a fixed anchor), `useFixedJoint`, `usePrismaticJoint` (sliders). Chain segments by joining successive bodies. Reach for joints only when the physics should visibly articulate — most gameplay motion is the kinematic scripting above.
</joints>
</enemies_and_movement>
