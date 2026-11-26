"""Ensure all standalone projects and catalog launch paths have documentation."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
REQUIRED = ("README.md", "SPEC.md", "ROADMAP.md", "STATUS.md")
DOC_BASE = "https://github.com/euclidi/euclidi-games/blob/main/"
errors = []
projects = {p.parent for p in ROOT.glob("*/index.html") if not p.parent.name.startswith(".")}
class Catalog(HTMLParser):
    def __init__(self):
        super().__init__()
        self.card = None
        self.cards = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "article" and "game" in a.get("class", "").split():
            self.card = {"name": a.get("data-name", "(unnamed)"), "links": [], "docs": []}
        elif tag == "a" and self.card is not None:
            href = a.get("href", "")
            if href.startswith("./") and href != "./":
                self.card["links"].append(href)
            elif href.startswith(DOC_BASE):
                self.card["docs"].append(href.removeprefix(DOC_BASE))
    def handle_endtag(self, tag):
        if tag == "article" and self.card is not None:
            self.cards.append(self.card)
            self.card = None
c = Catalog()
c.feed((ROOT / "index.html").read_text(encoding="utf-8"))
if not c.cards:
    errors.append("No catalog cards found")
for card in c.cards:
    roots = set()
    for href in card["links"]:
        path = ROOT / unquote(urlsplit(href).path)
        if path.is_dir() and (path / "index.html").is_file():
            projects.add(path)
            roots.add(path)
        elif path.is_file():
            # A legacy HTML page belongs to its top-level project.
            root = ROOT / path.relative_to(ROOT).parts[0]
            if (root / "index.html").is_file():
                projects.add(root)
                roots.add(root)
        else:
            errors.append(f'{card["name"]}: missing launch {href}')
    if not roots:
        errors.append(f'{card["name"]}: no valid launch path')
    for doc in REQUIRED:
        allowed = {(p / doc).relative_to(ROOT).as_posix() for p in roots}
        if not allowed.intersection(card["docs"]):
            errors.append(f'{card["name"]}: missing project link to {doc}')
readme = (ROOT / "README.md").read_text(encoding="utf-8")
for p in sorted(projects):
    for doc in REQUIRED:
        f = p / doc
        rel = f.relative_to(ROOT).as_posix()
        if not f.is_file() or len(f.read_text(encoding="utf-8").strip()) < 120:
            errors.append(f"Missing or insubstantial document: {rel}")
        if "(" + rel + ")" not in readme:
            errors.append(f"Missing root README documentation index link: {rel}")
    print("CHECK", p.relative_to(ROOT))
if errors:
    raise SystemExit("\n".join(errors))
print(f"PASS: {len(projects)} documented build directories, {len(c.cards)} catalog cards")
