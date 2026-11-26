# Sanctuary — Current status

**Snapshot:** 2026-11-26, inspected repository commit [631fb3e](https://github.com/euclidi/euclidi-games/commit/631fb3e5474b2ecae65235d216a9c816af00fe17).

**Lifecycle:** Active — development 0.2.

## Implemented / source-inspected

Adaptive state and learning, path navigation, care interactions, journal, local save, observer/player camera, generated church and character, optional Havok.

## Validation evidence

Catalog Chromium startup, day status and journal interaction passed; this is not a full care/relationship or physics acceptance test.

- [Catalog browser and logic audit](https://github.com/euclidi/euclidi-games/actions/runs/45913066891)

Tests are limited to their stated coverage. Browser startup is not full gameplay certification; CI results refer to the tested commit, not future changes.

## Outstanding and unverified

Authored anatomy and skinned animation, deep physical caregiving, richer autonomous planning, Recast/GOAP target work, expanded detail, audio and controller validation are incomplete. Havok may fall back to kinematic operation.

## Next work

Improve authored character anatomy, articulated hands/feet, texture quality and natural animation.

[Roadmap](ROADMAP.md) · [Specification](SPEC.md)
