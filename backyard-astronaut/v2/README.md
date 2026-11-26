# Backyard Astronaut — V2

Same-scene exploration, salvage, assembly and flight with stable spacecraft identity.

**Status:** Active — experimental unified build.

[Open browser build](https://euclidi.github.io/euclidi-games/backyard-astronaut/v2/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

WASD/touch, E collect/mount, R socket rotation, Q drop/detach, F board, space thrust, camera orbit and flight controls.

## Runtime

Pinned Three.js and Rapier CDN modules; local dependency bundle in CI; custom raster volumes and point-mass RK4 flight.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/backyard-astronaut/v2/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [Parent approved architecture](../ARCHITECTURE_V2.md)
- [Parent roadmap](../ROADMAP.md)
- [V2 model revision](MODEL_REVISION.md)

## Limitations

Point-mass flight is not full six-axis rigid-body dynamics; joints, staging, full solar system, landing, robust progression, mobile/controller, IndexedDB and fully bundled production remain incomplete.
