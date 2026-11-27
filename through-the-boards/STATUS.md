# Build 0.16 — asset-first correction

Vendored CC0 recorded indoor rainfall from PhilllChabbb via Aurora Viewer; the existing spatial rain chain switches to the recording after successful decoding and retains procedural fallback. Repository readback confirms exact upstream asset bytes, unchanged WASM and valid JS syntax. Audible playback and hosted runtime remain unverified. See [ASSETS.md](ASSETS.md).

---

# Through the Boards — status (2026-11-27)

**Lifecycle:** Active development, build 0.15 browser preview. Original editable C99 source not recovered. No native compile or new engine physics claimed.

## Verified this pass
- Recovered v0.14.1 browser checkpoint; compiled WASM identical to v0.15, SHA-256 7274bf858095a736be49742431d29af3e72e83960e90ea70574f92568726c9a0.
- Node engine tests: 57 exports, no imports, five interaction routes, BIOS/login, UTF-8 journal, 120-field physical snapshot and independent engine state restore, day rollover.
- Headless Chromium 430 x 850 touch viewport with actual touchscreen tap: movement, portable snapshot export, invalid input rejected without mutation, valid import, restoration in a second page, audio initialization, no page errors.
- Snapshot import validates current state/physics versions and options in an isolated WebAssembly instance before replacing the active one. Existing legacy local-save loading unchanged.

## Limitations
Direct browser navigation to local test URL returned ERR_BLOCKED_BY_ADMINISTRATOR; tests used injected HTML instead. Browser-restart persistence and hosted rendering/audio are unverified. Sound initialization is not an audible-quality test. No original C source or native compilation. Cloth, light and acoustics are approximations; prior features retained in binary, not all independently retested this pass.

## Baseline
`index.html` is the current browser preview, including the immutable compiled simulation. `legacy/preview-v0.14.1.html` is the pre-transfer rollback. `regression-v15.cjs` validates the compiled engine contract. Future source reconstruction must occur separately and pass parity tests before replacement.