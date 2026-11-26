# PAC-MAN — Maze Arcade / 1980 — Current status

**Snapshot:** 2026-11-26, inspected repository commit [631fb3e](https://github.com/euclidi/euclidi-games/commit/631fb3e5474b2ecae65235d216a9c816af00fe17).

**Lifecycle:** Active — Git revision 1.4.x.

## Implemented / source-inspected

28×31 maze, 240 pellets, four energizers, three ghost modes, bitmap runtime, death sequence, local high scores, mobile D-pad and synthesized effects.

## Validation evidence

Six logic tests passed including 36,000 simulation ticks, audio buffers, reachability and death/respawn. Chromium ready/start/input smoke passed.

- [Catalog browser and logic audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891)

Tests are limited to their stated coverage. Browser startup is not full gameplay certification; CI results refer to the tested commit, not future changes.

## Outstanding and unverified

No ROM or official recordings bundled; sprite, audio, timing and intermission fidelity not certified 1:1. Intermissions/fruit simplified; measured device and listening tests remain.

## Next work

Compare maze geometry, glyphs, sprites and ghost skirt/death frames against authorized references.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)
