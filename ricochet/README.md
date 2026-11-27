# RICOCHET
Original retro peg-clearing arcade game. [Play](https://euclidi.github.io/euclidi-games/ricochet/) · [Catalog](https://euclidi.github.io/euclidi-games/)

Development 0.2; source implementation, not a verified complete release. Aim with mouse or drag, Fire or Space to launch. Clear orange pegs; use the moving bucket to recover ammunition. Eight modes, five themes, 50 algorithmically composed campaign boards, local progression and JSON editor. Gamepad support uses the browser Gamepad API.

PixiJS 8.17.1 and Rapier 2D compat 0.17.1 are pinned CDN ES modules; WebGL and network access required. Original runtime bitmap textures and original synthesized audio, no commercial art or music copied. Run a static HTTP server at repository root to develop. Run `node ricochet/test.mjs` for content checks. See SPEC, ROADMAP and STATUS for approved scope and gaps.

Visual revision 0.2: redesigned cabinet UI, five unique raster scenery recipes, faceted jewel pegs, cannon, catcher, sparks and hit feedback. Runtime bitmap generation uses a small offscreen 2D rasterizer; gameplay rendering remains PixiJS/WebGL.
