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