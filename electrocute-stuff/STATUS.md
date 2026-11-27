# Status — V3 development preview

2026-11-27: recovered and audited V2; upgraded in place. Seven specimens retained. Three thermal zones with heat exchange and localized readout, terminal distinction for bulb, positive-probe ground-return rule, contact marks restricted to conducting contacts, capacitor recovery hysteresis, 120 Hz fixed-step simulation, approximate mutual debris collisions, resize preservation, unique discovery tracking, imperial/metric toggle and saved progress code. Existing Canvas 2D visuals and threshold-driven failures remain.

Local Chromium tests using injected HTML: can conducts (3.93 simulated A); bulb heats and opens filament; dry versus wet duck (0.03 vs 3.16 simulated A); release removes current; metric toggle; mobile-width layout has no horizontal overflow; no page errors in these runs. Storage serialization tested with mocked localStorage, not actual hosted storage. Physical mobile touch, all specimen failure paths, full debris collision behavior and actual Pages deployment not verified. Direct network unavailable from local runtime. Native fracture, component-level circuits for every specimen, spatial moisture, multi-object workbench and professional art/audio are outstanding.

## V4 asset-first preview — 2026-11-27
Vendored Matter.js 0.20.0 and four CC0 audio clips; integrated polygon rigid-body debris, material impact audio and electrical audio. Syntax check and isolated engine collision test passed. Full browser regression and deployment verification remain outstanding. V3 remains catalog baseline; V4 is separate at `v4.html`. See [ASSETS.md](ASSETS.md) for provenance, candidates and limitations.


## V5 — asset-first development preview
- Added two vendored CC0 particle textures; existing procedural fallback retained.
- Fixed clearing/reaping Matter bodies, audio retry throttling, input cancellation on blur, and residual scorch marks after total destruction.
- Replaced generalized elliptical contact checks with per-specimen rounded-box/ellipse unions, with distinct bulb terminals and temperature-dependent filament resistance. These are approximations, not physical electrical measurements.
- Executed the actual V5 update code with the exact vendored Matter 0.20.0 engine under a DOM shim. All seven default contacts conducted; wet duck exceeded dry current by >10x; disconnecting probe stopped current; bulb opened its filament; 31 debris bodies remained finite over 360 steps; clearing reduced world to 3 static boundaries. Syntax passed. DOM shim does not validate actual browser layout, touch, image decode, audio playback or visual fidelity. Local runtime network unavailable; GitHub Pages live deployment not verified. V3 remains default; V5 is a separate preview.


## V6 — specimen rack and spatial moisture
- Added a 21-cell moisture field with brush placement, lateral diffusion, evaporation and probe-to-probe path wetness. Water flood/dry remains available. Resistance responds to local path coverage rather than any wet patch. Coarse fictional model; not fluid dynamics.
- Seven independent specimen snapshots retain damage, zones, moisture, probe locations, failure flags and physical fragments across switching and browser storage reload; replace resets only the selected specimen. Simultaneous multi-object experiments still outstanding. Inactive slots are paused.
- Added optional intact/crushed authored can rendering via vendored Three.js r180/glTF. Original artwork retained by default. Adjusted contact footprint for rendered can dimensions, probe tip/cable alignment, moisture visualization, and inspector can outline. Final alignment patch syntax checked; visual fit not verified.
- Actual V6 logic executed under a DOM shim with Matter 0.20.0: seven default contacts conductive; rubber dry/isolated patch/full wet simulated current 0.03162/0.03221/3.15926; disconnection zero; bulb opens; 31 finite fragments; rack switching and mocked storage reload retain destroyed state/fragments; clear leaves three static boundaries; replace restores original HP. Tests performed before final rendering alignment patch. No actual browser raster/audio/touch or hosted storage test. Local DNS unavailable and Pages URL could not be opened by web retrieval. V3 remains default; V6 separate preview.
