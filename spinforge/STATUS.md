# Status — 2026-11-27 / v0.7.0 candidate
Baseline VI full HTML archived. Original 3D geometry and arenas retained. Vendored Three.js r169 exact upstream blob 424ef1c8e5dd8ce1ca89c8004954b17485aef269 with MIT license.

Implemented: energy-capped steering, larger contact proxy, pocket clearance, airborne height compensation, wall cooldown, shared geometry disposal fix, seeded physics, recorded state timeline, catalog anchor. Experiment and condition hooks in core only.

Executed real JavaScript core tests: 120 seeded bouts across three arenas and varied parts; 17172 contacts; {"SPIN FINISH":51,"TIME / SPIN ADVANTAGE":63,"STADIUM OUT":6}; finite state, single finish, repeatable state recording, depleted-spin energy cap and experimental input guard passed. Script parses. See tests/core-results.json.

Unverified: actual WebGL visuals and UI/flow, mobile sizing, physical controller, audio. Local container has no network; vendor retrieved through GitHub connector. Browser CI not yet run. No genuine cover; no catalog listing or live deployment certified. Solver is 2.5D, not full 3D. Replay UI, workshop, physical detachment and native five-top roster not implemented. Asset-first reference/model acquisition outstanding. Archive retains historical renderer dependency. Next: integrate UI, browser CI, visual inspection, fixes, cover, catalog.
