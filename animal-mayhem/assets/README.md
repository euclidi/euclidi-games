# Asset handoff

These are source and candidate assets for future development. Their presence does
not mean the associated gameplay, animation blending, contact physics, scale or
visual matching is implemented. `SHA256SUMS.txt` inventories each included asset
and runtime library. The game still uses its original remote URLs.

## Current source collection

`characters/`, `furniture/`, `audio/`, and `textures/` are copied unchanged
from [find-the-cat at 0ee6eb153807ebff3c50cdff5778830b74e36b5a](https://github.com/druboni/find-the-cat/tree/0ee6eb153807ebff3c50cdff5778830b74e36b5a/assets).
The full source credits are retained in `UPSTREAM-CREDITS.md`. The current cat
is [Cat by madtrollstudio](https://poly.pizza/m/YvVobPlTlQ),
[CC BY 3.0](https://creativecommons.org/licenses/by/3.0/); the game resizes it.
Its GLB contains neither a skin nor animation clips. The upstream credits
identify the furniture as [Low Poly Household Items by Anker's Assets](https://ankersassets.itch.io/low-poly-household-item-pack),
listed as CC0, but explicitly say the pack was identified by name and model
count; verify the exact source for each model before publication. Upstream also
credits Quaternius character models, Poly Haven textures and BigSoundBank audio
as CC0. The cat and furniture are used by the current game; the remaining
source collection is available for future integration.

## Pet candidates

`candidates/kenney-cube-pets/` contains 24 self-contained animated GLBs by
[Kenney](https://kenney.nl/assets/cube-pets), CC0, from the converted
[tge-assets mirror](https://github.com/Hidencod/tge-assets/tree/e5bd31ec8b339b25d66dd5816a21dd517bd1ae87/packs/cube-pets).
The included license describes the conversion. The pack has dog, bunny,
parrot and fish candidates, plus a cat and other animals. It has a distinctly
cubic style; assess its fit with the existing furniture and character before
use. Each candidate contains eight animation clips, though no glTF skin.

`candidates/poly-pizza/` contains these unmodified GLBs:

| File | Creator and source | License | Asset inspection |
| --- | --- | --- | --- |
| `quaternius__rat.glb` | [Rat, Quaternius](https://poly.pizza/m/iltq5bVNaV) | [CC0](https://creativecommons.org/publicdomain/zero/1.0/) | Skinned; six clips |
| `quaternius__snake.glb` | [Snake, Quaternius](https://poly.pizza/m/x9x0viZs8V) | CC0 | Skinned; four clips |
| `quaternius__spider.glb` | [Spider, Quaternius](https://poly.pizza/m/yRYJiAJyiM) | CC0 | Skinned; five clips; generic spider, not confirmed tarantula |
| `poly-google__ferret.glb` | [Ferret, Poly by Google](https://poly.pizza/m/4I1SBFHWuSo) | [CC BY 3.0](https://creativecommons.org/licenses/by/3.0/) | Static; no skin or clips |
| `poly-google__hamster.glb` | [Hamster, Poly by Google](https://poly.pizza/m/3YtzEQ5TVUP) | CC BY 3.0 | Static; no skin or clips |
| `jeff-larson__spotted-gecko.glb` | [Spotted Gecko, Jeff Larson](https://poly.pizza/m/65Yj7059c2K) | CC BY 3.0 | Static; no skin or clips |

Keep attribution, license links and modification notices with any future use
of the CC BY assets and expose appropriate credits in the game. The static
models need rigging and animation; all candidates require visual and runtime
assessment. No redistributable sugar glider model was established in this pass.
The locally available Labrador pack was excluded because its license forbids
redistributing the asset files as an asset pack.

## Runtime technology

`../vendor/three/` contains the Three.js 0.170.0 module and the specific GLTF
loader and utilities used by the game, under the included MIT license.
`../vendor/rapier/` contains `@dimforge/rapier3d-compat` 0.17.3 with embedded
WebAssembly, under the included Apache 2.0 license. The current import map and
model root still point to remote copies. These are runtime libraries, not a complete asset
authoring toolchain or implementation of the remaining game systems.
