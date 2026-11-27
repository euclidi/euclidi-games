# v16 — asset-first development preview (2026-11-27)

## Implemented
- Self-hosted three CC0 diffuse material textures: weathered plaster, oak veneer, woven fabric; material-specific world-space projection, repeat/mipmap filtering and separate upholstery material. Preserve authored color palette; optional material toggle and neutral fallback on decode/upload failure.
- Ten CC0 Ogg samples from Kenney: carpet/concrete footsteps (two variations each), wood/metal/generic impact, glass fracture and door opening/closing. Gesture-armed Web Audio sample bank with distance attenuation, stereo pan, impact cooldown and footfall synchronization. Optional audio toggle.
- Retained complete v15 scene, floors, input, interaction and physics systems. Asset manifest records licenses and source hashes.

## Verified
- All 13 binary source blob hashes matched at destination. Local v16 source passed Node syntax check and mocked DOM/WebGL initialization, Viewer/Walk rendering code, swept prop-wall contact, mass impulse, specimen retention and camera roll regression tests. Mesh counts remained 62,458 floor-20 triangles, 21 doors, 72 wall sections and 9 portable items. Source transfer FNV-1a 3365529206; 118768 UTF-16 code units.

## Limitations
- Actual browser shader compilation, texture upload/visual quality, audio playback and human/device playtest not verified. This is not a release-quality build. Diffuse-only shading; textile approximates carpet; not all props textured. No imported 3D models, Rapier integration, comprehensive world saves or ambient audio in this pass. Keep previous baseline intact and test all accepted scope.

---

# v15 — catalog development preview (2026-11-27)

## Baseline
Recovered full v13 (105,997 bytes) from the existing conversation checkpoint. The v14 HTML and checkpoint ZIP were listed but could not be retrieved as backing files. Reimplemented the documented v14 camera roll, footfalls, stair rhythm and settings persistence; exact v14 code equivalence is not verified. No floors, room layouts or established interaction classes were intentionally removed.

## Implemented in v15
- Full viewport and catalog return link; complete original WebGL project retained.
- Conservative orientation-dependent portable-object bounds; swept horizontal contacts with walls, door leaves and major furniture; mass-weighted horizontal object/object impulses; ceiling bound; window contact threshold; blocked placement cue; size-aware support heights.
- Jar specimen state survives pickup; improved jar, screwdriver and RAM meshes; spin combined with placement yaw.
- Footfall impulses, restrained roll and local control preferences; input blur reset.

## Verified this pass
- node --check passed.
- Full script initialized under Node DOM/WebGL stubs; reported 21 doors, 72 wall sections, 21 solid furniture entries, 62,458 floor-20 mesh triangles and 9 portable items. Counts are diagnostics, not a real GPU benchmark.
- Viewer and Walk render code executed against mock GL. Swept wall contact, mass-weighted impulse, captured specimen retention and camera roll assertions passed.
- Remote source transfer matched length and FNV-1a checksum (112812 UTF-16 code units, 2432933526).

## Not verified / incomplete
Chromium failed to return even a minimal headless DOM in this environment. No real GPU screenshot, shader compile, human playtest, performance benchmark, touch device, or physical controller check in v15. Prior v13 GPU tests are historical only. Conservative collision proxies are not full 3D rigid bodies; friction and restitution are approximate, stacking/vertical prop contacts and exact concave furniture remain incomplete. Jar rendering/transparency and new geometry are not visually checked. Inspection uses a local 2D preview rather than full shared 3D rendering. Universal disassembly, richer material textures, audio, world saves and complete destruction remain unfinished. This preview is not a release-quality build.
