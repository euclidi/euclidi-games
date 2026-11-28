# Deepvein Mine Kit v1.2.0

110 modular low poly mine pieces: rock walls (plain, ore veins, silver lode, gem pockets, coal seams,
glowing crystals, timbered, collapsed, crawl tunnel, niche), a timber-framed entrance with its door or bar gate,
rail floors (straight, curve, turnout with switch blades, crossing, slope, buffer stop), a pit with a rail trestle,
a shaft with a headframe, a lift cage and a hatch, timber supports, platforms, walkways and stairs, and the props a
mine needs (carts, a handcar, a loading chute, a stamp mill, a conveyor, a pulley and ore bucket, lanterns, tools,
ore, gems and crystals, dynamite, bats and a canary...). Every model is built by a Python script in Blender
(included), with a small shared colour palette and a few tiny tiling textures (rock, set stones, planks).

The 13 moving parts come with ready-made Godot scenes: drop `scenes/mine_door.tscn` or
`scenes/mine_cart.tscn` in your level and call `open()`, `close()` or `toggle()`.

## New in 1.1.0

- 62 new pieces (48 -> 110).
- Ready-made Godot scenes for every moving part (`godot_demo/scenes/`, script `kit_mover.gd`): door, bar gate,
  hatch, lift cage, carts, handcar, lever handle, switch blades, stamp, ore bucket, chute gate. Press F in the demo.
- The demo mine is twice as big: a branch line leads to the ore works (turnout, crossing, rail trestle over a pit,
  slope up to a platform, loading chute, stamp mill) and to a deep gallery (gems, silver, stalactites, a cave-in).

Made to work with the Cryptstone Dungeon Kit: same 4 m grid, same scale, same pivots and the same base
colours (materials with the same `dk_*` name are identical), so a mine tunnel can open straight into a dungeon.

Free, CC0 (public domain): use it in commercial and non-commercial games, no credit required.

## What is inside

| Folder | Content |
|---|---|
| `glb/` | One `.glb` per piece, clean meshes, for any engine (Godot, Unity with glTFast, Unreal 5, Blender...) |
| `glb_godot/` | Same meshes plus invisible `-colonly` collision meshes: Godot 4 creates a `StaticBody3D` automatically |
| `fbx/` | One `.fbx` per piece (Unity, Unreal) |
| `godot_demo/` | Godot 4 project: `demo_mine.tscn` (a small mine with lights), `catalog.tscn` (every piece with its name), `scenes/` (moving parts with `kit_mover.gd`) |
| `blender/` | `deepvein_mine_kit.blend` (collection `Kit` = all pieces, `Demo` = the demo mine), `build_kit.py`, the script that generates everything, and `lowpoly_tex.py`, which draws the textures |
| `textures/` | The tiling textures as PNG (256 px; they are also embedded in every GLB and FBX) |
| `previews/` | The renders used on the store page |

## Scale and grid

- 1 unit = 1 metre. Grid cell = **4 m**. Walls are 4 m wide, 4 m high, 0.5 m thick.
- Pivots sit at the bottom of every piece.
- **Floors** (`mine_floor*`): pivot at the cell centre, walkable top at height 0. Place them at (4 * i, 0, 4 * j).
- **Walls** (`mine_wall*`): pivot at the middle of the cell edge, e.g. (4 * i + 2, 0, 4 * j) rotated 90 degrees.
  The "front" (lantern, ore, crystal or timber side) faces +Z in Godot / -Y in Blender.
- **Corners** (`mine_wall_corner`): put one on each grid vertex where walls meet; it hides the joints.
- **Wall decor** (`mine_lantern_wall`): give it exactly the same position and rotation as its wall.
- **Ceiling**: place it at height 4 above a floor tile. **Support frames** go across a tunnel, at a cell centre or edge.
- **Stairs**: one cell, rise 2 m toward Godot -Z (Blender +Y).
- **Rails**: the track of `mine_floor_rails` runs along Godot Z. The curve goes from the -Y edge to the +X edge in
  Blender (Godot +Z edge to +X edge); rotate it to turn the other way. Rail top = 0.16 m: put carts at that height.
  `mine_floor_rails_junction` is the straight track plus the same curve (a turnout); `mine_floor_rails_cross` crosses
  two tracks; `mine_floor_rails_slope` rises 2 m over one cell toward Godot -Z, like the stairs, so a track can climb
  to a `mine_platform` (deck top at 2 m: put a rail floor on it at height 2.01).
