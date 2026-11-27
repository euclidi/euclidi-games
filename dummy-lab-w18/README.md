# Dummy Lab — W1.11

Observe an autonomous articulated humanoid from a furnished laboratory, inspect its behavior and interact with it from the observation area.

**Status:** W1.11 hybrid locomotion and physical interactions revision; browser and visual verification pending. Existing URL retained.

[Open browser build](https://euclidi.github.io/euclidi-games/dummy-lab-w18/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

WASD/arrows + drag to look; Q/E free-camera elevation. Touch: left analog pad and drag scene to look, UP/DOWN in free camera. Standard gamepad: left stick move, right stick look, LB/RB elevation, A noise, B camera, X slow motion, Y/Start Actions. In Actions: D-pad up/down, A play, B close, X auto. Alternate right-stick axes and touch settings under Controls / gamepad.

## Runtime

Three.js 0.180.0, Rapier 0.17.3 WASM, browser ES modules/import map, original procedural meshes, IK animation and 120 Hz environment stepping. Pinned CDN dependencies.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/dummy-lab-w18/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [W1.7 archived version](../dummy-lab/README.md)

## Limitations

Body remains kinematic; environment uses Rapier but powered balancing, physical falls and contact-driven actions are not certified. Visual hand alignment and room fidelity still need human review; mobile performance unmeasured.

## Physical tests

Open Actions, select a rubber ball, block or cylinder and Spawn; choose pick up item, carry item, throw item or drop item. Nudge tests balance correction; Shove triggers dynamic fall; recover returns to standing. Empty chamber on reset. Normal gait uses a reduced-order model and falls use Rapier bodies. See STATUS for limits.
