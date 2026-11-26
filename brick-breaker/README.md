# Brick Breaker

Precision paddle play combined with dense physical destruction, material interactions, projectile upgrades and persistent incremental progression.

**Status:** Active — browser 0.2 adaptation.

[Open browser build](https://euclidi.github.io/euclidi-games/brick-breaker/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

Mouse/touch or keyboard paddle; on-screen launch, modes, upgrades and restart.

## Runtime

Approved native branch: C++23, SDL3, bgfx, Box2D 3.1.1, Clipper2. Browser adaptation: Canvas 2D, Planck.js 1.5.1, 1280×720 and fixed 120 Hz. Native pipeline remains separate.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/brick-breaker/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [Existing scope audit](SCOPE.md)
- [Native Stage 1 branch](https://github.com/euclidi/euclidi-games/tree/brick-breaker-stage1/brick-breaker)
- [Latest dedicated test](https://github.com/euclidi/euclidi-games/actions/runs/45912705564)

## Limitations

Rectangular fracture, simplified heat/fluids, no native GPU deployment, continuous traversal, advanced weapons, bosses, full art/audio, controller and automation remain incomplete.
