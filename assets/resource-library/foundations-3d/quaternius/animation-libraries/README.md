# Quaternius humanoid motion libraries

Each version is an independent CC0 humanoid motion library with its own canonical armature and action names. Do not merge the two clip lists blindly: create a retarget map and validate bind pose, foot contact, root motion, and transition timing in the destination engine.

- `v1/`: 43 GLB animation entries; see `v1/CLIPS.txt`.
- `v2/`: 43 GLB animation entries; see `v2/CLIPS.txt`.

Each version provides an in-place GLB and a separate root-motion GLB (`*_RM.glb`), so choose one motion grammar per controller. Blender 4.2.9 loaded both variants for both libraries with a 65-bone armature and all 43 named entries. A sampled walk pose changed over time. This is import evidence, not a test of a game's controller or every clip's visual quality.
