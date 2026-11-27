# VOIDRUNNER

Development v0.24.0 — a first-person superhuman planetary traversal sandbox, with an optional body-view camera. It is not a spacecraft piloting game. Earth is currently playable; the recovered multi-world scope is not complete.

[Play candidate](https://euclidi.github.io/euclidi-games/voidrunner/) · [Specification](SPEC.md) · [Roadmap](ROADMAP.md) · [Status](STATUS.md)

## Controls
WASD moves, drag or arrow keys look, Space boosts/launches, Shift brakes or dives underwater; F casts, Q cycles powers, 1–5 select, V changes camera, E interacts, Escape pauses. Touch controls and a remappable raw/standard gamepad menu are included. Profile sets temperament, launch, suit, powers and explicit Save Position/Resume Save. Orbit, skim, reentry, dive and surface buttons are existing test/exploration shortcuts, not the intended final traversal loop.

## Run
From the repository root, run `python3 -m http.server 8765`, then open http://localhost:8765/voidrunner/. No runtime package, CDN or service is needed. Main HTML embeds the texture atlas, shader and CPU renderer. The historical v23 file is retained under legacy/; do not substitute it for current source. Browser smoke: install playwright@1.56.1 and Chromium, then `node voidrunner/smoke.mjs` with server running.

## Limitations
Development build, not release certified: simplified surface, screen-space humanoid, fixed Earth radius, approximate atmospheric and ocean simulation, incomplete LOD, limited world persistence, real GPU and physical controllers not verified. Multi-world traversal is missing; see specification and status.
