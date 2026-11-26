# Dummy Lab — W1.8 — Current status

**Snapshot:** 2026-11-26, inspected repository commit [631fb3e](https://github.com/euclidi/euclidi-games/commit/631fb3e5474b2ecae65235d216a9c816af00fe17).

**Lifecycle:** Active — current catalog release.

## Implemented / source-inspected

28 action entries, proximity/noise reactions, articulated rig and IK, furnished observation room, adjustable exposure without player headlamp, first-person/free camera, action preview and session logging.

## Validation evidence

W1.8 Chromium startup and Actions panel passed; five shared math tests passed; shared math.js matched W1.7 in the catalog audit.

- [Catalog browser and logic audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891)

Tests are limited to their stated coverage. Browser startup is not full gameplay certification; CI results refer to the tested commit, not future changes.

## Outstanding and unverified

Body remains kinematic; environment uses Rapier but powered balancing, physical falls and contact-driven actions are not certified. Visual hand alignment and room fidelity still need human review; mobile performance unmeasured.

## Next work

Audit hand/limb alignment, planted steps, camera comfort, room materials and lighting against player feedback.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)
