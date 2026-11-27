# Development 0.2 status

Wall fixtures now render before the foreground miners, with illumination in a separate pass. Replaced the original tiny sprite masks with original layered pixel-cluster artwork for distinct heads, clothing, boots, arms, hand tools, a minecart and a wheelbarrow, wall fixtures, supports and debris. The new art is an interim hand-authored bitmap set, not the finished high-resolution art direction; rails and geological textures are still procedurally drawn. Limb animation uses sprite-part rotation and distance-driven gait, not validated foot-contact or motion capture. Core simulation unchanged. Earlier 600-second model test passed. Visual quality, browser performance, and deployment of this revision are not yet verified. No third-party assets were incorporated and no cover art was changed.


## Development 0.3 — rendering revision
- Actor alpha masks participate in light ray intersections; foreground actors are composited separately from wall lights.
- Updated helmet, workwear, boots, torch and track bitmap clusters; material wear and rock strata shading revised.
- Core unchanged. Syntax checked and a deterministic 180-second core run completed (2,439 excavated cells, 224 credits, six supports). Browser visual verification and deployed Pages verification are still pending.
