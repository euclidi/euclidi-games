# VOIDRUNNER — Roadmap
Updated 2026-11-27. Complete-first continuation; no stage-only restriction. Internal priorities are not user approval gates. A consequential renderer/physics architecture replacement requires review, not permission for routine fixes.

- P0 — stabilize actual body flight, walking, swimming, orbit and atmospheric transitions. Validate GPU shader vs CPU, thermal/water/contact calculations, dt/warp, save/reload and controller on target devices; fit landscape controls without scroll.
- P0 — restore multiple celestial bodies lost after v9: source and locally cache verified Earth/Moon/Mars/Jupiter imagery, body registry, orbital positions and gravity; navigable continuous frame transitions; distinguish gaseous and solid bodies. Restore scale and geography without invented map placeholders. NASA lunar image download unavailable during this pass.
- P1 — replace screen-space body and sparse site with licensed or authored anatomically plausible rigged character, weighted motion, coherent local terrain, improved atmosphere/cloud and ocean shading; continuous nearest-neighbor LOD and world geometry. Evaluate Three.js + glTF, local physics vs custom orbital integrator; measure tradeoffs before migration.
- P1 — expand physical power consequences: world-anchored scorch/destruction, ice thickness/contact/melt, localized weather, object impulses, robust optional vehicle handling; durable save schema for multiple worlds and persistent effects.
- P2 — exploration landmarks, environmental audio, accessibility, discovery/navigation, settings and player feedback consistent with subtle pixel style.
- Release: exact source tracked, test and visual review; verify Pages separately from commit, versioned catalog entry and genuine capture; document all failures. Do not call a partial Earth baseline complete.

## Candidate update
- Byte-verified planetary and cloud maps imported on asset-first branch; verify actual runtime, orientations and capture, then merge only after regression checks. Survey destinations are a transitional testing mechanism, not the final multi-world system.
- Next use a CC0 rigged character and compatible animation clips; evaluate scale, pose, skinning and frame budget before replacing the screen-space human. Continuous orbital navigation and local terrain elevation remain P0/P1.
