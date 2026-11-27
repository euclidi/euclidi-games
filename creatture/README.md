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
