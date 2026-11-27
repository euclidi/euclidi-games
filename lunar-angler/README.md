# Lunar Angler
Cast a tethered hook from a moon through a miniature gravitational system, fish in distant water worlds, and recover specimens. **v0.2 seat-first experimental partial implementation**, not Revision 3.0 complete.

[Play route (publication may lag commits)](https://euclidi.github.io/euclidi-games/lunar-angler/)

## Controls
The lunar seat is the default view. Drag back on the scene and release to cast, or use the controls. Tap the live atlas to aim; the predicted line uses a separate copy of the actual WASM simulation. The clock is initially held for planning. Choose Look skyward to observe the celestial bodies. Reset first system, choose elastic launcher, 0° azimuth, full draw, cast immediately. Wait for submersion and a bite, then reel. Click atlas to aim or use sliders. Space cast, R reel toggle, 1/2/3 camera, P pause; gamepad A/B/Y and left stick bindings; touch uses buttons/sliders. Journal shows catches and credits; expedition unlocks seeded systems by catches; sandbox permits seed changes freely.

## Local
Serve the repository root over HTTP (python3 -m http.server 8765) and open /lunar-angler/. Reuses repository vendor Three.js, no external CDN. Requires WebGL2, WebAssembly, Worker and DecompressionStream. The gzip/base64 packaged WASM was compiled from core.cpp; source rebuild uses clang++ --target=wasm32 -Oz -nostdlib -fno-exceptions -fno-rtti -fno-builtin -Wl,--no-entry -Wl,--export=reset -Wl,--export=cast -Wl,--export=step -Wl,--export=snapshot -Wl,--export-memory -Wl,--strip-all core.cpp -o core.wasm; then gzip -9 -n -c core.wasm | base64 -w0 > core.wasm.gz.b64. Run node lunar-angler/test.mjs and node lunar-angler/forecast.test.mjs from root. Browser smoke requires Playwright and HTTP server.

[Approved specification](SPEC.md) · [Roadmap](ROADMAP.md) · [Current limitations and test evidence](STATUS.md) · [Asset credits](ASSET_CREDITS.md).
