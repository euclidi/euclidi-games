# Euclidi Games — repository development rules

These rules apply to all current and future projects in this repository and every contributing agent or harness. Follow narrower project instructions and explicit user decisions first; never infer approval of a changed scope.

## Mandatory project records

Every game directory with an entry index.html, including separately listed release directories, MUST have a substantive README.md, SPEC.md, ROADMAP.md and STATUS.md before first publication. Read them before editing. Create them at project inception, keep them current in the same change as relevant implementation, and link them from the root documentation index and public catalog. Use [templates](docs/templates/) and the [documentation standard](docs/PROJECT_DOCUMENTATION.md). Do not let a roadmap masquerade as implemented functionality. Preserve prior approved specifications and version history.

## Project workflow

- Establish requirements, visual direction, scope and strongest feasible project-specific stack. Evaluate mature reusable engines/assets first. Obtain approval for consequential architectural choices; do not silently substitute low-fidelity fallbacks.
- Once scope and stack are agreed, implement the complete agreed experience to the maximum feasible extent, then iterate through playtesting. Internal milestones are not approval gates unless explicitly requested (e.g. Dojo X Stage 1). Honor those gates.
- Use authentic, original or properly licensed assets; record provenance, inspect visual alignment, texture quality, contact and animation. Do not publish new cover art without owner approval.
- Maintain real gameplay, controls, audio, saves and performance checks as relevant; don't replace a game with a reduced demo. Do not touch unrelated projects, erase archives, or restore delisted games without approval.
- Run project tests and catalog checks; report actual tested, static-inspected, and unverified features separately. Save failures and corrective evidence. Add project-specific browser smoke coverage for each new launch path; do not claim all games were tested when a check omits one.
- After playtesting, use the existing GitHub Pages catalog at https://euclidi.github.io/euclidi-games/ unless explicitly instructed otherwise. Keep launch routes, public documentation links, version labels and source records consistent; verify deployed version separately from Git commit. Never allow one project workflow to replace the whole site.
- Do not claim future work was completed or a deployment is live until evidence exists. Record blockers and decisions in STATUS.md.

Catalog interface palette: use neutral grayscale for shared backgrounds, panels, borders, text, buttons, focus states and browser theme colors (equal RGB channels). Preserve approved logo assets and project-specific cover art/accents. Do not reintroduce an olive or other color cast into the shared interface without owner approval.

Catalog typography: owner selected Sinistre by Jules Durand / Collletttivo. Owner found all-Sinistre typography too extreme. Use the locally hosted original Sinistre variable WOFF2 at regular weight only for primary catalog headings and game titles; use neutral system sans-serif for brand labels, navigation, body copy, metadata, controls, documentation links and boot text. Preserve logo artwork, project assets and game-specific interfaces. Retain the original SIL OFL license beside the font and do not substitute another face without approval.

Catalog cover requirement: every current and future listed game MUST have a genuine gameplay screenshot from its primary playable release or owner-approved simplified stylized box art. No text-only placeholders, mock screenshots, unrelated stock art, or fabricated gameplay. Follow [docs/COVERS.md](docs/COVERS.md); maintain the local cover file and provenance in covers/manifest.json, and pass the strict cover audit before release. Gameplay screenshots are authorized by the owner's standing instruction; original stylized box art still requires approval before publication.
