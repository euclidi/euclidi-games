# Foundational 3D building blocks

This library covers humanoid rigs, two independent motion libraries, stylized characters, weapons, props, environments, vehicles, food, and modular kits. Packs remain separate by source; do not assume they share a scale, pivot, rig, material setup, or visual style.

## Humanoids and animation

- `quaternius/base-characters-standard/`: two textured, rigged, 65-bone humanoid GLTF models (female and male) and eight modular hair/eyebrow GLTF assets. CC0; source details and the four byte-identical URI filename aliases needed by the supplied GLTF files are recorded in `source-record.json`. The models do not contain motion clips.
- `quaternius/animation-libraries/v1/` and `v2/`: separate humanoid GLBs with 43 named entries each (42 motion clips plus the T-pose entry), from [Universal Animation Library](https://quaternius.com/packs/universalanimationlibrary.html) and [Universal Animation Library 2](https://quaternius.com/packs/universalanimationlibrary2.html). Each library includes in-place and root-motion exports. See each `CLIPS.txt` and `source-record.json`. Both imported in Blender with 65-bone armatures and all 43 named entries; sampled walk poses changed. Engine retargeting and root-motion settings remain project work.
- `humanoids/animated-mannequin/mannequin.glb`: CC0 skinned mannequin with 46 named clips; see `CLIPS.txt`. It came from the demo for [Foot IK Grounder Lite](https://dangalg.itch.io/foot-ik-grounder-godot). This is an animation reference, not a controller.
- `humanoids/female-mannequin/`: second CC0 skinned Quaternius mannequin, from a pinned [source repository](https://github.com/tilakpatell/tilakverse-assets/tree/85064399bbdacc0e8cc50807179490314bc4ff1c/quaternius/universal-animation-library-2/Female%20Mannequin). Retargeting to the other rigs is not validated.
- `quaternius/ultimate-animated-animals/`: 12 self-contained CC0 animated glTF models (alpaca, bull, cow, deer, donkey, fox, two horse variants, husky, Shiba Inu, stag, and wolf) with 12–13 named clips per model. See `ANIMATIONS.md` and the pinned source record. Their rigs vary from 38 to 51 joints; they are not one common quadruped rig.
- `kenney/mini-dungeon/`: human/orc, weapons, and shields; each animated figure has 32 named clips. [Kenney Mini Dungeon](https://kenney.nl/assets/mini-dungeon), CC0. Its skeleton and motion grammar differ from Quaternius.
- `kenney-full/packs/mini-characters.zip` and `blocky-characters.zip`: additional character sets retained as intact archives.

## Props, environments, and weapons

- [Kenney full glTF catalog](kenney-full/README.md): 1,883 self-contained models across 19 CC0 packs, including blasters, character sets, cars, castle/city/road kits, pets, food, furniture, graveyard/nature, dungeon, pirate, platformer, prototype, space, and tower-defense assets. Each pack is independently checksummed. Use `kenney-full/extract_pack.py` to extract one pack safely.
- `kenney/blaster-kit/`: 18 stylized blasters plus ammo, magazines, grenades, and attachments; [Kenney Blaster Kit](https://kenney.nl/assets/blaster-kit), CC0.
- `stein-classic-weapons-1024/`: 1911 and AK-47 FBX models with color, normal, and packed RMAO textures from [Stein Games Classic Weapons Pack](https://stein-indie.itch.io/classic-weapons-pack), CC0. Assign and verify materials and packed-map channels in the target engine. Maps were downscaled from 2048 to 1024; the original archive remains in the shared `D:/Assets` library. The 1911 normal map retains upstream name `T_1991_N.png`.

Kenney models were converted to GLB by the [pinned tge-assets commit](https://github.com/Hidencod/tge-assets/tree/e5bd31ec8b339b25d66dd5816a21dd517bd1ae87/packs). Quaternius GLBs were imported in Blender 4.2.9. These are source assets, not engine-ready controllers or game integrations. Check scale, sockets, collision, material channels, skeletons, clip transitions, and performance in each project.
