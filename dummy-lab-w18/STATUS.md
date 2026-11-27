# Dummy Lab — W1.13 — Current status

Neutral anatomy and stance revision (2026-11-27). W1.8 URL retained as the established catalog route; previous source is available in Git history. The cover is not changed.

## Changes

- Correct radial thumb orientation and index-to-little finger ordering on both hands.
- Relaxed progressive finger flexion, thumb opposition, forearm pronation, subtle wrist deviation and gait-dependent arm swing.
- Raised standing pelvis, staggered feet, slight outward foot headings, asymmetric loading and subdued torso compensation. Spawn in inspection stance before autonomous wandering.
- IK forearm roll follows palm orientation instead of forcing a large twist into the wrist; explicit contact targets retained.
- Observer pose and eye height updated. All 28 existing action entries remain.

## Verification limits

Source anchors and analytical geometry checks passed (see pose-audit.mjs). These are not a live browser test, collision certification, or proof of natural animation. W1.8 startup evidence does not certify W1.9. Browser rendering, contact regression, transition smoothness and user visual approval remain outstanding. Body remains kinematic; no powered balancing or fall simulation added.

## W1.10 mobile and gamepad

Responsive visual viewport, safe-area-aware controls, analog multitouch movement and view drag, free camera elevation, fullscreen where supported, standard Gamepad API and alternate right-stick axes. Desktop controls retained. 19 pure input/viewport checks passed using the exact functions exported by controls.js. Actual browser layout, physical controller and Pages deployment are unverified. Nonstandard button mappings may differ. Cover unchanged.

## W1.11 hybrid locomotion and interaction

Added COM-proxy spring integration, capture-point estimate, load-transfer and planted swing phases, foot pivot and toe segment, extra torso and neck articulation, gait arm counter-swing, step-boundary action queue, pose blending, perturbation and approximate obstacle trip detection, 15-body constrained dynamic ragdoll for falls, procedural recovery blend, spawnable Rapier objects, proximity-checked kinematic grasp and measured grip-velocity release. Added six action entries. Chamber starts empty; mobile and gamepad remain. 1310 numerical checks ran against the exact exported dynamics functions. Browser/runtime and physics-contact testing not performed. Normal walking is reduced-order kinematic IK, not full force-driven active ragdoll; support estimate is approximate, fall joints lack anatomical limits/self-collision, recovery is interpolated, grasp is kinematic not frictional, trip uses geometric proximity rather than actual foot collider contact, older actions remain procedural targets and not all transitions are physically solved. No cover publication.

Post-commit review corrected spine parenting, held-item pickup rise continuity, stale object references and grasp threshold. No rendered validation yet.

## W1.12 capture, clarity and live monitors (2026-11-27)

Replaced desktop drag-only look with actual Pointer Lock API, relative mouse deltas, focus/visibility release and touch/drag fallback. Default native framebuffer with antialiasing and adaptive DPR/area budgets; 480p is optional. Three 640×480 render targets use two fixed chamber cameras and one dummy-tracking camera; exclude monitor surfaces from their own feeds and reuse the main shadow maps. Staggered refresh targets approximately 11 Hz per screen desktop and 5.5 Hz mobile at sufficient FPS. No webcam, desktop capture or prerecorded imagery. Existing physics, rig, room props and archived build preserved. Local numerical and syntax checks / browser CI evidence to be reported separately. Actual Firefox desktop mouse lock, user GPU performance and subjective sharpness not yet verified.

## W1.13 grounded gait and observation-room interaction

Adapted ProceduralWalk (Igor Santarek, MIT; source and license in THIRD_PARTY.md) techniques: velocity-predicted, ground-raycast foot targets, displacement-based foot selection, persistent planted feet, spread-dependent hip height. Player now uses the adaptive gait with toe roll and counter-swing, and optional tiptoe. Dummy's existing reduced-order balance, dynamic falls and object handling retained. Three swivel chairs have seated/standing IK transitions and damped yaw from movement input. Vending cabinet rebuilt with recessed racks, glass, labeled cans, display, inventory, animated delivery flap and collectible can. Free dispensing; no currency or drinking simulation. Chair rotation and vending collection are kinematic, not force-driven. 1011 pure numerical checks passed on exact shared functions; browser, mobile, physical controller, actual IK and scene visuals unverified. No cover changes.

W1.13.1 review: reject ray origins inside furniture, account for elevated planted feet, clamp seated head yaw, update dedicated browser audit for walking, seating, swivel, standing and vending stock/collection. CI execution is pending; no successful rendered run claimed.

## W1.13.2 startup hotfix

Confirmed two W1.13 browser audit startup timeouts (runs 45997056292 and 45997194402). Reproduced `ReferenceError: Cannot access 'world' before initialization` with actual Three.js r180 CPU scene/rig code and stubbed physics/DOM; the local action-space conversion helper shadowed the Rapier world in act(). Renamed helper, ran 1200 successful simulation/controller ticks in the same harness, and added fail-stop on-screen frame diagnostics and early browser error reporting. Real Rapier, WebGL and live Pages startup remain to be verified. No gameplay feature removal.
