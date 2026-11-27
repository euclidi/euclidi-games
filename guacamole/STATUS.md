# Guacamole R3.0 — verification record

**Status:** development preview committed to main; not a certified release. User approved Retro CGI, adaptive 1280px and adjustable orthographic camera on 2026-11-27.

## Verified in this development session
- Fourteen original Kenney Food Kit GLB files sourced from Hidencod/tge-assets. Header magic, glTF version, declared byte length and mesh presence checked for every model. CC0 provenance stored with asset bundles; the individual model visual fit is not verified.
- Three.js r160, GLTFLoader, BufferGeometryUtils and an inline-WASM Rapier compatibility module vendored in repository; license files included. Rapier exact version and initialization remain unverified.
- Committed engine loaded from GitHub and its fifteen regression checks executed successfully: finite cutting, mass conservation, pit gating, both halves emptied, localized compression, texture, all five ingredient identities, actual fold displacement, finite lime/salt, conservation during mixing, empty bowl after serving 408 modeled grams, and save roundtrip.
- Game, engine and test source parsed successfully. Browser integration is not yet exercised.
- Desktop full-recipe pointer regression and mobile touch smoke test written; dedicated GitHub Actions workflow committed. No successful workflow run observed in this session.

## Implemented but not runtime verified
Persistent countertop, rendering, adjustable orthographic camera, responsive controls, keyboard/gamepad cursor, tool motions, pause, local save, guide/free mode, Three.js GLB loading, Rapier rigid bodies for counter and board fragments.

## Approximations and outstanding scope
- Reduced-order parcel solver; no continuous paste heightfield, real blade/utensil 3D swept collision, cohesive paste adhesion, or physically accurate lifting/folding. Cut geometry is planar polygon extrusion; avocado opening/pitting is an explicit two-action state transition.
- Pepper model substitutes for jalapeno; recolored lemon model substitutes for lime; cooking fork substitutes for masher; custom cilantro, exposed shell, chips and deforming food geometry are provisional. Models were acquired, not fully art-directed/baked/visually benchmarked. Retro CGI lighting is preliminary.
- Generated contact audio rather than licensed recordings. No finished plate scoring or physically independent chip consumption. No calibrated gram/volume measurements or real recipe chemistry.
- JavaScript ES modules with pinned vendor files instead of completed TypeScript/Vite build; exact Rapier version needs confirmation.
- Mobile frame rate, WebGL visuals, touch, DInput/gamepad mapping, persistence in real browser, collider quality, camera alignment and complete user-input playthrough not verified. No gameplay cover generated.
- Local package/network access blocked; GitHub connector used to source and commit assets and code. Pages preview URL could not be confirmed. Catalog has intentionally not been modified pending browser acceptance and genuine gameplay capture.

Preview target: https://euclidi.github.io/euclidi-games/guacamole/preview.html
Source: https://github.com/euclidi/euclidi-games/tree/main/guacamole
CI: https://github.com/euclidi/euclidi-games/actions/workflows/guacamole-browser-check.yml
