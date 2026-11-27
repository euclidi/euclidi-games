# Guacamole — proposed development specification R3.0

Status: proposed, awaiting scope/architecture approval. No production runtime or catalog entry yet.

## Scope
Preserve every V2 operation: chopping onion, tomato, jalapeno and cilantro; opening and scooping avocado; mashing to preferred consistency; adding and folding vegetables; squeezing lime, seasoning with salt; serving with tortilla chips. Replace disconnected mandatory stages with one persistent countertop. Guided recipe and free cooking use the same simulation. Optional scoring based on actual food state; no mandatory timer. Ingredient quantities, preparation order and resulting texture are player-controlled. No restaurant economy or unrelated cooking recipes in this revision.

## V2 source audit
V2 has gesture-based cutting, six scoops, global mash amount, four manual additions, angular stir counter, seasoning counts, three portions, synthesized tones and mouse/touch. It has no independent physical food entities, true sprite atlas stack, gamepad or persistence. Known source defects: bowl renders added types by count not identity; absolute angular movement permits short oscillations; local mashing modifies global texture; served bowl never empties; plate visuals ignore actual mixture state. Prior runtime test claims have not been independently reproduced in this audit.

## Proposed architecture
- TypeScript + Vite, static GitHub Pages base path; Three.js WebGL orthographic render, actual horizontal bitmap slice stacks with nearest filtering and depth/occlusion, coherent pixel palette. Bake slices from licensed meshes with Blender offline; use detailed custom cut faces and utensil contact geometry only when missing.
- Rapier JS/WASM fixed 60 Hz world for rigid utensils, whole produce and discrete pieces; continuous collision for fast blade/tool motion where applicable. Custom local mass-conserving particle/heightfield mixture solver for avocado paste, compression, shear, adhesion, folding and liquid distribution; render from simulation, not progress bars. No claim of CFD or molecular fidelity. Use measured performance budgets and aggregate tiny pieces without losing mass.
- Pointer raycast and swept tool collision, drag/click/keyboard alternatives, gamepad virtual cursor with adjustable sensitivity; pause/resume; responsive portrait/landscape and adaptive internal pixel buffer. Web Audio licensed samples, spatial/contact-dependent sound; local save and versioned migration. Bundle dependencies and assets; no third-party runtime CDN requirement.
- Suggested visual target: handcrafted warm kitchen, dark wood/mortar, natural ingredients, fixed oblique perspective with tool/food occlusion. No generic gradient UI or primitive substitutes. Final visual benchmark requires approval before bulk art.
- Suggested asset sources: Poly Haven Food Avocado 01 and food/kitchen catalog (https://polyhaven.com/a/food_avocado_01, https://polyhaven.com/models?c=food), Kenney Food Kit (https://kenney.nl/assets/food-kit), Quaternius Ultimate Food Pack (https://quaternius.com/packs/ultimatefood.html). CC0 candidates; verify individual asset license and geometry, bake to unified visual style, do not claim downloads or runtime compatibility yet. Technical references https://threejs.org/docs/pages/OrthographicCamera.html and https://rapier.rs/docs/user_guides/javascript/scene_queries/. Audit licenses, sources, scale, UVs, alpha, performance and redistribution rights in asset manifest.

## Acceptance requirements
1. Chop at arbitrary valid blade crossings; physical fragments conserve mass and retain type. No cutting from empty space or outside cutting surface.
2. Avocado skin and pit separate; spoon removes only contacted flesh; dropped material persists.
3. Masher changes only contacted region, chunk size and paste proportion respond to action and resistance.
4. Fold with spatula lifting/turning and displacement; actual ingredient identities and distributions persist, no gesture-count completion.
5. Squeeze lime into target; salt and liquid accumulate in local regions and spread during mixing. Excess seasoning is reflected in results.
6. Serving transfers real mixture composition and amount; bowl is empty when all material is served. Plate appearance tracks actual recipe.
7. Same kitchen state across tools, unrestricted reasonable recipe order, guided and free modes, meaningful reset and recovery.
8. No lost/duplicated mass beyond explicitly modeled spills, waste, or bounded documented numerical tolerance. Regression tests for invalid cuts, ingredient identity, local mashing, stir oscillation, transfer conservation, empty bowl, save/load, and different recipes.
9. Pilot avocado/knife/board visual inspection before bulk asset production; no primitive visual fallback presented as final. Validate touch, mouse, keyboard/gamepad, responsive layout, browser console, performance and actual complete playthrough.
10. Publish only after tested playable build: add game card, actual gameplay capture, version label, direct link and docs; verify live Pages deployment. No Vercel.

## Delivery
After approval, implement the complete scope in one continuous pass to the maximum feasible extent, using internal milestones for engineering only. Record unfinished, approximated, unverified items. Preserve cumulative source; no placeholder catalog entry.
