# Scrap Orbit

Futuristic physics-based launcher prototype featuring robots against alien, mutated and cyborg factions.

**Status:** Archived — removed from catalog at owner's request.

[Retained historical build](https://euclidi.github.io/euclidi-games/scrap-orbit/) (not listed in the catalog) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

Faction presets, robot selector, aim/test shot, pause, slow motion, collider debug, reset.

## Runtime

PixiJS 8.8.1 and Planck.js 1.5.1 via pinned esm.sh imports; raster stack art and 120 Hz rigid-body step.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/scrap-orbit/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Limitations

Full modes, upgrades, progression, asset quality, content and release validation unfinished. No current catalog launch audit applies.
