# SNAKE — LCD Organic

Version 0.1, experimental compatibility build. [Play](https://euclidi.github.io/euclidi-games/snake/).

Classic grid Snake and continuous organic hunting/survival share a monochrome dot-matrix display. Custom games mix movement, prey, environment and growth. Prey flees, the snake grows, and hunger affects survival. Original indexed pixel masks, procedural body rasterization and synthesized audio; no third-party assets.

Controls: arrows/WASD, on-screen D-pad/joystick/swipe, standard gamepad stick/D-pad, Start/A to start/pause, P/Space/Escape to pause. Settings in menu. Survival save is automatic on intervals, pause and page hide; resume from menu. High scores are local per mode.

Run from repository root with `python3 -m http.server 8000` and visit /snake/. WebGL 2 required; no external runtime dependencies. Service worker caches game assets after a successful HTTPS load. This is a compatibility implementation, not the approved PixiJS/TypeScript build.

[Specification](SPEC.md) · [Roadmap](ROADMAP.md) · [Status](STATUS.md)
