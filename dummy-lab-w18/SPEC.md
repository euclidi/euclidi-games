# Dummy Lab — W1.11 — Development specification

**Revision:** documentation baseline, 2026-11-26. **Lifecycle:** Active — current catalog release.

This reconstructs scope from project history, repository source and existing scope records; it does not grant new approvals or certify completion. Where exact historical decisions are not recovered, treat this as a proposed baseline for review. Existing explicitly approved detailed documents and stage restrictions take precedence.

## Objective

Observe an autonomous articulated humanoid from a furnished laboratory, inspect its behavior and interact with it from the observation area.

## Requirements

- Autonomous behavior with independent gaze, movement, reactions and diverse activities rather than repetitive scripted loops.
- Articulated anatomy with aligned hands, limbs and feet; believable contact, weight, falls and transitions; accessible slow motion and diagnostics.
- Furnished observation room, chamber glass, computers, chairs and props; controlled exposure, shadows, first-person and free camera, input and sound.

Neutral posture must use mirrored anatomical thumb orientation, relaxed finger cascade, inward-facing palms, lightly flexed knees and stable foot contacts. Explicit contact poses override the neutral wrist frame.

Responsive portrait and landscape, safe-area layout, analog multitouch movement/look, and standard controller input are required; nonstandard right-stick axes configurable. Physical hardware testing separate.

Locomotion targets: continuous weight transfer, foot roll and articulated toes, velocity-based arm counter-swing, balance recovery, physically simulated falls, procedural get-up, grasp/carry/throw using actual rigid bodies, and continuity across actions. Reduced-order hybrid controller is an intermediate implementation; full force-driven balance remains a target.

## Technology and assets

Three.js 0.180.0, Rapier 0.17.3 WASM, browser ES modules/import map, original procedural meshes, IK animation and 120 Hz environment stepping. Pinned CDN dependencies.

Preserve original or appropriately licensed assets and record their source, license and scale. Do not treat temporary primitive geometry, generated art or approximate audio as accepted visual fidelity. Obtain approval before publishing new cover artwork.

## Delivery and acceptance

- Keep existing working builds and player data; do not replace unrelated games. Publish to the Euclidi Games GitHub Pages catalog after testing unless the owner directs otherwise.
- Verify initialization, nonblank rendering, core controls and representative gameplay. Check relevant logic, physics, saves, visual alignment and performance; report actual hardware and measured results, not assumptions.
- Separate current implementation, target scope and evidence. See [STATUS.md](STATUS.md) and [ROADMAP.md](ROADMAP.md).

## Supporting records

- [W1.7 archived version](../dummy-lab/README.md)

## W1.12 display and input requirements

Desktop click-to-lock via the browser Pointer Lock API; relative mouse motion, Escape release, input clearing on blur or release, drag fallback and retained touch/gamepad. Native resolution by default, DPR capped at 2 with 8.3 MP desktop / 2.3 MP mobile pixel budgets; optional 480p. Three independent actual chamber renders on monitor surfaces, camera layer exclusion to avoid feedback recursion, staggered target refresh. Preserve existing behavior and physics.
