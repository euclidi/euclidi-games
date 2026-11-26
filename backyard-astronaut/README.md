# Backyard Astronaut

Scavenge physical parts, assemble and board the same spacecraft, launch from a backyard, and explore a miniature solar system using orbital mechanics.

**Status:** Active — unified V2 preview; Alpha 0.3 retained.

[Open browser build](https://euclidi.github.io/euclidi-games/backyard-astronaut/v2/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

V2: WASD/touch, drag orbit, E collect/mount, R rotate, Q drop/detach, F board, throttle/pitch and space thrust.

## Runtime

Approved V2 architecture: Three.js/WebGL2, TypeScript/Vite, Rapier 3D, Float64 orbital integration, workers, Web Audio and IndexedDB. Current V2 uses pinned Three.js/Rapier modules, JS, raster volumes, numerical flight and localStorage.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/backyard-astronaut/v2/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [Approved V2 architecture](ARCHITECTURE_V2.md)
- [V2 release notes](v2/README.md)
- [Model revision](v2/MODEL_REVISION.md)
- [Alpha 0.3](https://euclidi.github.io/euclidi-games/backyard-astronaut/)

## Limitations

Full authored art, continuous planetary terrain transitions, physical joints, six-degree-of-freedom torque, staging, lunar landing, wider solar system, progression, controller and IndexedDB remain incomplete.
