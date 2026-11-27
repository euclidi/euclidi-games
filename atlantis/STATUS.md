# Atlantis — status
2026-11-27 | Migration R1 | Not published | No verified release commit.

## Evidence and acceptance audit
Repository recursive main tree inspected: no existing Atlantis route, folder, or assets found before migration. Only locally accessible full checkpoint was Expedition XIII (55,580 bytes, SHA-256 `a4f7e656365dfde75fa143b9edd8761afc589f86ecc7c64b2a287324c93cf22f`). Later conversation records describe L and XCIII, but bytes were not recovered; file search found no match and direct materialization of L failed. Treat later features as claimed historical work, not source-verified. Do not roll back.

| Requirement | Status | Evidence |
|---|---|---|
| Canonical source | BLOCKED | Only XIII accessible; newer checkpoint unavailable |
| A01 city/ecology | NOT TESTED | XIII source contains sanctuary, districts, reefs and marine life; newest completeness unknown |
| A02 geometry | NOT TESTED | Later bevels, roads, foundations, sculptures reported; rendered seams not verified |
| A03 optics | NOT TESTED | XIII contains depth shader and caustics; GPU output unknown |
| A04 observation | NOT TESTED | XIII contains orbit controls; no live execution |
| A05 swimming | NOT TESTED | XIII contains inertia, colliders; actual comfort/collision unknown |
| A06 controls | NOT TESTED | Source contains browser mapping profiles; later neutral gating reported; hardware untested |
| A07 ecology/audio | NOT TESTED | XIII source contains procedural fauna, synth ambience; quality untested |
| A08 discovery | NOT TESTED | Five registrations in XIII; persistence/occlusion reported later but unavailable |
| A09 runtime/UI | NOT TESTED | XIII is an HTML fragment, not standalone release; 27 unique IDs, 40 literal UI refs resolve |
| A10 deployment | BLOCKED | No release, cover or catalog entry; no verified gameplay screenshot |
| XIII JavaScript syntax | PASS | Extract module; node --check /tmp/atlantis-xiii.mjs (exit 0) |

Environment: Node v22.16.0; Chromium 144 installed; network resolution to jsDelivr failed. No WebGL playtest completed this run. Source-level inconsistencies in XIII (surface geometry at y=133 but depth readout uses 420-y; approximate palace collider) require checking against the actual latest source, not blindly patching old code. XIII has no localStorage or later bevel/dynamic-light helpers. No claims about current appearance.

Next priority: recover latest complete source, establish reproducible runtime and perform integrated visual and input repair. No generated or mock cover. The original scheduled pursuit is paused; cadence not changed by this migration.
