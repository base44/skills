<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Three.js: projectiles and pooling

<projectiles_and_pooling>
Use this when things spawn and despawn rapidly: bullets, thrown objects, falling debris, wave spawns. The core rule: NEVER mount/unmount React components per spawn — pool them.

<pool_pattern>
- Mount a fixed pool of RigidBodies once (an array render with stable keys, refs collected into a ref array). "Spawning" teleports a parked body in (`setTranslation`) and gives it velocity (`setLinvel`); "despawning" parks it again.
- Park inactive bodies far below the level (staggered positions so they don't overlap), with `gravityScale={0}` and zeroed velocity so they stay put; restore gravityScale on activation if the object should fall.
- Recycle round-robin: keep a next-slot index; the oldest active body is simply reused when the pool wraps.
- Despawn on contact via `onCollisionEnter` (apply the hit, then park the payload's target body) AND by lifetime — a `useFrame` sweep parking anything active older than a few seconds (spawn times in a ref array).
- `ccd` on bullets stops fast ones tunneling through thin walls.
- The same pattern serves enemies, debris, and floating damage numbers.
</pool_pattern>

<hitscan>
- Instant-hit weapons and line-of-sight checks skip projectile bodies entirely — cast a ray through the physics world: `world.castRay` from `useRapier`, constructing the ray with the rapier `Ray` class from an origin and direction.
- The hit result's field is `timeOfImpact` (the old name `toi` was renamed — do not emit it); get the world-space point via the ray's `pointAt(timeOfImpact)`, and identify what was hit through the hit collider's parent body (name/userData).
- Exclude the shooter from its own ray via the cast's filter argument (pass the shooter's rigid body as the excluded body).
- Aim from the camera with `camera.getWorldDirection`.
- Decision rule: hitscan + a pooled tracer/impact effect for anything faster than the eye; pooled bodies when travel time and arcs are part of the gameplay.
</hitscan>
</projectiles_and_pooling>
