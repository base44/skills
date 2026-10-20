<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Three.js: text hud ui

<text_hud_ui>
Use this when showing text or UI: world-anchored labels, floating damage numbers, health bars above heads — and the boundary with the React overlay.

<the_boundary>
This section covers text/UI attached to points in the world (name tags, damage numbers, signs, health bars over enemies); screen-space UI belongs in the React overlay per the architecture instructions — never as meshes, never via drei. When in doubt: no world position → overlay.
</the_boundary>

<world_text>
- drei `<Text>` renders crisp SDF text at any size and angle (not blurry canvas sprites) — `fontSize`, `color`, `anchorX/anchorY`, and `outlineWidth`/`outlineColor` for readability against the scene.
- Wrap in `<Billboard>` to always face the camera (name tags, indicators).
- 3D extruded `<Text3D>` needs a bundled font JSON — prefer flat `<Text>` unless the text IS the centerpiece.
</world_text>

<damage_numbers>
Floating combat text is a pooled set of `<Text>` items animated in `useFrame` (rise + fade via the text material's opacity, with `transparent` on), activated from an EventBus event carrying a position — same pooling rule as projectiles: never mount/unmount per hit; park when invisible.
</damage_numbers>

<world_html>
- drei `<Html>` places real DOM at a 3D point — the pragmatic choice for styled micro-UI like health bars (a Tailwind-styled div). `center` anchors the middle, `distanceFactor` scales it with distance so it behaves like a world object, `occlude` hides it behind geometry.
- Update it imperatively (a ref setting styles) from events — not React state per frame.
- Each Html instance is a live DOM element — fine for a handful (bosses, nearby enemies), wrong for hundreds; beyond that use a thin mesh scaled by value instead.
- R3F hooks don't work inside the Html subtree (it renders to the DOM, outside the Canvas reconciler).
</world_html>
</text_hud_ui>
