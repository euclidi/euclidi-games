# Backyard Astronaut — Current status

**Snapshot:** 2026-11-26, inspected repository commit [631fb3e](https://github.com/euclidi/euclidi-games/commit/631fb3e5474b2ecae65235d216a9c816af00fe17).

**Lifecycle:** Active — unified V2 preview; Alpha 0.3 retained.

## Implemented / source-inspected

Alpha gameplay and separate V2 unified preview with physical salvage/carry/socket placement, boarding, numerical flight, home planet and moving moon, local save and raster volume models.

## Validation evidence

Alpha catalog startup/workshop switching passed; V2 numerical, raster-mesh and local bundle Chromium smoke passed on 631fb3e. End-to-end lunar transfer/landing and mobile performance not certified.

- [Catalog browser and logic audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891)
- [V2 validation](https://github.com/euclidi/euclidi-games/actions/runs/45913066884)

Tests are limited to their stated coverage. Browser startup is not full gameplay certification; CI results refer to the tested commit, not future changes.

## Outstanding and unverified

Full authored art, continuous planetary terrain transitions, physical joints, six-degree-of-freedom torque, staging, lunar landing, wider solar system, progression, controller and IndexedDB remain incomplete.

## Next work

Improve high-detail independent part/character art, animation and collision bounds; inspect all camera angles.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)
