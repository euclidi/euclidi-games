"""Publish real captured frames and verify the catalog's cover contract."""
import argparse, hashlib, html, json, re
from pathlib import Path
from urllib.parse import urlsplit, unquote
from PIL import Image, ImageStat

ROOT = Path(__file__).resolve().parents[1]
INDEX = ROOT / "index.html"
COVERS = ROOT / "covers"
MANIFEST = COVERS / "manifest.json"
CARD = re.compile(r'<article class="game"\b[\s\S]*?</article>')
# A space after the class attribute is used by the current HTML. Match it explicitly.
CARD = re.compile(r'<article\b[^>]*\bclass="game"[^>]*>[\s\S]*?</article>')
COVER = re.compile(r'<a\b[^>]*\bclass="cover"[^>]*>[\s\S]*?</a>')
def attr(tag, key):
    m = re.search(r'\b'+re.escape(key)+r'="([^"]*)"', tag.split(">",1)[0])
    return html.unescape(m[1]) if m else ""
def play(card):
    m = re.search(r'<a\b[^>]*\bclass="play"[^>]*>',card)
    return attr(m[0],"href") if m else ""
def load_manifest():
    return json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {}
def safe_path(src):
    u=urlsplit(src)
    if u.scheme or u.netloc or not u.path.startswith("./covers/"):
        raise ValueError("Cover must be a local file under covers/")
    p=(ROOT/unquote(u.path)).resolve()
    if not p.is_relative_to(COVERS.resolve()):
        raise ValueError("Cover escapes directory")
    return p
def verify(text,manifest):
    errors=[]
    count=0
    names=set()
    for card in CARD.findall(text):
        count+=1
        name=attr(card,"data-name")
        if not name or name in names: errors.append("Missing or duplicate card identity: "+name)
        names.add(name)
        covers=COVER.findall(card)
        if len(covers)!=1:
            errors.append(name+": expected exactly one cover");continue
        cover=covers[0]
        kind=attr(cover,"data-cover-kind")
        imgs=re.findall(r'<img\b[^>]*>',cover)
        if kind not in ("gameplay","box-art") or len(imgs)!=1:
            errors.append(name+": missing gameplay screenshot or approved box art");continue
        try:
            src=attr(imgs[0],"src")
            p=safe_path(src)
            if not attr(imgs[0],"alt"): raise ValueError("Missing descriptive alt text")
            if not p.is_file(): raise ValueError("Missing image "+src)
            with Image.open(p) as im:
                im.verify()
            with Image.open(p) as im:
                if im.width<320 or im.height<180: raise ValueError("Image too small")
                if max(ImageStat.Stat(im.convert("RGB")).stddev)<8: raise ValueError("Nearly blank frame")
            rec=manifest.get(name,{})
            if rec.get("kind")!=kind or rec.get("file")!=p.relative_to(ROOT).as_posix() or rec.get("sha256")!=hashlib.sha256(p.read_bytes()).hexdigest():
                raise ValueError("Missing or mismatched cover provenance")
            if rec.get("route")!=play(card): raise ValueError("Cover source route does not match Play link")
            if kind=="gameplay" and not rec.get("source"): raise ValueError("Missing capture source revision")
            if kind=="box-art" and not rec.get("approval"): raise ValueError("Missing owner approval record")
            if re.sub(r'<img\b[^>]*>','',cover).split(">",1)[1].rsplit("</a>",1)[0].strip(): raise ValueError("Unexpected overlay or text-only cover content")
        except Exception as e: errors.append(name+": "+str(e))
    if not count: errors.append("Catalog has no cards")
    for error in errors: print("FAIL",error)
    print(f"{count-len([n for n in names if any(e.startswith(n+':') for e in errors)])}/{count} cover records checked; {len(errors)} errors")
    return errors
def publish(folder):
    COVERS.mkdir(exist_ok=True)
    report=json.loads((folder/"captures.json").read_text())
    manifest=load_manifest()
    records={r["name"]:r for r in report["records"]}
    for r in report["failed"]: print("CAPTURE FAILURE",r["name"],r["error"])
    def update(m):
        card=m[0];name=attr(card,"data-name")
        r=records.get(name)
        if not r:return card
        if r["route"]!=play(card):
            print("SKIP changed launch route",name);return card
        old=COVER.search(card)
        if not old or attr(old[0],"data-cover-kind")=="box-art":return card
        if not re.fullmatch(r"[a-z0-9-]+",r["slug"]):raise ValueError("Invalid slug")
        try:
            with Image.open(folder/r["file"]) as im:
                rgb=im.convert("RGB")
                if min(rgb.size)<100 or max(ImageStat.Stat(rgb).stddev)<8 or rgb.entropy()<2:
                    raise ValueError("Capture appears blank or too small")
                original=list(rgb.size)
                # Keep the entire gameplay frame. Letterbox rather than cropping or stretching it.
                ratio=min(800/rgb.width,500/rgb.height)
                scaled=rgb.resize((max(1,round(rgb.width*ratio)),max(1,round(rgb.height*ratio))),Image.Resampling.LANCZOS)
                output=Image.new("RGB",(800,500),(17,17,17))
                output.paste(scaled,((800-scaled.width)//2,(500-scaled.height)//2))
                dst=COVERS/(r["slug"]+"-gameplay.webp")
                output.save(dst,"WEBP",quality=88,method=6)
            rel=dst.relative_to(ROOT).as_posix()
            src="./"+rel
            label=html.escape(r["title"]+" gameplay screenshot",quote=True)
            href=html.escape(r["route"],quote=True)
            markup=f'<a class="cover" href="{href}" aria-label="Open {html.escape(r["title"],quote=True)}" data-cover-kind="gameplay"><img src="{src}" alt="{label}" width="800" height="500" loading="lazy" decoding="async"></a>'
            manifest[name]={"kind":"gameplay","file":rel,"route":r["route"],"source":r["source"],"selector":r["selector"],"viewport":r["viewport"],"original_size":original,"sha256":hashlib.sha256(dst.read_bytes()).hexdigest()}
            print("PUBLISHED FRAME",name,rel)
            return card[:old.start()]+markup+card[old.end():]
        except Exception as e:
            print("REJECTED FRAME",name,e)
            return card
    text=CARD.sub(update,INDEX.read_text())
    INDEX.write_text(text)
    MANIFEST.write_text(json.dumps(manifest,indent=2,sort_keys=True)+"\n")
    return verify(text,manifest)
def main():
    p=argparse.ArgumentParser()
    p.add_argument("--captures",type=Path)
    p.add_argument("--check",action="store_true")
    p.add_argument("--allow-incomplete",action="store_true",help="Only for first capture migration; never a passing strict audit.")
    a=p.parse_args()
    errors=publish(a.captures) if a.captures else verify(INDEX.read_text(),load_manifest())
    if errors and not a.allow_incomplete: raise SystemExit(1)
if __name__=="__main__":main()
