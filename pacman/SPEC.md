# PAC-MAN — Maze Arcade / 1980 — Development specification

**Revision:** documentation baseline, 2026-11-26. **Lifecycle:** Active — Git revision 1.4.x.

This reconstructs scope from project history, repository source and existing scope records; it does not grant new approvals or certify completion. Where exact historical decisions are not recovered, treat this as a proposed baseline for review. Existing explicitly approved detailed documents and stage restrictions take precedence.

## Objective

Unofficial browser recreation of classic arcade maze gameplay, with selectable authentic, advanced and hybrid ghost intelligence.

## Requirements

- Faithful maze topology, scoring, lives, pellet and energizer rules, timing, ghost behaviors, fruit, death and intermissions.
- Pixel-accurate character silhouettes and animations, crisp bitmap typography, original-style sound timing and wavetable recreation using authorized assets or original synthesis.
- A dedicated arcade-style starting menu with mode, sound, CRT settings, new game and in-session return/resume without losing progress.
- Keyboard, swipe, controller and large touch pad; persistent high scores, accessible controls and responsive scaling.

## Technology and assets

Local 224×288 Canvas bitmap compositor, JS game logic, synthesized Web Audio, optional Vite packaging. No Phaser runtime or CDN needed for static play.

Preserve original or appropriately licensed assets and record their source, license and scale. Do not treat temporary primitive geometry, generated art or approximate audio as accepted visual fidelity. Obtain approval before publishing new cover artwork.

## Delivery and acceptance

- Keep existing working builds and player data; do not replace unrelated games. Publish to the Euclidi Games GitHub Pages catalog after testing unless the owner directs otherwise.
- Verify initialization, nonblank rendering, core controls and representative gameplay. Check relevant logic, physics, saves, visual alignment and performance; report actual hardware and measured results, not assumptions.
- Separate current implementation, target scope and evidence. See [STATUS.md](STATUS.md) and [ROADMAP.md](ROADMAP.md).

## Supporting records

- [Maze logic](src/core.js)
- [Bitmap compositor](src/bitmap-runtime.js)
- [Regression suite](test.mjs)
