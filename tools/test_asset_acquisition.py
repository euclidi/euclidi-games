import hashlib
import re
import tempfile
import threading
import unittest
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path

import asset_acquisition
from asset_acquisition import assert_redistributable, persistent_download_url, safe_archive_path


class AcquisitionPolicyTests(unittest.TestCase):
    def test_license_must_be_explicitly_verified_for_redistribution(self):
        record = {
            "redistribution_allowed": True,
            "license_verified": True,
            "license_id": "CC0-1.0",
            "license_url": "https://creativecommons.org/publicdomain/zero/1.0/",
        }
        self.assertTrue(assert_redistributable(record))
        record["redistribution_allowed"] = False
        with self.assertRaisesRegex(ValueError, "redistribution"):
            assert_redistributable(record)

    def test_unverified_license_label_does_not_authorize_download(self):
        with self.assertRaisesRegex(ValueError, "verified"):
            assert_redistributable({"license_id": "CC0-1.0", "redistribution_allowed": True})

    def test_billiards_parser_keeps_claim_unverified_and_captures_urls(self):
        source = asset_acquisition.LIBRARY / "acquisition" / "source-lists" / "euclidi-billiards-free-asset-manifest.txt"
        rows = asset_acquisition.parse_billiards_manifest(source)
        by_id = {row["id"]: row for row in rows}
        self.assertIn("billiards-BIL-001", by_id)
        self.assertEqual(by_id["billiards-BIL-001"]["source_url"], "https://opengameart.org/content/billiards-pack")
        self.assertFalse(by_id["billiards-BIL-001"]["license_verified"])
        self.assertFalse(by_id["billiards-BIL-001"]["redistribution_allowed"])
        self.assertEqual(len([key for key in by_id if key.startswith("billiards-TECH-")]), 15)

    def test_kinetic_parser_namespaces_sources_and_marks_holds(self):
        source = asset_acquisition.LIBRARY / "acquisition" / "source-lists" / "euclidi-games-asset-acquisition-manifest.txt"
        rows = asset_acquisition.parse_kinetic_manifest(source)
        by_id = {row["id"]: row for row in rows}
        self.assertIn("kinetic-A01", by_id)
        self.assertEqual(by_id["kinetic-A01"]["target_path"], "foundations-3d/quaternius/medieval-village-megakit")
        self.assertEqual(len([key for key in by_id if re.fullmatch(r"kinetic-[A-F]\d\d", key)]), 75)
        self.assertTrue(by_id["kinetic-H07"]["status"].startswith("held"))

    def test_review_marks_exact_source_evidence_but_blocks_quaternius_unknowns(self):
        kinetic = asset_acquisition.parse_kinetic_manifest(asset_acquisition.LIBRARY / "acquisition" / "source-lists" / "euclidi-games-asset-acquisition-manifest.txt")
        billiards = asset_acquisition.parse_billiards_manifest(asset_acquisition.LIBRARY / "acquisition" / "source-lists" / "euclidi-billiards-free-asset-manifest.txt")
        rows = kinetic + billiards
        asset_acquisition.apply_source_review(rows)
        by_id = {row["id"]: row for row in rows}
        self.assertTrue(by_id["kinetic-A04"]["redistribution_allowed"])
        self.assertEqual(by_id["kinetic-A01"]["status"], "license-review-required")
        self.assertTrue(by_id["billiards-BIL-001"]["redistribution_allowed"])
        self.assertFalse(by_id["billiards-TECH-002"]["redistribution_allowed"])

    def test_archive_path_rejects_traversal_and_absolute_paths(self):
        self.assertEqual(safe_archive_path("sprites/player.png").as_posix(), "sprites/player.png")
        for unsafe in ("../outside.txt", "C:/outside.txt", "/outside.txt", "sprites/../../outside"):
            with self.subTest(unsafe=unsafe), self.assertRaises(ValueError):
                safe_archive_path(unsafe)

    def test_short_lived_signed_url_is_not_saved_as_manifest_source(self):
        self.assertIsNone(persistent_download_url("https://cdn.example/file.zip?X-Amz-Signature=secret&expires=30"))
        self.assertEqual(persistent_download_url("https://opengameart.org/files/pack.zip"),
                         "https://opengameart.org/files/pack.zip")

    def test_interrupted_download_resumes_and_unchanged_file_is_skipped(self):
        payload = b"asset bytes for a resumable transfer"
        expected = hashlib.sha256(payload).hexdigest()
        stats = {"get": 0, "range": [], "interrupt": True}

        class Handler(BaseHTTPRequestHandler):
            def do_HEAD(self):
                self.send_response(200)
                self.send_header("ETag", '"asset-v1"')
                self.send_header("Content-Length", str(len(payload)))
                self.end_headers()

            def do_GET(self):
                stats["get"] += 1
                start = int(self.headers.get("Range", "bytes=0-").split("=")[1].split("-")[0])
                stats["range"].append(start)
                self.send_response(206 if start else 200)
                self.send_header("ETag", '"asset-v1"')
                self.send_header("Content-Length", str(len(payload) - start))
                if start:
                    self.send_header("Content-Range", f"bytes {start}-{len(payload)-1}/{len(payload)}")
                self.end_headers()
                if stats["interrupt"]:
                    stats["interrupt"] = False
                    self.wfile.write(payload[:8])
                    self.wfile.flush()
                    self.connection.shutdown(1)
                    return
                self.wfile.write(payload[start:])

            def log_message(self, *_):
                pass

        server = ThreadingHTTPServer(("127.0.0.1", 0), Handler)
        thread = threading.Thread(target=server.serve_forever, daemon=True)
        thread.start()
        test_root = Path(tempfile.mkdtemp(prefix="asset-acquisition-test-", dir=asset_acquisition.LIBRARY))
        destination = test_root / "sample.bin"
        url = f"http://127.0.0.1:{server.server_port}/asset?signature=first"
        refreshed_url = f"http://127.0.0.1:{server.server_port}/asset?signature=refreshed"
        source_key = "https://example.invalid/source-page"
        try:
            with self.assertRaises(Exception):
                asset_acquisition.download_resumable(url, destination, expected, stable_source=source_key)
            size, digest = asset_acquisition.download_resumable(refreshed_url, destination, expected, stable_source=source_key)
            self.assertEqual((size, digest), (len(payload), expected))
            self.assertEqual(destination.read_bytes(), payload)
            self.assertEqual(stats["range"], [0, 8])
            asset_acquisition.download_resumable(refreshed_url, destination, expected, stable_source=source_key)
            self.assertEqual(stats["get"], 2)
        finally:
            server.shutdown()
            server.server_close()
            thread.join(timeout=2)
            for item in test_root.rglob("*"):
                if item.is_file():
                    item.unlink()
            test_root.rmdir()


if __name__ == "__main__":
    unittest.main()
