# Asset provenance — VOIDRUNNER 0.25.0-asset candidate

The actual image files are tracked locally; no third-party runtime CDN requests. Exact source Git blob hashes were verified after importing.

| File | Source and license | Original Git blob |
|---|---|---|
| earth.jpg | Solar System Scope, 2k_earth_daymap.jpg, CC BY 4.0 | 6cdcffea631a25e344e4ed68f3028fef1e554870 |
| clouds.jpg | Solar System Scope, 2k_earth_clouds.jpg, CC BY 4.0 | 504aaa7750ec341922d8a28b03f42b8d4efa1549 |
| mars.jpg | Solar System Scope, 2k_mars.jpg, CC BY 4.0 | b3654a9b2d21c2910c38a0287423862650d54e1f |
| jupiter.jpg | Solar System Scope, 2k_jupiter.jpg, CC BY 4.0 | 21f1951026dc8e539f751ef55b559fa683869c63 |
| moon.jpg | NASA SVS CGI Moon Kit LROC color mosaic, public-domain NASA imagery as attributed by mirror | ed05d2cbce6b1258bc06d0f74ed8bb05851a6a55 |

Solar System Scope: https://www.solarsystemscope.com/textures/ ; license https://creativecommons.org/licenses/by/4.0/ ; byte source https://github.com/elymas/solar-simulator/tree/main/public/textures . Credit to Solar System Scope, based on NASA imagery. File renames only; runtime nearest-neighbor sampling, map resampling and converting cloud luminance into opacity are modifications. NASA Moon source: https://svs.gsfc.nasa.gov/4720 ; credit NASA/GSFC Scientific Visualization Studio, LRO LROC. Byte mirror https://github.com/cwtf/wiki-globe/blob/main/assets/moon.jpg . Exact lunar product edition and geographic seam orientation require runtime inspection. No agency endorsement implied.

Candidate for character work: Quaternius Universal Base Characters and Universal Animation Library (CC0), https://quaternius.com/packs/universalbasecharacters.html and https://quaternius.com/packs/universalanimationlibrary.html . Not yet imported or rig-tested; do not claim an animated model replacement. Evaluate Three.js glTF skinning with pixel-sampled composition and Rapier local contacts before larger architecture migration.
