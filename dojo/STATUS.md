# Dojo X — Current status

**Snapshot:** 2026-11-26, inspected repository commit [631fb3e](https://github.com/euclidi/euclidi-games/commit/631fb3e5474b2ecae65235d216a9c816af00fe17).

**Lifecycle:** Active — Stage 1D physical-controller research; Stage 2 gated.

## Implemented / source-inspected

Stage 1D deterministic motion replay, search/optimizer, seeded archive, ratings, import/export and earlier combat simulator. Browser global top() conflict fixed.

## Validation evidence

Deterministic 101-frame replay test and catalog Chromium archive/replay smoke passed after fix. Mobile frame rate and visual acceptance remain unverified.

- [Catalog browser and logic audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891)

Tests are limited to their stated coverage. Browser startup is not full gameplay certification; CI results refer to the tested commit, not future changes.

## Outstanding and unverified

Planar prototype, self-collision disabled, recovery often fails; numerical score does not prove believable motion. Full striking/contact/combinations and approved Stage 1 acceptance remain incomplete.

## Next work

Review archived motion and human ratings; tune physical balance, foot support and recovery.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)
