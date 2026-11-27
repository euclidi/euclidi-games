# Development roadmap

These are internal priorities, not approval gates or separate scope reductions.

1. Preserve full baseline and replace fragile service flags with stateful repairs. Current v4.2 introduces normalized pressure/leak decay, timed leak test and progressive drain obstruction, plus autosave/reset.
2. Audit locomotion and collision: retarget a humanoid rig, add world-space foot locks, acceleration-aware hips, collision-aware waypoint routes, chair alignment and head/hand tracking. Retain Maribel's body shape, glasses and candy identity.
3. Asset-first art pass: evaluate compatible CC0 sources, avoid generic low-poly placeholders, adapt real furniture profiles and detailed materials, validate all coordinates and scale. Add fixture manipulation and sound.
4. Extend service model to network of connected fittings, viscosity/resistance, threaded operations, physical tool feedback, visible flow and fluid accumulation. Add failure/recovery scenarios while preserving the original visit.
5. Complete validation: 3D browser smoke test, all 8 tasks, save and reset, keyboard/mobile/controller, NPC cycles, performance, then catalog entry and actual gameplay cover.

Asset candidates (research only, not imported):
- https://quaternius.com/packs/universalbasecharacters.html — CC0 humanoid rig reference, not a direct Maribel replacement.
- https://quaternius.com/packs/universalanimationlibrary.html — CC0 motion clips, inspect walk/sit compatibility and retarget.
- https://kenney.nl/assets/furniture-kit — CC0 furniture references, reject if lower visual quality than existing geometry.
- https://threejs.org/docs/pages/CCDIKSolver.html — IK reference; match addon version to Three.js version before import.
