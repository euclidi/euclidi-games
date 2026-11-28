# Source and rights review

Reviewed 2026-11-27 from publisher or source pages. A status of `license-verified-awaiting-acquisition` means the page states a license that permits redistribution; the binary has not been acquired or validated. `candidate-unverified` means it remains index-only until the original source's rights and access method are checked.

## Verified source terms

| ID | Source | Finding | Handling |
| --- | --- | --- | --- |
| D01 | [Ninja Adventure](https://pixel-boy.itch.io/ninja-adventure-asset-pack) | Page identifies Pixel-Boy and AAA, CC0 1.0, and says attribution is appreciated. Asset archive is a separate download from the Godot demo projects. | Eligible as an isolated 2D source pack; no project code/demo download. |
| D03 | [Farming Set (Pixel-Art)](https://opengameart.org/content/farming-set-pixel-art) | OpenGameArt entry identifies ScratchIO and lists CC0. One 45.1 KB ZIP. | Eligible as a separate pixel-art pack; inspect archive and preserve source record. |
| D04 | [RPG Base](https://kenney.nl/assets/rpg-base) | Kenney asset page lists CC0. Kenney's [support page](https://kenney.nl/support) states its asset-page game assets are CC0, including commercial use. | Eligible if not already present; repo currently has related Kenney packs but no `rpg-base.zip`. |
| D05-D07 | [Tiny Farm](https://kenney.nl/assets/tiny-farm), [Tiny Town](https://kenney.nl/assets/tiny-town), [Tiny Dungeon](https://kenney.nl/assets/tiny-dungeon) | These CC0 source archives already exist under `foundations-2d/kenney-tiny/`, with hashes and source URLs in `sources.json`. | No duplicate acquisition. |
| S01 | [512 Sound Effects (8-bit style)](https://opengameart.org/content/512-sound-effects-8-bit-style) | OpenGameArt entry identifies SubspaceAudio and lists CC0. ZIP is 20.6 MB. | Eligible as a source archive; inspect metadata/audio and retain archive license provenance. |
| M01 | [Quaternius Asset License](https://quaternius.com/license.html) | Current QAL 1.0 expressly bars reselling or redistributing the assets as standalone assets. Its game-use grant is not a library-mirroring grant. | Keep current QAL packs index-only. Existing library packs acquired under their recorded CC0 terms remain separate. |
| U03 | [Unscii source repository](https://github.com/viznut/unscii) | Publisher says most font files can be considered public domain/CC0, but specifically lists GPL-derived exceptions. | Select individual files only; do not mirror the repository wholesale. |

## Rights or storage gate

| ID | Source | Finding | Handling |
| --- | --- | --- | --- |
| S02 | [500 Free Game Sound Effects](https://untamedpixels.itch.io/gamesoundeffects) | Publisher page says all sounds are CC0 and redistributable, and describes a `LICENSES.txt` for original contributors. The 124 MB archive itself and its file-level notices were not inspected. GitHub blocks any single regular-Git file over 100 MiB. | Do not mirror the original archive. Keep index-only until individual files/notices can be reviewed and a repository-compatible subset under the file cap is selected. Do not use LFS unless consumers are confirmed. |
| B01-B06, B08-B10 and most P1-P3 sources | Discovery catalogs or mixed collections. | Catalog membership, free price, or a summary license does not prove each included asset can be redistributed. | Follow each item to the original publisher; retain only verified file/pack rights. |
| A05 | Mixamo | Source notes indicate project-use rights do not establish raw standalone redistribution. | Link-only unless a current license expressly permits mirroring. |
| D08-D10, S04-S08, U01-U02, U05-U07, V01-V05, M04-M10 | Mixed or per-item sources. | Some allow redistribution with attribution/share-alike; others have per-file, copyleft, third-party, or ambiguous terms. These terms are not yet audited for each item. | Index-only until per-asset license and attribution are recorded. |

## Access checks

During this intake, the official Ninja Adventure, Farming Set, Kenney RPG Base, and 512 Sound Effects source pages responded through automated HTTP page checks. Their resolvers returned a temporary itch.io URL, the official Kenney URL, and direct OpenGameArt URLs for metadata inspection only; no asset bytes were fetched. The Kenney resolver initially returned HTTP 403 without the source-page referrer and succeeded after the script was corrected to retain the session and referer. No confirmed inaccessible source pages are recorded. The remaining 59 links have not received live access checks; they remain unverified, not marked inaccessible.

## Repository size check

The GitHub repository metadata reports 203,668 KiB. The local tracked resource library is 259,404,900 bytes (247.39 MiB before Git compression). GitHub documents a warning over 50 MiB per file and a hard 100 MiB regular-Git file cap; it recommends keeping repositories under 1 GiB. The proposed 124 MB audio archive exceeds the per-file cap. The 89 MB Ninja pack is below the cap but above the warning threshold; no binary acquisition was made while the owner instruction prohibited PC asset downloads.


## Additional intake: Kinetic∆ and billiards lists

Two additional plain-text manifests were received on 2026-11-27 and are preserved verbatim under `../source-lists/`. The catalog contains 75 Kinetic∆ asset leads and 38 billiards art/audio leads; it also indexes 17 Kinetic∆ discovery/license/automation references, 8 Kinetic∆ holds, and 15 billiards technical references. Intake license labels are retained as `license_claim`; the acquisition gate uses independently reviewed `license_id`, `license_verified`, and `redistribution_allowed`. The lists are leads, not blanket permission to mirror files.

### Exact source terms checked

| IDs | Source evidence | Result |
| --- | --- | --- |
| kinetic-A04, A13, B04 | [Kenney Fantasy Town Kit](https://kenney.nl/assets/fantasy-town-kit), [Modular Cave Kit](https://kenney.nl/assets/modular-cave-kit), [Retro Textures Fantasy](https://kenney.nl/assets/retro-textures-fantasy), [Kenney support](https://kenney.nl/support) | Named asset pages show CC0. Specific ZIPs downloaded into `foundations-3d/kenney/` and `foundations-materials/kenney/`. |
| kinetic-B01, B02 | [Poly Haven license](https://polyhaven.com/license), [ambientCG license](https://docs.ambientcg.com/license/) | Libraries state CC0. Only specific billiards-list files were selected from these catalogs; no broad catalog mirror. |
| billiards-MAT-001..004 | [Fabric034](https://ambientcg.com/view?id=Fabric034), [Leather002](https://ambientcg.com/view?id=Leather002), [Leather007](https://ambientcg.com/view?id=Leather007), [Leather Substance 001](https://ambientcg.com/view?id=LeatherSubstance001), [ambientCG license](https://docs.ambientcg.com/license/) | 1K JPG material ZIPs and the free compiled SBSAR were downloaded under `foundations-materials/ambientcg/`; editable SBS project is supporter-only. |
| billiards-ENV-001..005, ROOM-001 | [Billiard Hall HDRI](https://polyhaven.com/a/billiard_hall), [Wooden Lounge](https://polyhaven.com/a/wooden_lounge), [Bar Chair Round 01](https://polyhaven.com/a/bar_chair_round_01), [Poly Haven license](https://polyhaven.com/license) | 1K HDRIs and the complete 1K GLTF chair set downloaded under `foundations-materials/polyhaven/` and `foundations-3d/polyhaven/`. Tonemapped JPGs retained for first two HDRIs. |
| billiards-BIL-001, BIL-006, BIL-014 | [Billiards Pack](https://opengameart.org/content/billiards-pack), [Pool Table (Low poly)](https://opengameart.org/content/pool-table-low-poly), [Asset Pack 8 Ball Pool](https://opengameart.org/content/asset-pack-8-ball-pool) | OpenGameArt pages list CC0 and provide author/pack metadata. Eligible candidates; preserve archive license records on acquisition. |
| billiards-BIL-002 | [Innerscene pool table](https://www.innerscene.com/tools/library/3d-parts/pool-table-sports-equipment-d28284c5), [library terms](https://www.innerscene.com/tools/library/terms) | Part page states CC0 and dimensions; library terms support redistribution. Eligible candidate. |
| billiards-SFX-006 | [SFXMint billiard effects](https://sfxmint.com/sounds/billiard-ball) | Site metadata API confirms CC0-1.0 and provides checksums for WAV files. Direct official audio URLs returned HTTP 429 for all ten entries during this pass; no download or mirror was attempted after rate limiting. |

### Held or restricted sources

- New Quaternius entries remain `license-review-required`: Quaternius says each kit uses either CC0 or QAL, and current QAL prohibits redistribution as standalone files. Check exact edition and included license per pack before mirroring ([FAQ](https://quaternius.com/faq.html), [QAL](https://quaternius.com/license.html)).
- `billiards-TECH-002` is held because it is GPL software. It is indexed as a technical reference; no code or bundled assets are approved for this library.
- Several source pages could not be fetched directly by automated browsing due to robots restrictions. Indexed page metadata was available for some OpenGameArt sources. Robots blocking is not treated as source inaccessibility or a license failure. Billiards BIL-003..005, BIL-007..013, BIL-015; most material/environment/furniture/audio/UI sources; and most Kinetic∆ candidates remain unverified. No source is marked confirmed inaccessible based on robots blocking alone.
- No exact URL collision was found with the original 63-entry queue. The Kinetic∆ list flags existing Kenney/KayKit/Quaternius families; these remain family-level comparison cautions, not confirmed binary duplicates. File hashes can only be compared after an authorized download.

The selected new ZIPs pass local CRC checks and the chair GLTF's buffer/image references resolve. No unlisted catalog assets were downloaded. The other manifest entries remain queued or held pending exact file selection, rights evidence, or access.
