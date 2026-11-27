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
