# PAC-MAN — Maze Arcade / 1980 — Current status

**Snapshot:** 2026-11-26, inspected repository commit [631fb3e](https://github.com/euclidi/euclidi-games/commit/631fb3e5474b2ecae65235d216a9c816af00fe17).

**Lifecycle:** Active — Git revision 1.7.0.

## Implemented / source-inspected

28×31 maze, 240 pellets, four energizers, three ghost modes, bitmap runtime, death sequence, local high scores, mobile D-pad and synthesized effects.

## Revision 1.6.2 — enhanced first-person feedback

480×360 native raster; beveled material, brighter cobalt rails, depth-shaded floor and ceiling; live color/state markers on map. Actual accepted Pac-Man turns record world-space paired skid decals and trigger separate short friction audio. Quick visual camera settle only, no simulation latency. Rear-view raycast mirror opens for approaching normal ghosts behind Pac-Man within seven tiles with direct line of sight, with brief hold; suppressed during fright or death. Tests cover rear detection, mirror render, occlusion, skid events and both roles. Device visual/audio verification pending.

## Revision 1.6.1 — first-person camera

Local 320×240 grid raycasting, textured walls and floor/ceiling, depth-tested bitmap actor/pellet/fruit billboards, smooth heading camera, optional locator map, first-person relative direction input and live view switching for both roles. Same core simulation. Ray/projection/occlusion and renderer role tests passed; browser and device visual playtest pending. Raycasting is 2.5D; actors are original billboard sprites, not 3D meshes.

## Revision 1.6.0 — Ghost Mode

Separate reverse-role mode with all four classic ghosts and a custom named, recolored ghost; same pixel geometry and two-frame animation. Autonomous Pac-Man uses maze-graph BFS food/danger evaluation; allied ghosts retain selected AI. Controlled ghost can reverse, is vulnerable to energizers, regenerates through the house, and scores personal/team captures. Win/loss, isolated high scores and player marker. Targeted tests passed; browser/device playtest pending. Pac-Man AI is heuristic, not an optimal solver.

## Revision 1.5.7 — character customizer removed

Removed the editor, all cosmetic assets and runtime state, menu navigation hooks, and custom sprite compositor scaling. Restored native 16×16 classic Pac-Man sprites and 224×288 backing raster. Existing cosmetic preferences are ignored; other settings and scores remain untouched. Historical revision records below describe removed features, not current functionality.

## Revision 1.5.6 — fitted original artwork

Redrawn pixel clusters, rounded custom body, face landmarks separated from headwear, fitted wearable bases and single-ear headphones. Classic default unchanged. Reference-style rotation remains for vertical directions. Added enlarged preview and native-raster sample. Direction/mouth anchor and minimum attachment-overlap checks passed; actual sprite comparison produced. Live browser/device playtest pending.

## Revision 1.5.5 — high-density cosmetic artwork

40×40 custom sprite canvas (20 logical pixels, unchanged 14-pixel body); 448×576 backing compositor, native original maze/glyph/ghost raster retained at 2× nearest-neighbor. Redesigned detailed eyes and wearables; six eye choices, eight accessories. Classic body exactly preserves previous pixel footprint. Larger gallery previews. Directional attachment and bounds regression passed; live browser/device visual verification pending.

## Revision 1.5.4 — aligned character editor

Reference-based canonical facing-right attachment coordinates (left reflection and vertical quarter turns), hand-authored eye and wearable pixel clusters, invariant face anchors across mouth frames, no eye/accessory overlap, fixed face/body attachment. Four-direction preview, selectable cosmetic thumbnails and inspectable mouth poses. References: [Ms. Pac-Man sprite sheet](https://www.spriters-resource.com/arcade/mspacman/asset/21043/page-1/) and [masonicGIT directional sprite implementation](https://github.com/masonicGIT/pacman/blob/master/src/sprites.js). Artwork independently drawn, not imported ROM sprites. All original combination tests and directional attachment tests passed; browser/device visuals remain pending.

## Revision 1.5.3 — character customization

Compact editor with 10 colors, four finishes, four eye styles, five accessories and an animated four-direction preview. Saved choices update live atlas, title sprite, life icons and death color. Classic default pixel identity and 9,600 cosmetic/direction/frame combinations passed bounds/uniqueness tests. Accessories disappear during death by design. Gameplay/collision rules unchanged. Browser and physical-device visual testing remain pending.

## Revision 1.5.2 — arcade-style ghost motion

Removed all lateral deformation, body offsets, per-ghost phase shifts and distance-driven skirt motion. Two hand-rasterized symmetric silhouettes alternate every eight active simulation ticks, with fixed face and upper body. Reference: [masonicGIT/pacman sprite geometry](https://github.com/masonicGIT/pacman/blob/master/src/sprites.js) and [animation cadence](https://github.com/masonicGIT/pacman/blob/master/src/Ghost.js). These are independently authored bitmap masks, not an original-ROM extraction. Symmetry, center, height, fixed body, frame timing and freeze tests plus 36,000 simulation ticks passed. Live visual parity remains unverified.

## Revision 1.5.1 — unified fabric sway

Replaced the independently varying scallops with a fixed three-lobed material silhouette and a single traveling deformation through the whole body and face. 16 sampled poses include brief extrema holds; cycle length 6.4 tiles instead of 2.4. Constant area and height, exact row mapping, connectivity, face alignment and loop tests passed. This is a stylized fabric sway, not a 3D cloth solver or verified arcade-ROM animation; live visual quality still needs playtesting.

## Revision 1.5.0 — preserve ghost proportions

Restored full rounded head and consistent 14-pixel height with wider, constant-width body and shallow rolling hem folds. Fabric bends sideways in the native 16×16 texture rather than removing body pixels. Removed whole-sprite bob. New frames occupy 168–169 pixels and keep facial pixels within connected silhouettes. Proportion, connectivity, eye and loop regression passed; live visual quality remains unverified.

## Revision 1.4.9 — unified ghost fabric

Replaced separate hem compositing with eight complete 14×14 body silhouettes. Lower side contours taper in phase with the moving scallops; face stays anchored to the fabric. Slower one-pixel whole-sprite hover, including face, is visual only; eyes-only returning ghosts do not bob. Same silhouettes used in title and gameplay. Mask connectivity, protected face pixels, lower-body motion and cycle wrap passed; live animated appearance still requires playtesting.

## Revision 1.4.8 — ghost skirt animation

Eight distinct bitmap hem frames replace two-frame flicker. Three scallops travel continuously across the lower silhouette, with stable upper body, connected pixels and seamless wrap. Each ghost advances by its own actual movement distance; idle house ghosts have a slower cycle. Death/ready freeze motion. Two focused regression tests and 36,000 simulation ticks passed in JS evaluation. Actual visual playtest remains pending; eight-frame animation is a deliberate enhancement rather than original two-frame arcade parity.

## Revision 1.4.7 — fruit contact fix

Fruit rendering and collision share one center. Removed the tile-arrival pickup shortcut; swept player contact is required while the fruit is active. Fruit scores once, shows a brief pickup-value popup, and is hidden outside active play. Four targeted regression tests and 36,000 general simulation ticks passed in JS evaluation. Live visual verification remains pending.

## Revision 1.4.6 — compact settings and gamepad

Five short tabs, four or fewer setting rows per tab; gamepad device selection, standard/legacy mappings, deadzone, menu navigation, repeat and supported rumble. Pure JS mapping and edge/repeat checks passed; real controller compatibility and live appearance remain unverified.

## Revision 1.4.5 — settings

Added 15 persistent options, fullscreen and restore defaults; new-game rules have separate score keys. Rule/default/score isolation and syntax checks passed in local JS evaluation. Live appearance and full device behavior remain unverified.

## Revision 1.4.4 — touch controls

Yellow pressed-direction D-pad, red bitmap joystick with four-way gate and recentering, persistent Pad/Stick/Off setting. Simulated DOM test passed 360 frames and checks for press, drag, deadzone, cancel, keyboard feedback and toggle cycling. Device touch feel and live visual appearance not yet independently verified.

## Revision 1.4.3 — title menu

Added a native bitmap title screen with animated sprites, mode selection and separate new-game/resume actions. Gameplay freezes while the title menu is open. No new graphics dependency or cover artwork.

Simulated runtime test passed 531 frames: initial menu, frozen simulation, mode change without launching, start, return/resume, keyboard navigation and controller start. This is a mock DOM/compositor test, not actual browser or device validation. Pages publication is not independently verified for this revision.

## Previous validation evidence

Six logic tests passed including 36,000 simulation ticks, audio buffers, reachability and death/respawn. Chromium ready/start/input smoke passed.

- [Catalog browser and logic audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891)

Tests are limited to their stated coverage. Browser startup is not full gameplay certification; CI results refer to the tested commit, not future changes.

## Outstanding and unverified

No ROM or official recordings bundled; sprite, audio, timing and intermission fidelity not certified 1:1. Intermissions/fruit simplified; measured device and listening tests remain.

## Next work

Compare maze geometry, glyphs, sprites and ghost skirt/death frames against authorized references.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)

## Night Watch — v1.7.0

Separate local Wolfenstein-style raycast shooter at [night-watch/](night-watch/). One compact connected 19×15 compound, broad rooms, cover and looped corridors. Eight hooded sentries with patrol/alert-style idle and pursuit, readable attack windup, three fictional arcade weapons, reload, ammo, health, armor, keycard and extraction. Keyboard/mouse, touch and standard gamepad, pause, minimap, difficulty selector, original hand-rasterized pixel clusters. No changes to original maze simulation. Core checks and 3,600 simulation ticks passed in JS evaluation. Browser/device playtest, audio and final asset polish remain unverified. No claim of Doom engine or original licensed assets.
