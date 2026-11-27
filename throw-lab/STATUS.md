# Throw Lab V12 — development preview
Date: 2026-11-27.

## Implemented in V12
- Canonical V11 preserved byte-for-byte (excluding no changes: baseline newline restored and FNV-1a verified against mounted source).
- Standalone fullscreen responsive control layout, return-to-library link, camera world matrix updates, recovered instructions after reset and gesture cancellation on focus loss.
- Corrected floor collider height, added side/end wall and ceiling contacts, moved bucket base to floor, aligned handle collider to its visible Catmull-Rom curve.
- Calibrate only an unspun reference release; user spin, aim and strength are applied afterward rather than automatically counter-steering the curve.
- Magnus spin ratio uses transverse angular velocity; zero spin produces zero lift.
- Revised physical light intensity, disabled sun through ceiling, corrected floor shadow and candy decoration placement.
- Existing seven balls, five techniques, three targets, net, scoring, camera, sound preserved.

## Verified
- Repository source retrieved and compiled as JavaScript.
- 315 parameter combinations (7 balls × 3 targets × 5 modes × 3 spin values) returned finite release/flight values within each speed cap, using extracted production functions with a minimal vector implementation.
- Basketball example at nominal release: target-plane x positions approximately -1.877, 0, +1.877 m for spin -1, 0, +1; nominal no-spin y=3.046 m.
- Isolated floor impact from -4 m/s rebounded at +2.246 m/s; isolated torus contact from -3 m/s rebounded at +1.8 m/s.
- These are isolated numerical tests, not full runtime/cloth/gesture integration tests.

## Unverified and incomplete
- Actual browser/WebGL visual and interactive playtesting unavailable in current runtime; CDN load, actual lighting exposure, mobile layout, and framerate not verified.
- Real-world physical calibration, accurate can cylinder contacts and stack dynamics, rim/net scoring regression, realistic articulated jump shot/follow-through and bank trajectory remain approximate.
- No external art pack integrated yet; geometry still substantially procedural. Bowling finger holes and basketball panel seams need further visual fidelity. Fictional balls have estimates, not measured properties.
- No gameplay screenshot or cover fabricated. Use a typographic catalog cover until a verified capture exists.
- A commit is not evidence of successful Pages deployment; confirm direct play URL independently.
