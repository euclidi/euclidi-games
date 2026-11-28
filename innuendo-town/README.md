# Innuendo Town
A standalone top-down urban comedy sandbox for adult fictional characters. Development playtest build 0.5.1.
 
Run from an HTTP server, not file://. The game uses Phaser 3.90 with native Arcade Physics, a vendored original 432×288 Kenney RPG Urban atlas, and separate simulation content. Controls: WASD/arrows, Shift, E; touch D-pad, ACT, and destination selection.

## Credits
- Kenney, [RPG Urban Pack](https://kenney.nl/assets/rpg-urban-pack), CC0 1.0. Atlas recovered from [openClawWorld](https://github.com/Two-Weeks-Team/openClawWorld/blob/main/packages/client/public/assets/kenney/urban/urban_tilemap.png), blob 66bf1156a23e2436473f96cf2240c301e4309faf. Original bitmap is stored as a data URI in assets/urban-atlas.js.
- Phaser 3.90.0, MIT, [upstream](https://github.com/phaserjs/phaser). Phaser 3.90 is bundled locally.
 
[Play Innuendo Town](https://euclidi.github.io/euclidi-games/innuendo-town/) · [Game catalog](https://euclidi.github.io/euclidi-games/).

## Project records
[Specification](SPEC.md) · [Roadmap](ROADMAP.md) · [Status](STATUS.md) · [Original implementation PR](https://github.com/euclidi/euclidi-games/pull/7). Playtest release; visual defects and incomplete scope are documented in STATUS.md.

Sprite correction: source atlas columns verified at enlarged scale (left/front/back/right). Traffic uses named complete vehicle regions rather than adjacent cells. See STATUS.md for regression evidence.
