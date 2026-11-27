# Approved specification — Revision 1.0

Approved 2026-11-26. Complete-first development, no artificial stage gates. Two movement systems: deterministic grid and continuous organic; pellets and autonomous living prey; customizable LCD palettes; arcade and natural habitats; traditional and biological growth; classic arcade and organic survival plus custom mix. High-resolution simulated LCD, adjustable contrast, ghosting, pixel density, inactive cells/backlight. Original/appropriately licensed bitmap assets, continuous textured anatomy, muscular waves, independent head/jaw/tongue, tapered body, swallowing/digestion, directional friction, self/obstacle contact, species/patterns. Grassland, desert, wetlands, arcade; prey wander, flee, shelter. Menu, pause, restart, survival save/resume, scores, difficulty, audio profiles, accessibility, keyboard/touch/gamepad remapping. Offline after load.

Approved stack: TypeScript, Vite, PixiJS v8, WebGL2, GLSL LCD shader, specialized XPBD body solver, textured mesh, spatial hash/swept tests, sprite atlases, Web Audio API, IndexedDB/localStorage, Vitest/Playwright, GitHub Pages. Targets: 480×320 logical LCD, adaptive high DPI, 120 Hz physics, 60–144 FPS desktop, stable 60 mobile, portrait/landscape. Acceptance: independently playable modes, natural movement, consistent anatomy, aligned LCD, autonomous prey, visible digestion, deterministic scoring, functional customization, all inputs, saves, desktop/mobile tests, catalog/version parity and verified Pages. Targets are not certifications.

## Compatibility build 0.1

Direct WebGL2/GLSL pixel presentation and JS simulation supplied as a provisional implementation because local network/package installation was unavailable. No claim of PixiJS or XPBD equivalence. Preserve the approved stack as target; see status for exact deviations.

## Display and handheld amendment (2026-11-27)

Sharper indexed LCD sampling with minimal default persistence; convincing molded handheld chassis, automatic touch/mobile detection, safe-area viewport fitting in portrait and landscape, orientation-driven chassis tilt with permission, neutral calibration and reduced-motion support. Display and control plane remain stationary to preserve clarity and input alignment. Tilt is cosmetic only.
