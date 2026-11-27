# Sector Zero — Development specification

**Revision:** documentation baseline, 2026-11-26. **Lifecycle:** Active — city simulation.

This reconstructs scope from project history, repository source and existing scope records; it does not grant new approvals or certify completion. Where exact historical decisions are not recovered, treat this as a proposed baseline for review. Existing explicitly approved detailed documents and stage restrictions take precedence.

## Objective

Observe, possess and intervene in a living dystopian city whose citizens, transport and institutions continue autonomously.

## Requirements

- PS1-inspired coherent city art, day/night and weather, physical directional and emissive lighting, spatial ambient audio.
- Autonomous citizens with needs, jobs, relationships, economy, events and persistent state; observation, possession and intervention.
- Target 0.25 km², 1,000 citizens, 150 vehicles and 40+ interiors; layered streets, public transport, interior and undercity exploration.

## Technology and assets

Target: Three.js/WebGL2, TypeScript/Vite, Rapier, bitECS, Recast, workers and IndexedDB. Shipped: bundled WebGL city runtime and urban-transit.js. Full original source tree is not recovered.

Preserve original or appropriately licensed assets and record their source, license and scale. Do not treat temporary primitive geometry, generated art or approximate audio as accepted visual fidelity. Obtain approval before publishing new cover artwork.

## Delivery and acceptance

- Keep existing working builds and player data; do not replace unrelated games. Publish to the Euclidi Games GitHub Pages catalog after testing unless the owner directs otherwise.
- Verify initialization, nonblank rendering, core controls and representative gameplay. Check relevant logic, physics, saves, visual alignment and performance; report actual hardware and measured results, not assumptions.
- Separate current implementation, target scope and evidence. See [STATUS.md](STATUS.md) and [ROADMAP.md](ROADMAP.md).

## Supporting records

- [Environmental integration notes](../sector-zero-patches/README.md)
- [Transit source](assets/urban-transit.js)

## Urban mobility extension (2026-11-26)
Use metre-scale vehicles and street cross-sections; distinct vehicle classes, visible occupants, independently steered/rotating wheels and suspension load transfer; surface-dependent braking, fuel economy and physical refuelling. Distinct service roles must perform actual jobs, not just drive recoloured cars. Integrate cycle lanes, personal mobility, storefront errands and pedestrian crossings while preserving existing systems. Require real scene inspection and population regression tests before release.
