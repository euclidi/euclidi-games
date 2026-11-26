# PAC-MAN — Maze Arcade / 1980

Unofficial browser recreation of classic arcade maze gameplay, with selectable authentic, advanced and hybrid ghost intelligence.

**Status:** Active — Git revision 1.4.x.

[Open browser build](https://euclidi.github.io/euclidi-games/pacman/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

Start, arrow keys/WASD, directional pad or swipe; mode, pause, sound and CRT toggles.

## Runtime

Local 224×288 Canvas bitmap compositor, JS game logic, synthesized Web Audio, optional Vite packaging. No Phaser runtime or CDN needed for static play.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/pacman/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [Maze logic](src/core.js)
- [Bitmap compositor](src/bitmap-runtime.js)
- [Regression suite](test.mjs)

## Limitations

No ROM or official recordings bundled; sprite, audio, timing and intermission fidelity not certified 1:1. Intermissions/fruit simplified; measured device and listening tests remain.
