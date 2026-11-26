# DUMMY LAB — Git reconstruction W1.7
Self-contained Three.js / Rapier WASM / Vite browser project, reconstructed from the earlier DUMMY LAB revisions and W1.7 R3 design/patch. This is not a byte-exact export of the deployed W1.6.1 (Vercel source retrieval truncates several files). No automatic promotion or deployment was performed. Keep the existing production version until this branch's build and browser testing pass.

## Run
Node 22 recommended. From this directory: npm install, npm test, npm run build, npm run dev. Vercel root directory: dummy-lab; output: dist; framework: Vite.

## Included
28 action entries, autonomous action selection, proximity/noise response, planted step targets, IK legs and arms, widened palms and 14 articulated phalanges per hand, gesture contact targets calculated from geometry, observer spawn behind glass, human lab-coat counterpart, first-person bob/sway, free camera, toggleable headlamp, static empty grey test bay and furnished carpeted observation room, monitors, chairs, tables, vending machine, closed door, shadows, slow motion, mobile controls and session logging.

## Limitations
This is a reconstructed implementation, not verified feature parity. The dummy remains kinematic; Rapier is used for environment colliders, not powered balancing or physical falling. Handstands, glass knocks and push-ups are animated IK previews and visual/physical contact is not certified. Avoid-prop is a retreat preview; chamber intentionally contains no props. Player footsteps are procedural, furnishings are static and procedurally authored; no arrow gameplay. Browser execution, performance, texture fidelity and full action completion have not been verified. Unit tests are mathematical checks, not rendered or physical validation.
