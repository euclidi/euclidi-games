# Roman Silhouette Study — asset-first reconstruction

Development branch only; not a release, catalog entry, or a playable replacement of the cumulative study.

## Sources and licensing
- MakeHuman core body: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/3dobjs/base.obj — pinned Git blob d26635e9326e3cca30778fd7b9c00062b03cce09. Its header explicitly releases this asset under CC0.
- Official skeleton: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/rigs/default.mhskel — blob b02cbecae00143856410d7561adf006d83bf9b3e, metadata license CC0.
- Official skin weights: https://github.com/makehumancommunity/makehuman/blob/master/makehuman/data/rigs/default_weights.mhw — blob 66185806afacf87749be8e5cf6dbf66496b2a6b0, metadata license CC0.
- License text: https://creativecommons.org/publicdomain/zero/1.0/
- No MakeHuman program code copied. Reference assets are not an approved final physique or historical garment.

## Baseline and scope
V13 is the newest recovered local HTML checkpoint. A later V17 was referenced previously but is not recovered; do not silently substitute V13 for the canonical baseline. Preserve every recoverable wardrobe, physics, camera, outline, anatomical landmarks, accessibility, mobile input, and fallback-rendering feature. Recover the original specific adult morphology rather than assuming a generic stock male. Audit full-body proportions, real pose/stance, clothing fit, and visual topology before releasing any integrated build. Keep exactly one evaluated body geometry shared by all wardrobe states at each pose.

## Current implementation
- assets/makehuman-body-reference.json: 13,380 connected body vertices, 26,756 triangles, 125 joint-landmark groups; zero boundary, nonmanifold, winding, or degenerate-triangle errors. Body-only geometry excludes OBJ helper and joint-marker surfaces. Coordinates normalized to reference height 1.70 m; actual subject stature unspecified.
- assets/makehuman-rig-reference.json: official 163-bone hierarchy and source skin weights, remapped to the body vertices. All vertices have weights. Full influence lists preserved (up to nine). Derived four-weight attributes provided for compatibility, but top-four truncation loses up to 30% of source influence at some vertices; do not silently use them as an anatomical-quality approximation.
- rig-adapter.mjs: full-influence linear blend skinning in reference axes, inherited quaternion joint rotations, recomputed normals and immutable reference positions. No IK, pose correction, medical validation, garment rigging, or collision solver supplied by this adapter.
- rig-adapter-checks.json: actual JavaScript numerical test using fetched committed body/rig data. Bind-pose deviation < 1e-12 m, exact repeatability, 20 degree left forearm rotation deforms skin, bone length preserved to floating-point precision, finite normals/vertices. No browser rendering or playtesting of the combined app has happened.

## Next implementation requirements
1. Recover latest verified cumulative HTML/source and exact original morphology.
2. Apply appropriately licensed source morphs, create and audit actual grounded full-body poses, validate joints, proportions, silhouette and surface deformation.
3. Fit Roman and modern garments to the same posed mesh; carry forward existing comparison controls and fallback, implement pose-dependent garment collision and constraints. Retain mature asset workflows and license records.
4. Test integrated UI, three identical underlying body states, camera invariance, cloth behavior, mobile performance, and visual quality. Only then merge and add to the Euclidi Games live catalog, verifying the public play link.

No live site changes. Development remains manual, with no recurring pursuit required.


## Manual continuation — articulated stance, fitted proxy and cloth subsystem checkpoint

- Pre-change audit: PRE_POSE_AUDIT.md. Local V13 source and progress reviewed; V17 remains missing. No claim of recovery, final morphology or V13 rollback.
- stance-solver.mjs: real two-link leg IK and hierarchical joint rotations for neutral, broad-base and weight-shift candidates. Foot orientation and lowest body point aligned with ground. Numerical tests on actual body: ankle separation 0.23/0.46/0.30 m, ankle error <= 2e-16 m, bone-length error <= 1.2e-16 m, both lower-foot minima near zero, exact deterministic repetition. Candidate poses are not visually or biomechanically validated; no center-of-mass or individual sole-pressure simulation.
- assets/makehuman-clothing-fit-helpers.json: original CC0 helper tights (2674 vertices) and helper skirt (720 vertices), all vertices weighted by official weights, exact same normalization and pose as body. They are technical fitting proxies, NOT the final T-shirt, jeans or Roman tunic. Official finished clothing paths queried were not available in upstream repository.
- body-collider.mjs: posed triangle BVH, nearest point, ray parity signed distance, projection with bounded narrow-gap fallback. 10,182 helper vertex tests across three poses, one remaining below 3 mm clearance in shifted tights; minimum positive 0.497 mm. Zero final inside points in this test but no cloth-edge/triangle collision, swept contact or self-collision; max individual fit correction 25.34 mm needs visual review.
- cloth-patch.mjs: area-weighted masses, fixed timestep XPBD stretch and opposite-vertex bending constraints, waist anchors, gravity, airflow, damping, body-point projection and deterministic reset. Actual 720-vertex skirt helper simulated 0.1 s per pose. All finite, 59 pinned anchors exact, zero penetrating vertices and projection failures, reset exact. Neutral worst relative edge stretch 216%, wide 18.6%, shift 24.4%; mean 1.17–1.45%. Excess local distortion is NOT acceptable for final clothes, particularly at narrow seams. Short numeric test only. No performance claim, visual QA, final garments or playable app integration.
- Tests recorded in stance-checks.json, body-collider-checks.json, body-collider-clearance-checks.json, cloth-patch-checks.json. Do not publish this technical checkpoint. Next priorities: seam/topology and local constraint quality, long-duration test, genuine garment assets with license and fit, visual retargeting of the intended morphology, preserve the cumulative UI and fallback, test before live catalog merge.
- No schedule created or resumed.
