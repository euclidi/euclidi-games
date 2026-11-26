"""Acquisition and review of FacadeGaikan's CC0 64x material textures.
Preserve original pixels; atlas is a candidate, not approved artwork."""
import hashlib, io, json, urllib.request, zipfile
from pathlib import Path, PurePosixPath
from PIL import Image, ImageDraw
source="https://lpc.opengameart.org/content/64x-textures-an-overlays"
urls=["https://opengameart.org/sites/default/files/64x.zip","https://lpc.opengameart.org/sites/default/files/64x.zip"]
out=Path(__file__).resolve().parents[1]/"texture-review"
out.mkdir(exist_ok=True)
errors=[]
for url in urls:
    try:
        req=urllib.request.Request(url,headers={"User-Agent":"BrickBreakerAssetReview/1.0"})
        with urllib.request.urlopen(req,timeout=40) as response:
            raw=response.read(10_000_001)
        if len(raw)>10_000_000 or not zipfile.is_zipfile(io.BytesIO(raw)):
            raise ValueError("invalid or excessive archive")
        break
    except Exception as exc:
        errors.append(f"{url}: {exc}")
else:
    (out/"errors.json").write_text(json.dumps(errors,indent=2))
    raise SystemExit("Texture archive not available")
tiles=[]
with zipfile.ZipFile(io.BytesIO(raw)) as z:
    entries=[f for f in z.infolist() if not f.is_dir()]
    if len(entries)>1000 or sum(f.file_size for f in entries)>100_000_000 or z.testzip():
        raise ValueError("archive integrity/size check failed")
    for f in sorted(entries,key=lambda f:f.filename):
        p=PurePosixPath(f.filename.replace("\\","/"))
        if p.is_absolute() or ".." in p.parts or any(":" in x for x in p.parts):
            raise ValueError("unsafe path")
        if p.suffix.lower() not in {".png",".bmp",".tga",".jpg",".jpeg"}:
            continue
        data=z.read(f)
        with Image.open(io.BytesIO(data)) as im:
            if im.size==(64,64):
                tiles.append((str(p),hashlib.sha256(data).hexdigest(),im.convert("RGBA")))
if not tiles or len(tiles)>128:
    raise ValueError(f"unexpected 64x64 candidate count: {len(tiles)}")
(out/"source.zip").write_bytes(raw)
# Fixed 1024x512 RGBA8 transport dimensions; enough for 128 64x64 tiles.
atlas=Image.new("RGBA",(1024,512))
records=[]
for i,(name,digest,im) in enumerate(tiles):
    x=(i%16)*64;y=(i//16)*64
    atlas.paste(im,(x,y))
    assert atlas.crop((x,y,x+64,y+64)).tobytes()==im.tobytes()
    records.append({"source":name,"source_sha256":digest,"x":x,"y":y,"w":64,"h":64})
atlas.save(out/"material-atlas.png")
payload=atlas.tobytes()
(out/"material-atlas.rgba").write_bytes(payload)
assert len(payload)==2097152
# A native-resolution review sheet: 1x source + 2x nearest sampling.
# No filtering, recoloring or implied runtime screenshot.
for start in range(0,len(tiles),24):
    board=Image.new("RGB",(1280,720),"#202326")
    d=ImageDraw.Draw(board)
    d.text((24,16),"BRICK BREAKER / MATERIAL CANDIDATES / 64x64 at 1x and 2x",fill="#e7e5de")
    for i,(name,_,im) in enumerate(tiles[start:start+24]):
        x=24+(i%6)*208;y=50+(i//6)*164
        board.paste(im,(x,y+32),im)
        large=im.resize((128,128),Image.Resampling.NEAREST)
        board.paste(large,(x+72,y),large)
        d.text((x,y+130),Path(name).stem[:30],fill="#d0d0d0")
    board.save(out/f"review-{start//24+1:02d}.png")
manifest={"author":"FacadeGaikan","source":source,"download_url":url,"publisher_license":"CC0","archive_sha256":hashlib.sha256(raw).hexdigest(),"atlas_sha256":hashlib.sha256(payload).hexdigest(),"atlas_format":"RGBA8 1024x512 tightly packed","tiles":records,"production_approved":False}
(out/"manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
print(f"Acquired {len(tiles)} native 64x64 textures. All atlas pixel copies verified.")
