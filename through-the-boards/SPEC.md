# Through the Boards — scope baseline

## Locked premise
One sparse carpeted bedroom, floor mattress and pillow/blanket, retro CRT computer and desk, messy anchored cables, wooden chair. Hallway door and all windows boarded. No explanation, escape plot, supernatural threat, additional rooms or mandatory objective. Time, light through gaps, rain and distant birds imply life outside.

## Functional scope
- Isometric bitmap sprite stacks, correct depth/occlusion, consistent proportions and material appearance.
- Independently customizable gender identity (including nonbinary), pronouns, androgynous body shapes, complexion, hairstyles, clothing; animated walking, sitting, lying face-up with visible neck, head support and hand contact.
- Tap/keyboard navigation, touch dragging, stable collision. Persistent chair tucking/pullout, mattress displacement/compression, pillow compression, blanket coverage/folds, anchored independent cables, realistic weight and friction.
- Time/weather-dependent sun and sky transmission through board gaps, obstruction, material-dependent indirect illumination, CRT light; directional ambient sound, rain, birds, footsteps and room acoustics.
- Offline ROOM/OS with staged BIOS, startup logo/loading, login, clock and journal. Retain computer session and room state.
- Local saves, checksums, backup recovery, portable snapshots, mobile responsiveness and performance.

## Technical constraints
Canonical simulation language C99; existing C-derived WASM is preserved as a binary reference while editable source is missing. Browser JavaScript handles rendering, UI and Web Audio. Recover source or build an explicitly identified compatible reconstruction against differential tests; never replace working binary with an unverified partial rewrite. Reuse mature appropriately licensed libraries/assets when compatible; record provenance, license, scale and performance. Do not introduce generic primitive visual placeholders.

## Acceptance
Preserve existing behavior and saves, test actual mobile/desktop inputs, representative physical interactions, visual alignment, time/weather, audio, ROOM/OS and save migration. Record evidence and limitations. Publish tested development builds to Euclidi Games GitHub Pages, retain rollback checkpoints, and verify deployed URL separately from local tests. Internal milestones are not mandatory approval gates; deliver the complete feasible scope before iterative refinements. No new cover art without direction.