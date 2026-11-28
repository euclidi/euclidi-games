"""Package only Innuendo Town, using the actual successful browser capture."""
import json, hashlib, os
from pathlib import Path
from PIL import Image, ImageStat

root=Path(__file__).resolve().parents[2]
im=Image.open(root/'town-cover.png').convert('RGB')
assert im.width>=320 and im.height>=180
assert max(ImageStat.Stat(im).stddev)>=8 and im.entropy()>=2
original=list(im.size)
im.thumbnail((800,500),Image.Resampling.LANCZOS)
out=Image.new('RGB',(800,500),(17,17,17))
out.paste(im,((800-im.width)//2,(500-im.height)//2))
dst=root/'covers/innuendo-town-gameplay.webp'
out.save(dst,'WEBP',quality=88,method=6)
route='./innuendo-town/'
manifest=root/'covers/manifest.json'
m=json.loads(manifest.read_text())
m['innuendo town']={'kind':'gameplay','file':'covers/innuendo-town-gameplay.webp','route':route,'source':os.environ['GITHUB_SHA'],'selector':'#canvas canvas','viewport':[1280,800],'original_size':original,'sha256':hashlib.sha256(dst.read_bytes()).hexdigest()}
manifest.write_text(json.dumps(m,indent=2,sort_keys=True)+'\n')
index=root/'index.html'
s=index.read_text()
card='<article class="game" data-category="Simulation" data-name="innuendo town" style="--ink:#e4c68d;--cover:#29282a"><a class="cover" href="./innuendo-town/" aria-label="Open Innuendo Town" data-cover-kind="gameplay"><img src="./covers/innuendo-town-gameplay.webp" alt="Innuendo Town gameplay screenshot" width="800" height="500" loading="lazy" decoding="async"></a><div class="info"><div class="meta"><span>Simulation</span><span>V0.5 · Playtest build</span></div><h2>Innuendo Town</h2><p>Explore an eccentric town, work at ridiculous businesses and navigate misunderstandings, gossip and social consequences.</p><div class="actions"><a class="play" href="./innuendo-town/" aria-label="Play Innuendo Town">Play <span aria-hidden="true">▶</span></a></div></div><nav class="project-docs" aria-label="Innuendo Town documentation"><a href="https://github.com/euclidi/euclidi-games/blob/main/innuendo-town/README.md">About</a><a href="https://github.com/euclidi/euclidi-games/blob/main/innuendo-town/SPEC.md">Spec</a><a href="https://github.com/euclidi/euclidi-games/blob/main/innuendo-town/ROADMAP.md">Roadmap</a><a href="https://github.com/euclidi/euclidi-games/blob/main/innuendo-town/STATUS.md">Status</a></nav></article>'
import re
marker='</div><p id="empty" hidden>'
assert s.count(marker)==1
if 'data-name="innuendo town"' not in s: index.write_text(s.replace(marker,card+marker))
else:
    assert 'V0.7 · Playtest build' in s
    print('Existing game card retained; refreshing gameplay cover only.')
print('Packaged actual gameplay cover and one catalog card.')

# A small contact sheet of actual browser frames and runtime-generated textures.
from PIL import ImageDraw
qa=root/'innuendo-town/qa'
evidence=Image.new('RGB',(1100,1120),(31,34,32))
d=ImageDraw.Draw(evidence)
def place(file,x,y,w,h,label,nearest=False):
    a=Image.open(root/file).convert('RGBA')
    a.thumbnail((w,h),Image.Resampling.NEAREST if nearest else Image.Resampling.LANCZOS)
    if nearest:
        a=Image.open(root/file).convert('RGBA')
        k=max(1,min(w//a.width,h//a.height))
        a=a.resize((a.width*k,a.height*k),Image.Resampling.NEAREST)
    d.text((x,y-18),label,fill=(222,211,181))
    evidence.paste(a,(x,y),a)
place('town-desktop.png',10,25,700,440,'ACTUAL DESKTOP')
place('town-mobile.png',735,25,355,510,'ACTUAL MOBILE')
place('town-interior.png',10,485,700,435,'ACTUAL INTERIOR')
place('town-art-player.png',745,570,335,250,'PLAYER WALK SHEET',True)
place('town-art-traffic.png',10,940,700,165,'TRAFFIC ATLAS',True)
place('town-art-resident-11.png',745,855,335,250,'RESIDENT WALK SHEET',True)
evidence.save(qa/'evidence-v070.webp','WEBP',quality=87,method=6)
