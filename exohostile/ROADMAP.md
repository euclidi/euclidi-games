# EXOHOSTILE roadmap

## Release gate — v0.3
- Acquire the selected three PBR material sets, six industrial glTF props and one HDRI through official Poly Haven metadata; verify all files, licenses and glTF dependencies.
- Run the Chromium smoke test with the local pack and verify the screenshot, movement input, weapon switching and terminal. Inspect the actual game for clipping, scale, lighting and asset placement before promotion.
- Preserve the current public build until the replacement is verified; report failures rather than hiding them behind fallback geometry.

## Subsequent quality work
- Replace procedural alien hands and inert mannequin segments with coherent rigged models; improve equipment silhouettes, animations and room-specific machinery.
- Test collision, materials, controls, save restoration and mobile GPU performance; add quality settings and optimize meshes/textures.
- Expand sustained gravity fields, projectile collision, material damage and persistent facility state according to SPEC.md.

See [specification](SPEC.md), [status](STATUS.md) and [controls](README.md).