# Dojo X

Develop recognizable emergent fighting motion through physical articulated bodies, recorded experiments and replay, rather than scripted hit outcomes.

**Status:** Active — Stage 1D physical-controller research; Stage 2 gated.

[Open browser build](https://euclidi.github.io/euclidi-games/dojo/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

Choose a configuration and replay; Play, frame step, speed, diagnostics, Optimize from best, save ratings, export/import.

## Runtime

Bundled MIT p2.js 0.7.1, 21 rigid bodies, 20 motorized joints, planar 120 Hz physics, Web Worker optimizer, Canvas replay, IndexedDB.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/dojo/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [Earlier combat build](legacy/dojo-ix.html)
- [Experiment evidence](experiments/git-seed-summary.json)
- [Physical controller](physics.js)

## Limitations

Planar prototype, self-collision disabled, recovery often fails; numerical score does not prove believable motion. Full striking/contact/combinations and approved Stage 1 acceptance remain incomplete.
