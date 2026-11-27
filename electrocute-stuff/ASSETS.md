# Asset and dependency register — V4

## Integrated and vendored

- Matter.js 0.20.0 — MIT. Upstream https://github.com/liabru/matter-js/tree/0.20.0 ; license retained in vendor/Matter-LICENSE.txt; distribution in vendor/matter.min.js. Polygon debris simulation, contact response and sleeping. Existing legacy debris integration is a fallback if the library is missing.
- Kenney Impact Sounds — CC0, https://kenney.nl/assets/impact-sounds. Metal and glass impact clips: impactMetal_heavy_000.ogg and impactGlass_heavy_000.ogg.
- Kenney Digital Audio — CC0, https://kenney.nl/assets/digital-audio. zap1.ogg.
- Faxcorp Electricity Game Sound Pack — CC0, https://opengameart.org/content/electricity-game-sound-pack. crackleelectricityloop.wav (MP3 derivative from the mirror).

Audio mirror: https://github.com/newrare/gamedustry/blob/main/assets/audio/sfx/sources.tsv . Original mirror files impact-metal-heavy-01.ogg, impact-glass-heavy-01.ogg, zap-01.ogg, loop-electric-crackle-01.mp3. Encoded as data URIs in vendor/samples.js, no runtime external requests. Audio playback and subjective sound quality not yet verified.

## Evaluated, not integrated

Kenney Food Kit (CC0): https://kenney.nl/assets/food-kit — authored 3D food props; candidate for a coherent visual conversion, not a direct 2D replacement.
Poly Haven (CC0): https://polyhaven.com/a/blue_metal_plate — scanned painted metal material; candidate for workbench/cabinet surfaces.
Retain original artwork until compatible models, component alignment, material maps, performance and consistent style can be validated. Do not introduce placeholder geometry just to use a 3D library.

## Verification

V4 inline JavaScript compiled successfully. Vendored Matter.js 0.20.0 executed an isolated polygon/floor collision test successfully. Integrated browser input, audio decoding/playback, full gameplay and Pages deployment unverified. V3 remains catalog baseline; V4 is available separately at v4.html.

## V5 additions
Kenney Particle Pack (CC0-1.0), https://kenney.nl/assets/particle-pack. Original `smoke_01.png` and `light_01.png`, retrieved from https://github.com/GeorgeQLe/assets-vfx-particles/tree/main/assets/kenney/particle-pack/PNG%20(Transparent) with license metadata in its manifest. PNG signatures checked; exact original images embedded in `vendor/vfx.js` and used for smoke sprites and conducting contact light. Browser image decode/render and visual fit not yet checked. No authored specimen art adopted in V5; geometry and visual fit require evaluation.


## V6 authored specimen pilot
- Three.js r180 (MIT), https://github.com/mrdoob/three.js/tree/r180. Vendored module/core builds, GLTFLoader, BufferGeometryUtils and license under vendor/three; only import specifiers adapted for static hosting.
- Kenney Food Kit (CC0), https://kenney.nl/assets/food-kit. Original soda-can.glb (27,124 bytes) and soda-can-crushed.glb (32,044 bytes) from https://github.com/Hidencod/tge-assets/tree/main/packs/food-kit, embedded verbatim as base64 in vendor/can-models.js. GLB v2 headers, declared lengths, mesh/material metadata and absence of required compression extensions checked. Optional WebGL raster-to-alpha-sprite pipeline lazily loads both states; original art is default and failure fallback. Model parsing/rendering and visual alignment have not been verified in a browser. The other candidate models (watermelon, toaster, vintage television) are not integrated yet.
