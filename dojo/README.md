# DOJO X — Stage 1D Git reconstruction

Play from the Euclidi Games site at `./dojo/`. No Vercel dependency. The earlier combat build is preserved at `legacy/dojo-ix.html`.

The current static optimizer is a reconstruction of Stage 1D, not a byte-for-byte recovery of the previous hosted build. The bundled MIT p2.js 0.7.1 engine drives 21 rigid bodies and 20 motorized joints at 120 Hz. The seed archive records 17 actual trials, three configurations, and two held-out tests, with 20 Hz motion replays. The baseline repeat produced identical replay samples.

Run `node dojo/tests.cjs` from the repository root for deterministic replay regression.

## Files

- index.html / app.js: replay, ratings, storage, and search controls
- physics.js / optimizer.js: physical controller and worker search
- p2.min.js: local MIT engine
- seed.json: full initial trial archive
- experiments/: previous test results and Git build summary
- legacy/: prior combat simulator

## Development gate

Stage 1 is not approved. No Stage 2 until explicit approval of the physical body controller. Preserve failed experiments; physical fitness is separate from visual ratings. Planar only, self-collision disabled, recovery often fails, mobile performance and live browser operation unverified. User-generated experiments are stored in browser IndexedDB and can be exported; Git does not sync browser-local data. No background search after closing the page. Commit source and regression evidence before publishing.

