---
name: base44-platform-games
description: "Base44 games: Phaser 4 (2D) and Three.js via React Three Fiber (3D) reference material for game apps built on Base44. Use when implementing scenes, physics, input, cameras, assets, HUD or game state in a Base44 game."
---
<!-- GENERATED FILE. DO NOT EDIT. Compiled by apper `backend/scripts/agent_skills` from the
     builder prompt sources; the apper commit is in /APPER_COMMIT at the repository root.
     Edits here are overwritten by the nightly sync; change the source partials in apper. -->
# Base44 games

A Base44 game is a React app with the game layer under `src/game/`; React owns the screen-space overlay and the Base44 SDK, the engine owns gameplay. Each topic reference covers one engine area.

## Pick the reference for this app

Determine the app profile first. Call `GET /api/apps/{app_id}/agent-profile` (over the Base44 MCP `execute_api`
tool, or with your Base44 CLI token); it returns the framework, app type, runtime,
entitlements and the exact reference files to read. Without it, detect from the project files:
`src/routes/__root.*` and `src/routeTree.gen.ts` mean TanStack Start; `app/_layout.*` means a
native mobile (Expo) app; `src/game/2d/` or `src/game/3d/` means a game; otherwise it is a Vite SPA.

| Profile | Read |
|---|---|
| Game, 2D (Phaser 4) | [2D game (Phaser 4): architecture, assets, analytics and the Phaser reference](references/game-2d.md) |
| Game, 3D (Three.js) | [3D game (Three.js): architecture, assets, analytics and the Three.js reference](references/game-3d.md) |

## Topic references

- [Phaser 4: actions and utilities](references/phaser/actions_and_utilities.md)
- [Phaser 4: animations](references/phaser/animations.md)
- [Phaser 4: audio and sound](references/phaser/audio_and_sound.md)
- [Phaser 4: cameras](references/phaser/cameras.md)
- [Phaser 4: curves and paths](references/phaser/curves_and_paths.md)
- [Phaser 4: data manager](references/phaser/data_manager.md)
- [Phaser 4: events system](references/phaser/events_system.md)
- [Phaser 4: filters and postfx](references/phaser/filters_and_postfx.md)
- [Phaser 4: game object components](references/phaser/game_object_components.md)
- [Phaser 4: game setup and config](references/phaser/game_setup_and_config.md)
- [Phaser 4: geometry and math](references/phaser/geometry_and_math.md)
- [Phaser 4: graphics and shapes](references/phaser/graphics_and_shapes.md)
- [Phaser 4: groups and containers](references/phaser/groups_and_containers.md)
- [Phaser 4: input keyboard mouse touch](references/phaser/input_keyboard_mouse_touch.md)
- [Phaser 4: loading assets](references/phaser/loading_assets.md)
- [Phaser 4: mesh and 3d elements](references/phaser/mesh_and_3d_elements.md)
- [Phaser 4: particles](references/phaser/particles.md)
- [Phaser 4: physics arcade](references/phaser/physics_arcade.md)
- [Phaser 4: physics matter](references/phaser/physics_matter.md)
- [Phaser 4: render textures](references/phaser/render_textures.md)
- [Phaser 4: scale and responsive](references/phaser/scale_and_responsive.md)
- [Phaser 4: scenes](references/phaser/scenes.md)
- [Phaser 4: sprites and images](references/phaser/sprites_and_images.md)
- [Phaser 4: text and bitmaptext](references/phaser/text_and_bitmaptext.md)
- [Phaser 4: tilemaps](references/phaser/tilemaps.md)
- [Phaser 4: time and timers](references/phaser/time_and_timers.md)
- [Phaser 4: tweens](references/phaser/tweens.md)
- [Three.js: assets models textures](references/threejs/assets_models_textures.md)
- [Three.js: cameras](references/threejs/cameras.md)
- [Three.js: character controller](references/threejs/character_controller.md)
- [Three.js: enemies and movement](references/threejs/enemies_and_movement.md)
- [Three.js: game state and flow](references/threejs/game_state_and_flow.md)
- [Three.js: input and controls](references/threejs/input_and_controls.md)
- [Three.js: performance](references/threejs/performance.md)
- [Three.js: physics dynamics](references/threejs/physics_dynamics.md)
- [Three.js: projectiles and pooling](references/threejs/projectiles_and_pooling.md)
- [Three.js: scene and rendering](references/threejs/scene_and_rendering.md)
- [Three.js: text hud ui](references/threejs/text_hud_ui.md)
- [Three.js: triggers and collisions](references/threejs/triggers_and_collisions.md)
- [Three.js: vfx and juice](references/threejs/vfx_and_juice.md)
