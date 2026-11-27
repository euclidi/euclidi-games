# Night Watch — Specification

Standalone browser game with a local 480×300 raycast renderer and fixed-step simulation. One 19×15 connected compound, eight hooded soldiers, pistol, scattergun and repeater, pickups, health, armor, ammo, keycard, extraction and pause/restart. Original pixel-cluster art and synthesized audio. Desktop, touch and standard gamepad inputs. No PAC-MAN imports or menu links. Acceptance: valid connected map, actor collision, weapon/reload/pickup behavior, win/loss, browser startup and responsive controls.


## Graphics revision 0.2.0
Retain simulation, map, controls and local software raycaster. Increase native render resolution to 640×400, use original 128px surface atlases with world-space occluded fixture lighting and distance attenuation, detailed distinct first-person weapon raster sprites, dedicated fallen-sentry sprites, and an industrial HUD. No external art dependencies. Existing enemy and pickup sprites remain the basis of the revision.


## Graphics revision 0.3.0
Replace generic procedural wall and floor art with locally vendored authored raster textures; give each existing compound wing a distinct surface palette. Use authored first-person weapon and pickup sprites, retain hooded sentry sprites and combat behavior. No third-party runtime requests. Preserve original geometry and physics. See asset license and sources.
