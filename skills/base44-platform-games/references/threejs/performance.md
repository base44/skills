<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Three.js: performance

<performance>
Use this when a scene has many objects, when frame rate matters (it always does in games), or when reviewing gameplay code for jank.

<the_rules>
1. No React state changes per frame — mutate refs in `useFrame`; React state only for discrete events. This is the #1 3D-game jank source, and for entity collections (enemy/projectile arrays, per-entity hp) it is also a correctness bug: closures read stale snapshots (see game_state_and_flow).
2. No allocations in hot loops — a `new` Vector3 per frame churns the GC into stutters. Hoist scratch objects to module scope (or `useMemo`) and reuse them via `set(...)`.
3. Share geometries and materials. Inline geometry/material JSX per mesh creates one of each per mount — fine for a dozen meshes, deadly for hundreds. Create them once (module scope or memoized) and pass via the `geometry`/`material` props.
4. Scale movement by `delta` — code tuned at 60fps without delta runs double speed on 120Hz screens.
</the_rules>

<many_objects>
- Each mesh is a draw call; hundreds of identical objects (trees, coins, tiles, debris) belong in ONE instanced draw call — drei `<Instances>` (one geometry + material) with an `<Instance>` per item, each still taking position/rotation/scale/color and pointer events. Set `limit` to the maximum count.
- The physics twin is `InstancedRigidBodies` (an `instances` array prop wrapping one `instancedMesh`) for piles of physical debris.
- Distant detail: drei `<Detailed>` with per-distance children swaps LOD levels automatically.
</many_objects>

<measuring_and_degrading>
- drei `<StatsGl />` while developing when performance is in question; judge draw calls and fps, then remove it.
- Auto-degrade on weak devices with `<AdaptiveDpr>`/`<PerformanceMonitor>` (see scene_and_rendering).
- Raycast-heavy scenes (constant pointer hover over complex meshes) get free speed from wrapping the scene in drei `<Bvh>`.
- Shadow maps are the silent budget-eater: a single 2048 map is usually enough; prefer turning `castShadow` off on small clutter over growing the map.
</measuring_and_degrading>

<react_shape>
Keep the component tree stable during play: conditional-render UI states, but never map gameplay entities off arrays that change every frame, and never key things by per-frame values — both force remounts (see the pooling rule in projectiles_and_pooling). If a component re-renders every frame, something reads per-frame state reactively; move that read into `useFrame`/`getState()`.
Debugging tells that gameplay data lives in useState: damage that never applies, turrets targeting already-dead enemies, `setState(prev => ...)` updaters as game logic (or nested inside other updaters). The fix is always the same — move the collection to a ref/module registry and keep React as a throttled HUD mirror.
</react_shape>
</performance>
