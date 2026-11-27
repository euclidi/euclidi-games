# EXOHOSTILE · Facility 07
Development build 0.2. Native-resolution first-person Three.js and Rapier sandbox.

[Open the browser build](https://euclidi.github.io/euclidi-games/exohostile/)

## Controls
WASD move; mouse look; primary mouse fire; secondary mouse aim; 1–3 select weapon; R exchange cell; F inspect; E select specimen or open terminal; Tab terminal; Esc pause. Gamepad: sticks, RT fire, LT aim, X cell, Y cycle, A use, Start terminal. Touch: directional controls, drag view, fire, aim, use and terminal buttons.

Choose Sandbox, Technician, or Persistent at startup. The terminal provides carrier distance and sweep, range presets, equipment selection, output, attraction/repulsion, specimen spawning, duplication, relocation, maintenance and saving. Persistent mode autosaves; the load button restores the most recent IndexedDB session.

## Dependencies and asset provenance
- Three.js 0.170.0 and Rapier3D compat 0.17.2, loaded from jsDelivr. WebGL 2 and network access required.
- Poly Haven [Metal Plate](https://polyhaven.com/a/metal_plate), CC0, requested through its public file API at runtime. Falls back to untextured material if inaccessible.
- Other meshes, signs, targets and synthesized sounds are custom procedural assets. They are not production-quality authored models. No third-party character or weapon model is bundled.
- See [SPEC](SPEC.md) and [STATUS](STATUS.md) for full scope and verification limitations.

## v0.2 art integration
Three CC0 PBR surfaces (Metal Plate, Metal Plate 02, Galvanized Sheet Metal) and four authored glTF props (Worn Metal Rack, Plastic Crate 02, Classic Laptop, Caged Hanging Light) from Poly Haven are connected to the runtime with local-first loading, CDN fallback and an on-screen load report. The vendor workflow downloads the original assets using the API with a unique user agent and verifies sizes/checksums and dependencies before committing them. Model collision envelopes use actual imported bounds. Spatial impact audio uses Web Audio HRTF panners. Neither downloads nor browser behavior have been confirmed in the development environment. Procedural weapon/alien art remains a fallback; no claim of complete visual replacement.
