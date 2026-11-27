# Creatture — development preview 0.1.8

Influence the development of an autonomous specimen by introducing elements in different orders. Three modes and six habitat definitions are present in the initial source. This is NOT an approved production release or verified playable deployment.

## Build
Requires Rust stable, wasm-pack, Node 22, npm and a WebGL 2 browser.
```
cd creatture/source
npm install
cargo test --manifest-path engine/Cargo.toml
npm run build
npx playwright install chromium
npm test
npm run preview
```
Vite outputs dist/. No fallback renderer or JavaScript simulation core. Use buttons or number keys 1–0, minus and equals to introduce elements. Camera button toggles orbit inspection. Free cultivation exposes experimental controls; archive preserves snapshots via IndexedDB.

[Approved specification](SPEC.md) · [Roadmap](ROADMAP.md) · [Status](STATUS.md)

Play the catalog development preview: https://euclidi.github.io/euclidi-games/creatture/?v=0.1.8. The compiled package was tested on CI; live deployment is separately verified. Original build source is in `source/` in the published directory and on branch `creatture-r3`. For local development, run the build commands below from the source directory. Original box art remains unapproved; use a gameplay screenshot.

## Offline art pipeline
Install Blender 4.x and run `npm run assets` to create the original element-object PNGs and panoramic habitat textures under `public/rendered/`. `npm run build:art` renders then builds the browser application. The standard build can still run with temporary text symbols and solid background; that is not the intended production visual release. See the separate art CI workflow for generated assets and browser screenshots. Production sculpted creature assets, rigging and authored transformation sequences are outstanding.