- **Pit**: `mine_floor_pit` is a floor tile with a 1.5 m deep hole; `mine_rail_bridge` (same transform) carries a
  track over it at the height of the rail floors, `mine_bridge` a footpath.
- **Ceilings**: `mine_ceiling_timbered`, `mine_ceiling_shaft` (opening for a ladder or scaffold) and
  `mine_ceiling_stalactites` go at height 4 like `mine_ceiling`. Hanging pieces (`mine_crystal_hanging`,
  `mine_stalactite`, `mine_bats`, `mine_lamp_string`, `mine_ore_bucket`) hang below their pivot: put the pivot
  just under the ceiling (height 3.98) or on a hook.
- **Inner corners**: `mine_wall_corner_round` goes on the grid vertex of a room corner and fills the +X / -Z quadrant
  in Godot; rotate it for the other corners.
- **Wall decor** also includes `mine_sign_board` and `mine_mushrooms_wall` (same transform as their wall).

## Moving parts and ready-made Godot scenes

The moving parts are separate pieces, with the pivot on the axis they move around. Each one has a scene in
`godot_demo/scenes/` that uses `kit_mover.gd`:

| Scene | Model | Motion |
|---|---|---|
| `scenes/mine_door.tscn` | `mine_door` | rotate -80 degrees around Godot (0, 1, 0) in 1.2 s |
| `scenes/mine_gate_bars.tscn` | `mine_gate_bars` | rotate -85 degrees around Godot (0, 1, 0) in 1.4 s |
| `scenes/mine_hatch.tscn` | `mine_hatch` | rotate 100 degrees around Godot (1, 0, 0) in 1 s |
| `scenes/mine_lift_cage.tscn` | `mine_lift_cage` | slide -1.3 m along Godot (0, 1, 0) in 3 s |
| `scenes/mine_cart.tscn` | `mine_cart` | slide 4 m along Godot (0, 0, -1) in 3 s |
| `scenes/mine_cart_ore.tscn` | `mine_cart_ore` | slide 4 m along Godot (0, 0, -1) in 3 s |
| `scenes/mine_cart_flat.tscn` | `mine_cart_flat` | slide 4 m along Godot (0, 0, -1) in 3 s |
| `scenes/mine_handcar.tscn` | `mine_handcar` | slide 4 m along Godot (0, 0, -1) in 3 s |
| `scenes/mine_switch_lever_handle.tscn` | `mine_switch_lever_handle` | rotate 60 degrees around Godot (1, 0, 0) in 0.4 s |
| `scenes/mine_rails_switch_blade.tscn` | `mine_rails_switch_blade` | rotate 6 degrees around Godot (0, 1, 0) in 0.5 s |
| `scenes/mine_stamp_head.tscn` | `mine_stamp_head` | slide 0.35 m along Godot (0, 1, 0) in 0.4 s |
| `scenes/mine_ore_bucket.tscn` | `mine_ore_bucket` | slide -1.4 m along Godot (0, 1, 0) in 2.5 s |
| `scenes/mine_chute_gate.tscn` | `mine_chute_gate` | slide 0.35 m along Godot (0, 1, 0) in 0.6 s |

```gdscript
$MineDoor.open()            # swings the door open over 1.2 s
$MineCart.toggle()          # rolls the cart 4 m along the track, then back
$MineChuteGate.opened.connect(func(): print("ore falls"))
```

`kit_mover.gd` exports `motion` (ROTATE or SLIDE), `axis`, `open_amount`, `duration` and `start_open`, and emits
`opened` / `closed`. It works on any piece: give it a child node named `Part`. In the demo, press **F** to open or
close every moving part. The collision of the moving part moves with it (it is a `StaticBody3D` moved by its
parent; for a physics-heavy game, replace it with an `AnimatableBody3D`). The carts roll one cell (4 m): change
`open_amount` for a longer ride, or move the node yourself along a `Path3D`.

Placement in Godot (closed pose):

