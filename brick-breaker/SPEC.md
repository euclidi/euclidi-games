# Brick Breaker — Development specification

**Revision:** documentation baseline, 2026-11-26. **Lifecycle:** Active — browser 0.2 adaptation.

This reconstructs scope from project history, repository source and existing scope records; it does not grant new approvals or certify completion. Where exact historical decisions are not recovered, treat this as a proposed baseline for review. Existing explicitly approved detailed documents and stage restrictions take precedence.

## Objective

Precision paddle play combined with dense physical destruction, material interactions, projectile upgrades and persistent incremental progression.

## Requirements

- Dense material destruction, hybrid playfield, all material categories, traditional paddle, evolving projectiles, hybrid run structure and classic failure.
- Balanced incremental progression, varied world aesthetics, precision late-game spectacle, authored textures/audio and performance validation.
- Preserve native architecture; web adaptation is explicitly authorized, not evidence native GPU integration is complete.

## Technology and assets

Approved native branch: C++23, SDL3, bgfx, Box2D 3.1.1, Clipper2. Browser adaptation: Canvas 2D, Planck.js 1.5.1, 1280×720 and fixed 120 Hz. Native pipeline remains separate.

Preserve original or appropriately licensed assets and record their source, license and scale. Do not treat temporary primitive geometry, generated art or approximate audio as accepted visual fidelity. Obtain approval before publishing new cover artwork.

## Delivery and acceptance

- Keep existing working builds and player data; do not replace unrelated games. Publish to the Euclidi Games GitHub Pages catalog after testing unless the owner directs otherwise.
- Verify initialization, nonblank rendering, core controls and representative gameplay. Check relevant logic, physics, saves, visual alignment and performance; report actual hardware and measured results, not assumptions.
- Separate current implementation, target scope and evidence. See [STATUS.md](STATUS.md) and [ROADMAP.md](ROADMAP.md).

## Supporting records

- [Existing scope audit](SCOPE.md)
- [Native Stage 1 branch](https://github.com/euclidi/euclidi-games/tree/brick-breaker-stage1/brick-breaker)
- [Latest dedicated test](https://github.com/euclidi/euclidi-games/actions/runs/45912705564)
