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
