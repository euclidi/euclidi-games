# Reusable game resources

This library collects reusable, licensed building blocks. Most entries are source assets; they are not wired into a live game. Read each pack's notes before importing it, keep incompatible art styles in separate layers, and preserve the included license and provenance when copying files.

## Browse by need

- [3D characters, locomotion/combat animation, weapons, props, environments, and extraction tooling](foundations-3d/README.md)
- [2D characters, platformer art, tiles, and particles](foundations-2d/README.md)
- [Footsteps, impacts, interface, RPG, sci-fi, and music cues](foundations-audio/README.md)
- [Icon and UI source packs](foundations-ui/README.md)
- [Godot foot-grounding IK source](tech/godot-foot-ik-grounder-lite/README.md): MIT source subset for Godot 4.4+; upstream demo/tests omitted, so runtime integration is still required.
- `tech/javascript-state-machine/`: browser-ready finite-state-machine library, history and visualization plugins, plus upstream README and MIT license. Upstream commit `2ae84bbbaad13103be43b3e0a24c077002e2301a`: [jakesgordon/javascript-state-machine](https://github.com/jakesgordon/javascript-state-machine). Evaluate maintenance and performance before integration.

## Use and iteration

Pick one art grammar per project layer. Pixel packs use different resolutions and palettes; the low-poly 3D kits also have distinct proportions. Animation libraries are alternatives, not one shared rig: retargeting, root-motion handling, foot locking, and transition blending must be set up per engine. The source packs remain easy to extract and inspect without adding their contents to a game build.

All asset files and curated copies are inventoried in [SHA256SUMS.txt](SHA256SUMS.txt). See each README and the included upstream license for pack-specific rights and limitations.
