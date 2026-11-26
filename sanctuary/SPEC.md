# Sanctuary — Development specification

**Revision:** documentation baseline, 2026-11-26. **Lifecycle:** Active — development 0.2.

This reconstructs scope from project history, repository source and existing scope records; it does not grant new approvals or certify completion. Where exact historical decisions are not recovered, treat this as a proposed baseline for review. Existing explicitly approved detailed documents and stage restrictions take precedence.

## Objective

Care for an autonomous anthropomorphic werewolf woman inhabiting an abandoned gothic church and its grounds; build a relationship through her choices and remembered interactions.

## Requirements

- PS1 gothic visual style, switchable perspective, detailed anatomy including teeth, nails, toes and calves.
- Physical caregiving activities: feeding, hydration, tooth brushing, nail filing, grooming, bandaging and supplies; meaningful comfort and consent signals.
- Autonomy, needs, preferences, habits, memory, emergent relationships, church and expanded grounds, physics, audio, controls and persistent saves.

## Technology and assets

Shipped: Babylon.js CDN, optional Havok WASM, procedural textured meshes, adaptive JS agent, A* pathfinding, IndexedDB. Target: authored articulated/skinned model, advanced animation, richer navigation and planning.

Preserve original or appropriately licensed assets and record their source, license and scale. Do not treat temporary primitive geometry, generated art or approximate audio as accepted visual fidelity. Obtain approval before publishing new cover artwork.

## Delivery and acceptance

- Keep existing working builds and player data; do not replace unrelated games. Publish to the Euclidi Games GitHub Pages catalog after testing unless the owner directs otherwise.
- Verify initialization, nonblank rendering, core controls and representative gameplay. Check relevant logic, physics, saves, visual alignment and performance; report actual hardware and measured results, not assumptions.
- Separate current implementation, target scope and evidence. See [STATUS.md](STATUS.md) and [ROADMAP.md](ROADMAP.md).

## Supporting records

- [Agent implementation](agent.js)
- [Game runtime](game.js)
