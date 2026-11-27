#!/usr/bin/env python3
"""Acquire audited Poly Haven assets at build time, never in the player runtime."""
import hashlib, json, pathlib, tempfile, shutil, urllib.request, urllib.parse
from PIL import Image

ROOT = pathlib.Path(__file__).resolve().parent
PLAN = json.loads((ROOT / "asset-plan.json").read_text())
UA = "EuclidiGames-DraculaTheVigil/0.13 (https://github.com/euclidi/euclidi-games)"
def get(url, maxbytes):
    parsed = urllib.parse.urlsplit(url)
    if parsed.scheme != "https" or parsed.hostname not in {"api.polyhaven.com","dl.polyhaven.org","cdn.polyhaven.com"}:
        raise ValueError("Unexpected asset host: " + url)
    with urllib.request.urlopen(urllib.request.Request(url, headers={"User-Agent":UA}), timeout=40) as response:
        final = urllib.parse.urlsplit(response.geturl())
        if final.scheme != "https" or final.hostname not in {"api.polyhaven.com","dl.polyhaven.org","cdn.polyhaven.com"}:
            raise ValueError("Unexpected redirect: " + response.geturl())
        b = response.read(maxbytes+1)
        if len(b)>maxbytes: raise ValueError("File too large")
        return b

def main():
    with tempfile.TemporaryDirectory(dir=ROOT) as tmp:
        stage = pathlib.Path(tmp)
        records=[]
        for asset in PLAN["materials"]:
            slug=asset["id"]
            data=json.loads(get("https://api.polyhaven.com/files/"+slug,2_000_000))
            for role in asset["maps"]:
                item=data[role]["1k"]["jpg"]
                body=get(item["url"],4_000_000)
                if item.get("size") is not None and len(body)!=int(item["size"]):
                    raise ValueError("Size mismatch: "+slug+"/"+role)
                if item.get("md5") and hashlib.md5(body).hexdigest()!=item["md5"].lower():
                    raise ValueError("Source checksum mismatch: "+slug+"/"+role)
                name=f"{slug}-{role}.jpg"
                (stage/name).write_bytes(body)
                with Image.open(stage/name) as im:
                    if im.format!="JPEG" or max(im.size)>2048 or min(im.size)<256:
                        raise ValueError("Invalid texture dimensions/format: "+name)
                    size=list(im.size); im.verify()
                records.append(dict(asset=slug, map=role, file=name, source=item["url"], bytes=len(body), sha256=hashlib.sha256(body).hexdigest(), dimensions=size, license="CC0-1.0"))
        if len(records)!=8: raise ValueError("Incomplete material batch")
        (stage/"manifest.json").write_text(json.dumps({"schema":1,"provider":"Poly Haven","license":"CC0-1.0","files":records},indent=2)+"\n")
        dest=ROOT/"assets"
        dest.mkdir(exist_ok=True)
        for p in stage.iterdir(): shutil.copy2(p,dest/p.name)
        print("Acquired and validated",len(records),"maps,",sum(r["bytes"] for r in records),"bytes")
if __name__=="__main__": main()
