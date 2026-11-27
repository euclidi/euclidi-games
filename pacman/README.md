# PAC-MAN — Maze Arcade / 1980

Unofficial browser recreation of classic arcade maze gameplay, with selectable authentic, advanced and hybrid ghost intelligence.

**Status:** Active — Git revision 1.4.4.

[Open browser build](https://euclidi.github.io/euclidi-games/pacman/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

The title menu opens first. Choose a ghost AI mode, sound and CRT preferences before starting. Enter/Space or controller Start/A starts a game; Left/Right changes mode. In play, use arrows/WASD, swipe, D-pad or controller. Escape or Main Menu suspends the current session; Resume Game returns to it. Mode selection applies to new games. CONTROL cycles between a yellow-feedback D-pad, a four-way red ball-top joystick, and hidden touch controls. The setting is saved; keyboard, swipe and physical gamepad remain available.

## Runtime

Local 224×288 Canvas bitmap compositor, JS game logic, synthesized Web Audio, optional Vite packaging. No Phaser runtime or CDN needed for static play.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/pacman/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [Maze logic](src/core.js)
- [Bitmap compositor](src/bitmap-runtime.js)
- [Regression suite](test.mjs)

## Limitations

No ROM or official recordings bundled; sprite, audio, timing and intermission fidelity not certified 1:1. Intermissions/fruit simplified; measured device and listening tests remain.
