# Foot IK Grounder Lite for Godot 4

Free starter version of **Foot IK Grounder**. It keeps both feet of an animated humanoid on the ground:
one ray per foot, a simple two-bone leg IK, and the hips drop so the lower foot can reach a lower step.
One node, pure GDScript, no plugin to enable. Godot 4.4 or newer (tested on 4.4.1 and 4.7.2).

> **Want feet that really sit on stairs, slopes and rocks?** The full **Foot IK Grounder** adds foot
> rotation to the slope, whole-foot clearance taken from your skinned mesh (no toes through step edges),
> swing look-ahead so feet lift before a step, separate smoothing for feet and hips, a foot speed limit,
> footstep signals, a debug view, a live tuning panel, a full test course and 82 automated tests.
> **Get it here: https://dangalg.itch.io/foot-ik-grounder-godot**

## Quick start
1. Copy `addons/foot_ik_lite/` into your project.
2. Select your character's `Skeleton3D` and add a child node **FootIKLite** (after other modifiers).
3. Set **Ground Mask** to your floor's physics layers. Press play.

Open `demo/lite_demo.tscn` (the main scene) to see two mannequins standing half on a step, one with
the Lite node and one without, and a walker going up and down three steps. **G** toggles IK on the walker.

## Settings (`FootIKLite`)
| Property | Meaning |
|---|---|
| `ground_mask` | physics layers the feet stand on |
| `max_reach_down` | how far below the character's root a foot may reach (m) |
| `max_hips_drop` | most the hips go down so the lower foot reaches (m) |
| `follow_speed` | how fast feet and hips follow the ground (1/s) |
| `hips_bone`, `left_leg`, `right_leg` | bone names; leave empty to auto-detect Rigify/Quaternius, Mixamo or Godot humanoid names |

`last_feet` holds the world positions of both ankles after each solve.

## What Lite does not do
Feet are not tilted to the slope, only the ankle point is placed, so on steep ground toes or heels can
go into the surface. There is no look-ahead, no debug view and no tuning panel. All of that is in the full kit.

## Tests
```
godot --headless --path . res://tests/run_tests.tscn
```

## License
Code: MIT (LICENSE.md). Demo mannequin: CC0. No generative AI art or animation is used.
