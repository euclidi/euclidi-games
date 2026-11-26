# Backyard Astronaut — Development specification

**Revision:** documentation baseline, 2026-11-26. **Lifecycle:** Active — unified V2 preview; Alpha 0.3 retained.

This reconstructs scope from project history, repository source and existing scope records; it does not grant new approvals or certify completion. Where exact historical decisions are not recovered, treat this as a proposed baseline for review. Existing explicitly approved detailed documents and stage restrictions take precedence.

## Objective

Scavenge physical parts, assemble and board the same spacecraft, launch from a backyard, and explore a miniature solar system using orbital mechanics.

## Requirements

- One coherent navigable world, independent sprite-stacked/pixel-textured objects, in-world salvage and construction with stable IDs, same craft throughout flight.
- Physical flight with authentic orbital mechanics, moving celestial bodies, transfers, flybys, landings, modular progression and creative mode.
- Controls, audio, versioned persistence, scalable rendering, authorized art, browser delivery; retain Alpha until V2 is validated.

## Technology and assets

Approved V2 architecture: Three.js/WebGL2, TypeScript/Vite, Rapier 3D, Float64 orbital integration, workers, Web Audio and IndexedDB. Current V2 uses pinned Three.js/Rapier modules, JS, raster volumes, numerical flight and localStorage.

Preserve original or appropriately licensed assets and record their source, license and scale. Do not treat temporary primitive geometry, generated art or approximate audio as accepted visual fidelity. Obtain approval before publishing new cover artwork.

## Delivery and acceptance

- Keep existing working builds and player data; do not replace unrelated games. Publish to the Euclidi Games GitHub Pages catalog after testing unless the owner directs otherwise.
- Verify initialization, nonblank rendering, core controls and representative gameplay. Check relevant logic, physics, saves, visual alignment and performance; report actual hardware and measured results, not assumptions.
- Separate current implementation, target scope and evidence. See [STATUS.md](STATUS.md) and [ROADMAP.md](ROADMAP.md).

## Supporting records

- [Approved V2 architecture](ARCHITECTURE_V2.md)
- [V2 release notes](v2/README.md)
- [Model revision](v2/MODEL_REVISION.md)
- [Alpha 0.3](https://euclidi.github.io/euclidi-games/backyard-astronaut/)
