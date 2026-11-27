# Scope and architecture — browser line
## Recovered scope
SPINFORGE started as a sprite-stacked duel; owner explicitly requested Three.js and better physics, arenas and models. Retain Raptor, Aegis, Orbit, Vortex; four discs and drivers, CPU best-of-three, swipe launch, optional spin-funded steering, three arenas with pockets, spin and burst finishes, wobble/hops, cameras, slow motion and diagnostics. Detailed believable mechanical geometry; no reduced demo.

## Related native scope (not silently merged)
Separate approved Beyblade Duel Simulator v1.0: Windows 10/11, Godot 4/Jolt, 1920x1080/60 FPS; full 3D rigid bodies, launch-only autonomous duel; Storm Pegasus 105RF, Burn Fireblaze/Phoenix 135MS, Earth Virgo GB145BS, Jumper and Unstable prototypes; razor attachments, heavy ring, rubber attack tip, stamina tip, offset weights, serrated ring. Physical mass/COM/inertia/friction, gyroscopic response, loosening/detachment/destruction; Experimental and CPU modes, configurable scoring, workshop credits/inventory/repairs/exploded view, actual state replays with 0.05x–1x and free camera. No evidence establishes that these are the same project. Keep separate until confirmed.

## Technology
Three.js and 120 Hz custom solver retained. Static GitHub Pages. Vendored official r169 after r187 upstream retrieval returned 404. Evaluate Rapier 3D WASM vs native Jolt for full 6-DOF contacts before changing architecture. Original procedural meshes preserved pending asset-first reference and license review; no asset acquisition claimed except renderer.

Candidate extensions: seed, energy cap, geometry-sized contacts, pocket clearance, vertical height compensation, 30 Hz state recording. Further experiment mode, workshop and playback interfaces are planned. Not full native scope.

## Acceptance
Finite simulation and deterministic replay; real WebGL browser tests on desktop/mobile, controls, round flow, visual contact review, genuine gameplay screenshot, accessible catalog return, documentation and version, deployment verification. Full 3D fidelity remains a separate criterion.

## 0.7.1 additions
Experimental mode, persistent condition/credits and paid repair, 30 Hz recorded state scrubbing/playback, pause, keyboard and basic gamepad launch. These are browser-line extensions, not full native-scope completion.
