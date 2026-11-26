# Sanctuary

Care for an autonomous anthropomorphic werewolf woman inhabiting an abandoned gothic church and its grounds; build a relationship through her choices and remembered interactions.

**Status:** Active — development 0.2.

[Open browser build](https://euclidi.github.io/euclidi-games/sanctuary/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

WASD/touch movement; camera, journal, sound and save; select a caregiving action in the lower panel.

## Runtime

Shipped: Babylon.js CDN, optional Havok WASM, procedural textured meshes, adaptive JS agent, A* pathfinding, IndexedDB. Target: authored articulated/skinned model, advanced animation, richer navigation and planning.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/sanctuary/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [Agent implementation](agent.js)
- [Game runtime](game.js)

## Limitations

Authored anatomy and skinned animation, deep physical caregiving, richer autonomous planning, Recast/GOAP target work, expanded detail, audio and controller validation are incomplete. Havok may fall back to kinematic operation.
