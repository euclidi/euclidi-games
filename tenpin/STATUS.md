# TENPIN 0.2.0 — development preview

Implemented in source: swipe velocity, angle and curvature; ten-frame scoring; cannon-es rigid bodies, compound pin colliders, ball and gutter detection; deadwood removal and rack resets; three cameras; synthesized collision audio; standard Gamepad API and keyboard controls; local best score; responsive UI.

Validated: seven pure-logic checks (perfect game, open frames, all spares, unresolved strike, fast vs slow swipe, swipe direction and invalid gesture); module syntax parsed successfully. No browser execution, actual collision result, device input, FPS, screenshots or audio playback verified in this pass. CDN modules not loaded locally because network access is unavailable in the execution container.

Approximations: simplified oil forces, compound cylinder pin colliders, re-spot standing pins between balls, synthesized sounds, custom procedural wood and geometry, fixed static scenery, no mechanical pinsetter animation. Original sprite stacking replaced with lathed cross-sections rendered in 3D; external asset candidates researched but not integrated. No full match resume, only high score persistence. Standard gamepad support is untested, raw DirectInput not guaranteed.

Asset candidates: https://opengameart.org/content/bowling-pin (CC0 candidate); https://3dassets.dev/packs/bowling-alley-and-pool-hall (CC0 claimed by publisher; source not downloaded or audited).