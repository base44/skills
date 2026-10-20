<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games: Three.js: vfx and juice

<vfx_and_juice>
Use this when adding feedback and polish ("juice"): particles, trails, glows, hit flashes, audio, win-moments. When the user hasn't specified polish, a light juice pass is usually what makes a simple game feel finished — suggest it rather than skipping it silently.

<drei_effects>
- `<Sparkles>` — ambient magic/pickup shimmer.
- `<Trail>` — motion readability on anything fast; it follows the mesh rendered as its child.
- `<Outlines>` — selection/highlight, rendered inside a mesh.
- One-shot bursts (explosion, pickup pop): a pooled `<Sparkles>` repositioned to the event point for ~0.5s — pooled and reused like projectiles, never created per event.
</drei_effects>

<hit_feedback>
A menu to pick from — each is a few lines; when the user didn't specify hit feedback, one or two of these on significant hits is a good default:
- Camera shake: brief `<CameraShake>` (see the cameras section).
- Flash: swap the target's material color/emissive for ~100ms (ref + timeout restoring the original).
- Scale pop: damp the mesh scale up to ~1.3 and back in `useFrame`.
- Hit-stop: freeze physics a beat — the `paused` prop on `<Physics>` for 60-100ms on big hits.
- Floating damage number (see text_hud_ui).
</hit_feedback>

<audio>
drei `<PositionalAudio>` attaches 3D sound to an object (`loop` for ambience; call `play()` on its ref for one-shots). Browsers block audio until a user gesture — start playback only after the first click/keydown (the start-screen "Play" button is the natural unlock). Screen-space UI sounds can be a plain Audio element on the overlay side. Only reference audio URLs that actually exist (user-uploaded or provided) — there is no built-in sound library; when none exist, skip audio rather than pointing at dead URLs.
</audio>

<win_moments>
`canvas-confetti` is already a dependency — fire it from the React overlay on win/level-complete EventBus events. If the user didn't specify a win moment, confetti + a camera move toward the goal (drei CameraControls transition) + a scale-pop on the goal object is a combo that works well.
</win_moments>

<postprocessing>
For bloom (glowing projectiles/neon), vignette, or chromatic aberration, install `@react-three/postprocessing` with `install_npm_package`: one `<EffectComposer>` as the last child inside the Canvas, with effect components inside (all effects in the composer merge into a single pass). For selective glow, set `luminanceThreshold` to 1 on `<Bloom>` (with `mipmapBlur`) so only overbright objects bloom, and make materials overbright via `emissive` + `emissiveIntensity` above 1 (or `toneMapped={false}` on plain colors). Skip postprocessing on visibly low-end targets (pair with PerformanceMonitor).
</postprocessing>
</vfx_and_juice>
