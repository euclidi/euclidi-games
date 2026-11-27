# 2D foundations

Small, self-contained CC0 source archives from Kenney. Each ZIP contains its own license. Extract only the chosen pack; do not combine its sprites with a layer using a different pixel scale, outline rule, or camera projection without first normalizing them.

| Pack | Focus | Source |
|---|---|---|
| `kenney/1-bit-platformer-pack.zip` | 16×16 tiles, characters, and platformer objects | [1-Bit Platformer Pack](https://kenney.nl/assets/1-bit-platformer-pack) |
| `kenney/pixel-platformer.zip` | 18×18 pixel platformer tiles and props | [Pixel Platformer](https://kenney.nl/assets/pixel-platformer) |
| `kenney/new-platformer-pack.zip` | Broad platformer sprites, objects, and characters | [New Platformer Pack](https://kenney.nl/assets/new-platformer-pack) |
| `kenney/roguelike-characters.zip` | Roguelike character sprites and variants | [Roguelike Characters](https://kenney.nl/assets/roguelike-characters) |
| `kenney/particle-pack.zip` | 512×512 particle textures for effects work | [Particle Pack](https://kenney.nl/assets/particle-pack) |

The existing `../kenney-1bit/` sheets are a separate 1-bit UI/world reference; `../kenney-input-prompts-pixel/` and `../kenney-crosshairs/` are optional HUD sources. Keep pixel densities and HUD/world art on explicit style boundaries.

## Additional packs

- [Pixel Frog character strips and playback module](pixel-frog/README.md) for side-view platformers.
- [Kenney Tiny maps](kenney-tiny/sources.json) for consistent 16 px dungeon, town, farm and battle maps.
- [Kenney isometric miniatures](kenney-isometric/sources.json) for four-direction dungeon, library, farm and prototype compositions. Use matching view folders and check tile footprints before composing.
- [Kenney map and arcade sets](kenney-map-arcade/sources.json) for roguelike interiors, world maps, space scenes and top-down action. Check the grid and perspective of each pack.
