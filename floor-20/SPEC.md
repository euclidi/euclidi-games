# Floor 20 — scope and technical baseline

## Experience
Explore a reclaimed, overgrown office tower with a believable layout, atmospheric lighting, interconnected floors 19–21, and inspectable ordinary objects. Preserve orbit/pan/zoom Viewer and independent first-person Walk. The sandbox should encourage discovery and emergent environmental interaction rather than impose a scripted objective.

## Full scope
- Architecture: workstations, executive suite, conference room, breakroom, restrooms, stairs, exterior city and coherent proportions. Accurate doors, ceilings, stairs and collision.
- Movement: weighted gait and smooth camera, floor transitions, sitting, physically responsive doors, mobile and controller input.
- Interaction: six-slot field kit, money, inspect with depth focus and rotation, orientation-controlled placement, throwing, object contacts and material response, persistent state.
- Functional objects: lamps and failing fixtures, clocks, globe, cradle, beetle and specimen jar, PC inspection and complete model-specific disassembly/reassembly, tool operations, power and POST based on installed parts.
- Destruction: glass and screen impacts, energy/angle dependence, detached door hinges and localized debris. World-wide generic destruction is not assumed implemented.
- Presentation: carefully crafted models and textures, coherent lighting and materials, credible silhouette/shadow and mirror, environmental and surface-specific audio, accessible and responsive UI.
- Performance: localized simulation, sleep, bounded updates, adaptive rendering, tested keyboard/touch/controller controls and actual device performance.

## Architecture decision
Keep the existing custom WebGL renderer and full authored scene for migration. Replacing it now would risk loss of geometry and interactions. Modularize incrementally. For future work evaluate Three.js/glTF asset loading, a mature rigid-body solver (e.g. Rapier), and Web Audio; integrate only after compatibility, license and behavior tests. No Three.js or Rapier migration has been implemented in v15. Asset-first: source and audit existing compatible assets before new modeling; retain the scene's art direction and real scale. No external asset license or compatibility audit was completed in v15.
