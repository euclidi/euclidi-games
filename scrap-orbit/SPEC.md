# Scrap Orbit — Development specification

**Revision:** documentation baseline, 2026-11-26. **Lifecycle:** Archived — removed from catalog at owner's request.

This reconstructs scope from project history, repository source and existing scope records; it does not grant new approvals or certify completion. Where exact historical decisions are not recovered, treat this as a proposed baseline for review. Existing explicitly approved detailed documents and stage restrictions take precedence.

## Objective

Futuristic physics-based launcher prototype featuring robots against alien, mutated and cyborg factions.

## Requirements

- Sprite-stacked futuristic factions, classic physics, upgradeable launchers, hybrid environments and multiple modes.
- Browser delivery; preserve historical scope without treating Stage 2 test range as a complete game.
- Do not restore catalog visibility or resume active development without explicit approval.

## Technology and assets

PixiJS 8.8.1 and Planck.js 1.5.1 via pinned esm.sh imports; raster stack art and 120 Hz rigid-body step.

Preserve original or appropriately licensed assets and record their source, license and scale. Do not treat temporary primitive geometry, generated art or approximate audio as accepted visual fidelity. Obtain approval before publishing new cover artwork.

## Delivery and acceptance

- Keep existing working builds and player data; do not replace unrelated games. Publish to the Euclidi Games GitHub Pages catalog after testing unless the owner directs otherwise.
- Verify initialization, nonblank rendering, core controls and representative gameplay. Check relevant logic, physics, saves, visual alignment and performance; report actual hardware and measured results, not assumptions.
- Separate current implementation, target scope and evidence. See [STATUS.md](STATUS.md) and [ROADMAP.md](ROADMAP.md).
