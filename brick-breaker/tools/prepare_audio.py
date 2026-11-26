"""Prepare the exact reviewed CC0 audio candidate as lossless decoded PCM for miniaudio.
No normalization, resampling or channel conversion; float32 WAV preserves decoded samples."""
from pathlib import Path
import zipfile, hashlib, io, sys, json
import soundfile as sf
import numpy as np
archive=Path(sys.argv[1])
out=Path(sys.argv[2])
out.mkdir(parents=True,exist_ok=True)
expected="e6ee04d91c5f4d30cfda1260d2c9d1faf96fda36319287215fbd07bcb1a80451"
raw=archive.read_bytes()
assert hashlib.sha256(raw).hexdigest()==expected,"reviewed archive changed"
records=[]
with zipfile.ZipFile(io.BytesIO(raw)) as z:
    names=z.namelist()
    assert len(names)==75 and len(set(names))==75
    for name in sorted(names):
        p=Path(name)
        assert p.name==name and p.suffix.lower()==".ogg"
        data,rate=sf.read(io.BytesIO(z.read(name)),always_2d=True,dtype="float32")
        peak=float(np.max(np.abs(data)))
        assert rate==48000 and data.shape[1]==2 and np.isfinite(data).all() and 0<peak<1
        dest=out/(p.stem+".wav")
        sf.write(dest,data,rate,subtype="FLOAT")
        copy,sr=sf.read(dest,always_2d=True,dtype="float32")
        assert sr==rate and np.array_equal(data,copy)
        records.append({"source":name,"file":dest.name,"frames":len(data),"sample_rate":rate,"channels":2,"peak":peak,"sha256":hashlib.sha256(dest.read_bytes()).hexdigest()})
manifest={"author":"rubberduck","publisher":"https://opengameart.org/content/75-cc0-breaking-falling-hit-sfx","published_license":"CC0","source_archive_sha256":expected,"conversion":"Vorbis decoded to float32 WAV, original 48kHz stereo","auditioned":False,"production_approved":False,"files":records}
(out/"manifest.json").write_text(json.dumps(manifest,indent=2),encoding="utf-8")
print(f"Validated and converted {len(records)} audio files; PCM data is bit-exact after WAV round trip.")
