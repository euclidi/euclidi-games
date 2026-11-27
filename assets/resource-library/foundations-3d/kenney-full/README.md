# Kenney complete glTF catalog

Nineteen packs containing 1,883 self-contained GLB models, distributed as per-pack ZIPs. `manifest.json` records the upstream conversion repository and commit, model counts, sizes, and SHA-256 for every pack. The original Kenney models are CC0; the conversion repository also marks the included exports CC0. The upstream catalog is retained for source filenames and organization.

The collection includes blasters, blocky and mini characters, cars, castle/city/road kits, cube pets, food, furniture, graveyard, dungeon, nature, pirate, platformer, prototype, space, and tower-defense models. Packs are kept independent to make selection and provenance clear.

## Extract one pack

From this folder, run:

```powershell
python .\extract_pack.py nature-kit --output C:\Projects\MyGame\Assets\kenney-nature
```

Choose a name from `manifest.json`'s `packs` array. The tool checks the archive hash and CRC, confirms the expected model count, blocks path traversal, and refuses to overwrite a non-empty destination. Extraction keeps each model under its original pack-relative filename. The script needs only the Python standard library.

Upstream: [pinned tge-assets conversion](https://github.com/Hidencod/tge-assets/tree/e5bd31ec8b339b25d66dd5816a21dd517bd1ae87/packs); licensing context: [Kenney license/support page](https://kenney.nl/support). Converted GLB imports were structurally checked; no target-engine scene or game integration is included.
