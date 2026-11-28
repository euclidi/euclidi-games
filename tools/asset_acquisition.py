"""Repo-local asset source catalog, resumable downloads, and safe ZIP extraction.

This tool never writes outside assets/resource-library. It does not execute pack
contents. Source records must explicitly carry verified redistribution rights.
"""

from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import html
import json
import os
import re
import shutil
import sys
from http.cookiejar import CookieJar
import urllib.error
import urllib.parse
import urllib.request
import zipfile
from datetime import date
from pathlib import Path, PurePosixPath


REPO = Path(__file__).resolve().parents[1]
LIBRARY = REPO / "assets" / "resource-library"
USER_AGENT = "EuclidiAssetLibrary/1.0 (asset-acquisition; contact: euclidi-games)"


def sha256_file(path: Path) -> str:
    digest = hashlib.sha256()
    with path.open("rb") as stream:
        for chunk in iter(lambda: stream.read(1024 * 1024), b""):
            digest.update(chunk)
    return digest.hexdigest()


def assert_redistributable(record: dict) -> bool:
    if record.get("redistribution_allowed") is not True:
        raise ValueError("source is not approved for standalone redistribution")
    if record.get("license_verified") is not True:
        raise ValueError("license is not verified")
    if not record.get("license_id") or not record.get("license_url"):
        raise ValueError("verified license ID and URL are required")
    return True


def safe_archive_path(member: str) -> PurePosixPath:
    normalized = member.replace("\\", "/")
    path = PurePosixPath(normalized)
    if (not normalized or path.is_absolute() or ".." in path.parts or
            re.match(r"^[A-Za-z]:", normalized) or "\x00" in normalized):
        raise ValueError(f"unsafe archive path: {member!r}")
    return path


def within_library(path: Path) -> Path:
    resolved = path.resolve()
    if not resolved.is_relative_to(LIBRARY.resolve()):
        raise ValueError(f"destination must remain inside {LIBRARY}")
    return resolved


def fetch_page(url: str) -> tuple[bytes, dict]:
    request = urllib.request.Request(url, headers={"User-Agent": USER_AGENT})
    with urllib.request.urlopen(request, timeout=45) as response:
        return response.read(), dict(response.headers.items())


def resolve_oga(page_url: str) -> str:
    page, _ = fetch_page(page_url)
    text = page.decode("utf-8", "replace")
    links = re.findall(r"href=[\"']([^\"']+)[\"'][^>]*>(.*?)</a", text, re.I | re.S)
    candidates = []
    for href, label in links:
        label = re.sub(r"<[^>]+>", " ", label)
        decoded = urllib.parse.unquote(href)
        if re.search(r"\.(?:zip|7z|rar|tar\.gz)(?:$|[?#])", decoded, re.I):
            candidate = urllib.parse.urljoin(page_url, html.unescape(href))
            if candidate not in candidates:
                candidates.append(candidate)
    if not candidates:
        raise ValueError("OpenGameArt page has no direct downloadable archive link")
    # Multiple archive formats/quality tiers are reviewed by source order; use
    # the first page-published archive and retain the resolver choice in receipt.
    return candidates[0]


