# Dummy Lab — W1.7 — Current status

**Snapshot:** 2026-11-26, inspected repository commit [631fb3e](https://github.com/euclidi/euclidi-games/commit/631fb3e5474b2ecae65235d216a9c816af00fe17).

**Lifecycle:** Archived — predecessor to W1.8.

## Implemented / source-inspected

28 actions, procedural room furnishings, proximity/noise reactions, IK limbs, headlamp toggle and diagnostics.

## Validation evidence

Legacy startup passed the catalog Chromium audit; five mathematical checks passed.

- [Catalog browser and logic audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891)

Tests are limited to their stated coverage. Browser startup is not full gameplay certification; CI results refer to the tested commit, not future changes.

## Outstanding and unverified

Kinematic body, approximate action/contact fidelity and unmeasured device performance. Not a byte-identical reconstruction of the earlier hosted build.

## Next work

Keep the version reproducible and run legacy startup regressions.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)
