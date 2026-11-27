# ROOFRUN 07 — scope revision 1.0
Recovered from the original project conversation and audited ROOFRUN 07 source. Preserve the entire existing course, scoring, checkpoints, controls, practice and obstacle set.

## Game
Third-person 3D urban rooftop parkour. Movement is the primary game mechanic. Retain sprinting, jumping, bilateral wall running/kicking, climbing/mantling, crawling, sliding, vaulting, aerial stunts, landing recovery, moving hazards, narrow walkways, gap traversal, timed runs and style chains. Maintain restart, checkpoints, wall-run practice and finish results. Add reliable settings persistence and clear control feedback without changing the core game into an unrelated mode.

## Movement
Force-based fixed-timestep character motor; collision-aware traversal; sustained momentum; context-sensitive obstacle selection; coyote time/input buffering; consistent directions in course and camera-relative modes. Derive locomotion from actual velocity, acceleration, contact state and terrain. Develop pelvis/spine, shoulder, elbow, wrist, hip, knee, ankle and toe articulation; planted feet, swing trajectories, push-off, hand contact, balance, landing compression and momentum-driven recovery. Do not label authored pose curves or cosmetic animation as fully physical simulation. Preserve playable control authority; avoid full uncontrolled ragdoll as the default locomotion system.

## Technology
Retain Three.js as specified. Baseline uses 0.160.1 and a 120 Hz custom force motor. Evaluate Rapier for collision queries/capsule sweep/contact handling, and a licensed skinned glTF character with procedural IK and contact targets. Do not replace the motor until a compatibility and behavioral comparison supports the change. Pin dependencies and record licenses. Asset-first: source reusable compatible character/environment assets; verify rights, scale, joints, material quality and runtime performance; use tailored geometry only where missing. Urban industrial rooftop identity, coherent materials, geometry and lighting; no primitive mannequin as the final character. Fix flashing surfaces, camera clipping and misaligned geometry.

## Inputs
Keyboard/mouse, touch and browser Gamepad API. Support standard mapping and generic nonstandard controllers where exposed by the browser, calibration, configurable movement/camera axes, deadzones, action remapping, pause and reconnect. Browser support does not imply native DirectInput access or confirmed hardware compatibility. Verify physical controllers separately.

## Delivery
GitHub Pages at /euclidi-games/roofrun/ after actual runtime validation; no Vercel. Add catalog play entry with genuine gameplay imagery and documentation links after acceptance. Complete-first workflow, with engineering milestones internal rather than approval stops. Preserve baseline, test, audit, commit, deploy and disclose all approximations, missing features and unverified devices.
