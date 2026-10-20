<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Three.js: triggers and collisions

<triggers_and_collisions>
Use this when gameplay reacts to contact: pickups, damage zones, goals, checkpoints, projectile hits, "what did I touch?".

<identifying_bodies>
Give bodies a `name` (exposed on the event payload's three object) or `userData` for richer typing — this is how handlers know WHAT was hit: in the event payload, check `other.rigidBodyObject?.name` or `other.rigidBody?.userData`.
</identifying_bodies>

<sensors>
- A collider with the `sensor` prop detects overlap but has no physical presence — THE gameplay trigger primitive (coins, kill zones, goal lines, checkpoints, aggro ranges). Sensors fire `onIntersectionEnter` / `onIntersectionExit` (solid colliders do not).
- The standard pickup: a `fixed` RigidBody with `colliders={false}`, an explicit sensor collider, and an `onIntersectionEnter` that checks the other body's name is the player, then emits an EventBus event (score/HUD updates on the React side) and hides the item via React state — a discrete event, so state is fine here.
- A large sensor box under the level is the standard fall-death detector.
</sensors>

<solid_collisions>
- Solid bodies fire `onCollisionEnter` / `onCollisionExit` (on the RigidBody or a specific collider). Check who hit via the payload's name/userData as above.
- Debounce repeated contacts — an enemy grinding against the player fires enter/exit rapidly; track the last-hit time in a ref and ignore hits inside the invulnerability window.
- `onContactForce` reports impact magnitude — for "break on hard landing" style rules.
</solid_collisions>

<filtering>
`collisionGroups` with the `interactionGroups(group, [collidesWith...])` helper (imported from @react-three/rapier) when categories must pass through each other — e.g. enemy projectiles ignoring enemies. Groups 0-15. Prefer plain name checks in handlers until pass-through behavior is actually required.
</filtering>
</triggers_and_collisions>
