# PAC-MAN — Maze Arcade / 1980 — Roadmap

Updated 2026-11-26. Active — Git revision 1.4.x.

This is an ordered development backlog, not a declaration that milestones are complete. Internal sequencing does not introduce approval stops; explicit project gates and archive restrictions remain binding.

## Priorities

- [ ] Compare maze geometry, glyphs, sprites and ghost skirt/death frames against authorized references.
- [ ] Audit ghost timing and all sound events, waveform/envelope fidelity and listening quality.
- [ ] Finish intermissions and level/fruit parity; verify touch, controller and integer pixel scaling across device sizes.
- [ ] Maintain replayable regression cases, source/license records and deployed smoke tests.

## Release discipline

- [ ] Record changes and known regressions in [STATUS.md](STATUS.md).
- [ ] Run relevant automated logic and browser checks, visual inspection, input and persistence tests; attach evidence to the release commit.
- [ ] Verify the actual GitHub Pages release and catalog links before labeling a build verified.

[Specification](SPEC.md) · [Current status](STATUS.md)

- Ghost Mode: browser playtest, AI difficulty tuning and physical controller verification.

- First-person camera: browser/device playtest and performance tuning; consider native 3D character models only if a different visual direction is requested.

## Night Watch — v1.7.0

Separate local Wolfenstein-style raycast shooter at [night-watch/](night-watch/). One compact connected 19×15 compound, broad rooms, cover and looped corridors. Eight hooded sentries with patrol/alert-style idle and pursuit, readable attack windup, three fictional arcade weapons, reload, ammo, health, armor, keycard and extraction. Keyboard/mouse, touch and standard gamepad, pause, minimap, difficulty selector, original hand-rasterized pixel clusters. No changes to original maze simulation. Core checks and 3,600 simulation ticks passed in JS evaluation. Browser/device playtest, audio and final asset polish remain unverified. No claim of Doom engine or original licensed assets.
