"""Extract only the candidate QA geometry from the existing checked-in CC0 catalog."""
from pathlib import Path
from zipfile import ZipFile
import json,hashlib,shutil
ROOT=Path(__file__).resolve().parents[2]
LIB=ROOT/"assets/resource-library/foundations-3d/kenney-full"
OUT=ROOT/"kinetic/qa/generated/models"
SELECT={"castle-kit":["wall.glb","tower-square.glb","gate.glb"],"nature-kit":["tree-default.glb","rock-smalla.glb"],"food-kit":["barrel.glb","apple.glb"]}
rows={x["pack"]:x for x in json.loads((LIB/"manifest.json").read_text())["packs"]}
for pack,names in SELECT.items():
    row=rows[pack]; archive=LIB/"packs"/row["archive"]
    assert hashlib.sha256(archive.read_bytes()).hexdigest()==row["sha256"],f"Checksum mismatch: {pack}"
    with ZipFile(archive) as z:
        assert z.testzip() is None
        for name in names:
            found=[n for n in z.namelist() if Path(n).name==name]
            if len(found)!=1: raise ValueError(f"{pack}: expected exactly one {name}, found {found}")
            dest=OUT/pack/name; dest.parent.mkdir(parents=True,exist_ok=True)
            with z.open(found[0]) as src,dest.open("wb") as dst: shutil.copyfileobj(src,dst)
            print(f"Verified and extracted {pack}/{name}")
