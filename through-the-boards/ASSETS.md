# Asset ledger — Through the Boards

## Integrated in v0.16
- Indoor rain loop: **Rain Indoor Cabin (loop)** by PhilllChabbb, Freesound sound 232731, CC0 1.0. Source: https://freesound.org/people/PhilllChabbb/sounds/232731/
- Redistribution: Aurora Viewer, https://github.com/Aurora-Viewer/Aurora-Viewer/blob/main/assets/rain/rain-roof.ogg (upstream blob b8b2c9763ef36d53815e340961f041f1d7576543). Upstream edits: cutting, levelling and looping; license verified in https://github.com/Aurora-Viewer/Aurora-Viewer/blob/main/NOTICE.md.
- Vendored byte-for-byte Ogg recording encoded in assets/rain-roof.js; no third-party runtime requests. It replaces the procedural rain source after successful Web Audio decoding, with weather, distance attenuation, low-pass filtering and reflections retained. Existing synthesized sound is the fallback.
- Source bytes matched upstream; game JS syntax and unchanged embedded WASM verified. Real audio decoding, audible quality and live GitHub Pages playtesting are not verified this pass.

## Evaluated, not integrated
- Grab3D Cozy Isometric Furniture Sprites (CC0): https://grab3d.com/sprites/cozy-isometric-furniture/ — 2:1 projection is compatible in principle, but flat prebaked views cannot simply replace depth-aware movable/deformable sprite stacks. Evaluate underlying 3D chair and per-height slices, not a flat overlay.
- Pixor bed (CC0): https://pixor.art/library/interior/bed/ — editable model and pixel sheets; bed frame conflicts with floor mattress, so only adapted mattress/pillow geometry is a candidate. No integration claimed.
- Chipmunk2D (MIT): https://github.com/slembcke/Chipmunk2D — C99 planar rigid-body dynamics, friction, angular motion and collision queries; promising for chair/mattress ground contacts. Does not solve 3D cloth or lighting. Requires compatible integration and tests against the preserved WASM before replacing the engine.
- Further priority: actual carpet/wood/fabric textures, authentic CRT and furniture models, separately layered character assets, real birds and carpet footsteps. Source and inspect assets before writing custom replacements.

## Mandatory workflow
Source → audit license, format, scale, projection, fidelity, performance and behavior → integrate best compatible existing assets/libraries → adapt → test → refine. A missing asset is not a reason to rebuild the project; a missing C source is not a reason to skip visual/audio asset research. Record rejected candidates and actual integration evidence. Never claim a shortlist constitutes implementation.