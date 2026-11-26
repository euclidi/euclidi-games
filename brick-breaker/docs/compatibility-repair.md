# Stage 1 compatibility repair — 2026-11-26

Run 45908170816 Windows graphics compiled upstream libraries but failed compiling runtime_probe.cpp: PlatformData.nwh and Init.resolution are absent, reset no longer takes width,height,flags. The pinned bgfx uses newer swap-chain APIs. Adapted to Init.swapChain, Init.reset, reset(flags,&swapChain), TextureRegion blit and read, based on upstream API declarations. Removed legacy texture blit/readback capability checks in favor of texture flag validation. No change of renderer or dependency pin. Exact pinned header could not be inspected remotely; build is the verification. The new code has not yet compiled or executed.

Run 45908389980 geometry job passed all eight Clipper2 tests (partition, conservation, disjointness, union, hole, sliver, concave separation, outside clip) and eight core checks. Windows and Linux physics jobs again passed. https://github.com/euclidi/euclidi-games/actions/runs/45908389980

Audio: the Kenney URL returned HTML (14794 bytes) on three attempts. Selected an alternative CC0 candidate by rubberduck, 75 breaking/falling/hit sounds, published at https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx. Its archive filename is sfx_breaking_and_falling.zip; direct URL is a candidate, unverified until intake runs. It includes material-specific wood, stone, glass and metal sounds per publisher. Not yet acquired or auditioned. Existing industrial assets remain reference only.

Stage 1 remains open; no production scene, playable build, or target-GPU validation yet.
