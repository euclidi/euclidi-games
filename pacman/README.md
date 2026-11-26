# Maze Arcade / 1980 — PAC-MAN Git revision 1.4.1

Self-contained Phaser 3 / WebGL / Vite browser game, reconstructed from revision 1.4. This is not a byte-identical export of the previous hosted build. No hosting or deployment settings are changed.

## Run
Node 22 recommended. In this directory run npm install, npm test, npm run build, npm run dev. Open the local address printed by Vite.

## Included
Original 28 x 31 maze topology, 240 pellets and 4 energizers, authentic/advanced/hybrid targeting, 60 Hz movement, scores and lives, fruit, simplified intermissions, persistent high scores, bitmap HUD and generated textures, 224 x 288 display, large drag-sensitive mobile D-pad, keyboard/swipe/gamepad input, scanlines, dedicated death sequence, integrated 16-effect wavetable audio.

## Limitations
Unofficial recreation. Sprites, bitmap typography, maze outlines, timing and synthesized sounds are not verified 1:1 with the original ROM. No original sound ROM or recordings are bundled, and no manual audio pack is required. Intermission visuals and fruit art are simplified. The logic audit was run against the reconstructed core; browser rendering, sound playback, installation and production build have not been verified in this Git revision.
