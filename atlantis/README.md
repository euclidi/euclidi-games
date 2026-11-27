# Atlantis — Lost City
Status: migration / source recovery; not yet a public release. No Play URL is certified.
A cinematic underwater exploration scene with optional first-person swimming, built in Three.js. Explore a classical-inspired lost city and living reef without mandatory objectives. Discoveries remain unmarked and spoiler-free.

## Controls (established design; actual recovered build must be tested)
Observation: drag orbit, scroll/pinch zoom. Swim: WASD, drag look, E/Q rise/dive, Shift surge, F inspect. Touch: virtual stick, look drag and depth controls. Controller: left/right sticks move/look, depth controls, inspect, mode switch and surge; raw browser mappings vary.
Comfort: subtle camera motion, optional reduced motion. Ambience optional.

## Development and delivery
Use the existing repository and GitHub Pages project base path, with `atlantis/` as the proposed launch route. Do not publish the recoverable Expedition XIII snapshot as the current cumulative build. Recover and compare the newest full source first. Retain Three.js and original design. Serve locally from the repository root with a static HTTP server once the source is recovered; no installation required for players. Use pinned, licensed, preferably locally bundled dependencies. No third-party art is approved by this record.
See [scope](SPEC.md), [roadmap](ROADMAP.md), [status](STATUS.md), and [release test](tests/atlantis.spec.mjs).
