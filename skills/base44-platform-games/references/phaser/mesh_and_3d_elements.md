<!-- GENERATED FILE. DO NOT EDIT. Compiled from the Base44 builder's prompt sources; the
     source commit is in /SOURCE_COMMIT at the repository root. Edits here are overwritten by
     the next sync; change the source instead. -->
# Base44 games: Phaser 4: mesh and 3d elements

<mesh_and_3d_elements>
Use this when a 2D Phaser game wants a 3D LOOK or depth flourishes without leaving 2D — Phaser stays the only engine (physics, input, scenes, collision are all unchanged). These are pseudo-3D tricks: plain 2D, no new machinery, not real 3D.

Note: Phaser's `Mesh`/`Plane` game objects from v3 (`this.add.mesh()`, `Phaser.Geom.Mesh.GenerateGridVerts`, `panZ`, `modelRotation`) were REMOVED in Phaser 4 — there is no Phaser-native vehicle for unlit 3D accents anymore. Small flourishes that used to lean on Mesh (card flips, tilting panels) are done with pseudo-3D scale/angle tweens, frame swaps, or a sheared Graphics quad.

<tier1_pseudo_3d>
Fake depth with plain 2D:
```js
// Depth scaling: things lower on screen are "closer"
sprite.setScale(0.5 + (sprite.y / this.scale.height) * 0.7);
sprite.setDepth(sprite.y);

// Parallax background layers (farther = slower)
this.add.tileSprite(0, 0, w, h, 'far-hills').setOrigin(0).setScrollFactor(0.2);
this.add.tileSprite(0, 0, w, h, 'near-trees').setOrigin(0).setScrollFactor(0.6);

// Isometric placement + draw-order sorting
const screenX = (tileX - tileY) * TILE_W / 2;
const screenY = (tileX + tileY) * TILE_H / 2;
obj.setDepth(screenY);
```
Floor-stripe "mode 7" feel: scale + tint rows of tileSprites by distance instead of attempting real projection.

Fake a 3D card flip without any Mesh — tween `scaleX` through 0 and swap the texture at the midpoint:
```js
this.tweens.add({
  targets: card,
  scaleX: 0,
  duration: 250,
  ease: 'Cubic.easeIn',
  onComplete: () => {
    card.setTexture('card-front');
    this.tweens.add({ targets: card, scaleX: 1, duration: 250, ease: 'Cubic.easeOut' });
  },
});
```
Tilting panels read well as a short `angle` + `scaleY` tween, a frame swap between pre-drawn angles, or a sheared quad drawn with Graphics (`fillPoints`). (Phaser game objects have no skew transform — a `skewX` tween renders nothing.)
</tier1_pseudo_3d>

<common_mistakes>
- Reaching for `this.add.mesh()` / `Phaser.Geom.Mesh` / `panZ` / `modelRotation` — the Phaser Mesh and Plane objects were removed in v4. Use a pseudo-3D tween, frame swap, or sheared Graphics quad instead.
- Expecting a `skewX` tween to do anything — Phaser game objects have no skew transform; shear with a Graphics `fillPoints` quad instead.
- Forgetting depth sorting (`setDepth`) on overlapping pseudo-3D sprites — closer objects then draw in front of farther ones.
</common_mistakes>
</mesh_and_3d_elements>
