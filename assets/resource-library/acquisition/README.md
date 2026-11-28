# Asset acquisition intake

This directory records source lists supplied on 2026-11-27 and separates discovered links from verified, redistributable files. Original text lists are retained in [`source-lists/`](source-lists/). The searchable [`sources.json`](sources.json) holds namespaced records from the earlier 63-source list, the Kinetic∆ intake, and the billiards intake. Candidate license claims remain unverified until exact source evidence is recorded. It is outside every game's deployed bundle. Raw source archives belong under their publisher-specific pack folder in `../`; extracted files retain the same pack boundary.

## Commands

Run from the `euclidi-games` repository root:

```powershell
python tools/asset_acquisition.py import-list assets/resource-library/acquisition/source-list-original.txt assets/resource-library/acquisition/source-lists/euclidi-games-asset-acquisition-manifest.txt assets/resource-library/acquisition/source-lists/euclidi-billiards-free-asset-manifest.txt
python tools/asset_acquisition.py audit --output assets/resource-library/acquisition/asset-manifest.json
python tools/asset_acquisition.py inspect-zips --output assets/resource-library/acquisition/archive-audit.json
python tools/asset_acquisition.py checksums
python tools/asset_acquisition.py acquire D03 --extract
```

`acquire` accepts only records with an explicit verified license, `redistribution_allowed: true`, and an approved status. It writes only under `assets/resource-library/`, resumes HTTP range transfers through `.part` files, records source validators, verifies SHA-256 when provided, checks ZIP CRC/path/symlink safety, and can extract ZIP files without running their contents. The updater skips unchanged files when upstream ETag/Last-Modified/length metadata and the local checksum match. Review any executable entries before extraction or use.

## Intake status

The searchable source catalog contains the records imported from the attached asset lists. V1 entries that are catalogs, discovery filters, technical references, code dependencies, mixed-license collections, or per-item searches remain index-only until a specific original asset is selected and cleared. They are not treated as blanket mirror instructions. The 2026-11-28 v2 execution directive supersedes v1 batch ordering: prioritize complete free editions and official asset APIs, retain distinct style families, and end bulk intake once general coverage is substantial. Actual acquisition status, source URL, license, local files, bytes and hashes are recorded per source in `sources.json`; every binary is separately indexed in `asset-manifest.json`.

Current GitHub repository size is about 203,668 KiB. GitHub recommends keeping repositories below 1 GB, warns above 50 MiB per file, and blocks files above 100 MiB. The 124 MB 500 Game Sound Effects archive is therefore index-only for now; Git LFS is not enabled because retrieval/deployment consumers have not been confirmed. See `evidence/source-review.md`.
