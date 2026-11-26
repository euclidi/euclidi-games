# Dummy Lab — W1.7

Earlier reconstruction of the autonomous humanoid laboratory; preserved for regression comparisons.

**Status:** Archived — predecessor to W1.8.

[Open browser build](https://euclidi.github.io/euclidi-games/dummy-lab/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

WASD/touch, free camera and action controls; this version retains the old headlamp.

## Runtime

Three.js 0.180.0, Rapier WASM 0.17.3, Vite optional; browser modules and kinematic IK.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/dummy-lab/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [Active W1.8 specification](../dummy-lab-w18/SPEC.md)
- [Active roadmap](../dummy-lab-w18/ROADMAP.md)

## Limitations

Kinematic body, approximate action/contact fidelity and unmeasured device performance. Not a byte-identical reconstruction of the earlier hosted build.
