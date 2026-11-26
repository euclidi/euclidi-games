# Backyard Astronaut — V2 — Development specification

**Revision:** documentation baseline, 2026-11-26. **Lifecycle:** Active — experimental unified build.

This reconstructs scope from project history, repository source and existing scope records; it does not grant new approvals or certify completion. Where exact historical decisions are not recovered, treat this as a proposed baseline for review. Existing explicitly approved detailed documents and stage restrictions take precedence.

## Objective

Same-scene exploration, salvage, assembly and flight with stable spacecraft identity.

## Requirements

- Implement the parent approved unified architecture; maintain independent entities, coherent visuals and numerical orbital propagation.
- Retain Alpha 0.3 as fallback; do not claim full physical or planetary scope until tested.

## Technology and assets

Pinned Three.js and Rapier CDN modules; local dependency bundle in CI; custom raster volumes and point-mass RK4 flight.

Preserve original or appropriately licensed assets and record their source, license and scale. Do not treat temporary primitive geometry, generated art or approximate audio as accepted visual fidelity. Obtain approval before publishing new cover artwork.

## Delivery and acceptance

- Keep existing working builds and player data; do not replace unrelated games. Publish to the Euclidi Games GitHub Pages catalog after testing unless the owner directs otherwise.
- Verify initialization, nonblank rendering, core controls and representative gameplay. Check relevant logic, physics, saves, visual alignment and performance; report actual hardware and measured results, not assumptions.
- Separate current implementation, target scope and evidence. See [STATUS.md](STATUS.md) and [ROADMAP.md](ROADMAP.md).

## Supporting records

- [Parent approved architecture](../ARCHITECTURE_V2.md)
- [Parent roadmap](../ROADMAP.md)
- [V2 model revision](MODEL_REVISION.md)
