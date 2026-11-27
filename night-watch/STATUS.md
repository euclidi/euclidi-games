# Night Watch — Status

Version 0.1.0. Split from PAC-MAN into an independent top-level project. The existing mission, rendering and game logic were preserved. Perspective helpers now live locally. Previous checks: connected map, pickups, reload, extraction and 3,600 simulation ticks; 90 mocked runtime frames. Real-device appearance, sound and control quality remain unverified. Standalone browser smoke test added to catalog CI. Previous path removed; use the new catalog entry.


## 0.2.0 graphics overhaul candidate
Original material atlas, fixture light field, floor/ceiling mapping, 640×400 render buffer, new weapon rasters, fallen-sentry art and HUD styling implemented. Combat simulation and map unchanged. Existing actor and pickup sprite bases retained. This candidate requires browser playtesting, visual inspection, real-device performance/control checks and deployed-version confirmation; no claim of passing those checks yet. Art is original code-authored raster work; no third-party assets. No cover change.
