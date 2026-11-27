# Candy Land Sewer — The Candy Underworks

Version 0.6.0 — development preview, not visually validated.

A cel-shaded first-person exploration simulation inside a confectionery sewer. Explore the Strawberry Trunk and four machinery rooms, cross three canal bridges, collect four samples, and operate the waffle sluice. There is no combat or imposed story.

[Open browser preview](https://euclidi.github.io/euclidi-games/candy-land-sewer/?v=0.6.0)

## Controls
Click the scene to focus. WASD/arrows move, Shift runs, drag to look, E interacts, F operates the sluice, V cycles viewpoints. Touch joystick and context interaction button are provided. A browser-exposed controller supports left/right sticks, standard or raw/custom axes, calibration and dead zone. DirectInput hardware compatibility is not certified. Sound is optional. Settings, sample collection and gate state are saved locally.

## Technology and assets
Three.js r161 (MIT), pinned CDN module with alternate CDN fallback; WebGL renderer, native toon materials and nearest-filtered scalar gradient. Custom procedural meshes and textures from the complete v5 scene, not third-party asset downloads. Kenney CC0 candy art is 2D and generic low-poly platformer kit was not suitable for machinery fidelity. No external art imported. No claim of fully eliminating primitive-looking geometry.

See SPEC.md, ROADMAP.md and STATUS.md for scope and outstanding validation.