def resolve_itch(page_url: str) -> str:
    opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))

    def read(url: str, data: bytes | None = None, headers: dict | None = None) -> bytes:
        request = urllib.request.Request(url, data=data,
                                         headers={"User-Agent": USER_AGENT, **(headers or {})})
        with opener.open(request, timeout=45) as response:
            return response.read()

    page = read(page_url)
    text = page.decode("utf-8", "replace")
    if not re.search(r"Creative Commons Zero v1\.0 Universal|CC0\s*1\.0|CC0", text, re.I):
        raise ValueError("official itch.io page does not state CC0; use a manually verified record")
    purchase_url = page_url.rstrip("/") + "/purchase"
    purchase = read(purchase_url, headers={"Referer": page_url})
    purchase_text = purchase.decode("utf-8", "replace")
    csrf = re.search(r'<meta name="csrf_token" value="([^"]+)"', purchase_text)
    if not csrf:
        raise ValueError("itch.io purchase page did not provide a CSRF token")
    body = urllib.parse.urlencode({"csrf_token": csrf.group(1), "reward_id": ""}).encode()
    origin = urllib.parse.urlsplit(page_url)
    request = urllib.request.Request(
        page_url.rstrip("/") + "/download_url", data=body,
        headers={"User-Agent": USER_AGENT, "Referer": purchase_url,
                 "Origin": f"{origin.scheme}://{origin.netloc}",
                 "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                 "X-Requested-With": "XMLHttpRequest"})
    with opener.open(request, timeout=45) as response:
        response_data = json.loads(response.read())
    download_page = response_data.get("url")
    if not download_page:
        raise ValueError("itch.io returned no download page")
    data = read(download_page, headers={"Referer": purchase_url})
    source = data.decode("utf-8", "replace")
    found = re.findall(r'<a\b(?=[^>]*\bdata-upload_id="(\d+)")(?=[^>]*\bclass="[^"]*download_btn[^"]*")[^>]*>[\s\S]{0,1800}?<strong title="([^"]+)"', source, re.I)
    if not found:
        found = re.findall(r'<a\b(?=[^>]*\bdata-upload_id="(\d+)")(?=[^>]*\bclass="[^"]*download_btn[^"]*")[^>]*>[\s\S]{0,1800}?<strong title="([^"]+)"', source, re.I)
    selected = next(((fid, name) for fid, name in found if "free" in name.lower() or "standard" in name.lower() or "asset pack" in name.lower()), None)
    if selected is None and found:
        selected = found[0]
    if selected is None:
        raise ValueError("itch.io page has no downloadable archive")
    fid, _ = selected
    csrf2 = re.search(r'<meta name="csrf_token" value="([^"]+)"', source)
    if not csrf2:
        raise ValueError("itch.io download page did not provide a CSRF token")
    post = urllib.parse.urlencode({"csrf_token": csrf2.group(1)}).encode()
    origin_url = urllib.parse.urlsplit(page_url)
    request = urllib.request.Request(
        urllib.parse.urljoin(page_url.rstrip("/") + "/file/", fid), data=post,
        headers={"User-Agent": USER_AGENT, "Referer": download_page,
                 "Origin": f"{origin_url.scheme}://{origin_url.netloc}",
                 "Content-Type": "application/x-www-form-urlencoded; charset=UTF-8",
                 "X-Requested-With": "XMLHttpRequest"})
    with opener.open(request, timeout=45) as response:
        file_info = json.loads(response.read())
    if not file_info.get("url"):
        raise ValueError("itch.io file endpoint returned no asset URL")
    return file_info["url"]


def resolve_download(record: dict) -> str:
    if record.get("download_url"):
        return record["download_url"]
    page = record.get("source_url", "")
    host = urllib.parse.urlsplit(page).hostname or ""
    if host.endswith("opengameart.org"):
        return resolve_oga(page)
    if host.endswith("itch.io"):
        return resolve_itch(page)
    if host.endswith("kenney.nl"):
        opener = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(CookieJar()))
        request = urllib.request.Request(page, headers={"User-Agent": USER_AGENT})
        with opener.open(request, timeout=45) as response:
            data = response.read()
        text = data.decode("utf-8", "replace")
        if not re.search(r"Creative Commons CC0|CC0", text, re.I):
            raise ValueError("official Kenney page did not state CC0")
        match = re.search(r'data-download-id=["\']([^"\']+)', text, re.I)
        if not match:
            raise ValueError("official Kenney page has no download control")
        request = urllib.request.Request(
            "https://kenney.nl/download-link/" + match.group(1),
            headers={"User-Agent": USER_AGENT, "Referer": page, "Accept": "application/json"})
        with opener.open(request, timeout=45) as response:
            payload = response.read()
        response = json.loads(payload)
        if not response.get("url"):
            raise ValueError("Kenney download endpoint returned no URL")
        return response["url"]
    if host.endswith("ambientcg.com"):
        asset_match = re.search(r"[?&]id=([A-Za-z0-9]+)", page)
        if not asset_match:
            raise ValueError("ambientCG item URL must identify one asset")
        asset_id = asset_match.group(1)
        meta_url = f"https://ambientcg.com/api/v2/full_json?assetId={asset_id}&include=downloadData,licenseData&sortBy=latest"
        with urllib.request.urlopen(urllib.request.Request(meta_url, headers={"User-Agent": USER_AGENT}), timeout=45) as response:
            metadata = json.loads(response.read())
        asset = metadata.get("foundAssets", [{}])[0]
        license_name = str(asset.get("license", {}).get("name", ""))
        if "CC0" not in license_name.upper() and "PUBLIC DOMAIN" not in license_name.upper():
            raise ValueError(f"ambientCG item license not verified as CC0: {license_name!r}")
        downloads = asset.get("downloadFolders", {})
        for folder in downloads.values():
            for item in folder.values() if isinstance(folder, dict) else []:
                if isinstance(item, dict) and item.get("downloadLink") and "1K-JPG" in str(item.get("attribute", "")):
                    return item["downloadLink"]
        raise ValueError("ambientCG item has no 1K-JPG download")
    if host.endswith("innerscene.com"):
        with urllib.request.urlopen(urllib.request.Request(page, headers={"User-Agent": USER_AGENT}), timeout=45) as response:
            text = response.read().decode("utf-8", "replace")
        data = re.search(r'<script id="__NEXT_DATA__" type="application/json">(.*?)</script>', text, re.S)
        if not data:
            raise ValueError("Innerscene page has no structured item data")
        item = json.loads(data.group(1))["props"]["pageProps"]["part"]
        if item.get("license") != "CC0-1.0":
            raise ValueError(f"Innerscene model license is not CC0-1.0: {item.get('license')!r}")
        return urllib.parse.urljoin(page, f"/api/library/{item['id']}/download")
    raise ValueError("no direct download URL or supported source-page resolver")


def persistent_download_url(url: str) -> str | None:
    """Avoid writing short-lived signed CDN URLs into long-lived source records."""
    parsed = urllib.parse.urlsplit(url)
    query_keys = {key.lower() for key, _ in urllib.parse.parse_qsl(parsed.query)}
    if ("x-amz-signature" in query_keys or "expires" in query_keys or
            (parsed.hostname or "").endswith("r2.cloudflarestorage.com")):
        return None
    return url


def download_resumable(url: str, destination: Path, expected_sha256: str | None,
                       stable_source: str | None = None) -> tuple[int, str]:
    destination = within_library(destination)
    destination.parent.mkdir(parents=True, exist_ok=True)
    source_key = stable_source or url
    receipt = destination.with_name(destination.name + ".source.json")
    old_receipt = {}
    if receipt.exists():
        try:
            old_receipt = json.loads(receipt.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            old_receipt = {}
    if destination.is_file():
        digest = sha256_file(destination)
        if expected_sha256 and digest != expected_sha256:
            pass
        elif old_receipt.get("source_key", old_receipt.get("url")) == source_key:
            head = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
            try:
                with urllib.request.urlopen(head, timeout=45) as response:
                    remote = {"etag": response.headers.get("ETag"),
                              "last_modified": response.headers.get("Last-Modified"),
                              "content_length": response.headers.get("Content-Length")}
            except (urllib.error.HTTPError, urllib.error.URLError):
                remote = {}
            if remote and remote == {key: old_receipt.get(key) for key in remote} and old_receipt.get("sha256") == digest:
                return destination.stat().st_size, digest
        elif expected_sha256 and digest == expected_sha256:
            return destination.stat().st_size, digest

    partial = destination.with_name(destination.name + ".part")
    state_file = partial.with_name(partial.name + ".json")
    state = {}
    if state_file.exists():
        try:
            state = json.loads(state_file.read_text(encoding="utf-8"))
        except (OSError, json.JSONDecodeError):
            state = {}
    if state.get("source_key", state.get("url")) != source_key or state.get("expected_sha256") != expected_sha256:
        partial.unlink(missing_ok=True)
        state_file.unlink(missing_ok=True)
    if not state_file.exists():
        state = {"source_key": source_key, "expected_sha256": expected_sha256}
        state_file.write_text(json.dumps(state, indent=2) + "\n", encoding="utf-8")
    offset = partial.stat().st_size if partial.exists() else 0
    headers = {"User-Agent": USER_AGENT}
    if offset:
        headers["Range"] = f"bytes={offset}-"
    request = urllib.request.Request(url, headers=headers)
    try:
        response = urllib.request.urlopen(request, timeout=90)
    except urllib.error.HTTPError as exc:
        if exc.code == 416 and partial.exists():
            response = None
        else:
            raise
    response_receipt = old_receipt
    if response is not None:
        status = getattr(response, "status", response.getcode())
        response_receipt = {"source_key": source_key, "url": url, "etag": response.headers.get("ETag"),
                            "last_modified": response.headers.get("Last-Modified"),
                            "content_length": response.headers.get("Content-Length")}
        append = bool(offset and status == 206)
        if offset and status != 206:
            offset = 0
        with response, partial.open("ab" if append else "wb") as output:
            shutil.copyfileobj(response, output, 1024 * 1024)
    state_file.write_text(json.dumps({"source_key": source_key, "url": url, "expected_sha256": expected_sha256,
                                     "bytes": partial.stat().st_size}, indent=2) + "\n", encoding="utf-8")
    digest = sha256_file(partial)
    if expected_sha256 and digest.lower() != expected_sha256.lower():
        raise ValueError(f"SHA-256 mismatch for {destination.name}: {digest}")
    with partial.open("rb") as stream:
        magic = stream.read(4)
    if destination.suffix.lower() == ".zip":
        if magic[:2] != b"PK":
            raise ValueError(f"download is not a ZIP archive: {destination.name}")
        with zipfile.ZipFile(partial) as archive:
            bad = archive.testzip()
            if bad:
                raise ValueError(f"ZIP CRC failure in {destination.name}: {bad}")
            for member in archive.infolist():
                safe_archive_path(member.filename)
    os.replace(partial, destination)
    try:
        head = urllib.request.Request(url, method="HEAD", headers={"User-Agent": USER_AGENT})
        with urllib.request.urlopen(head, timeout=45) as response:
            response_receipt = {"source_key": source_key, "url": url, "etag": response.headers.get("ETag"),
                                "last_modified": response.headers.get("Last-Modified"),
                                "content_length": response.headers.get("Content-Length")}
    except (urllib.error.HTTPError, urllib.error.URLError):
        response_receipt["source_key"] = source_key
        response_receipt["url"] = url
    response_receipt["source_key"] = source_key
    response_receipt["sha256"] = digest
    receipt.write_text(json.dumps(response_receipt, indent=2) + "\n", encoding="utf-8")
    state_file.unlink(missing_ok=True)
    return destination.stat().st_size, digest


def extract_zip(archive_path: Path, destination: Path) -> int:
    archive_path = within_library(archive_path)
    destination = within_library(destination)
    destination.mkdir(parents=True, exist_ok=True)
    extracted = 0
    with zipfile.ZipFile(archive_path) as archive:
        if archive.testzip():
            raise ValueError(f"ZIP CRC failure: {archive_path}")
        for member in archive.infolist():
            relative = safe_archive_path(member.filename)
            # Directory entries are retained structurally; symlink entries are not extracted.
            mode = member.external_attr >> 16
            if mode & 0o170000 == 0o120000:
                raise ValueError(f"ZIP symlink is not allowed: {member.filename}")
            target = within_library(destination.joinpath(*relative.parts))
            if member.is_dir():
                target.mkdir(parents=True, exist_ok=True)
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            if target.exists():
                member_digest = hashlib.sha256()
                with archive.open(member) as source:
                    for chunk in iter(lambda: source.read(1024 * 1024), b""):
                        member_digest.update(chunk)
                if target.is_file() and sha256_file(target) == member_digest.hexdigest():
                    continue
                raise FileExistsError(f"refusing to overwrite different extracted file: {target}")
            with archive.open(member) as source, target.open("wb") as output:
                shutil.copyfileobj(source, output, 1024 * 1024)
            extracted += 1
    return extracted


def parse_source_manifest(path: Path) -> list[dict]:
    rows = []
    pattern = re.compile(r"^\s*\[(\d{2})\s*[—-]\s*([^\]]+)\]\s*$")
    entry = re.compile(r"^([A-Z]\d{2})\s*\|\s*([^|]+)\|\s*(https?://[^|]+)\|\s*([^|]*)\|\s*(.*)$")
    section = ""
    for line in path.read_text(encoding="utf-8").splitlines():
        found = pattern.match(line)
        if found:
            section = found.group(2).strip()
            continue
        found = entry.match(line.strip())
        if found:
            code, name, url, coverage, notes = found.groups()
            tier = re.search(r"\bP[0-3]\b", notes)
            rows.append({
                "id": code,
                "title": name.strip(),
                "publisher": None,
                "source_url": url.strip(),
                "download_url": None,
                "category": section,
                "coverage": coverage.strip(),
                "priority": tier.group(0) if tier else None,
                "acquisition_notes": notes.strip(),
                "license_id": None,
                "license_url": None,
                "license_evidence_path": None,
                "license_verified": False,
                "redistribution_allowed": False,
                "attribution_text": None,
                "local_path": None,
                "sha256": None,
                "bytes": None,
                "formats": [],
                "status": "candidate-unverified",
                "source_retrieved": date.today().isoformat(),
            })
    return rows


def _candidate_record(source_id: str, title: str, publisher: str | None,
                      source_url: str | None, category: str, priority: str | None,
                      claim: str, notes: str, source_list: str) -> dict:
    """Normalize an intake row without treating its license claim as approval."""
    restricted = bool(re.search(r"GPL|HOLD|REF", claim, re.I))
    return {
        "id": source_id, "title": title.strip(), "publisher": publisher,
        "source_url": source_url, "related_urls": [], "download_url": None,
        "category": category, "coverage": notes.strip(), "priority": priority,
        "license_claim": claim.strip(), "license_id": None, "license_url": None,
        "license_evidence_path": None, "license_verified": False,
        "redistribution_allowed": False, "attribution_text": None,
        "local_path": None, "sha256": None, "bytes": None, "formats": [],
        "status": "held-index-only" if restricted else "candidate-unverified",
        "source_list": source_list, "source_retrieved": date.today().isoformat(),
    }


def parse_kinetic_manifest(path: Path) -> list[dict]:
    rows = []
    section = "Kinetic∆ asset candidates"
    item = re.compile(r"^([A-F]\d{2})\s*\|\s*(P[0-3])\s*\|\s*([^|]+)\|\s*([^|]+)\|\s*(https?://[^|]+)\|\s*(.*)$")
    reference = re.compile(r"^(G\d{2}|H\d{2})\s*\|\s*([^|]+)\|\s*(https?://\S+)\s*\|\s*(.*)$")
    for line in path.read_text(encoding="utf-8").splitlines():
        heading = re.match(r"^\s*([A-F])\.\s+(.+)$", line)
        if heading:
            section = f"{heading.group(1)}: {heading.group(2).strip()}"
            continue
        found = item.match(line.strip())
        if found:
            code, priority, claim, target, url, notes = found.groups()
            row = _candidate_record(f"kinetic-{code}", target.rsplit("/", 1)[-1], None,
                                    url.strip(), section, priority, claim, notes, "kinetic")
            row["target_path"] = target.strip()
            rows.append(row)
            continue
        found = reference.match(line.strip())
        if found:
            code, kind, url, notes = found.groups()
            rows.append(_candidate_record(f"kinetic-{code}", notes[:100], None, url,
                                          f"reference:{kind.strip()}", None, kind.strip(),
                                          notes, "kinetic"))
    return rows


def parse_billiards_manifest(path: Path) -> list[dict]:
    text = path.read_text(encoding="utf-8")
    lines = text.splitlines()
    rows = []
    heading = "Billiards assets"
    item = re.compile(r"^((?:BIL|MAT|ENV|ROOM|SFX|AUD|UI)-\d{3})\s*\|\s*(.*?)\s*\|\s*(.*?)\s*\|\s*(.*)$")
    tech_item = re.compile(r"^(TECH-\d{3})\s*\|\s*(.*?)\s*\|\s*(.*)$")
    current = None
    for line in lines:
        stripped = line.strip()
        section_heading = re.match(r"^(\d{2})\s*\|\s*(?:P[0-3]|REF|TECH)[^|]*\|\s*(.+)$", stripped)
        if section_heading:
            heading = f"{section_heading.group(1)}: {section_heading.group(2).strip()}"
            continue
        tech_found = tech_item.match(stripped)
        if tech_found:
            code, claim, title = tech_found.groups()
            current = _candidate_record(f"billiards-{code}", title, None, None, heading,
                                        None, claim, "Technical reference or software; not a redistributable game asset by default.", "billiards")
            rows.append(current)
            continue
        found = item.match(stripped)
        if found:
            code, priority, claim, title = found.groups()
            current = _candidate_record(f"billiards-{code}", title, None, None, heading,
                                        priority.strip() if re.fullmatch(r"P[0-3]", priority.strip()) else None,
                                        claim, "", "billiards")
            current["license_claim"] = claim.strip()
            rows.append(current)
            continue
        if stripped.startswith(("G0", "H0")):
            match = re.match(r"^(G\d{2}|H\d{2})\s*\|\s*([^|]+)\|\s*(https?://\S+)\s*\|\s*(.*)$", stripped)
            if match:
                code, kind, url, notes = match.groups()
                current = _candidate_record(f"billiards-{code}", notes[:100], None, url,
                                            f"reference:{kind}", None, kind, notes, "billiards")
                rows.append(current)
            continue
        if current and " | " in stripped and not stripped.startswith("https://") and current["id"].startswith("billiards-") and current["id"].split("-")[-2] != "TECH":
            # Billiards entries have an independent source/publisher column.
            parts = [part.strip() for part in stripped.split("|", 2)]
            if len(parts) == 2:
                current["publisher"], current["title"] = parts
        if current and not stripped.startswith(("=", "-")):
            urls = re.findall(r"https?://[^\s)]+", stripped)
            for raw_url in urls:
                url = raw_url.rstrip(".,;")
                if current.get("source_url") is None:
                    current["source_url"] = url
                elif url not in current["related_urls"] and url != current.get("source_url"):
                    current["related_urls"].append(url)
            if stripped and not urls:
                current["coverage"] = (current.get("coverage", "") + " " + stripped).strip()
    return rows


def apply_source_review(rows: list[dict]) -> None:
    """Apply findings supported by official source pages checked 2026-11-27."""
    by_id = {row["id"]: row for row in rows}
    cc0 = "https://creativecommons.org/publicdomain/zero/1.0/"
    reviewed = {
        "D01": ("Pixel-Boy and AAA", "CC0-1.0", cc0,
                "https://pixel-boy.itch.io/ninja-adventure-asset-pack",
                "license-verified-awaiting-acquisition", True,
                "Ninja Adventure by Pixel-Boy and AAA; CC0 1.0. Credit is appreciated, not required."),
        "D03": ("ScratchIO", "CC0-1.0", cc0,
                "https://opengameart.org/content/farming-set-pixel-art",
                "license-verified-awaiting-acquisition", True,
                "Farming Set (Pixel-Art) by ScratchIO; CC0 1.0. Attribution not required."),
        "D04": ("Kenney", "CC0-1.0", cc0,
                "https://kenney.nl/assets/rpg-base", "license-verified-awaiting-acquisition", True,
                "RPG Base by Kenney; CC0 1.0. Attribution not required."),
        "S01": ("SubspaceAudio", "CC0-1.0", cc0,
                "https://opengameart.org/content/512-sound-effects-8-bit-style",
                "license-verified-awaiting-acquisition", True,
                "512 Sound Effects (8-bit style) by SubspaceAudio; CC0 1.0."),
    }
    for source_id, (publisher, license_id, license_url, evidence, status, allowed, attribution) in reviewed.items():
        if source_id in by_id:
            row = by_id[source_id]
            effective_status = "acquired" if row.get("files") else status
            row.update({"publisher": publisher, "license_id": license_id,
                                    "license_url": license_url, "license_evidence_path": evidence,
                                    "license_verified": True, "redistribution_allowed": allowed,
                                    "attribution_text": attribution, "status": effective_status,
                                    "verification_method": "official publisher/source page reviewed; archive contents not downloaded"})
    new_reviewed = {
        "kinetic-A04": ("Kenney", "CC0-1.0", cc0, "https://kenney.nl/assets/fantasy-town-kit", "license-verified-awaiting-acquisition", True, "Fantasy Town Kit by Kenney; CC0 1.0."),
        "kinetic-A13": ("Kenney", "CC0-1.0", cc0, "https://kenney.nl/assets/modular-cave-kit", "license-verified-awaiting-acquisition", True, "Modular Cave Kit by Kenney; CC0 1.0."),
        "kinetic-B01": ("Poly Haven", "CC0-1.0", cc0, "https://polyhaven.com/license", "license-verified-awaiting-acquisition", True, "Poly Haven assets are CC0 1.0; identify each selected asset individually."),
        "kinetic-B02": ("ambientCG", "CC0-1.0", cc0, "https://docs.ambientcg.com/license/", "license-verified-awaiting-acquisition", True, "ambientCG assets are CC0 1.0; identify each selected asset individually."),
        "billiards-BIL-001": ("mehrasaur (Lokesh Mehra)", "CC0-1.0", cc0, "https://opengameart.org/content/billiards-pack", "license-verified-awaiting-acquisition", True, "Billiards Pack by mehrasaur; CC0 1.0."),
        "billiards-BIL-002": ("Innerscene contributor", "CC0-1.0", cc0, "https://www.innerscene.com/tools/library/3d-parts/pool-table-sports-equipment-d28284c5", "license-verified-awaiting-acquisition", True, "Pool table - Sports equipment; original Innerscene model released under CC0 1.0."),
        "billiards-BIL-006": ("STKRudy85", "CC0-1.0", cc0, "https://opengameart.org/content/pool-table-low-poly", "license-verified-awaiting-acquisition", True, "Pool Table (Low poly) by STKRudy85; CC0 1.0. Preserve included license.txt."),
        "billiards-BIL-014": ("Chasersgaming", "CC0-1.0", cc0, "https://opengameart.org/content/asset-pack-8-ball-pool", "license-verified-awaiting-acquisition", True, "Asset Pack 8 Ball Pool by Chasersgaming; CC0 1.0."),
        "billiards-SFX-006": ("SFXMint", "CC0-1.0", cc0, "https://sfxmint.com/sounds/billiard-ball", "license-verified-awaiting-acquisition", True, "SFXMint billiard ball sound effects; CC0 1.0; AI-generated or procedurally synthesized per source."),
    }
    for source_id, (publisher, license_id, license_url, evidence, status, allowed, attribution) in new_reviewed.items():
        if source_id in by_id:
            row = by_id[source_id]
            effective_status = "acquired" if row.get("files") else status
            row.update({"publisher": publisher, "license_id": license_id, "license_url": license_url,
                        "license_evidence_path": "acquisition/evidence/source-review.md#new-manifest-review",
                        "license_verified": True, "redistribution_allowed": allowed,
                        "attribution_text": attribution, "status": effective_status,
                        "verification_method": "official asset/source or license page reviewed; no asset bytes downloaded"})
    for source_id in ("billiards-BIL-001", "billiards-BIL-002", "billiards-BIL-006", "billiards-BIL-014", "billiards-SFX-006"):
        row = by_id.get(source_id)
        if row and not row.get("files"):
            urls = row.get("related_urls", [])
            if urls:
                row["source_url"] = urls[0]
                row["related_urls"] = [url for url in urls[1:] if url]
    # Current Quaternius pages use a pack-specific choice between CC0 and QAL.
    # Claims alone do not establish which license each listed new pack uses.
    for source_id, row in by_id.items():
        if source_id.startswith("kinetic-") and "quaternius.itch.io" in (row.get("source_url") or ""):
            row.update({"license_verified": False, "redistribution_allowed": False,
                        "status": "license-review-required",
                        "restriction": "Quaternius confirms individual kits use either CC0 or QAL; the current QAL prohibits standalone asset redistribution. Verify the exact pack page/download license before mirroring."})
    destinations = {
        "D01": ("foundations-2d/ninja-adventure/ninja-adventure-asset-pack.zip", ["2d", "characters", "tilesets", "audio", "ui"], "89 MB"),
        "D03": ("foundations-2d/farming-set-pixel-art/farming-stuff.zip", ["2d", "pixel-art", "farming"], "45.1 KB"),
        "D04": ("foundations-2d/kenney-rpg-base/rpg-base.zip", ["2d", "tilesets", "rpg"], None),
        "S01": ("foundations-audio/retro-sound-effects-512/retro-video-game-sound-effects-512.zip", ["audio", "sfx"], "20.6 MB"),
    }
    for source_id, (rel, categories, reported_size) in destinations.items():
        if source_id in by_id:
            by_id[source_id].update({"local_path": rel, "formats": ["zip"], "categories": categories,
                                    "source_reported_size": reported_size,
                                    "license_evidence_path": "acquisition/evidence/source-review.md#verified-source-terms",
                                    "acquisition_status": "not-downloaded-per-owner-instruction"})
    for source_id, rel, filename in [
        ("D05", "foundations-2d/kenney-tiny/tiny-farm.zip", "tiny-farm.zip"),
        ("D06", "foundations-2d/kenney-tiny/tiny-town.zip", "tiny-town.zip"),
        ("D07", "foundations-2d/kenney-tiny/tiny-dungeon.zip", "tiny-dungeon.zip"),
    ]:
        row = by_id.get(source_id)
        if row:
            path = LIBRARY / rel
            row.update({"publisher": "Kenney", "license_id": "CC0-1.0", "license_url": cc0,
                        "license_evidence_path": str(Path(rel).parent / "sources.json"),
                        "license_verified": True, "redistribution_allowed": True,
                        "attribution_text": f"{filename} by Kenney; CC0 1.0.",
                        "local_path": rel, "sha256": sha256_file(path) if path.is_file() else None,
                        "bytes": path.stat().st_size if path.is_file() else None,
                        "formats": ["zip"], "status": "already-present" if path.is_file() else "missing-local-copy",
                        "acquisition_status": "already-present-no-download" if path.is_file() else "eligible-not-present"})
    if "D02" in by_id:
        by_id["D02"].update({"status": "duplicate-project-link-index-only",
                             "acquisition_status": "index-only-duplicate-source-project",
                             "acquisition_notes": "Related Godot project for D01; do not mirror duplicate pack or executable demo project."})
    if "S02" in by_id:
        by_id["S02"].update({"publisher": "Untamed Pixels (curated multi-creator set)",
                             "license_id": "CC0-1.0", "license_url": cc0,
                             "license_evidence_path": "acquisition/evidence/source-review.md#rights-or-storage-gate",
                             "license_verified": False, "redistribution_allowed": False,
                             "status": "blocked-review-and-file-size",
                             "source_reported_size": "124 MB", "formats": ["zip"],
                             "categories": ["audio", "sfx"],
                             "acquisition_status": "blocked-uninspected-archive-over-git-file-limit",
                             "restriction": "Publisher page claims CC0 and redistribution, but archive LICENSES.txt/per-file provenance remains uninspected; published archive is 124 MB, exceeding GitHub's 100 MiB single-file limit. Do not use LFS until consumers are confirmed."})
    if "M01" in by_id:
        by_id["M01"].update({"license_id": "QAL-1.0", "license_url": "https://quaternius.com/license.html",
                             "license_verified": True, "redistribution_allowed": False,
                             "status": "restricted-index-only", "acquisition_status": "index-only-license-prohibits-standalone-redistribution",
                             "restriction": "Current Quaternius Asset License permits game integration but prohibits standalone asset redistribution. Older local packs retain their own archived CC0 notices."})
    if "U03" in by_id:
        by_id["U03"].update({"publisher": "Viznut (Ville-Matias Heikkilä)",
                             "license_id": "Public Domain / CC0 (selected files only)",
                             "license_url": "https://github.com/viznut/unscii",
                             "license_verified": True, "redistribution_allowed": False,
                             "status": "selective-file-review-required", "acquisition_status": "index-only-until-selective-file-approval",
                             "restriction": "Official repository says most Unscii files are public domain/CC0 but lists GPL-derived exceptions (unifont.hex, hex2bdf.pl, unscii-16-full variants). Select files individually and preserve notices."})


def command_import(args: argparse.Namespace) -> int:
    output = Path(args.output)
    rows_by_id = {}
    for input_path in args.inputs:
        path = Path(input_path)
        text = path.read_text(encoding="utf-8")
        if re.search(r"^A01\s*\|\s*P[0-3]\s*\|", text, re.M):
            parsed = parse_kinetic_manifest(path)
        elif re.search(r"^(?:BIL|MAT|ENV|ROOM|SFX|AUD|UI|TECH)-\d{3}\s*\|", text, re.M):
            parsed = parse_billiards_manifest(path)
        else:
            parsed = parse_source_manifest(path)
            apply_source_review(parsed)
        for row in parsed:
            rows_by_id[row["id"]] = row
    rows = list(rows_by_id.values())
    if output.is_file():
        try:
            previous = json.loads(output.read_text(encoding="utf-8"))
            old_by_id = {row.get("id"): row for row in previous.get("sources", [])}
            for row in rows:
                old = old_by_id.get(row["id"], {})
                # Preserve only acquisition evidence when a source list is
                # re-imported; old parsed fields may be incomplete or stale.
                if old.get("status") == "acquired" and old.get("files"):
                    # Preserve downloaded bytes and verification, while keeping
                    # source-list metadata (especially canonical source URLs)
                    # fresh from the attached manifests.
                    source_fields = {key: row.get(key) for key in (
                        "title", "publisher", "source_url", "related_urls", "category",
                        "coverage", "priority", "license_claim", "target_path", "source_list")}
                    row.update(old)
                    for key, value in source_fields.items():
                        if value not in (None, [], ""):
                            row[key] = value
                elif old.get("status") == "download-blocked-429":
                    for key in ("status", "acquisition_status", "access_error", "license_id", "license_url",
                                "license_verified", "redistribution_allowed", "formats", "file_candidates"):
                        if key in old:
                            row[key] = old[key]
                else:
                    # Keep verified rights, target paths, and failure evidence
                    # for these same source IDs across routine source-list syncs.
                    for key, value in old.items():
                        if key in {"id", "title", "source_url", "related_urls", "category", "coverage", "priority", "license_claim", "target_path", "source_list"}:
                            continue
                        if value not in (None, [], ""):
                            row[key] = value
        except (OSError, json.JSONDecodeError):
            pass
    apply_source_review(rows)
    for row in rows:
        if row.get("files"):
            row["status"] = "acquired"
            row["acquisition_status"] = "downloaded-to-repo"
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"manifest_version": 1, "sources": rows}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"catalogued {len(rows)} source records -> {output}")
    return 0


