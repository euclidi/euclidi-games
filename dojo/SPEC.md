# Dojo X — Development specification

**Revision:** documentation baseline, 2026-11-26. **Lifecycle:** Active — Stage 1D physical-controller research; Stage 2 gated.

This reconstructs scope from project history, repository source and existing scope records; it does not grant new approvals or certify completion. Where exact historical decisions are not recovered, treat this as a proposed baseline for review. Existing explicitly approved detailed documents and stage restrictions take precedence.

## Objective

Develop recognizable emergent fighting motion through physical articulated bodies, recorded experiments and replay, rather than scripted hit outcomes.

## Requirements

- Mandatory Stage 1 criteria: recognizable jab/cross/hook/uppercut without labels, independent head movement, foot support and weight transfer, momentum on misses, physical contact for hits, unstable stumbles and falls.
- Natural sitting/standing, distinct personalities, fluid combinations, no obvious stretching, clipping or sliding, event-driven effects and target 60 FPS mobile.
- Preserve attempted configurations, failed trials, held-out tests and human visual ratings; do not advance Stage 2 until the user explicitly approves the physical controller.

## Technology and assets

Bundled MIT p2.js 0.7.1, 21 rigid bodies, 20 motorized joints, planar 120 Hz physics, Web Worker optimizer, Canvas replay, IndexedDB.

Preserve original or appropriately licensed assets and record their source, license and scale. Do not treat temporary primitive geometry, generated art or approximate audio as accepted visual fidelity. Obtain approval before publishing new cover artwork.

## Delivery and acceptance

- Keep existing working builds and player data; do not replace unrelated games. Publish to the Euclidi Games GitHub Pages catalog after testing unless the owner directs otherwise.
- Verify initialization, nonblank rendering, core controls and representative gameplay. Check relevant logic, physics, saves, visual alignment and performance; report actual hardware and measured results, not assumptions.
- Separate current implementation, target scope and evidence. See [STATUS.md](STATUS.md) and [ROADMAP.md](ROADMAP.md).

## Supporting records

- [Earlier combat build](legacy/dojo-ix.html)
- [Experiment evidence](experiments/git-seed-summary.json)
- [Physical controller](physics.js)