- `mine_door`, `mine_gate_bars`: in a `mine_wall_entrance` at position P and rotation R, put it at P + R * (-0.95, 0, 0) with rotation R.
- `mine_hatch`: on `mine_floor_shaft` at local (0, 0.12, 1.05) (the hinge edge).
- `mine_lift_cage`: in `mine_floor_shaft` at height -0.12 (platform flush with the floor).
- `mine_cart`, `mine_cart_ore`, `mine_cart_flat`, `mine_handcar`: on a track at height 0.16, turned along it.
- `mine_switch_lever_handle`: on `mine_switch_lever` at height 0.22, same position (the scene holds its -30 degree rest tilt).
- `mine_rails_switch_blade`: on `mine_floor_rails_junction` at local (0, 0, 0.7), same rotation.
- `mine_stamp_head`: on `mine_stamp_mill` at local (0, 0.95, 0).
- `mine_ore_bucket`: under `mine_pulley_frame` at local (0, 2.55, 0).
- `mine_chute_gate`: on `mine_loading_chute` at local (0, 1.62, 0.86).

Lights are not part of the models. The demo puts an `OmniLight3D` just above each lantern flame and in front of
the crystals; the positions are listed in `godot_demo/layout.json` (Blender coordinates).

## Godot 4 quick start

Open `godot_demo/project.godot` with Godot 4.4 or newer (tested with 4.7.2). Press F5 to open the demo mine.
Fly camera: hold the right mouse button to look, WASD to move, Q / E down / up, Shift = faster.
`demo_mine.tscn` has a `Ceiling` node, hidden so that you can look from above: show it to walk inside
(the hanging crystals, stalactites, bats and lamp string are in it too). Press F to open / close every moving part.

To use the kit in your project, copy `glb_godot/` (with collisions) or `glb/` (without) into it.

## Pieces (110, 29319 triangles in total)

### Structure