def command_acquire(args: argparse.Namespace) -> int:
    path = Path(args.manifest)
    data = json.loads(path.read_text(encoding="utf-8"))
    records = [row for row in data.get("sources", []) if row.get("id") == args.id]
    if not records:
        raise ValueError(f"source ID not found: {args.id}")
    record = records[0]
    assert_redistributable(record)
    if record.get("status") not in {"eligible", "license-verified-awaiting-acquisition"}:
        raise ValueError(f"source status must be eligible, got {record.get('status')!r}")
    target = within_library(LIBRARY / record["local_path"])
    url = resolve_download(record)
    size, digest = download_resumable(url, target, record.get("sha256"), stable_source=record.get("source_url"))
    duplicates = []
    for candidate in LIBRARY.rglob("*"):
        if not candidate.is_file() or candidate == target or candidate.name.endswith((".part", ".part.json", ".source.json")):
            continue
        if candidate.suffix.lower() in {".zip", ".glb", ".gltf", ".png", ".jpg", ".wav", ".ogg", ".ttf", ".otf", ".woff2"} and sha256_file(candidate) == digest:
            duplicates.append(candidate)
    if duplicates:
        target.unlink(missing_ok=True)
        target.with_name(target.name + ".source.json").unlink(missing_ok=True)
        target = sorted(duplicates, key=lambda item: item.as_posix())[0]
        record["local_path"] = target.relative_to(LIBRARY).as_posix()
        record["status"] = "duplicate-existing-content"
    else:
        record["status"] = "acquired"
    record.update({"download_url": persistent_download_url(record.get("download_url") or url),
                   "sha256": digest, "bytes": size,
                   "acquisition_date": date.today().isoformat()})
    if args.extract:
        if target.suffix.lower() != ".zip":
            raise ValueError("--extract currently supports ZIP archives only")
        count = extract_zip(target, target.parent / (target.stem + "-extracted"))
        record["extracted_files"] = count
        record["original_or_derived"] = "original archive plus source extraction"
    path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(json.dumps({"id": args.id, "path": str(target), "bytes": size, "sha256": digest,
                      "extracted": bool(args.extract), "status": record["status"]}))
    return 0


