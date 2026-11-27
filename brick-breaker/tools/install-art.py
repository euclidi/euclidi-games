"""Acquire the exact public CC0 candidate art. No asset substitutions."""
import hashlib, io, zipfile, urllib.request, json
from pathlib import Path
url="https://opengameart.org/sites/default/files/64x.zip"
names=["Bricks","Stone","Planks","Glass","Iron","Sand","WaterF1","WoolSnow","CrateOver","LavaF1","Mud","Ice"]
request=urllib.request.Request(url,headers={"User-Agent":"ImpactWorksAssetIntake/1.0"})
with urllib.request.urlopen(request,timeout=45) as f: data=f.read(10_000_001)
assert len(data)<=10_000_000
out=Path(__file__).resolve().parents[1]/"assets"/"materials"
out.mkdir(parents=True,exist_ok=True)
with zipfile.ZipFile(io.BytesIO(data)) as z:
    assert z.testzip() is None
    manifest={"source":"https://lpc.opengameart.org/content/64x-textures-an-overlays","author":"FacadeGaikan","license":"CC0 per publisher","archive_sha256":hashlib.sha256(data).hexdigest(),"files":{}}
    for name in names:
        raw=z.read("64x/"+name+".png")
        assert raw[:8]==b"\x89PNG\r\n\x1a\n" and int.from_bytes(raw[16:20],"big")==64 and int.from_bytes(raw[20:24],"big")==64
        (out/(name+".png")).write_bytes(raw)
        manifest["files"][name+".png"]=hashlib.sha256(raw).hexdigest()
    (out/"LICENSE.json").write_text(json.dumps(manifest,indent=2))

# Previously acquired and decoded CC0 audio archive, pinned to the reviewed bytes.
sound_url="https://opengameart.org/sites/default/files/sfx_breaking_and_falling.zip"
with urllib.request.urlopen(urllib.request.Request(sound_url,headers={"User-Agent":"ImpactWorksAssetIntake/1.0"}),timeout=45) as f: sound=f.read(10_000_001)
assert hashlib.sha256(sound).hexdigest()=="e6ee04d91c5f4d30cfda1260d2c9d1faf96fda36319287215fbd07bcb1a80451"
sounds=out.parent/"sound"
sounds.mkdir(exist_ok=True)
with zipfile.ZipFile(io.BytesIO(sound)) as z:
    assert z.testzip() is None
    manifest={"author":"rubberduck","source":"https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx","license":"CC0 per publisher","files":{}}
    names=z.namelist()
    assert len(names)==75
    for name in names:
        assert Path(name).name==name and name.endswith(".ogg")
        raw=z.read(name);assert raw[:4]==b"OggS"
        (sounds/name).write_bytes(raw);manifest["files"][name]=hashlib.sha256(raw).hexdigest()
    (sounds/"LICENSE.json").write_text(json.dumps(manifest,indent=2))
