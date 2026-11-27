# Dummy Lab — W1.10 — Current status

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
