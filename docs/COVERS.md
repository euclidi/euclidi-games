# Catalog cover standard

All listed games require exactly one real cover image: a screenshot from the current playable release, or simplified stylized box art explicitly approved by the owner. Screenshots are the default. Text-only title panels, mock gameplay, invented screenshots, loading/menu/error screens and unrelated stock art do not satisfy the requirement. An approved box-art cover must represent actual models and environments, not imply features that do not exist.

## Format and placement

- Use the current primary Play link as the capture source. Capture a representative rendered game view, not the browser chrome or the catalog. Preserve its actual colors and proportions.
- Use a local WebP cover in `covers/`, ideally 800×500 (16:10). Letterbox other aspect ratios against #111111. Do not stretch or obscure gameplay with catalog typography.
- Cover link opens the same current release as Play; keep the game title and documentation in the existing information section. Provide descriptive alt text.
- Keep provenance in `covers/manifest.json`: card identity, kind, local file, matching launch route, SHA-256, and capture commit/viewport/selector or explicit owner approval for stylized art.
- Preserve approved box art until the owner asks for a replacement. Do not recolor game artwork to match the grayscale site UI.
- Every new card must have a cover and manifest record before release; add a browser capture recipe to `tools/capture-covers.mjs` or supply approved box art.

## Capture and validation

The GitHub Actions workflow captures actual browser frames using game-specific public controls and readiness checks, checks for exceptions, rejects small/nearly blank images, generates aspect-preserving WebP images, commits successful covers and requests a build using the existing branch Pages configuration. Failed captures are reported and are never represented as completed screenshots. It does not certify subjective art quality; review the actual frames and recapture unrepresentative ones.

Run `python tools/publish-covers.py --check` (Pillow required) for strict cover validation. Use the workflow manual refresh input for a new screenshot pass; existing approved box art is skipped. Capture failures leave the previous card intact and cause strict audit failure, not a fabricated image.

Initial migration: 12 current catalog cards identified. The browser capture workflow must complete before the migration is certified. No artwork or game files are changed by the migration.
