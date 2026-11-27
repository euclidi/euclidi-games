# Dummy Lab — W1.9

Observe an autonomous articulated humanoid from a furnished laboratory, inspect its behavior and interact with it from the observation area.

**Status:** W1.9 stance revision; browser and visual verification pending. Existing URL retained.

[Open browser build](https://euclidi.github.io/euclidi-games/dummy-lab-w18/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

WASD or touch pad; camera, exposure, speed, resolution and Actions controls on screen.

## Runtime

Three.js 0.180.0, Rapier 0.17.3 WASM, browser ES modules/import map, original procedural meshes, IK animation and 120 Hz environment stepping. Pinned CDN dependencies.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/dummy-lab-w18/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [W1.7 archived version](../dummy-lab/README.md)

## Limitations

Body remains kinematic; environment uses Rapier but powered balancing, physical falls and contact-driven actions are not certified. Visual hand alignment and room fidelity still need human review; mobile performance unmeasured.
