# Status — 2026-11-27 / v0.7.0 candidate
Baseline VI full HTML archived. Original 3D geometry and arenas retained. Vendored Three.js r169 exact upstream blob 424ef1c8e5dd8ce1ca89c8004954b17485aef269 with MIT license.

Implemented: energy-capped steering, larger contact proxy, pocket clearance, airborne height compensation, wall cooldown, shared geometry disposal fix, seeded physics, recorded state timeline, catalog anchor. Experiment and condition hooks in core only.

Executed real JavaScript core tests: 120 seeded bouts across three arenas and varied parts; 17172 contacts; {"SPIN FINISH":51,"TIME / SPIN ADVANTAGE":63,"STADIUM OUT":6}; finite state, single finish, repeatable state recording, depleted-spin energy cap and experimental input guard passed. Script parses. See tests/core-results.json.

Unverified: actual WebGL visuals and UI/flow, mobile sizing, physical controller, audio. Local container has no network; vendor retrieved through GitHub connector. Browser CI not yet run. No genuine cover; no catalog listing or live deployment certified. Solver is 2.5D, not full 3D. Replay UI, workshop, physical detachment and native five-top roster not implemented. Asset-first reference/model acquisition outstanding. Archive retains historical renderer dependency. Next: integrate UI, browser CI, visual inspection, fixes, cover, catalog.

## 0.7.1
Implemented in source: experiment/duel selector, saved condition/credit/repair, replay timeline scrub/playback, pause, keyboard and gamepad launch. Actual browser interactions not yet certified. Balance calibration: 120 seeded bouts, 13611 contacts, mean 31.70 seconds, finishes {"SPIN FINISH":92,"STADIUM OUT":6,"BURST FINISH":12,"TIME / SPIN ADVANTAGE":10}. Core syntax and deterministic energy tests passed. Earlier note about replay/workshop not implemented superseded for basic interfaces only. Full inventory, exploded views, detachable component physics, effects replay, real gamepad testing and visual quality still outstanding. Browser CI introduced; no cover or catalog claim.

GitHub Actions run 46004621209 independently passed Node physics tests. Browser installation failed before game launch because Playwright 1.51.1 does not support ubuntu26.04-x64. Workflow pinned to ubuntu-24.04 for retry. Do not treat the failed job as a game runtime result.
