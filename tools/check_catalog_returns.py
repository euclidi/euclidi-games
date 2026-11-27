"""Require direct, accessible catalog return links on each playable entry."""
from html.parser import HTMLParser
from pathlib import Path
from urllib.parse import urlsplit, unquote

ROOT = Path(__file__).resolve().parents[1]
CATALOG = "https://euclidi.github.io/euclidi-games/"

class Links(HTMLParser):
    def __init__(self):
        super().__init__(convert_charrefs=True)
        self.links = []
        self.current = None
        self.in_card = False
        self.routes = []
    def handle_starttag(self, tag, attrs):
        a = dict(attrs)
        if tag == "article" and "game" in a.get("class", "").split():
            self.in_card = True
        if tag == "a":
            href = a.get("href", "")
            if self.in_card and href.startswith("./") and href != "./":
                self.routes.append(href)
            if "data-catalog-return" in a:
                self.current = {"href": href, "label": a.get("aria-label", ""), "text": "", "hidden": "hidden" in a}
                self.links.append(self.current)
    def handle_data(self, data):
        if self.current is not None:
            self.current["text"] += data
    def handle_endtag(self, tag):
        if tag == "a":
            self.current = None
        if tag == "article":
            self.in_card = False

def entry_for(href):
    p = (ROOT / unquote(urlsplit(href).path)).resolve()
    if not p.is_relative_to(ROOT):
        raise ValueError("Launch escapes catalog: " + href)
    return p / "index.html" if p.is_dir() else p

def valid_link(p, link):
    u = urlsplit(link["href"])
    if link["hidden"] or not (link["label"].strip() and link["text"].strip()) or u.query or u.fragment:
        return False
    if u.scheme or u.netloc:
        return link["href"] == CATALOG
    if not u.path:
        return False
    return (p.parent / unquote(u.path)).resolve() in (ROOT, ROOT / "index.html")

def main():
    catalog = Links()
    catalog.feed((ROOT / "index.html").read_text(encoding="utf-8"))
    entries = {p for p in ROOT.glob("*/index.html") if not p.parent.name.startswith(".")}
    entries.update(entry_for(h) for h in catalog.routes)
    for p in list(entries):
        if p.is_file():
            entries.update(x for x in p.parent.rglob("index.html") if not any(part in ("node_modules", "vendor", "assets", ".git") for part in x.relative_to(ROOT).parts))
    errors = []
    if not entries:
        errors.append("No game entries found")
    for p in sorted(entries):
        if not p.is_file():
            errors.append("Missing entry: " + str(p))
            continue
        links = Links()
        links.feed(p.read_text(encoding="utf-8"))
        if not any(valid_link(p, l) for l in links.links):
            errors.append(f"{p.relative_to(ROOT)}: missing labeled data-catalog-return anchor targeting catalog root")
        else:
            print("PASS", p.relative_to(ROOT))
    if errors:
        raise SystemExit("\n".join(errors))
    print(f"PASS: {len(entries)} game entry routes have a catalog return link")

if __name__ == "__main__":
    main()
