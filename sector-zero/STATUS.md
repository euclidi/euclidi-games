# Sector Zero — Current status

**Snapshot:** 2026-11-26, urban infrastructure commit [ca12a4f](https://github.com/euclidi/euclidi-games/commit/ca12a4f5466fe2f55f0b3db3b20ec21353e42d77).

**Lifecycle:** Active — city simulation.

## Implemented / source-inspected

Existing city runtime, camera fix, observation tools, transit overlay with weighted grid routing with local congestion penalties, three road speed classes, 32 architecture variants and six bus routes served by 18 vehicles. Includes two limited-stop express loops, 28/40-passenger capacities, one-transfer itineraries and saved-rider migration. Static bundled browser build.

## Validation evidence

Urban module: 599 passing logic assertions in an isolated JavaScript runtime, including boarding, transfer, alighting and old-rider migration. Sampled 1,296 origin/destination pairs: 398 direct bus itineraries and 98 with a transfer; the rest chose walking. Browser rendering and actual Pages deployment for this revision are unverified.

Catalog Chromium boot/camera smoke passed in the 631fb3e audit; no full city-day or mobile performance certification for this exact revision.

- [Catalog browser and logic audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891)

Tests are limited to their stated coverage. Browser startup is not full gameplay certification; CI results refer to the tested commit, not future changes.

## Outstanding and unverified

Irregular streets, integrated transfer performance, rail, deeper social systems, interior fidelity, full Recast integration, environmental integration and measured population performance require validation or development. The patch directory is not a playable release.

## Next work

Recover or modularize the bundled source without replacing the city; add reproducible build and state migration tests.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)

## Facade correction — 2026-11-26

