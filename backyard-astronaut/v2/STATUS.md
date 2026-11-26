# Backyard Astronaut — V2 — Current status

**Snapshot:** 2026-11-26, inspected repository commit [631fb3e](https://github.com/euclidi/euclidi-games/commit/631fb3e5474b2ecae65235d216a9c816af00fe17).

**Lifecycle:** Active — experimental unified build.

## Implemented / source-inspected

V2.1 raster volumes, independent parts, contact-based walking/salvage, socket mounting, same-scene craft, home planet/moon flight, localStorage, keyboard/touch.

## Validation evidence

V2 validation workflow passed numerical tests, raster asset mesh tests and local bundle browser smoke at 631fb3e.

- [Catalog browser and logic audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891)
- [V2 validation](https://github.com/euclidi/euclidi-games/actions/runs/45913066884)

Tests are limited to their stated coverage. Browser startup is not full gameplay certification; CI results refer to the tested commit, not future changes.

## Outstanding and unverified

Point-mass flight is not full six-axis rigid-body dynamics; joints, staging, full solar system, landing, robust progression, mobile/controller, IndexedDB and fully bundled production remain incomplete.

## Next work

Improve asset quality, animations and near-field collisions.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)
