# SNAKE — LCD Organic

Version 0.1.6, experimental compatibility build. [Play](https://euclidi.github.io/euclidi-games/snake/).

Classic grid Snake and continuous organic hunting/survival share a monochrome dot-matrix display. Custom games mix movement, prey, environment and growth. Prey flees, the snake grows, and hunger affects survival. Original indexed pixel masks, procedural body rasterization and synthesized audio; no third-party assets.

Controls: arrows/WASD, on-screen D-pad/joystick/swipe, standard gamepad stick/D-pad, Start/A to start/pause, P/Space/Escape to pause. Settings in menu. Survival save is automatic on intervals, pause and page hide; resume from menu. High scores are local per mode. The chassis automatically switches between desktop and mobile portrait/landscape; the LCD maximizes its available 3:2 rectangle. No sensor access or shell tilt. Settings use five tabs and paged controls within the LCD; SETUP pauses the current game and resumes on close.

Run from repository root with `python3 -m http.server 8000` and visit /snake/. WebGL 2 preferred; software LCD fallback available; no external runtime dependencies. Service worker caches game assets after a successful HTTPS load. This is a compatibility implementation, not the approved PixiJS/TypeScript build.

[Specification](SPEC.md) · [Roadmap](ROADMAP.md) · [Status](STATUS.md)

Classic has a segmented model, faint grid, LCD startup and original chiptune loop. Organic uses habitat ambience, distance/pan-dependent prey cues and dynamic grass displacement. Visual settings use a shared-renderer LCD preview with mode switch; audio settings have individual toggles.
