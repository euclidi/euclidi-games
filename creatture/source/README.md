# Creatture — unreleased development source

Influence the development of an autonomous specimen by introducing elements in different orders. Three modes and six habitat definitions are present in the initial source. This is NOT an approved production release or verified playable deployment.

## Build
Requires Rust stable, wasm-pack, Node 22, npm and a WebGL 2 browser.
```
cd creatture
npm install
cargo test --manifest-path engine/Cargo.toml
npm run build
npx playwright install chromium
npm test
npm run preview
```
Vite outputs dist/. No fallback renderer or JavaScript simulation core. Use buttons or number keys 1–0, minus and equals to introduce elements. Camera button toggles orbit inspection. Free cultivation exposes experimental controls; archive preserves snapshots via IndexedDB.

[Approved specification](SPEC.md) · [Roadmap](ROADMAP.md) · [Status](STATUS.md)

No public play URL yet. The branch is isolated from the Pages catalog pending successful builds, playtests, visual audit and owner-approved box art.

## Offline art pipeline
Install Blender 4.x and run `npm run assets` to create the original element-object PNGs and panoramic habitat textures under `public/rendered/`. `npm run build:art` renders then builds the browser application. The standard build can still run with temporary text symbols and solid background; that is not the intended production visual release. See the separate art CI workflow for generated assets and browser screenshots. Production sculpted creature assets, rigging and authored transformation sequences are outstanding.