| File | Size (m) W x D x H | Triangles | Notes |
|---|---|---|---|
| `mine_floor` | 4 x 4 x 0.2 | 12 | Floor tile, 4 x 4 m packed dirt with set stones, walkable top at 0 |
| `mine_floor_rails` | 4 x 4 x 0.36 | 156 | Floor tile with a straight rail track along Blender Y / Godot Z (rail top at 0.16 m) |
| `mine_floor_rails_curve` | 4.013 x 4.013 x 0.36 | 504 | Floor tile with a 90 degree rail curve (from the -Y edge to the +X edge) |
| `mine_floor_rails_end` | 4 x 4.119 x 0.85 | 284 | Floor tile where the track ends against a timber buffer stop (+Y end) |
| `mine_floor_shaft` | 4 x 4 x 1.64 | 236 | Floor tile with a 2 x 2 m shaft opening and a timber collar (lift cage and hatch fit it) |
| `mine_wall` | 4 x 0.624 x 4 | 54 | Rock wall, 4 m wide, 4 m high, 0.5 m thick |
| `mine_wall_half` | 2 x 0.5 x 4 | 26 | Half rock wall, 2 m wide (for half-cell layouts) |
| `mine_wall_ore` | 4 x 0.821 x 4 | 254 | Rock wall with gold and copper ore veins on its front side |
| `mine_wall_crystal` | 4 x 1.356 x 4 | 314 | Rock wall with glowing cyan crystals growing out of its front |
| `mine_wall_timbered` | 4 x 0.86 x 4 | 234 | Rock wall shored up with timber posts and planks on its front side |
| `mine_wall_entrance` | 4 x 0.65 x 4 | 148 | Rock wall with a 2 x 3 m timber-framed opening (mine_door fits it) |
| `mine_wall_collapsed` | 4 x 2.67 x 3.75 | 232 | Partly collapsed rock wall with fallen stones and a broken beam |
| `mine_wall_corner` | 0.864 x 0.859 x 3.996 | 80 | Rock column for wall junctions (put one on each grid vertex) |
| `mine_support_frame` | 3.95 x 0.36 x 3.9 | 108 | Timber support frame across a tunnel: two posts and a cap beam (cell centre or edge) |
| `mine_ceiling` | 4 x 4 x 0.531 | 60 | Rock ceiling tile 4 x 4 m; place it at height 4 |
| `mine_stairs` | 3.98 x 4 x 2.01 | 272 | Stairs cut in the rock with timber risers, rise 2 m over one cell (up toward +Y / Godot -Z) |
| `mine_bridge` | 2.14 x 4.02 x 1.15 | 424 | Plank bridge with rope rails, 4 m long along Blender Y / Godot Z, deck top at 0.25 |
| `mine_rock_pillar` | 1.323 x 1.396 x 3.983 | 100 | Natural rock column, floor to ceiling (4 m) |
| `mine_shaft_headframe` | 3.1 x 3.1 x 3.9 | 356 | Timber headframe with a pulley wheel, stands over mine_floor_shaft (3.9 m high) |
| `mine_door` | 1.892 x 0.18 x 2.898 | 182 | Plank door for mine_wall_entrance. MOVING: pivot = hinge (left edge), turn around Z |
| `mine_hatch` | 2.085 x 2.135 x 0.125 | 184 | Plank hatch for the shaft. MOVING: pivot = hinge (the -Y edge), turn around X to open |
| `mine_lift_cage` | 1.86 x 1.86 x 2.64 | 280 | Lift platform with railings for the shaft. MOVING: slide it along Z; open side faces -Y |
| `mine_floor_rails_junction` | 4.013 x 4.013 x 0.36 | 588 | Floor tile with a rail turnout: straight track along Blender Y plus a branch curving to the +X edge (mine_rails_switch_blade fits it at local (0, -0.7, 0)) |
| `mine_floor_rails_cross` | 4 x 4 x 0.36 | 456 | Floor tile with two tracks crossing at right angles |
| `mine_floor_rails_slope` | 4 x 4.072 x 2.143 | 388 | Rail track on a dirt ramp, rises 2 m over one cell toward +Y / Godot -Z (same rise as the stairs) |
| `mine_floor_pit` | 4 x 4 x 1.5 | 120 | Floor tile with a 1.5 m deep rocky pit (span it with mine_rail_bridge or mine_bridge) |
| `mine_rail_bridge` | 2 x 4 x 1.687 | 360 | Timber trestle carrying a rail track over a pit, 4 m along Blender Y, rails at the same height as the rail floors |
| `mine_floor_puddles` | 4 x 4 x 0.215 | 300 | Floor tile with water puddles |
| `mine_floor_rubble` | 4 x 4 x 0.396 | 116 | Floor tile strewn with gravel, loose stones and a broken plank |
| `mine_floor_planks` | 4 x 4 x 0.19 | 48 | Plank floor tile on timber joists, walkable top at 0 |
| `mine_wall_silver` | 4 x 0.909 x 4 | 312 | Rock wall crossed by a pale quartz lode studded with silver |
| `mine_wall_gems` | 4 x 1.031 x 4 | 537 | Rock wall with three geode pockets full of red and green gems |
| `mine_wall_coal_seam` | 4 x 1.113 x 4 | 238 | Rock wall cut through two thick coal seams, with loose coal at its foot |
| `mine_wall_low_tunnel` | 4 x 0.622 x 4 | 124 | Rock wall with a low 1.5 x 1.5 m crawl tunnel framed in timber |
| `mine_wall_alcove` | 4 x 0.61 x 4 | 400 | Rock wall with a timber-framed niche, a shelf with ore samples and a small lamp |
| `mine_wall_corner_round` | 1.612 x 1.395 x 4.195 | 320 | Rounded rock mass for an inner room corner: pivot on the grid vertex, fills the +X / +Y quadrant (Godot +X / -Z) |
| `mine_gate_bars` | 1.95 x 0.203 x 2.9 | 324 | Iron bar gate for mine_wall_entrance (another choice than the door). MOVING: pivot = hinge (left edge), turn around Z |
| `mine_support_braced` | 4.02 x 1.2 x 3.915 | 192 | Heavy support set across a tunnel: leaning posts, knee braces, cap beam and lagging boards (cell centre or edge) |
| `mine_support_post` | 1.3 x 0.5 x 3.88 | 76 | Single timber prop with a cap board, wedged under the ceiling (3.9 m) |
| `mine_ceiling_timbered` | 4 x 4 x 0.63 | 120 | Rock ceiling tile held by three timber beams; place it at height 4 |
| `mine_ceiling_shaft` | 4 x 4 x 1.83 | 188 | Rock ceiling tile with a 2 x 2 m opening and a timber collar (a ladder or scaffold can go up); place it at height 4 |
| `mine_ceiling_stalactites` | 4 x 4 x 1.74 | 508 | Rock ceiling tile with stalactites hanging up to 1.3 m down; place it at height 4 |
| `mine_stairs_timber` | 2.28 x 4.134 x 3.036 | 216 | Open timber staircase 2 m wide with a handrail, rise 2 m over one cell (up toward +Y / Godot -Z) |
| `mine_walkway` | 1.64 x 4 x 3 | 276 | Timber walkway 4 m long along Blender Y, 1.6 m wide, deck top at 2 m, with railings |
| `mine_platform` | 4.02 x 4.02 x 3 | 396 | Timber platform 4 x 4 m on posts, deck top at 2 m, railing on its +X side (upper track level, landings) |
| `mine_cave_in` | 3.931 x 2.978 x 3.607 | 424 | Cave-in: a pile of boulders and broken beams that blocks a whole tunnel (4 m wide, 3.6 m high) |
| `mine_rock_arch` | 3.973 x 0.903 x 3.868 | 300 | Natural rock arch, 4 m wide and 3.7 m high (grotto entrances, cave halls) |
| `mine_loading_chute` | 3.34 x 2.595 x 3.6 | 512 | Timber gantry with an ore bin and a chute that straddles a track along Blender Y (mine_chute_gate fits its mouth at local (0, -0.86, 1.62)) |

