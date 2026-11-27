# Status — 0.1.1 startup repair

User reported every menu button inert in 0.1. Source inspection identified a reserved GLSL identifier, `active`, in the fragment shader, which could abort startup before event registration. Renamed to `pixelMask`; shader/link/context initialization now falls back to presenting the existing indexed bitmap buffer through a software LCD renderer. Settings and menu remain available even if neither graphics context can initialize. Audio initialization failures no longer abort start. Versioned resource URLs and offline cache updated.

Local full-browser verification unavailable (Chromium graphics initialization failed in the execution environment); the updated CI tests exercise both GPU and deliberately disabled WebGL paths. Do not claim live deployment or successful browser playtest without results.

# Status — 0.1 experimental compatibility build

Date: 2026-11-26. Implemented source: classic grid with queued turns, growth, scoring and collisions; continuous steering, trail-based body sampling and distance projection, self and obstacle collisions, hunger/health, growth and digestion bulges, three prey masks with flee/wander logic, four environments, custom modes/settings, palettes and WebGL2 LCD shader, keyboard/touch/gamepad input, local storage save/resume, sound tones, offline worker. Original indexed bitmap masks and procedural rasterization; not reviewed in a live browser yet.

Evidence: direct simulation assertions passed for spawn, eating/growth, reverse guard, turn, save state, wall collision, organic traversal and finite body positions. Browser workflow added; no passing browser run or verified Pages deployment at commit time. Gamepad hardware, mobile performance, offline behavior and visual fidelity unverified.

Unfinished: approved TypeScript/Vite/PixiJS/XPBD/mesh/IndexedDB stack; direct JS/WebGL2 implementation is provisional. No anisotropic physical friction, full swept collision/spatial hash, independent jaw animation, accurate shelter occupancy, licensed organic ambient/music assets, remapping, interface scaling, or validated 60 FPS. Classic biological growth is not gradual; wrapping organic body continuity is experimental. Species and art are simplified. No approved custom cover artwork. Next: browser validation and implementation of approved stack/fidelity requirements.
