#!/usr/bin/env python3
"""Vendor selected CC0 artwork for EXOHOSTILE. Requires Python 3.10+ and network."""
import hashlib, json, pathlib, urllib.request, urllib.parse, concurrent.futures
ROOT=pathlib.Path(__file__).resolve().parent / "assets"
UA="EuclidiGames-EXOHOSTILE-AssetPipeline/0.2"
TEXTURES=["metal_plate","metal_plate_02","galvanized_sheet_metal"]
MODELS=["worn_metal_rack","plastic_crate_02","classic_laptop","caged_hanging_light"]
def request(url):
    with urllib.request.urlopen(urllib.request.Request(url,headers={"User-Agent":UA}),timeout=90) as r:
        return r.read()
def fetch(entry, destination):
    destination=destination.resolve()
    if not destination.is_relative_to(ROOT.resolve()):
        raise ValueError("Unsafe dependency path")
    data=request(entry["url"])
    if entry.get("size") is not None and entry["size"]!=len(data):
        raise ValueError("Size mismatch: "+str(destination))
    md5=hashlib.md5(data).hexdigest()
    if entry.get("md5") and entry["md5"]!=md5:
        raise ValueError("Checksum mismatch: "+str(destination))
    destination.parent.mkdir(parents=True,exist_ok=True)
    destination.write_bytes(data)
    return {"path":str(destination.relative_to(ROOT.resolve())),"url":entry["url"],"bytes":len(data),"sha256":hashlib.sha256(data).hexdigest()}
def source(asset):
    meta=json.loads(request("https://api.polyhaven.com/files/"+asset))
    folder=ROOT/asset
    records=[]
    if asset in TEXTURES:
        for ch in ("diff","nor_gl","rough","metal"):
            entry=meta.get(ch,{}).get("1k",{}).get("jpg")
            if entry:
                records.append(fetch(entry,folder/(asset+"_"+ch+"_1k.jpg")))
            elif ch=="diff":
                raise ValueError("Missing diffuse: "+asset)
    else:
        entry=meta["gltf"]["1k"]["gltf"]
        records.append(fetch(entry,folder/(asset+"_1k.gltf")))
        for rel,dep in entry.get("include",{}).items():
            rel=urllib.parse.unquote(rel)
            records.append(fetch(dep,folder/rel))
        document=json.loads((folder/(asset+"_1k.gltf")).read_text())
        for item in document.get("buffers",[])+document.get("images",[]):
            uri=item.get("uri","")
            if uri and not uri.startswith("data:") and not (folder/urllib.parse.unquote(uri)).exists():
                raise ValueError("Missing glTF dependency: "+uri)
    return {"id":asset,"license":"CC0","source":"https://polyhaven.com/a/"+asset,"files":records}
def main():
    ROOT.mkdir(parents=True,exist_ok=True)
    records=[]
    errors={}
    with concurrent.futures.ThreadPoolExecutor(max_workers=3) as pool:
        futures={pool.submit(source,a):a for a in TEXTURES+MODELS}
        for f in concurrent.futures.as_completed(futures):
            a=futures[f]
            try:
                records.append(f.result())
                print("OK",a,flush=True)
            except Exception as e:
                errors[a]=str(e)
                print("FAILED",a,e,flush=True)
    (ROOT/"provenance.json").write_text(json.dumps({"assets":sorted(records,key=lambda x:x["id"]),"errors":errors},indent=2)+"\n")
    if errors:
        raise SystemExit(1)
if __name__=="__main__":
    main()
