# Dracula — The Vigil
Atmospheric Gothic crypt simulation with a sole autonomous rat priest. Version 0.13.1 asset-first migration candidate from cumulative V11. [Candidate route](https://euclidi.github.io/euclidi-games/draculas-crypt/) (Pages unverified; not catalog-listed). Controls: drag orbit, scroll/pinch zoom, five views, pause, follow, flames, mist, sound, browser gamepad left stick/right Y/shoulders. Run from repository root with python3 -m http.server 8765; visit /draculas-crypt/. Three.js r160 (0.160.0) vendored MIT module, with pinned 0.160.1 CDN fallbacks; ?renderer=software selects labeled compatibility view. [Spec](SPEC.md) · [Roadmap](ROADMAP.md) · [Status](STATUS.md).

[Asset sources and acquisition](ASSETS.md). Powered by [Poly Haven](https://polyhaven.com/). Real surface scans load from local files when available; append `?assets=procedural` for baseline comparison.

Six real PBR JPEG maps (stone and timber) are committed locally. Linen maps remain pending. Runtime status is exposed via `data-asset-state` and `data-asset-families` on the scene root.
