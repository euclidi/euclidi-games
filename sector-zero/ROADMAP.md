# Sector Zero — Roadmap

Updated 2026-11-26. Active — city simulation.

This is an ordered development backlog, not a declaration that milestones are complete. Internal sequencing does not introduce approval stops; explicit project gates and archive restrictions remain binding.

## Priorities

- [ ] Recover or modularize the bundled source without replacing the city; add reproducible build and state migration tests.
- [ ] Validate expanded six-line transit, transfer journeys and differentiated roads at population scale; replace the fixed grid with irregular streets, then develop rail.
- [ ] Integrate solar/weather/emissive lighting, local sound and authored city assets; audit camera and controls.
- [ ] Complete interiors, undercity, economy/social depth and persistence; measure frame time and run long autonomous playthroughs.

## Release discipline

- [ ] Record changes and known regressions in [STATUS.md](STATUS.md).
- [ ] Run relevant automated logic and browser checks, visual inspection, input and persistence tests; attach evidence to the release commit.
- [ ] Verify the actual GitHub Pages release and catalog links before labeling a build verified.

[Specification](SPEC.md) · [Current status](STATUS.md)
