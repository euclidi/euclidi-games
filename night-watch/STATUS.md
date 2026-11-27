# Night Watch — Status

Version 0.1.0. Split from PAC-MAN into an independent top-level project. The existing mission, rendering and game logic were preserved. Perspective helpers now live locally. Previous checks: connected map, pickups, reload, extraction and 3,600 simulation ticks; 90 mocked runtime frames. Real-device appearance, sound and control quality remain unverified. Standalone browser smoke test added to catalog CI. Previous path removed; use the new catalog entry.


## 0.2.0 graphics overhaul candidate
Original material atlas, fixture light field, floor/ceiling mapping, 640×400 render buffer, new weapon rasters, fallen-sentry art and HUD styling implemented. Combat simulation and map unchanged. Existing actor and pickup sprite bases retained. This candidate requires browser playtesting, visual inspection, real-device performance/control checks and deployed-version confirmation; no claim of passing those checks yet. Art is original code-authored raster work; no third-party assets. No cover change.


## 0.3.0 authored artwork correction
0.2.0 was deployed successfully; the user rejected its visual quality. The four logic/atlas tests passed; the browser smoke test reached gameplay but failed clicking Pause while desktop pointer lock was active. 0.3.0 replaces procedural surface, first-person weapon and pickup art with locally vendored Freedoom v0.13.0 PNGs, groups materials by compound wing, adjusts illumination, hides the map by default and pauses on loss of pointer lock. Corrects the smoke test to use Escape for desktop pause. Original hooded sentry art and pillar atlas remain. The repeater now uses a rotary-weapon raster, a visual-only choice. Browser screenshots, art alignment, real-device performance and the new deployed version are not yet verified. See assets/freedoom/SOURCES.md and LICENSE.adoc.


## 0.4.0 Relay Station
Rebuilt the mission layout and placement; added seven named zones, signed routes, a protected entry room, optional supply rooms and guard detection/reaction pacing. Replaced original enemy sprites in normal authored-art mode with Freedoom masked-soldier frames, enlarged supply art and added scenery. This changes the original hooded uniform to masked armor; all eight directions have idle frames but only four directions have walking frames (some partial). Props are decorative, not collision geometry. Six logic/asset tests authored; CI, full playthrough, screenshots and deployed version remain unverified at commit time. No cover art changes. One mission, not multiple levels.
