"""Fetch CC0 candidate archives, validate contents, and build a nearest-neighbor review sheet.
Intake is not approval for production. No assets are installed in the runtime."""
from pathlib import Path, PurePosixPath
import hashlib, io, json, urllib.request, zipfile, time
from PIL import Image, ImageDraw
ROOT=Path(__file__).resolve().parents[1]/"asset-review"
ROOT.mkdir(exist_ok=True)
PACKS=[
 ("industrial","https://opengameart.org/sites/default/files/kenney_pixelplatformerindustrialexpansion.zip","https://opengameart.org/content/pixel-platformer-industrial-expansion"),
 ("impact","https://kenney.nl/media/pages/assets/impact-sounds/87b4ddecda-1677589768/kenney_impact-sounds.zip","https://kenney.nl/assets/impact-sounds")
]
records=[]
errors=[]
for name,url,source in PACKS:
    try:
        request=urllib.request.Request(url,headers={"User-Agent":"BrickBreakerAssetReview/1.0"})
        for attempt in range(3):
            try:
                with urllib.request.urlopen(request,timeout=45) as response:
                    data=response.read(20_000_001)
                    content_type=response.headers.get("Content-Type","unknown")
                if not zipfile.is_zipfile(io.BytesIO(data)):
                    raise ValueError(f"non-ZIP response: {content_type}, {len(data)} bytes")
                break
            except Exception as exc:
                print(f"{name}: attempt {attempt+1}/3: {exc}",flush=True)
                if attempt==2:
                    raise
                time.sleep(2**attempt)
        if len(data)>20_000_000:
            raise ValueError("archive exceeds size limit")
        with zipfile.ZipFile(io.BytesIO(data)) as archive:
            infos=[i for i in archive.infolist() if not i.is_dir()]
            if sum(i.file_size for i in infos)>100_000_000 or len(infos)>2000:
                raise ValueError("archive expansion exceeds limit")
            if archive.testzip() is not None:
                raise ValueError("archive CRC failure")
            entries=[]
            previews=[]
            for info in infos:
                p=PurePosixPath(info.filename.replace("\\","/"))
                if p.is_absolute() or ".." in p.parts or any(":" in part for part in p.parts):
                    raise ValueError("unsafe archive path")
                payload=archive.read(info)
                entry={"path":info.filename,"bytes":len(payload),"sha256":hashlib.sha256(payload).hexdigest()}
                if p.suffix.lower()==".png":
                    with Image.open(io.BytesIO(payload)) as im:
                        im.load()
                        entry["pixels"]=list(im.size)
                        if im.width<=128 and im.height<=128:
                            previews.append((p.name,im.convert("RGBA")))
                entries.append(entry)
            (ROOT/f"{name}.zip").write_bytes(data)
            if previews:
                cols=8; cell=144; rows=(len(previews)+cols-1)//cols
                sheet=Image.new("RGB",(cols*cell,rows*cell),"#303238")
                draw=ImageDraw.Draw(sheet)
                for j,(label,im) in enumerate(previews):
                    x=(j%cols)*cell;y=(j//cols)*cell
                    factor=max(1,min(6,112//max(im.size)))
                    im=im.resize((im.width*factor,im.height*factor),Image.Resampling.NEAREST)
                    sheet.paste(im,(x+(cell-im.width)//2,y+4+(112-im.height)//2),im)
                    draw.text((x+4,y+120),label[:19],fill="white")
                sheet.save(ROOT/f"{name}-contact-sheet.png")
            print(f"{name}: validated {len(entries)} files",flush=True)
            records.append({"pack":name,"url":url,"source":source,"publisher_license":"CC0","archive_sha256":hashlib.sha256(data).hexdigest(),"entries":entries,"production_approved":False})
    except Exception as exc:
        errors.append({"pack":name,"error":str(exc)})
        print(f"{name}: FAILED: {exc}",flush=True)
(ROOT/"manifest.json").write_text(json.dumps({"records":records,"errors":errors},indent=2),encoding="utf-8")
if errors:
    raise SystemExit("Asset intake incomplete; inspect manifest.json")
