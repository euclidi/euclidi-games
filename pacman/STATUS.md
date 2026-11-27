# PAC-MAN — Maze Arcade / 1980 — Current status

**Snapshot:** 2026-11-26, inspected repository commit [631fb3e](https://github.com/euclidi/euclidi-games/commit/631fb3e5474b2ecae65235d216a9c816af00fe17).

**Lifecycle:** Active — Git revision 1.4.6.

## Implemented / source-inspected

28×31 maze, 240 pellets, four energizers, three ghost modes, bitmap runtime, death sequence, local high scores, mobile D-pad and synthesized effects.

## Revision 1.4.6 — compact settings and gamepad

Five short tabs, four or fewer setting rows per tab; gamepad device selection, standard/legacy mappings, deadzone, menu navigation, repeat and supported rumble. Pure JS mapping and edge/repeat checks passed; real controller compatibility and live appearance remain unverified.

## Revision 1.4.5 — settings

Added 15 persistent options, fullscreen and restore defaults; new-game rules have separate score keys. Rule/default/score isolation and syntax checks passed in local JS evaluation. Live appearance and full device behavior remain unverified.

## Revision 1.4.4 — touch controls

Yellow pressed-direction D-pad, red bitmap joystick with four-way gate and recentering, persistent Pad/Stick/Off setting. Simulated DOM test passed 360 frames and checks for press, drag, deadzone, cancel, keyboard feedback and toggle cycling. Device touch feel and live visual appearance not yet independently verified.

## Revision 1.4.3 — title menu

Added a native bitmap title screen with animated sprites, mode selection and separate new-game/resume actions. Gameplay freezes while the title menu is open. No new graphics dependency or cover artwork.

Simulated runtime test passed 531 frames: initial menu, frozen simulation, mode change without launching, start, return/resume, keyboard navigation and controller start. This is a mock DOM/compositor test, not actual browser or device validation. Pages publication is not independently verified for this revision.

## Previous validation evidence

Six logic tests passed including 36,000 simulation ticks, audio buffers, reachability and death/respawn. Chromium ready/start/input smoke passed.

- [Catalog browser and logic audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891)

Tests are limited to their stated coverage. Browser startup is not full gameplay certification; CI results refer to the tested commit, not future changes.

## Outstanding and unverified

No ROM or official recordings bundled; sprite, audio, timing and intermission fidelity not certified 1:1. Intermissions/fruit simplified; measured device and listening tests remain.

## Next work

Compare maze geometry, glyphs, sprites and ghost skirt/death frames against authorized references.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)
