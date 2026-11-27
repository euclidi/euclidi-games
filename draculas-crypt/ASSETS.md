# Asset provenance and integration — 0.13.0

Powered by [Poly Haven](https://polyhaven.com/). Source assets [CC0](https://polyhaven.com/license); API used only by build-time acquisition, with user agent and attribution. Plan is in asset-plan.json. Download exact 1K JPEG maps from official API metadata, check source size/hash when available, image format/dimensions and record SHA-256 in assets/manifest.json. The renderer consumes the local files only; successful material families replace the corresponding procedural maps atomically. Existing modeled masonry, furniture, single inhabitant, cloth and behavior are preserved. No browser API calls to Poly Haven. The material batch must complete and pass browser smoke before source files are automatically committed by the acquisition workflow.

- Rock 01: solid gray weathered stone, avoids double mortar seams on the physical masonry.
- Fine Grained Wood: aged dark brown wood for coffin and furniture; tint separately for ebony.
- Rough Linen: normal and roughness only; retain existing red/gray liturgical colors.
- Brass Candleholders: candidate; source approx. 42k triangles, require separate holder/candle/flame and contact alignment before replacement.
- Street Rat: candidate anatomy source; not a biped rig, not added as a second character.
- Three.js existing 0.160.1 retained. No generic low-poly replacement; retain authored cloth controller until an evaluated replacement is superior.

Status: acquisition code and renderer integration are being committed; binary asset download and actual WebGL rendering are not yet verified in the current environment. Use GitHub Actions acquisition logs and manifest to establish actual success.
## 0.13.1 — actual local acquisition
The complete Rock 01 and Fine Grained Wood families are committed under `assets/` (six JPEGs; 2,615,675 bytes total). Retrieved from pinned public mirrors because the official asset server was unreachable in the development environment. Source pages verify asset identity and CC0 licensing. Each copied file's JPEG signature, byte length and Git blob SHA match its pinned mirror; official-server checksums and image appearance still require independent verification. Individual mirror provenance is recorded in `assets/manifest.json`. The Rough Linen roughness map exceeded the connector's 1 MB contents limit, so no incomplete linen family was installed. Official acquisition workflow remains available. Three.js r160 (0.160.0), upstream minified ES module, is vendored with its MIT license; existing 0.160.1 CDN URLs are emergency fallbacks. The local engine blob SHA is `9807b610d02fd0a1833fa7ceae44239652c78f3c`.