### Props

| File | Size (m) W x D x H | Triangles | Notes |
|---|---|---|---|
| `mine_cart` | 1.2 x 1.66 x 1.01 | 548 | Empty mine cart, wheels fit the rails. MOVING: roll it along Blender Y / Godot Z, at height 0.16 on rails |
| `mine_cart_ore` | 1.2 x 1.66 x 1.23 | 796 | Mine cart loaded with ore and gold. MOVING: same as mine_cart |
| `mine_lantern_hanging` | 0.222 x 0.222 x 0.96 | 198 | Lantern on a chain; hang it from a beam (pivot = bottom, top hook at 0.95 m) |
| `mine_lantern_post` | 0.911 x 0.5 x 1.975 | 234 | Wooden post with a hanging lantern, 2 m |
| `mine_lantern_wall` | 0.222 x 0.551 x 0.82 | 222 | Wall lantern on an iron arm (wall decor: use the wall's transform) |
| `mine_pickaxe` | 0.949 x 0.786 x 0.1 | 56 | Pickaxe lying on the ground |
| `mine_shovel` | 1.465 x 0.27 x 0.065 | 68 | Shovel lying on the ground |
| `mine_tool_rack` | 1.593 x 0.27 x 1.81 | 296 | Wall rack with two pickaxes and two shovels (back side +Y) |
| `mine_ore_pile_gold` | 1.455 x 1.477 x 0.55 | 334 | Pile of rock with gold nuggets |
| `mine_ore_pile_iron` | 1.358 x 1.379 x 0.5 | 294 | Pile of rusty iron ore |
| `mine_coal_pile` | 1.318 x 1.28 x 0.45 | 294 | Pile of coal |
| `mine_crystal_cluster` | 0.68 x 0.618 x 1.15 | 176 | Cluster of glowing cyan crystals on a rock base |
| `mine_crystal_large` | 1.232 x 1 x 2.189 | 176 | Large violet crystal formation, 2 m |
| `mine_boulders` | 1.938 x 1.444 x 0.994 | 100 | Group of large fallen boulders |
| `mine_stalagmite` | 1.088 x 0.875 x 1.7 | 168 | Stalagmite with two smaller spikes, 1.7 m |
| `mine_dynamite_crate` | 0.994 x 0.82 x 0.968 | 352 | Crate of dynamite with a bundle on top |
| `mine_detonator` | 0.769 x 0.33 x 0.745 | 136 | Plunger detonator box with its wire spool |
| `mine_winch` | 0.9 x 1.78 x 1.242 | 184 | Hand winch with a rope drum on two timber trestles |
| `mine_switch_lever` | 0.5 x 0.36 x 0.25 | 80 | Track switch lever base (put mine_switch_lever_handle on it at height 0.22) |
| `mine_switch_lever_handle` | 0.083 x 0.083 x 0.94 | 60 | Lever handle. MOVING: pivot = axle, turn it around X (about +/- 30 degrees) |
| `mine_ladder` | 0.59 x 0.09 x 4 | 284 | Wooden ladder, 4 m (lean it on a wall or put it in a shaft) |
| `mine_scaffold` | 2 x 2.05 x 2 | 132 | Timber scaffold, 2 x 2 m, platform at 2 m |
| `mine_sign_danger` | 0.914 x 0.215 x 1.661 | 64 | Wooden warning sign on a post (no text) |
| `mine_mushrooms_glow` | 0.734 x 0.573 x 0.55 | 428 | Cluster of glowing cave mushrooms |
| `mine_plank_pile` | 2.313 x 1 x 0.58 | 84 | Stack of timber planks and beams |
| `mine_workbench` | 2 x 1.107 x 1.352 | 454 | Workbench with a vise, a pickaxe and ore samples, 2 x 0.9 m |
| `mine_rails_switch_blade` | 1.145 x 1.3 x 0.16 | 84 | Switch blades for mine_floor_rails_junction (local (0, -0.7, 0)). MOVING: pivot = heel, turn around Z (about 6 degrees) |
| `mine_conveyor` | 1.17 x 3.82 x 2.141 | 536 | Inclined belt conveyor 3.6 m long (0.6 m to 2 m high) with ore on the belt |
| `mine_stamp_mill` | 2.04 x 1.453 x 3.233 | 364 | Ore stamp mill: mortar box, timber frame and cam shaft (mine_stamp_head fits it at local (0, 0, 0.95)) |
| `mine_stamp_head` | 0.277 x 0.369 x 2.33 | 116 | Stamp of the stamp mill: stem and iron shoe. MOVING: pivot = bottom of the shoe, slide it along Z (0.35 m) |
| `mine_pulley_frame` | 3.3 x 1.811 x 3.16 | 244 | Timber gallows frame with a pulley that straddles mine_floor_shaft (2.9 m wide); mine_ore_bucket hangs at local (0, 0, 2.55) |
| `mine_ore_bucket` | 0.557 x 0.546 x 1.95 | 432 | Wooden ore bucket on its rope, hangs below its pivot (top of the rope). MOVING: slide it along Z to lower it (-1.4 m) |
| `mine_chute_gate` | 0.66 x 0.117 x 0.58 | 120 | Iron gate plate for the loading chute mouth. MOVING: slide it along Z to let the ore fall (0.35 m) |
| `mine_lamp_miner` | 0.262 x 0.148 x 0.305 | 118 | Small oil miner's lamp with a hook (put it on a table or a ledge) |
| `mine_lamp_string` | 4.06 x 0.188 x 1.07 | 630 | Cable with three hanging lanterns, 4 m along Blender X; hangs below its pivot (cable at 0) |
| `mine_sign_arrow` | 1.44 x 0.17 x 1.9 | 68 | Signpost with two blank arrow boards (no text) |
| `mine_sign_board` | 1.36 x 0.095 x 0.67 | 108 | Blank wall plank sign with a painted crossed-picks mark (wall decor: use the wall's transform) |
| `mine_crate_ore` | 0.91 x 0.94 x 0.75 | 360 | Open crate full of ore and gold nuggets |
| `mine_barrel_powder` | 0.603 x 0.637 x 0.954 | 344 | Black powder keg with a red band and a fuse |
| `mine_water_trough` | 1.62 x 0.781 x 0.836 | 168 | Timber water trough on legs, 1.6 m |
| `mine_drill_hand` | 1.367 x 1.933 x 1.965 | 152 | Hand rock drill on a tripod, with a crank wheel |
| `mine_mushroom_giant` | 1.97 x 1.97 x 2.62 | 334 | Giant glowing cave mushroom, 2.6 m, with two small ones at its foot |
| `mine_mushrooms_wall` | 2.617 x 0.532 x 2.555 | 486 | Glowing shelf fungi growing on a wall (wall decor: use the wall's transform) |
| `mine_geode` | 1.843 x 1.854 x 1.458 | 500 | Split geode bowl, 1.9 m wide, lined with violet crystals |
| `mine_crystal_hanging` | 0.884 x 0.769 x 1.132 | 150 | Cyan crystals hanging from a rock lump; hangs below its pivot (fix it under a ceiling) |
| `mine_crystal_shards` | 1.103 x 1.103 x 0.235 | 374 | Small red and green gem shards scattered on a patch of gravel |
| `mine_rail_stack` | 2.889 x 2.4 x 0.39 | 204 | Stack of spare sleepers with four rails on top |
| `mine_wheelbarrow` | 0.92 x 1.987 x 0.7 | 184 | Iron wheelbarrow with a load of ore |
| `mine_sack_pile` | 1.328 x 0.805 x 0.884 | 264 | Pile of six tied ore sacks |
| `mine_table` | 1.6 x 1.27 x 1.01 | 216 | Miner's table and bench with a lunch tin, a mug and bread |
| `mine_canary_cage` | 0.839 x 0.512 x 1.605 | 360 | Canary in a cage on a stand (the miners' gas alarm) |
| `mine_rope_coil` | 1.257 x 0.753 x 0.2 | 432 | Coil of rope with an iron hook |
| `mine_strongbox` | 0.84 x 0.59 x 0.59 | 104 | Iron-bound strongbox for the gold, with a padlock |
| `mine_dynamite_bundle` | 0.967 x 0.9 x 0.162 | 188 | Three tied sticks of dynamite with a long fuse on the ground |
| `mine_vent_fan` | 1.01 x 2.4 x 1.175 | 396 | Hand-cranked ventilation fan with a canvas air duct |
| `mine_vent_chimney` | 0.9 x 0.91 x 3.9 | 282 | Square timber air duct from floor to ceiling (3.9 m) with an iron grille at the bottom |
| `mine_water_pump` | 0.9 x 1.353 x 1.404 | 212 | Hand water pump on a timber base, with a bucket under the spout |
| `mine_scaffold_tall` | 2 x 2.06 x 3.6 | 376 | Two-storey timber scaffold, 2 x 2 m, decks at 1.8 m and 3.4 m, with ladders |
| `mine_stalactite` | 1.06 x 0.796 x 1.798 | 188 | Large stalactite with two smaller ones; hangs below its pivot (1.8 m) |
| `mine_bats` | 0.646 x 0.424 x 0.497 | 320 | Three bats asleep under a rock lump; hangs below its pivot |
| `mine_cart_flat` | 1.2 x 1.9 x 1.01 | 596 | Flat cart loaded with timber beams. MOVING: roll it along Blender Y / Godot Z, at height 0.16 on rails |
| `mine_handcar` | 1.2 x 1.761 x 1.33 | 752 | Rail handcar with a pump lever. MOVING: roll it along Blender Y / Godot Z, at height 0.16 on rails |

## Materials

One small palette shared by every piece, named `dk_*`, plain colours. Rock walls, ceilings, floors and plank decks
are solid blocks with a small tiling texture (256 px, in `textures/` and embedded in every GLB / FBX): no
stone-by-stone geometry, no bevels, no gaps. The palette reuses the Cryptstone colours
(stone, wood, iron, steel, gold, cloth, parchment, wax, sack, coal, fire) plus a few mine colours (two rocks,
dirt, rust, copper, rope, cyan and violet crystals, glowing mushrooms). New in 1.1: blue cloth, clay, brass,
leather and water (same values as in the other kits), silver, quartz, red and green gems, canary yellow. Recolour the whole kit by editing a few
materials. Fire, crystals and mushrooms use emission.

## Regenerating the kit

```
blender -b --factory-startup -P blender/build_kit.py
```

(Blender 4.5 LTS.) The script rebuilds the meshes, the exports and the renders; change sizes, colours or add
your own pieces in it. The "with Cryptstone" preview render needs the Cryptstone GLBs in `_cryptstone_ref/`; the
script skips it when they are not there.

## Changelog

- **1.2.0**: back to free, CC0. Lighter models: walls and floors are solid textured blocks instead of stone-by-stone geometry, no bevels,
  no gaps (72358 tris -> 29319 tris for the whole kit). Rock walls and ceilings keep a few big facets, plank
  floors, decks and scaffolds are one textured slab, chains are a single rod.
- 1.1.1: licence change only (README and LICENSE), no model changed.
- 1.1.0: 62 new pieces, ready-made Godot scenes for the moving parts, a bigger demo mine.
- 1.0.0: first release.

## How it was made

Made by Benny, with AI tools: the models are generated by a Python script written with an AI assistant and run in
Blender. No image-generation AI and no AI 3D generator were used.

## Licence

CC0 1.0 Universal (public domain dedication), see `LICENSE.txt`.

Copies sold from 16 November 2026 until this release (version 1.1.1) were under a commercial licence;
from version 1.2.0 on, the kit is CC0 again.
