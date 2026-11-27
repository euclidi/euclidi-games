# Meeting Seam offline art sources

The miner rig and initial material ramps are adapted from Wren, a CC0 example by Lucas Ramos in [SpriteKiln](https://github.com/LucasJRamos/spritekiln). The new miner helmets, lights, clothing, mining tools, clips and prop model specifications are project adaptations. The rendering tool is MIT; the example assets and palettes used here are CC0. No showcase or proprietary sprites are used.

The workflow `.github/workflows/meeting-seam-art.yml` builds PNG atlases and JSON animation metadata. The browser uses only locally served baked files, with a labeled legacy fallback if any atlas is missing. The source specifications are not proof of finished renders; inspect the workflow artifact and visually audit the sprites before treating them as approved.
