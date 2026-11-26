# Stage 1 validation follow-up

The first GitHub commit returned no workflow runs or status checks via the available connector. This is not a build failure or proof that Actions is disabled. The workflow now explicitly handles pull requests and runs core, Box2D-only, Windows graphics, and asset intake as separate jobs. The Windows diagnostic artifact does not establish target GPU compatibility; execute it on a real desktop.

The initial approved dependency pins remain unchanged. The Box2D 3.1.1 API uses surface material fields. The bgfx.cmake pin appears in its published release list.

Asset intake retrieves the two publisher-listed CC0 candidate ZIPs, checks expansion limits and CRCs, records SHA-256 and PNG dimensions, and generates a nearest-neighbor contact sheet for inspection. No production approval or actual acquisition is claimed before a successful run and human visual/audio review.

No gameplay milestone advanced. All new jobs remain unverified until execution evidence is available.
