# lowpoly_tex.py - shared by the 7 Kettlewyn Collection kits (copied into each kit's tools/ folder).
#
# (Deepvein Mine Kit copy: adds the "rockface" and "stonefloor" patterns, irregular Voronoi stones.)
# Stone walls, floors, cobbles, bricks and planks used to be built block by block (a bevelled box per stone):
# thousands of triangles, gaps between the blocks, light leaking through the walls. They are now a few flat
# faces with a small tiling texture drawn here (pixels made with numpy inside Blender, no other dependency).
# The texture holds the joints and a light edge / dark edge per stone, so nothing needs a bevel.
#
# UVs are a world-aligned box projection (1 UV unit = TILE metres), so two pieces side by side continue the
# same pattern. glTF / FBX exports embed the texture.

import bpy, bmesh, math, os, random
import numpy as np

TEX_SIZE = 256
TILE = 2.0          # metres covered by one texture repeat

_IMAGES = {}
TEX_MATS = set()    # material names (without the dk_ prefix) that carry a texture


def _rgb(hx):
    return np.array([int(hx[i:i + 2], 16) / 255.0 for i in (0, 2, 4)], dtype=np.float32)


def _shade(col, k):
    return np.clip(col * k, 0, 1)


def _stone(img, x0, y0, w, h, col, rng, edge=2, joint=2):
    """Fill one stone in img (y down, wraps around): joint on its left/top, light top-left, dark bottom-right."""
    S = img.shape[0]
    c = _shade(col, rng.uniform(0.9, 1.1))
    ys = [(y0 + j) % S for j in range(h)]
    xs = [(x0 + i) % S for i in range(w)]
    for j, y in enumerate(ys):
        for i, x in enumerate(xs):
            if i < joint or j < joint:
                continue   # joint pixels keep the mortar colour
            if j < joint + edge or i < joint + edge:
                img[y, x] = _shade(c, 1.12)
            elif j >= h - edge or i >= w - edge:
                img[y, x] = _shade(c, 0.8)
            else:
                img[y, x] = c


def _noise(img, rng, amount=0.035):
    n = np.array([[rng.uniform(-amount, amount) for _ in range(img.shape[1])] for _ in range(img.shape[0])],
                 dtype=np.float32)
    return np.clip(img + n[..., None], 0, 1)


