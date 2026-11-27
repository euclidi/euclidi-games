# Pixel Adventure

The four side-view characters each have seven 32×32 strips. [character-strips.json](character-strips.json) maps each clip to the PNG inside [pixel-adventure.zip](pixel-adventure.zip) and records the frame count. The archive also contains enemies, backgrounds, items, traps, and terrain.

Extract the archive with folders intact. Create a player with createSpritePlayer(manifest.characters["Ninja Frog"], 12) from [sprite-player.mjs](sprite-player.mjs). Call player.play("Run") to select a clip and player.advance(deltaSeconds) each update. The result gives the image and source rectangle for your atlas renderer. For a one-shot, call player.play("Hit", { loop: false }) and check ended.

[Pixel Frog's source and CC0 declaration](https://pixelfrog-assets.itch.io/pixel-adventure-1) · [Source archive record](sources.json)
