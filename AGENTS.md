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

Catalog typography: use neutral system sans-serif throughout the Games catalog, including all headings, game titles, navigation, controls and metadata. The owner rejected Sinistre's gothic appearance even when limited to display headings. Do not reintroduce decorative gothic or blackletter fonts without explicit approval. Preserve approved logos, project artwork and game-specific interfaces.

Catalog cover requirement: every current and future listed game MUST have a genuine gameplay screenshot from its primary playable release or owner-approved simplified stylized box art. No text-only placeholders, mock screenshots, unrelated stock art, or fabricated gameplay. Follow [docs/COVERS.md](docs/COVERS.md); maintain the local cover file and provenance in covers/manifest.json, and pass the strict cover audit before release. Gameplay screenshots are authorized by the owner's standing instruction; original stylized box art still requires approval before publication.

Games catalog startup: open directly to the catalog, with no CRT shutter, splash screen, boot animation or replay control. Keep ordinary optional hover and cursor motion separate. Do not reintroduce startup effects without explicit owner approval.

Catalog return navigation: every current and future playable game entry (including archived versions and nested release paths) MUST provide a clearly labeled, keyboard- and touch-accessible real anchor back to the Euclidi Games catalog root. Use the correct relative path, add `data-catalog-return` and `aria-label="Back to game catalog"`, and integrate it into an existing header, menu or control bar without covering gameplay. Never rely only on browser Back or a link to a parent game version. Run `python3 tools/check_catalog_returns.py` before release; the project documentation audit checks it automatically. Do not reinstate archived games in the catalog.