def draw(pattern, colors, mortar, seed=1, S=TEX_SIZE):
    """colors: list of hex stone colours, mortar: hex. Returns an S x S x 3 array (sRGB, y down)."""
    rng = random.Random(seed)
    cols = [_rgb(c) for c in colors]
    img = np.zeros((S, S, 3), dtype=np.float32)
    img[:] = _rgb(mortar)
    if pattern in ("ashlar", "rubble", "brick"):
        rows = {"ashlar": 8, "rubble": 8, "brick": 16}[pattern]
        h = S // rows
        for r in range(rows):
            lo, hi = {"ashlar": (0.3, 0.6), "rubble": (0.18, 0.4), "brick": (0.24, 0.24)}[pattern]
            x = rng.randrange(S) if pattern != "brick" else (0 if r % 2 else S // 8)
            left = S
            while left > 0:
                w = int(S * rng.uniform(lo, hi))
                if left - w < S * lo * 0.6:
                    w = left
                hh = h if pattern != "rubble" else h
                _stone(img, x, r * h, w, hh, rng.choice(cols), rng, edge=2 if pattern != "brick" else 1)
                x += w
                left -= w
    elif pattern == "cobble":
        n = 8
        c = S // n
        for r in range(n):
            off = c // 2 if r % 2 else 0
            for k in range(n):
                _stone(img, k * c + off, r * c, c, c, rng.choice(cols), rng, edge=3, joint=3)
    elif pattern == "flag":
        def split(x, y, w, h, d):
            if d > 0 and max(w, h) > S // 3:
                if w >= h:
                    a = int(w * rng.uniform(0.35, 0.65))
                    split(x, y, a, h, d - 1)
                    split(x + a, y, w - a, h, d - 1)
                else:
                    a = int(h * rng.uniform(0.35, 0.65))
                    split(x, y, w, a, d - 1)
                    split(x, y + a, w, h - a, d - 1)
            else:
                _stone(img, x, y, w, h, rng.choice(cols), rng, edge=3, joint=3)
        split(0, 0, S, S, 4)
    elif pattern == "planks":
        n = 8
        h = S // n
        for r in range(n):
            x = rng.randrange(S)
            left = S
            while left > 0:
                w = min(left, int(S * rng.uniform(0.5, 1.0)))
                _stone(img, x, r * h, w, h, rng.choice(cols), rng, edge=1, joint=2)
                x += w
                left -= w
        # grain lines
        for _ in range(S // 3):
            y, x = rng.randrange(S), rng.randrange(S)
            for i in range(rng.randrange(8, 30)):
                img[y, (x + i) % S] = _shade(img[y, (x + i) % S], 0.9)
    elif pattern == "rooftile":   # round clay tiles: columns lit in the middle, dark between them
        n, rows = 8, 8
        w, h = S // n, S // rows
        for r in range(rows):
            for k in range(n):
                c = _shade(rng.choice(cols), rng.uniform(0.9, 1.1))
                for j in range(h):
                    for i in range(w):
                        x, y = (k * w + i + (w // 2 if r % 2 else 0)) % S, (r * h + j) % S
                        rr = abs(i - w / 2) / (w / 2)       # 0 in the middle of the tile, 1 at its sides
                        k_l = 1.15 - 0.45 * rr * rr
                        if j >= h - 3:
                            k_l *= 0.6                      # shadow under the lip of the tile above
                        img[y, x] = _shade(c, k_l)
    elif pattern == "rock":
        for _ in range(40):
            w, h = rng.randrange(S // 6, S // 2), rng.randrange(S // 8, S // 3)
            _stone(img, rng.randrange(S), rng.randrange(S), w, h, rng.choice(cols), rng, edge=3, joint=0)
    elif pattern in ("rockface", "stonefloor"):   # (Deepvein local addition) irregular stones, Voronoi cells
        n, jw = (22, 2.2) if pattern == "rockface" else (30, 5.0)
        seeds = np.array([[rng.uniform(0, S), rng.uniform(0, S)] for _ in range(n)], dtype=np.float32)
        cell_col = [_shade(rng.choice(cols), rng.uniform(0.86, 1.12)) for _ in range(n)]
        offs = np.array([[ox, oy] for ox in (-S, 0, S) for oy in (-S, 0, S)], dtype=np.float32)
        pts = (seeds[None, :, :] + offs[:, None, :]).reshape(-1, 2)          # seeds repeated around: tiles
        yy, xx = np.mgrid[0:S, 0:S].astype(np.float32)
        d = np.sqrt((xx[..., None] - pts[:, 0]) ** 2 + (yy[..., None] - pts[:, 1]) ** 2)
        order = np.argsort(d, axis=2)
        d1 = np.take_along_axis(d, order[..., :1], 2)[..., 0]
        d2 = np.take_along_axis(d, order[..., 1:2], 2)[..., 0]
        near = order[..., 0]
        cid = near % n
        img[:] = np.array(cell_col, dtype=np.float32)[cid]
        edge = d2 - d1
        # light on the top-left side of each stone, dark on its bottom-right (y down), near its border
        vx = xx - pts[near, 0]
        vy = yy - pts[near, 1]
        side = -(vx + vy) / (np.abs(vx) + np.abs(vy) + 1e-3)
        rim = np.clip(1 - (edge - jw) / 7.0, 0, 1)
        k = 1 + 0.16 * side * rim - 0.05 * np.clip(d1 / (S / np.sqrt(n)), 0, 1)
        img *= k[..., None]
        img[edge < jw] = _rgb(mortar)
        img[:] = np.clip(img, 0, 1)
    else:
        raise ValueError(pattern)
    return _noise(img, rng)


def image(key, pattern, colors, mortar, seed=1, out_dir=None):
    """Blender image for this pattern (saved as PNG next to the exports so the .blend stays portable)."""
    if key in _IMAGES:
        return _IMAGES[key]
    px = draw(pattern, colors, mortar, seed)
    S = px.shape[0]
    im = bpy.data.images.new("tex_" + key, S, S, alpha=False)
    rgba = np.ones((S, S, 4), dtype=np.float32)
    rgba[..., :3] = px[::-1]          # Blender images are stored bottom row first
    im.pixels.foreach_set(rgba.ravel())
    if out_dir:
        os.makedirs(out_dir, exist_ok=True)
        path = os.path.join(out_dir, "tex_" + key + ".png")
        im.filepath_raw = path
        im.file_format = "PNG"
        im.save()
    im.pack()
    _IMAGES[key] = im
    return im


def material(name, pattern, colors, mortar, rough=0.92, seed=1, out_dir=None):
    """Material dk_<name> with the texture on Base Color (nearest filtering keeps the flat low poly look)."""
    m = bpy.data.materials.new("dk_" + name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes["Principled BSDF"]
    t = nt.nodes.new("ShaderNodeTexImage")
    t.image = image(name, pattern, colors, mortar, seed, out_dir)
    t.interpolation = "Closest"
    t.location = (-400, 200)
    nt.links.new(t.outputs["Color"], b.inputs["Base Color"])
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = 0.0
    avg = np.mean([_rgb(c) for c in colors], axis=0)
    m.diffuse_color = (*[float(c) for c in avg], 1)
    TEX_MATS.add(name)
    return m


def box_uv(me, textured_indices, tile=TILE):
    """World-aligned box projection for the faces whose material index is in textured_indices
    (other faces get a UV of 0 so every exported mesh has the same layout)."""
    if not me.uv_layers:
        me.uv_layers.new(name="UVMap")
    uv = me.uv_layers.active.data
    vs = me.vertices
    for poly in me.polygons:
        n = poly.normal
        ax = max(range(3), key=lambda i: abs(n[i]))
        tex = poly.material_index in textured_indices
        for li in poly.loop_indices:
            co = vs[me.loops[li].vertex_index].co
            if not tex:
                uv[li].uv = (0.0, 0.0)
            elif ax == 2:
                uv[li].uv = (co.x / tile, co.y / tile)
            elif ax == 1:
                uv[li].uv = ((co.x if n[1] < 0 else -co.x) / tile, co.z / tile)
            else:
                uv[li].uv = ((-co.y if n[0] < 0 else co.y) / tile, co.z / tile)


def merged_rows(x0, x1, z0, z1, cut=None, ch=0.01):
    """Rectangles (xa, xb, za, zb) covering [x0, x1] x [z0, z1] minus the openings of cut(za, zb) -> [(xa, xb)],
    with consecutive bands that have the same openings merged (a plain wall face = one rectangle)."""
    def subtract(segs, a, b):
        out = []
        for s, e in segs:
            if b <= s or a >= e:
                out.append((s, e))
            else:
                if a > s:
                    out.append((s, a))
                if b < e:
                    out.append((b, e))
        return out
    bands = []
    z = z0
    while z < z1 - 1e-4:
        za, zb = z, min(z + ch, z1)
        segs = [(x0, x1)]
        if cut:
            for a, b in cut(za, zb):
                segs = subtract(segs, a, b)
        segs = [s for s in segs if s[1] - s[0] > 0.01]
        if bands and bands[-1][2] == segs:
            bands[-1][1] = zb
        else:
            bands.append([za, zb, segs])
        z = zb
    return [(a, b, za, zb) for za, zb, segs in bands for a, b in segs]
