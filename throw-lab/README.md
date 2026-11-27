# Throw Lab
A first-person-style, compact indoor throwing sandbox. Seven selectable balls, three target configurations, and five release techniques are preserved from the original V11 scene.
 
## Controls
- Choose a target, ball and shot type at the bottom.
- Spin/flick: touch the ball, circle to build spin, then flick upward. Aim sideways to compensate for curve.
- Drag: drag upward and release; distance and direction affect the release.
- Jump: hold to gather, drag to adjust aim, release near 750 ms.
- Lob: drag upward for an elevated throw.
- Bank: aim for the backboard; timing and approach remain approximate.
- Camera, lighting, audio and reset are independent controls. The top link returns to the catalog.

## Architecture
Three.js r152.2 (CDN fallback), WebGL, 240 Hz specialized sphere/rigid-contact and deformable-net solver. Original single-file implementation is kept intact under legacy/; V12 extends it rather than replacing it. The ball mass, radius, restitution, drag and inertia are separate parameters. Five fictional ball models use estimated properties.

## Verification
See STATUS.md for what has and has not been tested. This is a development preview, not a claim of calibrated physical realism. The CDN and WebGL are required.
