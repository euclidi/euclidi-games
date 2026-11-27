# Brick Breaker — scope audit, browser edition 0.2

The native Stage 1 branch remains intact: https://github.com/euclidi/euclidi-games/tree/brick-breaker-stage1/brick-breaker . Native C++23 / SDL3 / bgfx / Box2D 3.1.1 / Clipper2 is NOT compiled into this site. Native Box2D and Clipper2 tests previously passed; GPU/runtime integration remains separate and unverified. User asked for a playable GitHub Pages conversion, which authorizes browser gameplay beyond the original native Stage 1-only restriction for this adaptation.

| Approved scope | Browser implementation | Gaps |
|---|---|---|
| 1280x720, 120 Hz | Canvas 2D bitmap rendering, fixed 120 Hz Planck step | Not native GPU pipeline or measured 60 FPS |
| Dense destruction | Physical rigid fragments and detached bricks, capped debris, contact damage, support graph | Simplified rectangular fractures, not Clipper2 or engineering fracture |
| All materials | Brick, stone, wood, glass, metal, sand, water, rubber, explosives, lava, acid, ice | Simplified material properties and cellular rules; not full heat/fluids or GPU compute |
| Hybrid playfield | Fixed arenas and variable room layouts | No continuous scrolling or world traversal |
| Traditional paddle | Mouse, touch, keys; angle controlled by impact offset | No controller input yet |
| Evolution | Damage, extra balls, velocity, resonance, width, extra life | No drills, lasers or advanced projectile ecosystem |
| Hybrid modes | 12-stage campaign, endless, expedition chamber variants | No bosses or exploration map; expedition uses layout rules |
| Balanced incremental | Persistent scrap, paddle width, reserve life and auto-paddle | No offline accumulation or advanced automation |
| Classic failure | Limited lives, restart and retained scrap | Basic balancing |
| Varied aesthetic | Five material palettes and layout themes, procedural bitmap textures | Not the approved high-density authored environment art; no dynamic lighting |
| Precision spectacle | Capped rigid fragments, finite speed and traditional control | Needs playtest balancing |
| Audio | Synthesized impact tones, opt-in | Acquired CC0 sound library is not included; no native audio integration |

Browser dependency: Planck.js 1.5.1, MIT, https://github.com/piqnt/planck.js . Pinned CDN URL with unpkg fallback. No native results are represented as browser benchmarks. Canvas 2D and Planck are an explicit browser adaptation, not silent changes to native architecture. Art is original programmatically authored bitmap textures, not acquired industrial sprites. No user files uploaded. Persistence is localStorage with graceful failure. Browser edition is development build, not completion of native or full approved scope.

## 0.3 redesign: Impact Works
Prior browser smoke test run 45911746267 passed on 0.2. User rejected its presentation and game feel. 0.3 replaces random grids with six authored layout archetypes, identifiable suspended structures, impact rings, polygon rigid-body debris, an aimed launch, increased baseline velocity, wider paddle, controller support and a cohesive industrial workshop UI. Real CC0 source bitmap assets from FacadeGaikan's 64x pack were inspected in native artifact 15158934073; new asset publishing workflow retrieves twelve originals and records attribution/hashes. Browser uses existing procedural fallback until local files exist; new art is not asserted deployed. Glass/stone/etc remain stylized. The environment is still procedurally rasterized, not a fully hand-authored scene. No full thermal solver, scrolling world, native engine, or complete original scope is claimed. Updated smoke test pending.

0.3 audio follow-up: real material-specific source samples selected from the 75-file CC0 archive previously acquired and decoded. The asset publisher now installs original OGG files, and the browser uses randomized decoded recordings for impacts and breaks with a short noise fallback. Actual asset publishing and browser playback are not verified yet.
