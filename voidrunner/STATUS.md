# VOIDRUNNER — Current status
2026-11-27 — v0.24.0 development migration candidate, source preserved from v23. Deployed revision is not yet confirmed. No independent reviewer capability was available; second-pass review performed by implementer.

## Implemented and changed
Retains Earth flight, reentry, walking, swimming/dive, five environmental powers, four personality/launch/suit choices, optional vehicle, remappable controller and profile. Recovered the earlier 2048x1024 Earth map and resized to 512x256 (WebP, nearest sampling in CPU and GPU); previous atlas 256x128. New fixed 1/120-second simulation step with bounded catchup, sampled adaptive quality, true first-person camera when body view disabled, water-entry momentum transfer and stronger swimming ascent, pause, focus/visibility input release, GPU context-loss fallback path, explicit world save/load, catalog return anchor. v23 archived under legacy/.

## Acceptance evidence
- PASS — extracted inline script: node --check.
- PASS — Chromium page.set_content of exact candidate, desktop 900x700 and 390x740, forced CPU. Map startup, ground walking, takeoff, dive, cryokinesis ice creation, reentry plasma, pause and camera toggle, no page errors. Initial recorded render rates approximately 55 FPS on headless CPU at low quality (not device guarantee).
- PASS — final source follow-up in Chromium 1280x800, 390x740 and 740x390: movement after buttons, pause, save state round-trip with mocked localStorage, no JS errors. Main viewport no horizontal document overflow; landscape internal content extends 24px, so viewport acceptance PARTIAL. Actual storage across page reload NOT TESTED.
- PASS — actual 1280x800 orbit gameplay screenshot, high CPU quality, captured scene 1038x585, nearest resize and letterbox to 800x500; no generated art.
- PARTIAL — manual still-frame inspection: orbit geography visible, but humanoid and surface geometry remain visibly rudimentary. No independent motion/feel certification.
- BLOCKED — attempts to load file:// and synthetic HTTP URL were blocked by browser administrator; local HTML rendered via set_content instead. Chromium SwiftShader request returned Canvas2D, real GPU not tested. Container could not resolve GitHub via git; authorized GitHub connector used. Physical controller, actual mobile hardware, full solar/laser/storm/vehicle regression in v0.24.0, real storage and live Pages are NOT TESTED. CI smoke added to check real origin and these paths.
- MISSING — multi-body navigation, accurate lunar/planet surfaces, real orbital transitions, dynamic ocean geometry, complete terrain LOD, real animated 3D humanoid, persistent destruction, richer interactions, full environmental audio. Earth-only code is not full original scope.

## Next
Restore multi-body data and continuous navigation, validate GPU, replace body and environment placeholders with audited assets and preserve all cumulative mechanics. No unrelated games changed.

## Catalog registration
Source commit: 45fbc3a0f1e0775badd0ec0fb98373c225595f83. Actual captured cover is registered in covers/manifest.json, with matching public route and a capture recipe. Candidate is labeled Earth development build, not complete multi-world release. Pages publication and hosted runtime still unconfirmed at commit time.

## 0.25.0-asset — candidate branch (not published)
Imported actual Earth/Moon/Mars/Jupiter raster maps and Earth cloud coverage, with identical source Git hashes. CPU sampling uses actual map dimensions; GPU uploads use nearest-neighbor and replace prior textures. Body registry uses mean radius and approximate gravity/atmosphere. Profile survey selection uses explicit instantaneous local-frame changes, with per-body session state, Earth-only water/weather/vehicle, dry solid surfaces on Moon/Mars and no solid Jupiter surface. Jupiter reference pressure boundary triggers recovery; not a realistic gas giant descent. New per-body save keys retain legacy Earth save. Multi-body interplanetary flight still absent; no real topography or character rig yet. Browser smoke for actual asset loads, dry worlds, Earth restoration and both renderer paths added but not yet executed. This branch intentionally remains separate from main until runtime and screenshots are reviewed. See ASSETS.md.