def command_audit(args: argparse.Namespace) -> int:
    roots = [Path(p).resolve() for p in args.roots]
    source_by_hash: dict[str, dict] = {}
    source_by_path: dict[str, dict] = {}

    def index_source_tree(value, inherited=None):
        inherited = dict(inherited or {})
        if isinstance(value, dict):
            for key in ("source", "source_url"):
                if isinstance(value.get(key), str) and value[key].startswith("http"):
                    inherited["source_url"] = value[key]
                    break
            if isinstance(value.get("url"), str) and value["url"].startswith("http"):
                inherited["source_url"] = value["url"]
            if value.get("license"):
                inherited["license_id"] = value["license"]
            if value.get("license_url"):
                inherited["license_url"] = value["license_url"]
            if value.get("attribution_text"):
                inherited["attribution_text"] = value["attribution_text"]
            digest = value.get("sha256")
            if isinstance(digest, str) and re.fullmatch(r"[0-9a-fA-F]{64}", digest):
                source_by_hash[digest.lower()] = dict(inherited)
            if isinstance(value.get("file"), str):
                local_ref = value["file"].replace("\\", "/")
                source_by_path[local_ref] = dict(inherited)
            for child in value.values():
                index_source_tree(child, inherited)
        elif isinstance(value, list):
            for child in value:
                index_source_tree(child, inherited)

    for root in roots:
        for manifest in root.rglob("*.json"):
            if manifest.name not in {"sources.json", "source-record.json", "upstream-catalog.json"}:
                continue
            try:
                source_data = json.loads(manifest.read_text(encoding="utf-8"))
                index_source_tree(source_data)
                if manifest.name == "upstream-catalog.json" and isinstance(source_data, dict):
                    for pack in source_data.get("packs", []):
                        if not isinstance(pack, dict):
                            continue
                        source_data_pack = {"source_url": pack.get("url"), "license": pack.get("license")}
                        for model in pack.get("models", []):
                            if isinstance(model, dict) and model.get("file"):
                                source_by_path[(manifest.parent / model["file"]).resolve().as_posix().lower()] = source_data_pack
            except (UnicodeDecodeError, json.JSONDecodeError):
                continue
    rows = []
    for root in roots:
        for path in sorted(root.rglob("*")):
            if not path.is_file() or path.name.endswith(".part") or path.name.endswith(".part.json"):
                continue
            if "acquisition" in path.relative_to(LIBRARY).parts:
                continue
            relative = path.relative_to(LIBRARY).as_posix()
            digest = sha256_file(path)
            path_ref = path.resolve().as_posix().lower()
            evidence = dict(source_by_hash.get(digest.lower()) or source_by_path.get(path_ref) or {})
            if not evidence:
                for root in (path.parent, *path.parents):
                    if root == LIBRARY.parent or root == LIBRARY:
                        break
                    licenses = [candidate for candidate in root.iterdir() if candidate.is_file() and
                                candidate.name.lower().startswith(("license", "copying", "notice"))]
                    if licenses:
                        evidence = {"license_evidence_path": min(licenses).relative_to(LIBRARY).as_posix()}
                        break
            if evidence.get("license_id") and not evidence.get("license_evidence_path"):
                for ancestor in (path.parent, *path.parents):
                    if ancestor == LIBRARY.parent or ancestor == LIBRARY:
                        break
                    manifests = [candidate for candidate in ancestor.iterdir() if candidate.is_file() and
                                 candidate.name.lower() in {"sources.json", "source-record.json", "upstream-catalog.json"}]
                    if manifests:
                        evidence["license_evidence_path"] = min(manifests).relative_to(LIBRARY).as_posix()
                        break
            record = {"id": "sha256:" + digest, "title": path.stem,
                      "publisher": None, "source_url": evidence.get("source_url"),
                      "download_url": None, "license_id": evidence.get("license_id"),
                      "license_url": evidence.get("license_url"), "license_evidence_path": None,
                      "redistribution_allowed": None, "attribution_text": evidence.get("attribution_text"),
                      "local_path": relative, "sha256": digest, "bytes": path.stat().st_size,
                      "format": path.suffix.lstrip(".").lower() if path.suffix else None,
                      "categories": relative.split("/")[:-1], "tags": [], "style": None,
                      "dimensions_or_scale": None, "animation_names": [], "dependencies": [],
                      "original_or_derived": "original/source-library-file",
                      "source_asset_id": None, "acquisition_date": None,
                      "verification_status": "hash-matched-source-record" if evidence else "local-file-needs-license-reconciliation"}
            record.update(evidence)
            rows.append(record)
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    hash_groups: dict[str, list[str]] = {}
    for row in rows:
        hash_groups.setdefault(row["sha256"], []).append(row["local_path"])
    duplicate_groups = [{"sha256": digest, "paths": sorted(paths)}
                        for digest, paths in sorted(hash_groups.items()) if len(paths) > 1]
    output.write_text(json.dumps({"manifest_version": 1, "retrieved": date.today().isoformat(),
                                  "asset_count": len(rows), "unique_hashes": len(hash_groups),
                                  "duplicate_groups": duplicate_groups,
                                  "assets": rows}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"indexed {len(rows)} files; {len(hash_groups)} unique hashes, {len(duplicate_groups)} duplicate groups -> {output}")
    return 0


def command_inspect_zips(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    results = []
    for archive_path in sorted(root.rglob("*.zip")):
        if "acquisition" in archive_path.relative_to(LIBRARY).parts:
            continue
        entry_types = Counter()
        license_files = []
        executable_files = []
        unsafe_paths = []
        symlink_entries = []
        entry_count = 0
        uncompressed_bytes = 0
        crc_failure = None
        try:
            with zipfile.ZipFile(archive_path) as archive:
                entry_count = len(archive.infolist())
                uncompressed_bytes = sum(member.file_size for member in archive.infolist())
                crc_failure = archive.testzip()
                for member in archive.infolist():
                    try:
                        safe_archive_path(member.filename)
                    except ValueError:
                        unsafe_paths.append(member.filename)
                    suffix = PurePosixPath(member.filename).suffix.lower() or "[no-extension]"
                    entry_types[suffix] += 1
                    if PurePosixPath(member.filename).name.lower() in {"license", "license.txt", "license.md", "copying", "notice", "licenses.txt"}:
                        license_files.append(member.filename)
                    if suffix in {".exe", ".dll", ".bat", ".cmd", ".ps1", ".sh", ".msi", ".com", ".scr", ".jar"}:
                        executable_files.append(member.filename)
                    mode = member.external_attr >> 16
                    if mode & 0o170000 == 0o120000:
                        symlink_entries.append(member.filename)
            status = "crc-failed" if crc_failure else ("unsafe-paths" if unsafe_paths or symlink_entries else "inspected")
        except (OSError, zipfile.BadZipFile) as exc:
            status = "unreadable"
            crc_failure = str(exc)
        results.append({"path": archive_path.relative_to(LIBRARY).as_posix(),
                        "bytes": archive_path.stat().st_size, "sha256": sha256_file(archive_path),
                        "entry_count": entry_count, "uncompressed_bytes": uncompressed_bytes,
                        "formats": dict(sorted(entry_types.items())), "license_files": license_files,
                        "adjacent_license_evidence": [candidate.relative_to(LIBRARY).as_posix()
                                                       for ancestor in (archive_path.parent, *archive_path.parents)
                                                       if ancestor == LIBRARY or LIBRARY in ancestor.parents
                                                       for candidate in ancestor.iterdir()
                                                       if candidate.is_file() and candidate.name.lower().startswith(("license", "copying", "notice"))],
                        "executable_files": executable_files, "unsafe_paths": unsafe_paths,
                        "symlink_entries": symlink_entries, "crc_failure": crc_failure,
                        "status": status})
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    output.write_text(json.dumps({"retrieved": date.today().isoformat(), "archive_count": len(results),
                                  "archives": results}, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    flagged = sum(bool(row["executable_files"] or row["unsafe_paths"] or row["symlink_entries"] or row["crc_failure"]) for row in results)
    print(f"inspected {len(results)} ZIPs; {flagged} contain executable, unsafe, symlink, or CRC findings -> {output}")
    return 1 if any(row["unsafe_paths"] or row["symlink_entries"] or row["crc_failure"] for row in results) else 0


def command_checksums(args: argparse.Namespace) -> int:
    root = Path(args.root).resolve()
    target = root / "SHA256SUMS.txt"
    files = sorted((path for path in root.rglob("*") if path.is_file() and path != target and
                    not path.name.endswith((".part", ".part.json"))),
                   key=lambda path: path.relative_to(root).as_posix())
    body = "".join(f"{sha256_file(path)}  {path.relative_to(root).as_posix()}\n" for path in files)
    target.write_text(body, encoding="utf-8", newline="\n")
    print(f"wrote SHA-256 records for {len(files)} library files -> {target}")
    return 0


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    sub = parser.add_subparsers(dest="command", required=True)
    imp = sub.add_parser("import-list", help="turn the supplied text catalog into JSON source records")
    imp.add_argument("inputs", nargs="+")
    imp.add_argument("--output", default=str(LIBRARY / "acquisition" / "sources.json"))
    imp.set_defaults(func=command_import)
    acquire = sub.add_parser("acquire", help="download one explicitly verified, redistributable source")
    acquire.add_argument("id")
    acquire.add_argument("--manifest", default=str(LIBRARY / "acquisition" / "sources.json"))
    acquire.add_argument("--extract", action="store_true")
    acquire.set_defaults(func=command_acquire)
    audit = sub.add_parser("audit", help="index files and source records already inside the library")
    audit.add_argument("roots", nargs="*", default=[str(LIBRARY)])
    audit.add_argument("--output", default=str(LIBRARY / "acquisition" / "asset-manifest.json"))
    audit.set_defaults(func=command_audit)
    inspect = sub.add_parser("inspect-zips", help="scan ZIPs for CRC/path/symlink/executable/license records")
    inspect.add_argument("root", nargs="?", default=str(LIBRARY))
    inspect.add_argument("--output", default=str(LIBRARY / "acquisition" / "archive-audit.json"))
    inspect.set_defaults(func=command_inspect_zips)
    checksums = sub.add_parser("checksums", help="refresh the library-wide SHA256SUMS.txt")
    checksums.add_argument("root", nargs="?", default=str(LIBRARY))
    checksums.set_defaults(func=command_checksums)
    args = parser.parse_args()
    try:
        return args.func(args)
    except Exception as exc:
        print(f"asset acquisition failed: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    raise SystemExit(main())
