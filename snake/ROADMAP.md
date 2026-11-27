# Roadmap

1. Verify Pages launch, desktop/mobile gameplay, input, save/resume, and visual quality. Record evidence and failures; do not certify untested controls.
2. Bundle approved TypeScript/Vite/PixiJS renderer and migrate body rendering to continuous textured mesh without losing gameplay. Build original reviewed bitmap atlases (prey, habitats, snake anatomy), independent jaw/swallow motion and multiple species. Improve terrain composition.
3. Replace arc-length guide/projection with validated specialized XPBD, anisotropic friction, broadphase and swept collision. Test stability, body-obstacle contact, wrap seams, long bodies, prey shelter behaviors and biological growth in both modes.
4. Improve audio with organic samples/ambient beds and independent profile/music controls, remapping, IndexedDB and accessibility scaling, offline tests. Validate 120 Hz physics and desktop/mobile 60+ FPS.
5. Complete scope acceptance against SPEC.md; iterate from playtesting. No automatic approval gates.
