"""Safely verify and extract one pack from the bundled Kenney glTF catalog."""

from __future__ import annotations

import argparse
import hashlib
import json
from pathlib import Path, PurePosixPath
from zipfile import ZipFile


ROOT = Path(__file__).resolve().parent
MANIFEST = ROOT / "manifest.json"


def sha256(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for block in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(block)
    return digest.hexdigest()


def safe_members(archive: ZipFile) -> list[tuple[str, PurePosixPath]]:
    result = []
    for info in archive.infolist():
        relative = PurePosixPath(info.filename)
        if (
            relative.is_absolute()
            or ".." in relative.parts
            or not relative.parts
            or "\\" in info.filename
            or ":" in relative.parts[0]
        ):
            raise ValueError(f"unsafe path in archive: {info.filename!r}")
        if not info.is_dir():
            result.append((info.filename, relative))
    return result


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("pack", help="pack name from manifest.json")
    parser.add_argument("--output", required=True, type=Path, help="new or empty destination folder")
    args = parser.parse_args()

    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    rows = {row["pack"]: row for row in manifest["packs"]}
    if args.pack not in rows:
        parser.error(f"unknown pack {args.pack!r}; choose one of: {', '.join(sorted(rows))}")
    row = rows[args.pack]
    archive_path = ROOT / "packs" / row["archive"]
    if sha256(archive_path) != row["sha256"]:
        raise SystemExit(f"archive SHA-256 mismatch: {archive_path}")

    output = args.output.resolve()
    if output.exists() and (not output.is_dir() or any(output.iterdir())):
        raise SystemExit(f"destination must be a new or empty directory: {output}")

    with ZipFile(archive_path) as archive:
        bad = archive.testzip()
        if bad:
            raise SystemExit(f"archive CRC check failed at {bad}")
        members = safe_members(archive)
        model_count = sum(path.suffix.lower() == ".glb" for _, path in members)
        if model_count != row["models"]:
            raise SystemExit(f"manifest says {row['models']} GLBs; archive contains {model_count}")
        output.mkdir(parents=True, exist_ok=True)
        for source_name, relative in members:
            target = (output / Path(*relative.parts)).resolve()
            if target != output and output not in target.parents:
                raise SystemExit(f"unsafe extraction target: {source_name!r}")
            target.parent.mkdir(parents=True, exist_ok=True)
            with archive.open(source_name) as source, target.open("xb") as destination:
                destination.write(source.read())

    print(f"Extracted {model_count} verified GLBs from {archive_path.name} to {output}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
