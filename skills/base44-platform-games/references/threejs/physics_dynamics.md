<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Three.js: physics dynamics

<physics_dynamics>
Use this when configuring rigid bodies, colliders, and forces with @react-three/rapier — stacking, bouncing, knockback, vehicles, physical props.

<bodies_and_colliders>
- Body types: `type="fixed"` for level geometry, dynamic (the default) for anything gravity and forces should move, `type="kinematicPosition"` for code-driven movers (it pushes dynamic bodies but is immovable itself).
- Collider auto-generation from child meshes via the `colliders` prop: `"cuboid"` (default) | `"ball"` | `"hull"` (convex wrap — the right choice for most dynamic props) | `"trimesh"`. HARD RULE: `trimesh` only on `fixed` bodies (concave level geometry) — a dynamic trimesh is slow and tunnels.
- Compound or offset shapes: `colliders={false}` plus explicit `<CuboidCollider>`/`<BallCollider>`/`<CapsuleCollider>`/`<CylinderCollider>` children. Explicit collider `args` are HALF-extents.
- Material feel per body/collider: `restitution` (bounciness), `friction`, `mass` (or `density`). `ccd` on small fast bodies stops them tunneling through walls. The `debug` prop on `<Physics>` renders all colliders — dev only.
</bodies_and_colliders>

<moving_bodies>
- Never mutate mesh positions inside a RigidBody and never move a dynamic body via props after mount — always the body ref API: `applyImpulse` (instant kick — jumps, hits, explosions), `setLinvel` (direct control), `applyTorqueImpulse`/`setAngvel` (spin), `setTranslation` (teleport/respawn — also zero the velocity).
- Every one of those calls takes a wake flag as its last argument — pass `true`; sleeping bodies ignore forces.
- Impulses scale with mass: the same impulse that launches a mass-1 crate nudges a mass-10 one. Read state with `translation()`, `linvel()`, `rotation()`.
- Common tuning: floaty jumps → stronger gravity (around -20) or extra downward force while airborne; jittery stacks → bigger colliders and more mass; everything slides → raise `friction` on both surfaces.
</moving_bodies>

<per_step_logic>
Physics steps at a fixed 1/60 timestep decoupled from rendering. Logic that must see every step (custom gravity, force fields, speed clamps) belongs in `useBeforePhysicsStep`, not `useFrame`. Pause the whole simulation with the `paused` prop on `<Physics>`.
</per_step_logic>
</physics_dynamics>
