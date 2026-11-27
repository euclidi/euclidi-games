# COUNTERTOP / Guacamole

R3 is a continuous-countertop cooking development preview. See [approved scope](SPEC.md), [verification and limitations](STATUS.md), and [remaining work](ROADMAP.md).

[Development preview (availability not verified)](https://euclidi.github.io/euclidi-games/guacamole/preview.html)

Serve the repository root with a static HTTP server to run `guacamole/preview.html`. No runtime CDN dependencies. The browser diagnostics flag is `?test=1`. Engine regressions are accessible through the in-game test button; the Playwright test and scoped CI workflow cover the desktop recipe, save/reload, and mobile smoke test. CI result is not yet confirmed.

Assets: Kenney Food Kit (CC0-1.0), via Hidencod/tge-assets. Original source GLB identifiers and byte validation in assets/pilot.mjs and assets/kitchen.mjs. Third-party runtime license files in vendor/.
