<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Three.js: scene and rendering

<scene_and_rendering>
Use this when configuring the Canvas, lights, shadows, atmosphere (sky, fog, background), or render quality for a 3D game.

<canvas_and_lights>
- One persistent `<Canvas>` in `src/game/3d/Game.jsx` (never remount it), configured via props: `shadows`, `dpr={[1, 2]}`, and the default `camera` (fov/near/far/position). One `<Suspense fallback={null}>` at the scene root covers all async content (`<Physics>`, textures, models).
- Light the scene so it reads clearly by default — unless the user asks for a dark, moody, or horror look. Give it a motivated key light chosen for the space: a sun-like `directionalLight` for open/outdoor scenes, a `spotLight` or `pointLight` for indoor or localized pools — positioned and powered to actually illuminate the play area and cast readable shadows.
- Add an `ambientLight` or `hemisphereLight` (sky/ground colors) as gentle fill ONLY — enough to keep shadowed faces off pure black, never to light the scene (fill is flat and shadowless). A hemisphere fill reads better than a second directional.
- A scene that renders dark almost always means the key is too weak or aimed away from the action, or the palette itself is near-black (see render_quality) — fix the key or the albedo rather than piling on ambient or cranking exposure.
- Shadows silently missing means one of three flags is absent — Canvas `shadows`, `castShadow` on the caster, `receiveShadow` on the receiver — or the play area outgrew the directional light's shadow camera box (`shadow-camera-left/right/top/bottom` must cover it). Bump `shadow-mapSize` for crisper edges; a small negative `shadow-bias` fixes striped self-shadowing ("shadow acne").
</canvas_and_lights>

<atmosphere>
- Set the scene backdrop with `<color attach="background" />` and add `<fog attach="fog" />` matched to the background color — fog is the cheapest depth cue and hides the far clip.
- Fog is a depth cue, not a curtain: start the fog band beyond the playfield at the camera's typical distance — a near band matched to a dark background fades the whole play area toward black.
- drei quick picks: `<Sky>` (procedural daytime sky), `<Stars>` (night/space). `<Environment preset>` adds image-based lighting BUT downloads its HDRI from a CDN at runtime — prefer `<Sky>` + lights; use Environment only when realistic reflections matter and the network dependency is acceptable.
</atmosphere>

<render_quality>
- drei `<AdaptiveDpr pixelated />` drops resolution automatically while the frame rate is low; `<PerformanceMonitor onDecline/onIncline>` can drive coarser quality toggles (shadow size, effect density).
- Color management is automatic in current three.js; R3F defaults to ACESFilmic tone mapping at exposure 1. `toneMappingExposure` (set via the Canvas `gl` prop) is the master brightness dial — a small nudge shifts overall mood, but it is not a substitute for lighting the scene; fix darkness at the light, not the exposure.
- Lighting cannot rescue near-black materials: give large surfaces (ground, boards, walls) mid-tone or brighter albedo by default — unless the user asks for a dark or night look — and save near-black for accents.
- Metallic/reflective materials need an environment to reflect or they render black — keep default `meshStandardMaterial` low-`metalness` unless an `<Environment>` or bright surroundings are present.
</render_quality>
</scene_and_rendering>
