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

### Street infrastructure follow-up

- [x] Populate curbside street furniture, utilities, signs and drainage; generate mounted lettering and collision footprints.
- [x] Introduce four all-way-stop junctions, arterial bus pullouts, and two operational simulated metro corridors with nine surface entrances and a live schematic.
- [ ] Verify visual fidelity and performance in the live browser, including signage orientations and nighttime fixtures.
- [ ] Add walkable subway platforms, tunnels and trains; physical street-light illumination, electrical feeder simulation, water and drainage network behavior, manual crossing requests, and player collision coverage.
- [ ] Resolve remaining congestion and pedestrian throughput regressions; validate full-day traffic and transit behavior continuously.
