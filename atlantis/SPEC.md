# Atlantis — scope record / migration R1
2026-11-27. Recovered from the existing user-directed scene requirements; no scope expansion or replacement game approved. Three.js is the established rendering stack. Historical inspiration is fictional classical maritime architecture, not archaeological reconstruction.

## Experience and acceptance
| ID | Requirement | Acceptance |
|---|---|---|
| A01 | Monumental explorable underwater city | Sanctuary, distinct districts, residences, towers, roads/causeways, reefs and prior landmarks preserved from newest source; meaningful vistas at both scales |
| A02 | Crafted geometry | Beveled/faceted stone art and architectural details, consistent supports, roof seams, grounded foundations, no obvious overlaps or floating pieces; rendered close-ups |
| A03 | Convincing ocean | Coherent depth/color absorption, animated caustics, volumetric shafts, surface and particulate movement, dynamic local lights; inspect rendered frames at multiple depths |
| A04 | Default observation | Orbit/zoom by mouse, touch and compatible controller; stable bounds and framing |
| A05 | Optional first-person swim | Pitch-aware six-directional movement, acceleration/drag and buoyancy, collision sliding, continuous camera transitions; gentle bob, no forced roll; reduce-motion option |
| A06 | Input | Keyboard/mouse, multitouch, standard and raw browser gamepad mappings, deadzones, reconnect/focus neutral gating; test virtual and physical input separately |
| A07 | Ecology/audio | Moving fish, rays, coral/kelp, marine snow/bubbles and optional ambient sound; anatomy/animation quality and no obvious alignment defects |
| A08 | Hidden discoveries | Preserve original pop-culture content, unobstructed inspect/proximity/tap, no spoilers or visible checklist, persistent unlocks and bubble-fading notifications; reduced-motion alternative |
| A09 | Interface/runtime | Responsive restrained HUD, working settings, adaptive resolution, water fallback and recovery, accessible back-to-catalog anchor |
| A10 | Delivery | Complete-first implementation, source and licensed asset records, automated tests, visual inspection, public version/route verification, genuine gameplay cover |

## Stack decisions
Preserve Three.js, WebGL, browser Gamepad API and Web Audio. Existing reference uses Three.js 0.163.0; keep pinned until recovered source and compatibility are audited. Mature reusable assets and collision/rendering libraries should be evaluated against the actual source before replacing custom systems. Prefer locally served dependencies and appropriate licensed architecture/reef assets with provenance; no arbitrary engine migration. New dependencies, art changes and architecture choices that materially alter scope need approval. No unrelated catalog edits, no Vercel, no simplified replacement scene.

## Quality gates
A source-preservation gate precedes modifications. A release must load through the actual Pages base path without initialization exceptions, pass input and discovery regression tests, and have rendered evidence of visual quality, frame pacing and usable mobile controls. Physical controller support is not certified by simulated inputs. Cover from real gameplay only or separately approved art. No hidden artifacts named in public docs.
