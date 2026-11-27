# PAC-MAN — Maze Arcade / 1980

Unofficial browser recreation of classic arcade maze gameplay, with selectable authentic, advanced and hybrid ghost intelligence.

**Status:** Active — Git revision 1.7.5.

[Open browser build](https://euclidi.github.io/euclidi-games/pacman/) · [Game catalog](https://euclidi.github.io/euclidi-games/)

## Documentation

- [Development specification](SPEC.md) — scope, architecture and acceptance criteria.
- [Roadmap](ROADMAP.md) — outstanding work in priority order.
- [Current status](STATUS.md) — implementation and actual validation evidence.

## Controls

The title menu opens first. Choose a ghost AI mode, sound and CRT preferences before starting. Enter/Space or controller Start/A starts a game; Left/Right changes mode. In play, use arrows/WASD, swipe, D-pad or controller. Escape or Main Menu suspends the current session; Resume Game returns to it. Mode selection applies to new games. CONTROL cycles between a yellow-feedback D-pad, a four-way red ball-top joystick, and hidden touch controls. The setting is saved; keyboard, swipe and physical gamepad remain available. Mobile landscape places one selected movement control on the left, the game in the middle, and utility buttons on the right. CONTROL OFF removes the movement slot entirely. Revision 1.7.5 measures the actual remaining display area, tracks browser viewport changes, preserves the maze aspect ratio and uses a compact top-down bitmap ball-top joystick. SETTINGS provides five compact tabs with 19 persistent gameplay, audio, control and display options, plus fullscreen and restore defaults. Starting lives, bonus threshold and ghost speed apply to new games; non-default rule sets have separate high scores.

## Runtime

Local 224×288 Canvas bitmap compositor, JS game logic, synthesized Web Audio, optional Vite packaging. No Phaser runtime or CDN needed for static play.

Serve the repository with a local HTTP server from its root (for example `python3 -m http.server 8000`) and open `http://localhost:8000/pacman/`. Use the hosted build for normal play. CDN-dependent builds need network access; 3D builds need a supported graphics context. Do not open module-based games via file://.

## Supporting records

- [Maze logic](src/core.js)
- [Bitmap compositor](src/bitmap-runtime.js)
- [Regression suite](test.mjs)

## Limitations

No ROM or official recordings bundled; sprite, audio, timing and intermission fidelity not certified 1:1. Intermissions/fruit simplified; measured device and listening tests remain.

Gamepad: browser Gamepad API, standard/legacy mappings, device slot, deadzone and optional supported vibration. D-pad/stick navigates title; A confirms, Start starts/pauses, Back/Select opens menu, B returns, LB/RB switches settings tabs. Legacy mapping is a fallback, not native Windows DirectInput or the GTA GInput plugin.



## Ghost Mode

Choose Blinky, Pinky, Inky, Clyde or create a named ghost with a classic bitmap silhouette, body color and pupil color. Control one ghost while autonomous Pac-Man seeks pellets and evades the team. Win by catching all Pac-Man lives before he clears the board. Personal capture 1,000; team capture 250; being eaten costs 100 (minimum zero) and forces a return to the house. Separate high scores. Existing controls and settings remain supported.

## First-person camera

Use VIEW 2D/3D (V on keyboard, Y on standard gamepad during play) before or during a match. Both Pac-Man and Ghost Mode use the same simulation and a local 480×360 ray-cast renderer with depth-occluded original bitmap characters, perspective pellets, textured maze and optional locator map (M / RB). In first person, directions are relative: up forward, left/right turn, down reverse. Turns are buffered until legal and the camera follows the actual heading. Overhead controls remain absolute. No CDN, WebGL or extra assets required.

First-person upgrade: higher-density beveled wall panels, perspective floor shading, color-coded ghost minimap, subtle accepted-turn motion cues and synthesized friction sound, rapid camera settle and a live reflected rear-view inset when a normal ghost approaches Pac-Man from behind in line of sight. Overhead turns show a single low-contrast tapered streak for up to 14 simulation ticks (0.23 seconds). First person uses the existing brief camera kick and friction sound without floor decals. Turn friction is a quiet 75 ms transient (110 ms for reversal), without changing the classic arcade audio mix. These effects do not affect game physics.