[Implementation commit d504d25](https://github.com/euclidi/euclidi-games/commit/d504d25cbc214d6677c2504a956ff693ae2cea95). Signs now use actual wall or canopy fascia anchors with physical backing plates, smaller residential number plaques, and 1024-pixel-wide lettering textures with mipmaps. Framed front and side windows align to their own wall volumes, including stepped towers and row houses. Corrected canopy attachment offsets.

Isolated geometry audit: 128 building configurations (32 subtypes at four heights), 2,522 framed windows, 15,138 passing assertions covering geometry dimensions, sign backing attachment, texture configuration, and window-frame/wall placement. These tests use mock rendering primitives; live WebGL rendering, text legibility at camera distances, device performance, and GitHub Pages deployment remain unverified.

## Pedestrian and traffic safety revision — 2026-11-26

[Implementation de9503e](https://github.com/euclidi/euclidi-games/commit/de9503e749d70cda02d970a32d8dcdae08a35e78). Replaces autonomous waypoint-only motion with a sidewalk/crosswalk graph, separated walking lanes, spatial occupancy checks, marked crossing reservations, all-red vehicle signals, stop-line braking, staggered door departures, off-lane bus queue slots, and individual waiting/yielding states. Preserves the original citizen intent, economy and transit simulation.

Integrated headless test: extracted original civic simulation with the new module, actual procedural building footprint generation using mock rendering primitives, 1,000 citizens, 150 vehicles, 1,000 simulation steps of 0.25 minutes (07:00–11:10). Across 40 sampled states, peak observed street population 879; zero pedestrian pairs closer than 0.60 units, zero pedestrian/vehicle rectangle overlaps at the tested margin, and zero autonomous pedestrians observed on a road without a crossing reservation. 52 boardings, five completed bus journeys, 73 citizens at workplaces at end. 764 citizens reported yielding at the end: major crowd throughput/deadlock limitations remain. This is not continuous contact verification or a full-day/browser/mobile test. Manual possession still uses the original controller; live Pages deployment and visual animation validation are unverified.

## Junction flow correction — 2026-11-26

[Implementation ebcbedb](https://github.com/euclidi/euclidi-games/commit/ebcbedbec1231ab621a178a78a0aaad6df8134a2). Junction entry reservations, downstream clearance, committed vehicle exit priority, cleared crosswalk release, incoming stop bars and traffic wait diagnostics. Integrated headless comparison: 600 quarter-minute steps with 1,000 citizens, 150 vehicles and generated building footprints. Vehicles stationary over 20 simulated minutes at end: 118 → 17; destination arrivals 215 → 310. 24 sampled states: 0 pedestrian/vehicle overlaps, 0 pedestrian pairs below 0.60 units and 0 unauthorized pedestrian road occupancies. Remaining long waits: {"FOLLOWING":12,"JUNCTION OCCUPIED":3,"RED SIGNAL":1,"EXIT BLOCKED":1}. Workplace arrivals at test end decreased 78 → 42; crowd throughput remains unresolved. No separate bus pullouts, continuous collision guarantee, live browser playtest or deployment verification.

## Street infrastructure and metro — 2026-11-26

[Implementation 39f9198](https://github.com/euclidi/euclidi-games/commit/39f9198ad8782876ff4cbaf954da45d5c52a421e). Street layer includes 64 utility poles, 168 conductor spans, 24 transformers, 42 cabinets, 84 streetlights, 84 hydrants, 168 storm drains, 84 manholes, 24 benches, 24 bins, 24 bicycle racks, 49 street-name posts, 28 speed signs, 21 pedestrian signs, 45 crossing posts, 16 STOP signs (four all-way-stop intersections), 57 unique bus shelters and 39 arterial bus pullouts. Two simulated underground metro corridors serve nine stations with four 72-passenger trains, transfers at Central, route planning, capacity, boarding/alighting, train positions on the transit map and station entrance structures. Utility lamp materials react to time of day and blackout where material supports emissive properties. 

Final integrated headless run: 600 quarter-minute steps with 1,000 citizens, 150 vehicles and actual generated building/roadside footprint data; 19,383 mesh-primitive submissions (before merging), 335 sign draw calls with mocked canvas, 532 roadside collision footprints, no footprint/building overlaps. Across 24 sampled states, zero pedestrian pair overlaps below 0.60 units, zero pedestrian/vehicle rectangle overlaps at the tested margin, zero unreserved road occupancies. Metro: 34 boardings, 11 completed journeys, 11 transfers. All 18 buses used pullouts; a separate controlled test confirmed a private car can pass a parked bus. No passing event was recorded in the final city run. 18 vehicles remained stationary over 20 simulated minutes and 41 citizens were at workplaces at the end; traffic/crowd throughput remains unresolved. Metro is a scheduled underground simulation with street entrances and a schematic, not a walkable underground level. Utility wiring, hydrants and drains are visual fixtures, not hydraulic/electrical network solvers. Speed signs describe road class; crossing request posts do not yet accept manual input. No live WebGL, mobile performance, or Pages verification. Manual player collision with street furniture remains unverified.

## Streetscape alignment, underground cutaway and citizen identity — 2026-11-26

[Implementation b9cd231](https://github.com/euclidi/euclidi-games/commit/b9cd2319e3ab69f4adc8853a5887da799aed17c7). Removed original duplicate block furniture; replaced terrain around nine station stair openings with non-overlapping tiles; aligned continuous road surfaces, markings, curb and sidewalk widths, and incoming stop bars. 45 signal-controlled intersections now have 152 suspended approach-facing signal heads supported by curbside cantilever masts, synchronized with traffic logic. Each shaft has 16 descending treads and 3.2-unit depth. LOWER view replaces decorative rail grid with two separate elevation track corridors, station platforms and four scheduled moving train models. Station cutaway is observational, not a continuous walkable underground level; possession physics still uses original flat floor. Citizen rendering uses the existing instancing pipeline with 1,000 deterministic individual profiles, six style variants, varying body proportions, skin/hair/clothes, bags/hats, and movement-dependent walking poses. Assets remain procedural geometry, not authored character models.

Mock scene audit verified ground replacement (20 tiles), nine unobstructed shaft cutouts, old block decoration removal, lower scene replacement, four finite train transforms, 45 signal groups, and 1,000 unique appearance profiles. Integrated comparison with 1,000 citizens and 150 vehicles over 700 quarter-minute steps: density-aware route recalculation and looser corner navigation reduced yielding citizens 649 → 314, workplace arrivals 51 → 177, walking citizens 125 → 244, metro completions 46 → 120, bus completions 8 → 2. Zero pedestrian/vehicle overlaps, pedestrian pairs below 0.60 units or unreserved road occupancy in 28 sampled states. Bus throughput regressed and congestion remains substantial. No live WebGL visual verification, device performance tests, or Pages deployment confirmation. Scene and geometry checks use mock adapters, not a rendered screenshot.

## Parcel navigation and junction fairness — 2026-11-26

Implementation: [parcel routing](https://github.com/euclidi/euclidi-games/commit/127f145a494e43d2e90726e0c4a4e05c2afc3b88), [bench orientation correction](https://github.com/euclidi/euclidi-games/commit/c591e6351d4c082b30f8d02759d3aef2f7f27949), [junction fairness](https://github.com/euclidi/euclidi-games/commit/1755b444be643ecac3ed7eff72de0fa3867ac86e).

Cached parcel visibility graphs route around building and street fixture footprints while retaining explicit crosswalk edges. Where a standard facade door is accessible, the corresponding simulation entrance is aligned to it. Citizens queue indoors until a departure point is clear. Shelter posts, benches and back panels are included in navigation collision data. Walking pose phase follows actual traveled distance. Junction processing now favors approaches with longer waits while retaining same-lane order and committed-vehicle priority across lanes.

Validation: 60 isolated parcel-routing assertions passed using synthetic building and fixture footprints. Three controlled synthetic traffic trials, each with 150 private vehicles, no pedestrians, 800 quarter-minute steps: completed trips 809 → 819 in aggregate; vehicles still waiting more than 20 simulated minutes at trial end 32 → 0 across the trials; cumulative stationary vehicle-minutes 39,875 → 39,676.75. Worst recorded wait 80 → 52.75 simulated minutes. These results do not represent the full city, bus scheduling, pedestrians, or browser rendering. The full city layout remains the original regular grid. Unreachable parcel endpoints still fall back to existing collision-constrained movement; this is not a complete navigation mesh. Metro exploration, asset fidelity, manual controller collision, full-population throughput, browser/mobile performance, save migration and actual GitHub Pages deployment remain unverified. No complete overhaul certification.
