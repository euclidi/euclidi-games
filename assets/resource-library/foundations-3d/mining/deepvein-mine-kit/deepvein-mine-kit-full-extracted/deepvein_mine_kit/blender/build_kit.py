# Deepvein Mine Kit - every model is built by this script, nothing else.
#
#   blender -b --factory-startup -P tools/build_kit.py -- [--no-render] [--thumbs-only] [--beauty-only]
#
# Outputs (relative to the project folder):
#   deepvein_mine_kit.blend        all pieces (collection "Kit") + the demo mine (collection "Demo")
#   exports/glb/*.glb              clean meshes, any engine
#   exports/glb_godot/*.glb        same meshes + "-colonly" collision meshes (Godot builds StaticBody3D)
#   exports/fbx/*.fbx              FBX copies (Unity / Unreal)
#   exports/pieces.json            name, category, size, triangle count, light points
#   exports/layout.json            the demo mine, reused by tools/make_godot_demo.py
#   renders/thumbs/*.png, renders/beauty_*.png
#
# Same conventions, scale and base palette as the Cryptstone Dungeon Kit, so both kits mix:
# 1 unit = 1 m, grid cell = 4 m, walls 4 m high and 0.5 m thick, pivot = bottom of the piece.
# Floors: cell centre, walkable top at 0. Walls: centre of the cell edge, the "front" faces -Y in
# Blender (= +Z in Godot). Wall decor (wall lantern) uses the SAME transform as its wall.
# Moving parts are separate pieces with their pivot on the axis they turn or slide on.

import bpy, bmesh, math, random, json, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import lowpoly_tex as LT
from mathutils import Matrix, Vector, Euler

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ARGS = sys.argv[sys.argv.index("--") + 1:] if "--" in sys.argv else []
SHOT = next((a[5:] for a in ARGS if a.startswith("shot=")), None)   # render only this beauty shot
CELL, WALL_H, WALL_T = 4.0, 4.0, 0.5
HALF = CELL / 2
RAIL_TOP = 0.16  # height of the rail top above the floor: put carts at this height

# --------------------------------------------------------------------------- palette
# The first block is the Cryptstone palette, unchanged (same names, same values): materials
# with the same name are the same colour in both kits. The second block is new for the mine.
PALETTE = {  # name: (sRGB hex, roughness, metallic, emission strength)
    "stone_a": ("8c8781", 0.92, 0.0, 0),
    "stone_b": ("77726c", 0.92, 0.0, 0),
    "stone_c": ("a39c92", 0.90, 0.0, 0),
    "stone_dark": ("4b4642", 0.95, 0.0, 0),
    "void": ("0e0d0c", 1.0, 0.0, 0),
    "wood": ("8a5a32", 0.85, 0.0, 0),
    "wood_dark": ("5a3b22", 0.88, 0.0, 0),
    "iron": ("44464c", 0.55, 0.75, 0),
    "steel": ("a9adb3", 0.32, 0.9, 0),
    "gold": ("e0b040", 0.32, 1.0, 0),
    "cloth_red": ("8f2424", 0.95, 0.0, 0),
    "parchment": ("d8c79a", 0.9, 0.0, 0),
    "wax": ("e6dcc0", 0.6, 0.0, 0),
    "sack": ("b49a68", 0.95, 0.0, 0),
    "coal": ("231d1a", 0.9, 0.0, 0),
    "fire": ("ff4a00", 0.5, 0.0, 1.2),
    "fire_core": ("ff9a00", 0.5, 0.0, 1.8),
    # mine
    "rock_brown": ("7a6a5a", 0.95, 0.0, 0),
    "rock_dark": ("5a5048", 0.95, 0.0, 0),
    "dirt": ("6b5a48", 1.0, 0.0, 0),
    "rust": ("8a4b2a", 0.8, 0.3, 0),
    "copper": ("b8693a", 0.4, 0.9, 0),
    "rope": ("a88d5a", 0.95, 0.0, 0),
    "crystal_cyan": ("39d0e0", 0.1, 0.0, 1.6),
    "crystal_violet": ("b06cff", 0.1, 0.0, 1.6),
    "mushroom_glow": ("6ee0c8", 0.4, 0.0, 1.4),
    # v1.1 (added at the end; same values as the other kits for the shared names)
    "cloth_blue": ("2c4a8a", 0.95, 0.0, 0),
    "clay": ("a65a33", 0.85, 0.0, 0),
    "brass": ("c89b45", 0.35, 1.0, 0),
    "leather": ("4a3326", 0.85, 0.0, 0),
    "water": ("2f5560", 0.08, 0.0, 0),
    "silver": ("cfd3da", 0.25, 1.0, 0),
    "quartz": ("d9d4c8", 0.45, 0.0, 0),
    "gem_red": ("e0304a", 0.1, 0.0, 0.9),
    "gem_green": ("35c46a", 0.1, 0.0, 0.9),
    "canary": ("f2c530", 0.8, 0.0, 0),
}
ROCKS = ["rock_brown", "rock_brown", "rock_dark", "stone_b"]
MATS = {}


def srgb(h):
    out = []
    for i in (0, 2, 4):
        c = int(h[i:i + 2], 16) / 255
        out.append(c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4)
    return out


def make_materials():
    for name, (hx, rough, metal, emit) in PALETTE.items():
        m = bpy.data.materials.new("dk_" + name)
        m.use_nodes = True
        b = m.node_tree.nodes["Principled BSDF"]
        col = srgb(hx)
        b.inputs["Base Color"].default_value = (*col, 1)
        b.inputs["Roughness"].default_value = rough
        b.inputs["Metallic"].default_value = metal
        if emit:
            b.inputs["Emission Color"].default_value = (*col, 1)
            b.inputs["Emission Strength"].default_value = emit
        m.diffuse_color = (*col, 1)
        MATS[name] = m


def tex_mat(pattern, mats, mortar="stone_dark"):
    """Textured material (see lowpoly_tex.py) drawn from palette colours; created on first use."""
    name = pattern + "_" + "_".join(sorted(set(mats)))
    if name not in MATS:
        MATS[name] = LT.material(name, pattern, [PALETTE[m][0] for m in mats], PALETTE[mortar][0],
                                 out_dir=os.path.join(ROOT, "exports", "textures"))
    return name


# --------------------------------------------------------------------------- mesh builder
class Part:
    def __init__(self, name):
        self.name = name
        self.bm = bmesh.new()
        self.mats = []
        self.stack = [Matrix.Identity(4)]
        self.info = {"lights": [], "col": None}

    def push(self, m):
        self.stack.append(self.stack[-1] @ m)

    def pop(self):
        self.stack.pop()

    def _add(self, tbm, mat, local=None):
        m = self.stack[-1] @ (local if local is not None else Matrix.Identity(4))
        bmesh.ops.transform(tbm, matrix=m, verts=list(tbm.verts))
        if m.determinant() < 0:
            bmesh.ops.reverse_faces(tbm, faces=list(tbm.faces))
        if mat not in self.mats:
            self.mats.append(mat)
        idx = self.mats.index(mat)
        for f in tbm.faces:
            f.material_index = idx
            f.smooth = False
        me = bpy.data.meshes.new("_tmp")
        tbm.to_mesh(me)
        tbm.free()
        self.bm.from_mesh(me)
        bpy.data.meshes.remove(me)

    def box(self, c, s, mat, bevel=0.0, rot=(0, 0, 0)):
        tbm = bmesh.new()
        bmesh.ops.create_cube(tbm, size=1.0)
        bmesh.ops.scale(tbm, vec=Vector(s), verts=list(tbm.verts))
        b = 0.0   # no bevels: they cost triangles and do not show at game distance (the textures draw the edges)
        if b > 0.001:
            bmesh.ops.bevel(tbm, geom=list(tbm.edges), offset=b, offset_type="OFFSET",
                            segments=1, profile=0.5, affect="EDGES", clamp_overlap=True)
        self._add(tbm, mat, Matrix.Translation(Vector(c)) @ rotm(rot))

    def cyl(self, c, r, h, mat, seg=8, r2=None, rot=(0, 0, 0)):
        """c = centre of the bottom cap (before rotation the axis is +Z)."""
        tbm = bmesh.new()
        bmesh.ops.create_cone(tbm, cap_ends=True, cap_tris=False, segments=seg,
                              radius1=r, radius2=r if r2 is None else r2, depth=h)
        bmesh.ops.translate(tbm, vec=(0, 0, h / 2), verts=list(tbm.verts))
        bmesh.ops.rotate(tbm, cent=(0, 0, 0), matrix=Matrix.Rotation(math.pi / seg, 3, "Z"),
                         verts=list(tbm.verts))
        self._add(tbm, mat, Matrix.Translation(Vector(c)) @ rotm(rot))

    def lathe(self, prof, mat, c=(0, 0, 0), seg=10, rot=(0, 0, 0), caps=True):
        """prof = [(radius, z), ...] bottom to top; r = 0 closes the shape."""
        tbm = bmesh.new()
        rings = []
        for r, z in prof:
            if r < 1e-5:
                rings.append([tbm.verts.new((0, 0, z))])
            else:
                rings.append([tbm.verts.new((r * math.cos(2 * math.pi * k / seg + math.pi / seg),
                                             r * math.sin(2 * math.pi * k / seg + math.pi / seg), z))
                              for k in range(seg)])
        for A, B in zip(rings, rings[1:]):
            if len(A) == 1 and len(B) == 1:
                continue
            for k in range(seg):
                k2 = (k + 1) % seg
                if len(A) == 1:
                    tbm.faces.new((A[0], B[k], B[k2]))
                elif len(B) == 1:
                    tbm.faces.new((A[k], A[k2], B[0]))
                else:
                    tbm.faces.new((A[k], A[k2], B[k2], B[k]))
        if len(rings[0]) > 1 and caps:
            tbm.faces.new(list(reversed(rings[0])))
        if len(rings[-1]) > 1 and caps:
            tbm.faces.new(rings[-1])
        bmesh.ops.recalc_face_normals(tbm, faces=list(tbm.faces))
        self._add(tbm, mat, Matrix.Translation(Vector(c)) @ rotm(rot))

    def prism_xz(self, pts, y0, y1, mat, rot=(0, 0, 0), c=(0, 0, 0)):
        """Polygon drawn in the XZ plane, extruded along Y from y0 to y1."""
        tbm = bmesh.new()
        a = [tbm.verts.new((x, y0, z)) for x, z in pts]
        b = [tbm.verts.new((x, y1, z)) for x, z in pts]
        tbm.faces.new(a)
        tbm.faces.new(list(reversed(b)))
        n = len(pts)
        for k in range(n):
            k2 = (k + 1) % n
            tbm.faces.new((a[k], a[k2], b[k2], b[k]))
        bmesh.ops.recalc_face_normals(tbm, faces=list(tbm.faces))
        self._add(tbm, mat, Matrix.Translation(Vector(c)) @ rotm(rot))

    def rock(self, c, s, mat, rng, rot=(0, 0, 0), jit=0.08):
        """Faceted low poly stone: a jittered icosahedron (20 triangles) of size s."""
        tbm = bmesh.new()
        bmesh.ops.create_icosphere(tbm, subdivisions=1, radius=0.5)
        for v in tbm.verts:
            v.co = Vector((v.co.x * s[0] * (1 + rng.uniform(-jit, jit)),
                           v.co.y * s[1] * (1 + rng.uniform(-jit, jit)),
                           v.co.z * s[2] * (1 + rng.uniform(-jit, jit))))
        self._add(tbm, mat, Matrix.Translation(Vector(c)) @ rotm(rot))

    def crystal(self, base, r, h, mat, tilt=(0, 0, 0), seg=6):
        self.push(Matrix.Translation(Vector(base)) @ rotm(tilt))
        self.cyl((0, 0, -0.08), r, h * 0.72 + 0.08, mat, seg=seg)
        self.cyl((0, 0, h * 0.72), r, h * 0.28, mat, seg=seg, r2=0.0)
        self.pop()

    def light(self, c, size, kind):
        w = self.stack[-1] @ Vector(c)
        self.info["lights"].append([round(w.x, 3), round(w.y, 3), round(w.z, 3), size, kind])

    def flame(self, c, scale=1.0):
        self.cyl(c, 0.1 * scale, 0.36 * scale, "fire", seg=6, r2=0.0)
        self.cyl((c[0], c[1], c[2] + 0.02 * scale), 0.06 * scale, 0.24 * scale, "fire_core", seg=5, r2=0.0,
                 rot=(0, 0, 30))
        # above the tip, never inside the emissive flame (Eevee would shadow the whole light)
        self.light((c[0], c[1], c[2] + 0.36 * scale + 0.1), scale, "fire")


def rotm(rot):
    return Euler([math.radians(a) for a in rot]).to_matrix().to_4x4()


def subtract(segs, ca, cb):
    out = []
    for a, b in segs:
        if cb <= a or ca >= b:
            out.append((a, b))
            continue
        if ca > a:
            out.append((a, ca))
        if cb < b:
            out.append((cb, b))
    return out


def rock_mat():
    return tex_mat("rockface", ROCKS, mortar="stone_dark")


def rock_block(p, rng, x0, x1, z0, z1, y0=-WALL_T / 2, y1=WALL_T / 2, mat=None, step=1.4, bulge=(0.02, 0.09),
               top=None, faces=(True, True), bottom=False):
    """Solid rock block [x0, x1] x [y0, y1] x [z0, z1] (one closed mesh, textured "rockface"). Its two big faces
    (-Y and +Y) are a coarse grid whose inner vertices are pushed out a little: a few large facets instead of
    a flat plane. The outline stays straight, so blocks side by side (and two wall pieces) meet without a gap.
    top(x) -> z replaces the flat top (ruined walls); faces = (bulge the -Y face, bulge the +Y face)."""
    mat = mat or rock_mat()
    nx = max(1, int(round((x1 - x0) / step)))
    nz = max(1, int(round((z1 - z0) / step)))
    xs = [x0 + (x1 - x0) * i / nx for i in range(nx + 1)]
    for i in range(1, nx):
        xs[i] += rng.uniform(-0.2, 0.2) * (x1 - x0) / nx
    ztop = [top(x) if top else z1 for x in xs]
    tbm = bmesh.new()
    grids = []
    for side, y in ((0, y0), (1, y1)):
        g = []
        for i in range(nx + 1):
            col = []
            for j in range(nz + 1):
                t = j / nz
                if 0 < j < nz:
                    t += rng.uniform(-0.2, 0.2) / nz
                z = z0 + (ztop[i] - z0) * t
                yy = y
                if faces[side] and 0 < i < nx and 0 < j < nz:
                    yy += (-1 if side == 0 else 1) * rng.uniform(*bulge)
                col.append(tbm.verts.new((xs[i], yy, z)))
            g.append(col)
        grids.append(g)
    F, B = grids
    for i in range(nx):
        for j in range(nz):
            tbm.faces.new((F[i][j], F[i + 1][j], F[i + 1][j + 1], F[i][j + 1]))
            tbm.faces.new((B[i][j], B[i][j + 1], B[i + 1][j + 1], B[i + 1][j]))
    for j in range(nz):   # ends
        tbm.faces.new((F[0][j], F[0][j + 1], B[0][j + 1], B[0][j]))
        tbm.faces.new((F[nx][j], B[nx][j], B[nx][j + 1], F[nx][j + 1]))
    for i in range(nx):   # top (and bottom, usually hidden in the floor)
        tbm.faces.new((F[i][nz], F[i + 1][nz], B[i + 1][nz], B[i][nz]))
        if bottom:
            tbm.faces.new((F[i][0], B[i][0], B[i + 1][0], F[i + 1][0]))
    bmesh.ops.recalc_face_normals(tbm, faces=list(tbm.faces))
    p._add(tbm, mat)


def band(p, rng, zc, h, mat, y0=-0.36, y1=-0.2, n=9, wave=None):
    """Mineral band across the front of a wall (ore lode, coal seam): one prism with wavy edges."""
    xs = [-HALF + CELL * i / (n - 1) for i in range(n)]
    mid = [zc + (wave(x) if wave else 0.0) for x in xs]
    lo = [(x, m - h / 2 + rng.uniform(-0.05, 0.05)) for x, m in zip(xs, mid)]
    hi = [(x, m + h / 2 + rng.uniform(-0.05, 0.05)) for x, m in zip(xs, mid)]
    p.prism_xz(lo + hi[::-1], y0, y1, mat)


def rock_wall(p, rng, x0=-HALF, x1=HALF, h=WALL_H, cut=None, top=None, bulge=(0.02, 0.09)):
    """Rough rock wall, full thickness and solid: one faceted textured block per rectangle left around the
    openings of cut(z0, z1) -> [(xa, xb)] (no core, no gaps; the stones are in the "rockface" texture).
    top(x) -> z gives a broken top line (ruins)."""
    if top:
        rock_block(p, rng, x0, x1, 0.0, h, top=top, step=1.0, bulge=bulge)
        return
    for a, b, za, zb in LT.merged_rows(x0, x1, 0.0, h, cut):
        rock_block(p, rng, a, b, za, zb, bulge=bulge, bottom=za > 0.001)


def scatter_rocks(p, rng, cx, cy, n=7, spread=0.6, size=(0.15, 0.4), mats=None):
    for _ in range(n):
        s = rng.uniform(*size)
        p.rock((cx + rng.uniform(-spread, spread), cy + rng.uniform(-spread * 0.7, spread * 0.7), s * 0.36),
               (s, s * rng.uniform(0.75, 1.2), s * rng.uniform(0.6, 0.85)), rng.choice(mats or ROCKS), rng,
               rot=(0, 0, rng.uniform(0, 180)))


def mound(p, rng, r, h, mat, seg=9, c=(0, 0, 0)):
    p.lathe([(0, 0), (r, 0), (r * 0.78, h * 0.35), (r * 0.45, h * 0.8), (0, h)], mat, c=c, seg=seg)


def lantern(p, c, s=1.0):
    """Open iron lantern with a candle: no glass, so the light above the flame is not blocked."""
    x, y, z = c
    p.cyl((x, y, z), 0.11 * s, 0.04 * s, "iron", seg=8)
    p.cyl((x, y, z + 0.04 * s), 0.035 * s, 0.07 * s, "wax", seg=6)
    p.flame((x, y, z + 0.11 * s), 0.34 * s)
    for k in range(4):
        a = math.pi / 4 + k * math.pi / 2
        p.box((x + 0.085 * s * math.cos(a), y + 0.085 * s * math.sin(a), z + 0.21 * s), (0.02 * s, 0.02 * s, 0.38 * s),
              "iron")
    p.cyl((x, y, z + 0.38 * s), 0.12 * s, 0.07 * s, "iron", seg=8, r2=0.05 * s)
    p.cyl((x, y, z + 0.45 * s), 0.03 * s, 0.04 * s, "iron", seg=6)
    p.box((x, y, z + 0.52 * s), (0.015 * s, 0.09 * s, 0.09 * s), "iron")


def chain(p, x, y, z0, z1):
    """Hanging chain: one thin iron rod (the links were 2 cm boxes, invisible at game distance)."""
    p.box((x, y, (z0 + z1) / 2 + 0.03), (0.035, 0.035, z1 - z0 + 0.06), "iron")


def pickaxe(p, rng=None):
    """Pickaxe lying along X, head at +X, resting on the ground (z = 0)."""
    p.cyl((-0.45, 0, 0.035), 0.03, 0.88, "wood", seg=6, rot=(0, 90, 0))
    p.box((0.42, 0, 0.05), (0.09, 0.09, 0.1), "iron", 0.01)
    for s in (-1, 1):
        p.push(Matrix.Translation((0.42, s * 0.04, 0.05)) @ Matrix.Rotation(math.radians(s * -12), 4, "Z"))
        p.cyl((0, 0, 0), 0.035, 0.36, "steel", seg=4, r2=0.006, rot=(-90 * s, 0, 0))
        p.pop()


def crate(p, s=0.9, c=(0, 0, 0)):
    x0, y0, z0 = c
    p.box((x0, y0, z0 + s / 2), (s - 0.04, s - 0.04, s - 0.04), "wood", 0.01)
    t = 0.09 * s / 0.9 + 0.02
    for a in (-1, 1):
        for b in (-1, 1):
            p.box((x0 + a * (s / 2 - t / 2), y0 + b * (s / 2 - t / 2), z0 + s / 2), (t, t, s), "wood_dark", 0.01)
            p.box((x0, y0 + a * (s / 2 - t / 2), z0 + s / 2 + b * (s / 2 - t / 2)), (s - 0.02, t, t), "wood_dark", 0.01)
            p.box((x0 + a * (s / 2 - t / 2), y0, z0 + s / 2 + b * (s / 2 - t / 2)), (t, s - 0.02, t), "wood_dark", 0.01)


# --------------------------------------------------------------------------- pieces
PIECES = []
PLACEMENT = {}   # name -> "ground" (default), "floor", "below", "decor", "ceiling", "hanging", "free"


def piece(name, cat, desc, placement="ground"):
    """placement tells Godot's verify.gd where the pivot is. "ground" and "decor" pieces are flattened
    (nothing below the pivot), exactly as in v1.0."""
    def deco(fn):
        PIECES.append((name, cat, desc, fn))
        PLACEMENT[name] = placement
        return fn
    return deco


def floor_mat():
    return tex_mat("stonefloor", ["dirt", "stone_b", "rock_dark", "stone_a", "stone_b"], mortar="dirt")


def floor_base(p, rng, hole=None, clear_x=None, avoid=None):
    """Packed dirt slab, walkable top at 0: one textured block (the set stones are in the texture).
    hole = half size of a square opening in the middle. clear_x / avoid are kept for compatibility."""
    m = floor_mat()
    if hole:
        h = hole
        for (c, s) in (((0, (HALF + h) / 2, -0.1), (CELL, HALF - h, 0.2)),
                       ((0, -(HALF + h) / 2, -0.1), (CELL, HALF - h, 0.2)),
                       (((HALF + h) / 2, 0, -0.1), (HALF - h, 2 * h, 0.2)),
                       ((-(HALF + h) / 2, 0, -0.1), (HALF - h, 2 * h, 0.2))):
            p.box(c, s, m)
    else:
        p.box((0, 0, -0.1), (CELL, CELL, 0.2), m)


def planks_mat():
    return tex_mat("planks", ["wood", "wood", "wood_dark"], mortar="wood_dark")


def plank_deck(p, x0, x1, y0, y1, z_top, t=0.08):
    """Plank deck: one textured slab, boards along X (they are in the "planks" texture)."""
    p.box(((x0 + x1) / 2, (y0 + y1) / 2, z_top - t / 2), (x1 - x0, y1 - y0, t), planks_mat())


def rails_straight(p, y0=-HALF, y1=HALF):
    n = int(round((y1 - y0) / 0.5))
    for k in range(n):
        p.box((0, y0 + 0.25 + k * 0.5, 0.04), (1.5, 0.22, 0.08), "wood_dark", 0.01)
    for s in (-1, 1):
        p.box((s * 0.5, (y0 + y1) / 2, 0.09), (0.14, y1 - y0, 0.02), "iron")
        p.box((s * 0.5, (y0 + y1) / 2, 0.13), (0.06, y1 - y0, 0.06), "steel")


@piece("mine_floor", "structure", "Floor tile, 4 x 4 m packed dirt with set stones, walkable top at 0", "floor")
def _floor(p, rng):
    floor_base(p, rng)
    p.info["col"] = [("box", (0, 0, -0.12), (CELL, CELL, 0.24))]


@piece("mine_floor_rails", "structure", f"Floor tile with a straight rail track along Blender Y / Godot Z (rail top at {RAIL_TOP} m)", "floor")
def _floor_rails(p, rng):
    floor_base(p, rng, clear_x=0.9)
    rails_straight(p)
    p.info["col"] = [("box", (0, 0, -0.12), (CELL, CELL, 0.24))]


@piece("mine_floor_rails_curve", "structure", "Floor tile with a 90 degree rail curve (from the -Y edge to the +X edge)", "floor")
def _floor_rails_curve(p, rng):
    floor_base(p, rng, avoid=lambda x, y, s: abs(math.hypot(x - HALF, y + HALF) - 2.0) < 0.9 + s / 2)
    cx, cy, n = HALF, -HALF, 8
    for k in range(n + 1):
        a = math.radians(90 + 90 * (k + 0.5) / (n + 1))
        p.box((cx + 2.0 * math.cos(a), cy + 2.0 * math.sin(a), 0.04), (1.5, 0.22, 0.08), "wood_dark", 0.01,
              rot=(0, 0, math.degrees(a)))
    for r in (1.5, 2.5):
        for k in range(n):
            a0, a1 = math.radians(90 + 90 * k / n), math.radians(90 + 90 * (k + 1) / n)
            m = (a0 + a1) / 2
            L = 2 * r * math.sin((a1 - a0) / 2) + 0.012
            c = (cx + r * math.cos(m) * math.cos((a1 - a0) / 2), cy + r * math.sin(m) * math.cos((a1 - a0) / 2))
            p.box((c[0], c[1], 0.09), (0.14, L, 0.02), "iron", rot=(0, 0, math.degrees(m)))
            p.box((c[0], c[1], 0.13), (0.06, L, 0.06), "steel", rot=(0, 0, math.degrees(m)))
    p.info["col"] = [("box", (0, 0, -0.12), (CELL, CELL, 0.24))]


@piece("mine_floor_rails_end", "structure", "Floor tile where the track ends against a timber buffer stop (+Y end)", "below")
def _floor_rails_end(p, rng):
    floor_base(p, rng, clear_x=0.9)
    rails_straight(p, -HALF, 1.0)
    p.box((0, 1.25, 0.5), (1.5, 0.3, 0.3), "wood", 0.02)
    p.box((0, 1.12, 0.5), (0.9, 0.06, 0.18), "cloth_red", 0.01)
    for s in (-1, 1):
        p.box((s * 0.55, 1.35, 0.32), (0.22, 0.22, 0.64), "wood_dark", 0.02)
        p.box((s * 0.55, 1.7, 0.3), (0.16, 0.85, 0.16), "wood_dark", 0.02, rot=(-38, 0, 0))
    scatter_rocks(p, rng, 0, 1.8, 4, 0.5, (0.15, 0.3))
    p.info["col"] = [("box", (0, 0, -0.12), (CELL, CELL, 0.24)), ("box", (0, 1.45, 0.4), (1.5, 0.7, 0.8))]


@piece("mine_floor_shaft", "structure", "Floor tile with a 2 x 2 m shaft opening and a timber collar (lift cage and hatch fit it)", "floor")
def _floor_shaft(p, rng):
    floor_base(p, rng, hole=1.0)
    for s in (-1, 1):  # pit walls
        p.box((0, s * 1.05, -0.8), (2.2, 0.1, 1.4), "rock_dark")
        p.box((s * 1.05, 0, -0.8), (0.1, 2.0, 1.4), "rock_dark")
    p.box((0, 0, -1.45), (2.0, 2.0, 0.1), "void")
    for s in (-1, 1):  # timber collar, top at 0.12
        p.box((0, s * 1.1, 0.05), (2.4, 0.2, 0.14), "wood", 0.02)
        p.box((s * 1.1, 0, 0.05), (0.2, 2.0, 0.14), "wood", 0.02)
    for a in (-1, 1):
        for b in (-1, 1):
            p.cyl((a * 1.1, b * 1.1, 0.12), 0.03, 0.02, "iron", seg=6)
    p.info["col"] = [("box", (0, (HALF + 1.0) / 2, -0.12), (CELL, HALF - 1.0, 0.24)),
                     ("box", (0, -(HALF + 1.0) / 2, -0.12), (CELL, HALF - 1.0, 0.24)),
                     ("box", ((HALF + 1.0) / 2, 0, -0.12), (HALF - 1.0, 2.0, 0.24)),
                     ("box", (-(HALF + 1.0) / 2, 0, -0.12), (HALF - 1.0, 2.0, 0.24)),
                     ("box", (0, 0, -1.45), (2.0, 2.0, 0.1))]


@piece("mine_wall", "structure", "Rock wall, 4 m wide, 4 m high, 0.5 m thick")
def _wall(p, rng):
    rock_wall(p, rng)
    p.info["col"] = [("box", (0, 0, 2.0), (CELL, WALL_T, WALL_H))]


@piece("mine_wall_half", "structure", "Half rock wall, 2 m wide (for half-cell layouts)")
def _wall_half(p, rng):
    rock_wall(p, rng, -1.0, 1.0)
    p.info["col"] = [("box", (0, 0, 2.0), (2.0, WALL_T, WALL_H))]


@piece("mine_wall_ore", "structure", "Rock wall with gold and copper ore veins on its front side")
def _wall_ore(p, rng):
    rock_wall(p, rng)
    for k in range(10):
        t = k / 9
        x = -1.5 + 3.0 * t + rng.uniform(-0.15, 0.15)
        z = 1.0 + 1.6 * t + 0.45 * math.sin(t * 7) + rng.uniform(-0.15, 0.15)
        s = rng.uniform(0.18, 0.3)
        p.rock((x, -0.36, z), (s, 0.2, s * 0.9), "gold" if k % 3 else "copper", rng,
               rot=(rng.uniform(0, 40), 0, rng.uniform(0, 90)))
    p.info["col"] = [("box", (0, 0, 2.0), (CELL, WALL_T, WALL_H))]


@piece("mine_wall_crystal", "structure", "Rock wall with glowing cyan crystals growing out of its front")
def _wall_crystal(p, rng):
    rock_wall(p, rng)
    for (x, z, r, h, tx, tz) in ((-0.9, 1.3, 0.16, 0.95, 55, -20), (-0.6, 1.15, 0.11, 0.65, 75, 25),
                                 (-1.15, 1.5, 0.1, 0.55, 45, -55), (-0.85, 1.65, 0.08, 0.45, 35, 5),
                                 (0.75, 2.4, 0.18, 1.05, 60, 25), (1.05, 2.25, 0.11, 0.65, 78, 55),
                                 (0.5, 2.7, 0.1, 0.55, 40, -15), (0.8, 2.75, 0.08, 0.4, 30, 40),
                                 (0.15, 0.5, 0.13, 0.6, 40, 0), (0.35, 0.45, 0.08, 0.4, 60, 50)):
        p.crystal((x, -0.2, z), r, h, "crystal_cyan", tilt=(tx, 0, tz))
    p.light((0.0, -1.1, 1.9), 1.0, "crystal")
    p.info["col"] = [("box", (0, 0, 2.0), (CELL, WALL_T, WALL_H))]


@piece("mine_wall_timbered", "structure", "Rock wall shored up with timber posts and planks on its front side")
def _wall_timbered(p, rng):
    rock_wall(p, rng)
    for s in (-1, 1):
        p.box((s * 1.72, -0.42, 1.8), (0.26, 0.26, 3.6), "wood_dark", 0.03)
    p.box((0, -0.42, 3.72), (3.9, 0.28, 0.26), "wood_dark", 0.03)
    x = -1.56
    while x < 1.5:
        w = rng.uniform(0.24, 0.32)
        w = min(w, 1.59 - x)
        p.box((x + w / 2, -0.35, 1.78 + rng.uniform(-0.02, 0.02)), (w - 0.02, 0.06, 3.52), rng.choice(["wood", "wood", "wood_dark"]),
              0.01, rot=(0, rng.uniform(-0.6, 0.6), 0))
        x += w
    p.info["col"] = [("box", (0, -0.06, 2.0), (CELL, WALL_T + 0.12, WALL_H))]


def entrance_cut(z0, z1):
    return [(-1.24, 1.24)] if z0 < 3.3 else []


@piece("mine_wall_entrance", "structure", "Rock wall with a 2 x 3 m timber-framed opening (mine_door fits it)")
def _wall_entrance(p, rng):
    rock_wall(p, rng, cut=entrance_cut)
    for s in (-1, 1):
        p.box((s * 1.12, 0, 1.5), (0.24, 0.6, 3.0), "wood_dark", 0.03)
        p.box((s * 1.12, -0.31, 0.12), (0.3, 0.06, 0.24), "iron", 0.01)
    p.box((0, 0, 3.15), (2.75, 0.62, 0.3), "wood_dark", 0.03)
    for x in (-0.9, 0.9):
        p.box((x, -0.32, 3.15), (0.06, 0.04, 0.32), "iron")
    p.info["col"] = [("box", (-1.62, 0, 2.0), (0.76, WALL_T, 4.0)), ("box", (1.62, 0, 2.0), (0.76, WALL_T, 4.0)),
                     ("box", (0, 0, 3.5), (2.48, WALL_T, 1.0))]


@piece("mine_wall_collapsed", "structure", "Partly collapsed rock wall with fallen stones and a broken beam")
def _wall_collapsed(p, rng):
    pts = [(-2.0, 3.75), (-1.5, 3.35), (-1.0, 3.3), (-0.5, 2.8), (0.0, 2.7), (0.5, 2.35), (1.0, 2.55), (1.5, 2.3), (2.0, 2.45)]

    def top(x):   # broken top line, higher on the -X side
        for (a, za), (b, zb) in zip(pts, pts[1:]):
            if a - 1e-6 <= x <= b + 1e-6:
                return za + (zb - za) * (x - a) / (b - a)
        return pts[-1][1]
    rock_wall(p, rng, top=top)
    scatter_rocks(p, rng, 0.6, -0.95, 4, 0.85, (0.35, 0.65))
    scatter_rocks(p, rng, 0.5, 0.9, 2, 0.7, (0.3, 0.5))
    p.box((-0.2, -0.75, 0.55), (0.22, 0.22, 2.6), "wood_dark", 0.03, rot=(0, 62, 8))
    p.box((1.25, -0.8, 0.13), (0.2, 0.2, 1.2), "wood_dark", 0.03, rot=(90, 0, 70))
    p.info["col"] = [("box", (0, 0, 1.6), (CELL, WALL_T, 3.2))]


@piece("mine_wall_corner", "structure", "Rock column for wall junctions (put one on each grid vertex)")
def _corner(p, rng):
    z = 0.0
    for h in (1.1, 1.0, 0.95, 0.75):
        s = rng.uniform(0.86, 0.94)
        p.rock((0, 0, z + h / 2 + (0.08 if z == 0 else 0)), (s, s, h * 1.45), rng.choice(ROCKS), rng,
               rot=(0, 0, rng.uniform(0, 90)))
        z += h
    p.info["col"] = [("box", (0, 0, 2.0), (0.7, 0.7, 4.0))]


@piece("mine_support_frame", "structure", "Timber support frame across a tunnel: two posts and a cap beam (cell centre or edge)")
def _support(p, rng):
    for s in (-1, 1):
        p.box((s * 1.72, 0, 1.8), (0.26, 0.26, 3.6), "wood_dark", 0.03, rot=(0, rng.uniform(-1, 1), 0))
        p.box((s * 1.72, 0, 0.08), (0.36, 0.36, 0.16), "stone_dark", 0.03)
        p.box((s * 1.38, 0, 3.38), (0.18, 0.16, 0.8), "wood", 0.02, rot=(0, s * 45, 0))
        p.box((s * 1.72, -0.14, 3.5), (0.3, 0.03, 0.12), "iron")
    p.box((0, 0, 3.75), (3.95, 0.3, 0.3), "wood_dark", 0.03)
    p.info["col"] = [("box", (-1.72, 0, 1.9), (0.3, 0.3, 3.8)), ("box", (1.72, 0, 1.9), (0.3, 0.3, 3.8)),
                     ("box", (0, 0, 3.75), (3.95, 0.3, 0.3))]


@piece("mine_ceiling", "structure", "Rock ceiling tile 4 x 4 m; place it at height 4", "ceiling")
def _ceiling(p, rng):
    ceiling_slab(p, rng)
    p.info["col"] = [("box", (0, 0, 0.22), (CELL, CELL, 0.44))]


@piece("mine_stairs", "structure", "Stairs cut in the rock with timber risers, rise 2 m over one cell (up toward +Y / Godot -Z)")
def _stairs(p, rng):
    for k in range(8):
        y0 = -HALF + k * 0.5
        top = (k + 1) * 0.25
        p.box((0, y0 + 0.25, top / 2 - 0.02), (CELL - 0.02, 0.5, top - 0.04), floor_mat())
        p.box((0, y0 + 0.06, top - 0.09), (CELL - 0.3, 0.12, 0.2), "wood_dark", 0.02)
    for s in (-1, 1):
        for k in (0, 2):
            sz = rng.uniform(0.45, 0.6)
            p.rock((s * 1.8, -1.5 + k, (k + 0.6) * 0.5), (sz * 0.7, sz, sz * 1.3), rng.choice(ROCKS), rng)
    p.info["col"] = [("prism", [(-HALF, 0), (HALF, 0), (HALF, 2.0), (-HALF, 0.0)])]


@piece("mine_bridge", "structure", "Plank bridge with rope rails, 4 m long along Blender Y / Godot Z, deck top at 0.25")
def _bridge(p, rng):
    for s in (-1, 1):
        p.cyl((s * 0.85, -HALF, 0.1), 0.1, CELL, "wood_dark", seg=7, rot=(-90, 0, 0))
    k = 0
    y = -HALF + 0.12
    while y < HALF - 0.1:
        p.box((rng.uniform(-0.03, 0.03), y, 0.22), (2.0 + rng.uniform(-0.1, 0.06), 0.22, 0.06),
              rng.choice(["wood", "wood", "wood_dark"]), 0.01, rot=(0, rng.uniform(-1.5, 1.5), rng.uniform(-2, 2)))
        y += 0.25
        k += 1
    for s in (-1, 1):
        for yy in (-1.85, 0.0, 1.85):
            p.cyl((s * 1.02, yy, 0.0), 0.05, 1.15, "wood_dark", seg=6)
        p.cyl((s * 1.02, -HALF + 0.15, 1.05), 0.022, CELL - 0.3, "rope", seg=5, rot=(-90, 0, 0))
        p.cyl((s * 1.02, -HALF + 0.15, 0.62), 0.018, CELL - 0.3, "rope", seg=5, rot=(-90, 0, 0))
    p.info["col"] = [("box", (0, 0, 0.13), (2.1, CELL, 0.26)), ("box", (-1.02, 0, 0.6), (0.1, CELL, 1.0)),
                     ("box", (1.02, 0, 0.6), (0.1, CELL, 1.0))]


@piece("mine_rock_pillar", "structure", "Natural rock column, floor to ceiling (4 m)")
def _rock_pillar(p, rng):
    z = 0.0
    for h, s in ((0.9, 1.55), (0.8, 1.3), (0.8, 1.15), (0.75, 1.2), (0.6, 1.45)):
        p.rock((rng.uniform(-0.06, 0.06), rng.uniform(-0.06, 0.06), z + h / 2 + (0.08 if z == 0 else 0)),
               (s, s * rng.uniform(0.85, 1.0), h * 1.45),
               rng.choice(ROCKS), rng, rot=(0, 0, rng.uniform(0, 90)))
        z += h
    p.info["col"] = [("box", (0, 0, 2.0), (0.9, 0.9, 4.0))]


@piece("mine_shaft_headframe", "structure", "Timber headframe with a pulley wheel, stands over mine_floor_shaft (3.9 m high)")
def _headframe(p, rng):
    for a in (-1, 1):
        for b in (-1, 1):
            p.box((a * 1.38, b * 1.38, 1.85), (0.22, 0.22, 3.7), "wood_dark", 0.03)
            p.box((a * 1.38, b * 1.38, 0.08), (0.34, 0.34, 0.16), "stone_dark", 0.03)
    for b in (-1, 1):
        p.box((0, b * 1.38, 3.6), (3.0, 0.22, 0.2), "wood_dark", 0.03)
        p.box((b * 1.38, 0, 3.6), (0.22, 2.54, 0.2), "wood_dark", 0.03)
        p.box((b * 1.38, 0, 1.85), (0.12, 3.95, 0.14), "wood", 0.02,
              rot=(b * math.degrees(math.atan2(3.1, 2.54)), 0, 0))
    p.box((0, 0, 3.8), (2.96, 0.24, 0.2), "wood", 0.03)
    for s in (-1, 1):
        p.box((0, s * 0.22, 3.42), (0.12, 0.08, 0.5), "wood_dark", 0.01)
    p.cyl((0, -0.06, 3.3), 0.36, 0.12, "iron", seg=12, rot=(-90, 0, 0))
    p.cyl((0, -0.3, 3.3), 0.05, 0.6, "steel", seg=6, rot=(-90, 0, 0))
    for k in range(6):
        a = k * math.pi / 3
        p.box((0.17 * math.cos(a), 0, 3.3 + 0.17 * math.sin(a)), (0.32, 0.05, 0.04), "iron", rot=(0, -math.degrees(a), 0))
    p.cyl((0.36, 0, 2.55), 0.02, 0.75, "rope", seg=5)
    p.info["col"] = [("box", (a * 1.38, b * 1.38, 1.85), (0.24, 0.24, 3.7)) for a in (-1, 1) for b in (-1, 1)]


@piece("mine_door", "structure", "Plank door for mine_wall_entrance. MOVING: pivot = hinge (left edge), turn around Z")
def _door(p, rng):
    x = 0.0
    while x < 1.88:
        w = min(rng.uniform(0.28, 0.36), 1.9 - x)
        if 1.9 - (x + w) < 0.18:
            w = 1.9 - x
        p.box((x + w / 2, 0, 1.45), (w - 0.015, 0.07, 2.9 - rng.uniform(0, 0.04)), rng.choice(["wood", "wood", "wood_dark"]), 0.01)
        x += w
    for z in (0.45, 2.45):
        p.box((0.95, -0.065, z), (1.8, 0.06, 0.16), "wood_dark", 0.01)
        p.box((0.25, -0.1, z), (0.5, 0.02, 0.09), "iron")
    L = math.hypot(1.5, 1.85)
    p.box((0.95, -0.065, 1.45), (L, 0.06, 0.16), "wood_dark", 0.01, rot=(0, -math.degrees(math.atan2(2.0, 1.5)), 0))
    p.cyl((1.65, -0.07, 1.25), 0.07, 0.06, "iron", seg=8, rot=(90, 0, 0))
    p.cyl((1.65, -0.13, 1.25), 0.07, 0.015, "iron", seg=8, r2=0.075, rot=(90, 0, 0))
    p.info["col"] = [("box", (0.95, 0, 1.45), (1.9, 0.12, 2.9))]


@piece("mine_hatch", "structure", "Plank hatch for the shaft. MOVING: pivot = hinge (the -Y edge), turn around X to open")
def _hatch(p, rng):
    x = -1.05
    while x < 1.04:
        w = min(0.3, 1.05 - x)
        p.box((x + w / 2, 1.05, 0.035), (w - 0.015, 2.1, 0.07), rng.choice(["wood", "wood_dark", "wood"]), 0.01)
        x += w
    for y in (0.3, 1.8):
        p.box((0, y, 0.09), (2.0, 0.14, 0.04), "wood_dark", 0.01)
    for x in (-0.6, 0.6):
        p.box((x, 0.2, 0.08), (0.1, 0.4, 0.02), "iron")
        p.cyl((x - 0.1, 0.0, 0.03), 0.04, 0.2, "iron", seg=6, rot=(0, 90, 0))
    p.box((0, 1.98, 0.1), (0.3, 0.05, 0.05), "iron")
    p.info["col"] = [("box", (0, 1.05, 0.05), (2.1, 2.1, 0.1))]


@piece("mine_lift_cage", "structure", "Lift platform with railings for the shaft. MOVING: slide it along Z; open side faces -Y")
def _lift(p, rng):
    p.box((0, 0, 0.06), (1.86, 1.86, 0.12), "wood", 0.02)
    for x in (-0.6, 0.0, 0.6):
        p.box((x, 0, 0.13), (0.04, 1.8, 0.02), "wood_dark")
    for a in (-1, 1):
        for b in (-1, 1):
            p.box((a * 0.88, b * 0.88, 1.25), (0.1, 0.1, 2.3), "iron", 0.01)
    for z in (0.55, 1.05):
        p.box((0, 0.88, z), (1.76, 0.06, 0.06), "wood_dark", 0.01)
        for a in (-1, 1):
            p.box((a * 0.88, 0, z), (0.06, 1.76, 0.06), "wood_dark", 0.01)
    for a in (-1, 1):
        p.box((0, a * 0.88, 2.4), (1.86, 0.08, 0.1), "iron", 0.01)
        p.box((a * 0.88, 0, 2.4), (0.08, 1.86, 0.1), "iron", 0.01)
        p.box((a * 0.44, 0, 2.55), (0.06, 1.8, 0.05), "iron", rot=(0, a * 30, 0))
    p.cyl((0, 0, 2.48), 0.07, 0.1, "iron", seg=6)
    p.cyl((0, 0, 2.58), 0.06, 0.06, "steel", seg=6, r2=0.03)
    p.info["col"] = [("box", (0, 0, 0.06), (1.86, 1.86, 0.12)), ("box", (0, 0.88, 0.8), (1.86, 0.1, 1.4)),
                     ("box", (-0.88, 0, 0.8), (0.1, 1.86, 1.4)), ("box", (0.88, 0, 0.8), (0.1, 1.86, 1.4))]


# --- props ------------------------------------------------------------------
def cart_body(p):
    p.push(Matrix.Diagonal((1.0, 1.32, 1.0, 1.0)))
    r0, r1 = 0.45 * math.sqrt(2), 0.55 * math.sqrt(2)
    p.lathe([(0, 0.36), (r0, 0.36), (r1, 0.98), (r1 - 0.07, 0.98), (r0 - 0.07, 0.42), (0, 0.42)], "rust", seg=4)
    for z in (0.5, 0.92):
        rr = r0 + (r1 - r0) * (z - 0.36) / 0.62 + 0.02
        p.lathe([(rr, z - 0.025), (rr, z + 0.025), (rr - 0.02, z + 0.025), (rr - 0.02, z - 0.025), (rr, z - 0.025)], "iron", seg=4, caps=False)
    p.pop()
    p.box((0, 0, 0.3), (0.82, 1.15, 0.1), "wood_dark", 0.02)
    for s in (-1, 1):
        p.box((0, s * 0.68, 0.3), (0.22, 0.2, 0.08), "iron", 0.01)
        p.cyl((0, s * 0.8, 0.3), 0.045, 0.06, "iron", seg=6, rot=(90, 0, 0))
        p.cyl((-0.6, s * 0.42, 0.16), 0.03, 1.2, "iron", seg=6, rot=(0, 90, 0))
        for x in (-1, 1):
            p.cyl((x * 0.5 - x * 0.03, s * 0.42, 0.16), 0.16, 0.06, "iron", seg=10, rot=(0, 90 * x, 0))
            p.cyl((x * 0.5 - x * 0.03, s * 0.42, 0.16), 0.19, 0.02, "iron", seg=10, rot=(0, 90 * x, 0))
            p.box((x * 0.4, s * 0.42, 0.24), (0.06, 0.14, 0.12), "iron")


@piece("mine_cart", "props", f"Empty mine cart, wheels fit the rails. MOVING: roll it along Blender Y / Godot Z, at height {RAIL_TOP} on rails", "free")
def _cart(p, rng):
    cart_body(p)


@piece("mine_cart_ore", "props", f"Mine cart loaded with ore and gold. MOVING: same as mine_cart", "free")
def _cart_ore(p, rng):
    cart_body(p)
    p.push(Matrix.Diagonal((1.0, 1.32, 1.0, 1.0)))
    mound(p, rng, 0.6, 0.35, "stone_b", seg=8, c=(0, 0, 0.85))
    p.pop()
    for k in range(10):
        s = rng.uniform(0.12, 0.22)
        p.rock((rng.uniform(-0.3, 0.3), rng.uniform(-0.45, 0.45), 1.0 + rng.uniform(0, 0.12)), (s, s, s * 0.8),
               rng.choice(["gold", "gold", "copper", "rock_dark"]), rng, rot=(0, 0, rng.uniform(0, 90)))


@piece("mine_lantern_hanging", "props", "Lantern on a chain; hang it from a beam (pivot = bottom, top hook at 0.95 m)")
def _lantern_hanging(p, rng):
    lantern(p, (0, 0, 0))
    chain(p, 0, 0, 0.55, 0.9)
    p.box((0, 0, 0.93), (0.12, 0.04, 0.04), "iron")


@piece("mine_lantern_post", "props", "Wooden post with a hanging lantern, 2 m")
def _lantern_post(p, rng):
    p.box((0, 0, 0.06), (0.5, 0.5, 0.12), "stone_dark", 0.03)
    p.box((0, 0, 1.0), (0.14, 0.14, 1.95), "wood_dark", 0.02)
    p.box((0.32, 0, 1.92), (0.62, 0.1, 0.1), "wood_dark", 0.02)
    p.box((0.15, 0, 1.75), (0.06, 0.06, 0.4), "wood", 0.01, rot=(0, 45, 0))
    chain(p, 0.55, 0, 1.6, 1.87)
    lantern(p, (0.55, 0, 1.05))
    p.info["col"] = [("box", (0, 0, 1.0), (0.3, 0.3, 2.0))]


@piece("mine_lantern_wall", "props", "Wall lantern on an iron arm (wall decor: use the wall's transform)", "decor")
def _lantern_wall(p, rng):
    y = -WALL_T / 2 - 0.08
    p.box((0, y + 0.02, 2.55), (0.18, 0.04, 0.3), "iron", 0.01)
    p.box((0, y - 0.2, 2.65), (0.04, 0.44, 0.04), "iron")
    p.box((0, y - 0.1, 2.52), (0.03, 0.03, 0.3), "iron", rot=(-45, 0, 0))
    chain(p, 0, y - 0.4, 2.42, 2.64)
    lantern(p, (0, y - 0.4, 1.88))
    p.info["col"] = [("box", (0, y - 0.25, 2.3), (0.3, 0.5, 0.8))]


@piece("mine_pickaxe", "props", "Pickaxe lying on the ground")
def _pickaxe(p, rng):
    pickaxe(p)


@piece("mine_shovel", "props", "Shovel lying on the ground")
def _shovel(p, rng):
    p.cyl((-0.55, 0, 0.03), 0.026, 0.95, "wood", seg=6, rot=(0, 90, 0))
    p.box((-0.58, 0, 0.03), (0.05, 0.2, 0.04), "wood_dark")
    p.box((0.42, 0, 0.035), (0.1, 0.07, 0.06), "iron")
    p.box((0.62, 0, 0.012), (0.34, 0.27, 0.02), "steel", rot=(0, -6, 0))
    p.prism_xz([(0.79, 0.0), (0.86, 0.0), (0.86, 0.03), (0.79, 0.03)], -0.135, 0.135, "steel")


@piece("mine_tool_rack", "props", "Wall rack with two pickaxes and two shovels (back side +Y)")
def _tool_rack(p, rng):
    for s in (-0.65, 0.65):
        p.box((s, 0.08, 0.85), (0.1, 0.1, 1.7), "wood_dark", 0.01)
    for z in (0.35, 1.45):
        p.box((0, 0.08, z), (1.5, 0.06, 0.12), "wood", 0.01)
    for i, x in enumerate((-0.45, -0.15, 0.15, 0.45)):
        p.push(Matrix.Translation((x, -0.04, 1.02)) @ Matrix.Rotation(math.radians(-90), 4, "Y")
               @ Matrix.Rotation(math.radians(90), 4, "X"))
        if i % 2 == 0:
            pickaxe(p)
        else:
            p.cyl((-0.55, 0, 0.03), 0.026, 0.95, "wood", seg=6, rot=(0, 90, 0))
            p.box((0.42, 0, 0.035), (0.1, 0.07, 0.06), "iron")
            p.box((0.62, 0, 0.012), (0.34, 0.27, 0.02), "steel")
        p.pop()
        p.box((x, 0.03, 1.45), (0.04, 0.12, 0.04), "iron")
    p.info["col"] = [("box", (0, 0, 0.85), (1.5, 0.3, 1.7))]


@piece("mine_ore_pile_gold", "props", "Pile of rock with gold nuggets")
def _ore_gold(p, rng):
    mound(p, rng, 0.75, 0.55, "stone_b")
    for k in range(14):
        a, r = rng.uniform(0, 6.28), rng.uniform(0.05, 0.6)
        z = 0.55 * (1 - (r / 0.75) ** 1.3)
        s = rng.uniform(0.1, 0.2)
        p.rock((r * math.cos(a), r * math.sin(a), max(z - 0.02, s * 0.3)), (s, s, s * 0.8), "gold", rng,
               rot=(0, 0, rng.uniform(0, 90)))


@piece("mine_ore_pile_iron", "props", "Pile of rusty iron ore")
def _ore_iron(p, rng):
    mound(p, rng, 0.7, 0.5, "rust")
    scatter_rocks(p, rng, 0, 0, 12, 0.65, (0.15, 0.3), mats=["rust", "rust", "rock_dark", "copper"])


@piece("mine_coal_pile", "props", "Pile of coal")
def _coal(p, rng):
    mound(p, rng, 0.65, 0.45, "coal")
    scatter_rocks(p, rng, 0, 0, 12, 0.6, (0.1, 0.25), mats=["coal"])


@piece("mine_crystal_cluster", "props", "Cluster of glowing cyan crystals on a rock base")
def _crystals(p, rng):
    p.rock((0, 0, 0.12), (0.8, 0.7, 0.32), "rock_dark", rng)
    for (x, y, r, h, tx, tz) in ((0, 0, 0.13, 1.0, 0, 0), (0.2, 0.1, 0.09, 0.65, 25, -70),
                                 (-0.18, 0.08, 0.08, 0.55, 28, 60), (0.05, -0.2, 0.08, 0.5, 30, 180),
                                 (-0.12, -0.12, 0.06, 0.38, 40, 130), (0.25, -0.12, 0.06, 0.35, 45, -120)):
        p.crystal((x, y, 0.15), r, h, "crystal_cyan", tilt=(tx, 0, tz))
    p.light((0, -0.6, 1.25), 0.8, "crystal")
    p.info["col"] = [("box", (0, 0, 0.5), (0.8, 0.7, 1.0))]


@piece("mine_crystal_large", "props", "Large violet crystal formation, 2 m")
def _crystal_large(p, rng):
    p.rock((0, 0, 0.15), (1.3, 1.1, 0.4), "rock_dark", rng)
    for (x, y, r, h, tx, tz) in ((0, 0, 0.26, 2.0, 6, 0), (0.35, 0.15, 0.16, 1.2, 25, -60),
                                 (-0.32, 0.1, 0.15, 1.05, 24, 70), (0.1, -0.35, 0.13, 0.9, 30, 170),
                                 (-0.3, -0.25, 0.1, 0.6, 40, 120), (0.42, -0.25, 0.09, 0.5, 45, -130)):
        p.crystal((x, y, 0.2), r, h, "crystal_violet", tilt=(tx, 0, tz))
    p.light((0.0, -1.0, 2.2), 1.4, "crystal_violet")
    p.info["col"] = [("box", (0, 0, 1.0), (1.2, 1.0, 2.0))]


@piece("mine_boulders", "props", "Group of large fallen boulders")
def _boulders(p, rng):
    for (x, y, s) in ((0, 0, 1.1), (0.75, 0.3, 0.75), (-0.6, 0.4, 0.6), (0.35, -0.6, 0.5), (-0.3, -0.55, 0.35)):
        p.rock((x, y, s * 0.42), (s, s * rng.uniform(0.8, 1.0), s * 0.9), rng.choice(ROCKS), rng,
               rot=(0, 0, rng.uniform(0, 90)))


@piece("mine_stalagmite", "props", "Stalagmite with two smaller spikes, 1.7 m")
def _stalagmite(p, rng):
    for (x, y, r, h) in ((0, 0, 0.42, 1.7), (0.42, 0.18, 0.22, 0.8), (-0.3, 0.3, 0.17, 0.55)):
        p.lathe([(0, 0), (r, 0), (r * 0.72, h * 0.3), (r * 0.42, h * 0.62), (r * 0.15, h * 0.9), (0, h)],
                rng.choice(["rock_brown", "stone_b"]), c=(x, y, 0), seg=7)
    p.info["col"] = [("box", (0, 0, 0.85), (0.8, 0.8, 1.7))]


@piece("mine_dynamite_crate", "props", "Crate of dynamite with a bundle on top")
def _dynamite(p, rng):
    crate(p, 0.8)
    p.box((0, -0.41, 0.4), (0.5, 0.02, 0.18), "cloth_red")
    for k in range(5):
        a = k * 2 * math.pi / 5
        p.cyl((0.1 + 0.06 * math.cos(a), 0.06 * math.sin(a), 0.8), 0.04, 0.42, "cloth_red", seg=7, rot=(0, 90, 0))
    p.cyl((-0.11, 0, 0.8), 0.04, 0.42, "cloth_red", seg=7, rot=(0, 90, 0))
    p.cyl((0.0, 0.0, 0.8), 0.115, 0.05, "rope", seg=8, rot=(0, 90, 0))
    p.cyl((0.31, 0, 0.86), 0.008, 0.3, "rope", seg=4, rot=(0, 70, 0))


@piece("mine_detonator", "props", "Plunger detonator box with its wire spool")
def _detonator(p, rng):
    p.box((0, 0, 0.17), (0.42, 0.3, 0.32), "wood", 0.015)
    p.box((0, 0, 0.34), (0.44, 0.32, 0.04), "wood_dark", 0.01)
    p.cyl((0, 0, 0.36), 0.025, 0.36, "iron", seg=6)
    p.box((0, 0, 0.72), (0.34, 0.05, 0.05), "iron", 0.01)
    p.box((0, -0.16, 0.18), (0.24, 0.02, 0.12), "cloth_red")
    p.cyl((0.42, 0.0, 0.0), 0.12, 0.22, "wood_dark", seg=8)
    p.cyl((0.42, 0.0, 0.03), 0.14, 0.16, "cloth_red", seg=8)
    p.cyl((0.21, 0.0, 0.2), 0.012, 0.24, "coal", seg=4, rot=(0, 75, 0))


@piece("mine_winch", "props", "Hand winch with a rope drum on two timber trestles")
def _winch(p, rng):
    for s in (-1, 1):
        p.prism_xz([(-0.35, 0), (0.35, 0), (0.06, 1.0), (-0.06, 1.0)], -0.06, 0.06, "wood_dark", c=(0, s * 0.6, 0))
        p.box((0, s * 0.6, 0.04), (0.9, 0.18, 0.08), "wood_dark", 0.01)
    p.cyl((0, -0.56, 0.92), 0.18, 1.12, "wood", seg=10, rot=(-90, 0, 0))
    p.cyl((0, -0.46, 0.92), 0.2, 0.92, "rope", seg=10, rot=(-90, 0, 0))
    p.cyl((0, -0.8, 0.92), 0.03, 1.6, "iron", seg=6, rot=(-90, 0, 0))
    p.box((0, 0.8, 1.07), (0.04, 0.04, 0.32), "iron")
    p.cyl((0, 0.8, 1.22), 0.025, 0.18, "wood_dark", seg=6, rot=(-90, 0, 0))
    p.box((0, 0, 0.3), (0.08, 1.3, 0.1), "wood_dark", 0.01)
    p.info["col"] = [("box", (0, 0, 0.6), (0.9, 1.6, 1.2))]


@piece("mine_switch_lever", "props", "Track switch lever base (put mine_switch_lever_handle on it at height 0.22)")
def _switch(p, rng):
    p.box((0, 0, 0.08), (0.5, 0.36, 0.16), "wood_dark", 0.02)
    for s in (-1, 1):
        p.box((s * 0.08, 0, 0.2), (0.04, 0.3, 0.1), "iron", 0.005)
    p.cyl((-0.12, 0, 0.22), 0.025, 0.24, "steel", seg=6, rot=(0, 90, 0))
    p.prism_xz([(-0.2, 0.16), (0.2, 0.16), (0.2, 0.18), (-0.2, 0.18)], -0.15, 0.15, "iron")
    p.box((0, 0.16, 0.2), (0.02, 0.02, 0.06), "cloth_red")
    p.info["col"] = [("box", (0, 0, 0.12), (0.5, 0.36, 0.24))]


@piece("mine_switch_lever_handle", "props", "Lever handle. MOVING: pivot = axle, turn it around X (about +/- 30 degrees)")
def _switch_handle(p, rng):
    p.box((0, 0, 0.04), (0.06, 0.08, 0.08), "iron", 0.01)
    p.cyl((0, 0, 0.06), 0.025, 0.85, "iron", seg=6)
    p.cyl((0, 0, 0.78), 0.045, 0.16, "cloth_red", seg=8)


@piece("mine_ladder", "props", "Wooden ladder, 4 m (lean it on a wall or put it in a shaft)")
def _ladder(p, rng):
    for s in (-1, 1):
        p.box((s * 0.26, 0, 2.0), (0.07, 0.09, 4.0), "wood_dark", 0.01)
    z = 0.3
    while z < 3.9:
        p.cyl((-0.27, 0, z), 0.025, 0.54, "wood", seg=6, rot=(0, 90, 0))
        z += 0.3
    p.info["col"] = [("box", (0, 0, 2.0), (0.6, 0.1, 4.0))]


@piece("mine_scaffold", "props", "Timber scaffold, 2 x 2 m, platform at 2 m")
def _scaffold(p, rng):
    for a in (-1, 1):
        for b in (-1, 1):
            p.box((a * 0.92, b * 0.92, 1.0), (0.14, 0.14, 2.0), "wood_dark", 0.02)
        p.box((a * 0.92, 0, 1.0), (0.08, 2.4, 0.12), "wood", 0.01, rot=(math.degrees(math.atan2(1.85, 1.85)), 0, 0))
        p.box((0, a * 0.92, 1.85), (1.98, 0.1, 0.12), "wood_dark", 0.01)
        p.box((a * 0.92, 0, 1.85), (0.1, 1.98, 0.12), "wood_dark", 0.01)
    plank_deck(p, -1.0, 1.0, -1.025, 1.025, 2.0)
    p.info["col"] = [("box", (0, 0, 1.96), (2.05, 2.05, 0.1))] + \
        [("box", (a * 0.92, b * 0.92, 1.0), (0.14, 0.14, 2.0)) for a in (-1, 1) for b in (-1, 1)]


@piece("mine_sign_danger", "props", "Wooden warning sign on a post (no text)")
def _sign(p, rng):
    p.box((0, 0.05, 0.8), (0.12, 0.12, 1.6), "wood_dark", 0.02)
    p.box((0, -0.04, 1.35), (0.9, 0.06, 0.6), "wood", 0.015, rot=(0, rng.uniform(-3, 3), 0))
    pts = [(-0.3, 1.13), (0.3, 1.13), (0.0, 1.6)]
    p.prism_xz(pts, -0.085, -0.07, "cloth_red")
    p.prism_xz([(-0.22, 1.17), (0.22, 1.17), (0.0, 1.52)], -0.095, -0.085, "parchment")
    p.box((0, -0.1, 1.33), (0.04, 0.01, 0.14), "coal")
    p.box((0, -0.1, 1.215), (0.04, 0.01, 0.04), "coal")
    p.info["col"] = [("box", (0, 0, 0.85), (0.9, 0.2, 1.7))]


@piece("mine_mushrooms_glow", "props", "Cluster of glowing cave mushrooms")
def _mushrooms(p, rng):
    for (x, y, h, r) in ((0, 0, 0.42, 0.2), (0.25, 0.12, 0.28, 0.14), (-0.2, 0.15, 0.24, 0.12),
                         (0.08, -0.22, 0.18, 0.1), (-0.15, -0.14, 0.13, 0.08), (0.3, -0.15, 0.1, 0.06)):
        p.cyl((x, y, 0), r * 0.28, h, "parchment", seg=6, r2=r * 0.22)
        p.lathe([(0, h - 0.02), (r, h - 0.02), (r * 0.85, h + r * 0.35), (r * 0.4, h + r * 0.6), (0, h + r * 0.65)],
                "mushroom_glow", c=(x, y, 0), seg=8)
    p.rock((0.0, 0.0, 0.03), (0.75, 0.6, 0.1), "rock_dark", rng)
    p.light((0, 0, 0.85), 0.5, "glow")


@piece("mine_plank_pile", "props", "Stack of timber planks and beams")
def _planks(p, rng):
    # two layers of boards (one textured slab each, the joints are in the "planks" texture) on cross battens
    for layer, (n, z) in enumerate(((4, 0.05), (3, 0.29))):
        w = n * 0.24
        p.box((0, -0.36 + w / 2 - 0.12, z), (2.0, w, 0.1), planks_mat(), rot=(0, 0, rng.uniform(-1.5, 1.5)))
    for k in range(4):
        p.box((-0.75 + k * 0.5, 0, 0.17), (0.14, 1.0, 0.14), "wood_dark")
    p.box((0.2, 0.0, 0.46), (2.2, 0.26, 0.24), "wood_dark", rot=(0, 0, 8))


@piece("mine_workbench", "props", "Workbench with a vise, a pickaxe and ore samples, 2 x 0.9 m")
def _workbench(p, rng):
    for i in range(3):
        p.box((0, -0.3 + i * 0.3, 0.86), (2.0, 0.29, 0.08), "wood", 0.01)
    for a in (-1, 1):
        for b in (-1, 1):
            p.box((a * 0.88, b * 0.35, 0.41), (0.12, 0.12, 0.82), "wood_dark", 0.02)
        p.box((a * 0.88, 0, 0.16), (0.08, 0.7, 0.08), "wood_dark", 0.01)
    p.box((0, 0, 0.16), (1.7, 0.08, 0.08), "wood_dark", 0.01)
    p.box((0, 0.1, 0.35), (1.7, 0.7, 0.04), "wood_dark", 0.01)
    p.box((0.75, -0.3, 0.98), (0.18, 0.2, 0.16), "iron", 0.01)
    p.cyl((0.75, -0.55, 0.98), 0.02, 0.3, "steel", seg=6, rot=(-90, 0, 0))
    p.push(Matrix.Translation((-0.2, 0.05, 0.9)) @ Matrix.Rotation(math.radians(15), 4, "Z"))
    pickaxe(p)
    p.pop()
    for (x, y, m) in ((0.45, 0.25, "gold"), (0.3, 0.3, "copper"), (0.55, 0.05, "rust")):
        p.rock((x, y, 0.95), (0.1, 0.1, 0.08), m, rng)
    lantern(p, (-0.75, 0.22, 0.9), 0.8)
    p.info["col"] = [("box", (0, 0, 0.45), (2.0, 0.9, 0.9))]


# =========================================================================== v1.1 pieces
# Everything below is new in v1.1. The v1.0 pieces above are unchanged (same code, same seeds).

def track_y(p, y0, y1, gaps=(), sleepers=True, sleeper_skip=None):
    """Straight track along Y, like rails_straight, with optional gaps in the rails (crossings)."""
    if sleepers:
        n = int(round((y1 - y0) / 0.5))
        for k in range(n):
            y = y0 + 0.25 + k * 0.5
            if sleeper_skip and sleeper_skip(y):
                continue
            p.box((0, y, 0.04), (1.5, 0.22, 0.08), "wood_dark", 0.01)
    for s in (-1, 1):
        segs = [(y0, y1)]
        for a, b in gaps:
            segs = subtract(segs, a, b)
        for a, b in segs:
            p.box((s * 0.5, (a + b) / 2, 0.09), (0.14, b - a, 0.02), "iron")
            p.box((s * 0.5, (a + b) / 2, 0.13), (0.06, b - a, 0.06), "steel")


def rail_arc(p, sleeper_ok=None):
    """Same 90 degree curve as mine_floor_rails_curve (-Y edge to +X edge, radius 2 m)."""
    cx, cy, n = HALF, -HALF, 8
    for k in range(n + 1):
        a = math.radians(90 + 90 * (k + 0.5) / (n + 1))
        x, y = cx + 2.0 * math.cos(a), cy + 2.0 * math.sin(a)
        if sleeper_ok and not sleeper_ok(x, y):
            continue
        p.box((x, y, 0.04), (1.5, 0.22, 0.08), "wood_dark", 0.01, rot=(0, 0, math.degrees(a)))
    for r in (1.5, 2.5):
        for k in range(n):
            a0, a1 = math.radians(90 + 90 * k / n), math.radians(90 + 90 * (k + 1) / n)
            m = (a0 + a1) / 2
            L = 2 * r * math.sin((a1 - a0) / 2) + 0.012
            c = (cx + r * math.cos(m) * math.cos((a1 - a0) / 2), cy + r * math.sin(m) * math.cos((a1 - a0) / 2))
            p.box((c[0], c[1], 0.09), (0.14, L, 0.02), "iron", rot=(0, 0, math.degrees(m)))
            p.box((c[0], c[1], 0.13), (0.06, L, 0.06), "steel", rot=(0, 0, math.degrees(m)))


def cart_chassis(p):
    """Frame, couplings, axles and wheels of mine_cart (same sizes: fits the same rails)."""
    p.box((0, 0, 0.3), (0.82, 1.15, 0.1), "wood_dark", 0.02)
    for s in (-1, 1):
        p.box((0, s * 0.68, 0.3), (0.22, 0.2, 0.08), "iron", 0.01)
        p.cyl((0, s * 0.8, 0.3), 0.045, 0.06, "iron", seg=6, rot=(90, 0, 0))
        p.cyl((-0.6, s * 0.42, 0.16), 0.03, 1.2, "iron", seg=6, rot=(0, 90, 0))
        for x in (-1, 1):
            p.cyl((x * 0.5 - x * 0.03, s * 0.42, 0.16), 0.16, 0.06, "iron", seg=10, rot=(0, 90 * x, 0))
            p.cyl((x * 0.5 - x * 0.03, s * 0.42, 0.16), 0.19, 0.02, "iron", seg=10, rot=(0, 90 * x, 0))
            p.box((x * 0.4, s * 0.42, 0.24), (0.06, 0.14, 0.12), "iron")


def beam(p, a, b, w, h, mat, bevel=0.01):
    """Box beam from point a to point b (cross-section w x h)."""
    a, b = Vector(a), Vector(b)
    d = b - a
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    tbm = bmesh.new()
    bmesh.ops.create_cube(tbm, size=1.0)
    bmesh.ops.scale(tbm, vec=Vector((w, h, d.length)), verts=list(tbm.verts))
    bv = 0.0   # no bevels (see Part.box)
    if bv > 0.001:
        bmesh.ops.bevel(tbm, geom=list(tbm.edges), offset=bv, offset_type="OFFSET",
                        segments=1, profile=0.5, affect="EDGES", clamp_overlap=True)
    p._add(tbm, mat, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())


def rope_seg(p, a, b, r=0.018, mat="rope", seg=5):
    a, b = Vector(a), Vector(b)
    d = b - a
    q = Vector((0, 0, 1)).rotation_difference(d.normalized())
    tbm = bmesh.new()
    bmesh.ops.create_cone(tbm, cap_ends=True, cap_tris=False, segments=seg, radius1=r, radius2=r, depth=d.length)
    p._add(tbm, mat, Matrix.Translation((a + b) / 2) @ q.to_matrix().to_4x4())


def barrel(p, r=0.3, h=0.8, mat="wood_dark", c=(0, 0, 0), seg=10):
    x, y, z = c
    p.lathe([(0, 0), (r * 0.85, 0), (r, h * 0.5), (r * 0.85, h), (0, h)], mat, c=(x, y, z), seg=seg)
    for t in (0.12, 0.88):
        rr = r * (0.85 + 0.15 * (1 - abs(t - 0.5) * 2)) + 0.012
        p.lathe([(rr, h * t - 0.03), (rr, h * t + 0.03), (rr - 0.03, h * t + 0.03), (rr - 0.03, h * t - 0.03), (rr, h * t - 0.03)],
                "iron", c=(x, y, z), seg=seg, caps=False)


# --- structure ----------------------------------------------------------------
@piece("mine_floor_rails_junction", "structure",
       "Floor tile with a rail turnout: straight track along Blender Y plus a branch curving to the +X edge "
       "(mine_rails_switch_blade fits it at local (0, -0.7, 0))", "floor")
def _floor_rails_junction(p, rng):
    floor_base(p, rng, avoid=lambda x, y, s: abs(x) < 0.9 + s / 2 or abs(math.hypot(x - HALF, y + HALF) - 2.0) < 0.9 + s / 2)
    track_y(p, -HALF, HALF)
    rail_arc(p, sleeper_ok=lambda x, y: x > 1.1)
    p.box((1.05, -1.7, 0.05), (0.4, 0.3, 0.1), "iron", 0.01)   # switch box at the points
    p.info["col"] = [("box", (0, 0, -0.12), (CELL, CELL, 0.24))]


@piece("mine_floor_rails_cross", "structure", "Floor tile with two tracks crossing at right angles", "floor")
def _floor_rails_cross(p, rng):
    floor_base(p, rng, avoid=lambda x, y, s: abs(x) < 0.9 + s / 2 or abs(y) < 0.9 + s / 2)
    track_y(p, -HALF, HALF, gaps=((-0.53, -0.47), (0.47, 0.53)))
    p.push(Matrix.Rotation(math.radians(90), 4, "Z"))
    track_y(p, -HALF, HALF, gaps=((-0.53, -0.47), (0.47, 0.53)), sleeper_skip=lambda y: abs(y) < 0.9)
    p.pop()
    p.box((0, 0, 0.045), (1.3, 1.3, 0.09), "wood_dark", 0.01)   # crossing timber
    p.info["col"] = [("box", (0, 0, -0.12), (CELL, CELL, 0.24))]


SLOPE = math.atan2(2.0, CELL)


@piece("mine_floor_rails_slope", "structure",
       "Rail track on a dirt ramp, rises 2 m over one cell toward +Y / Godot -Z (same rise as the stairs)")
def _floor_rails_slope(p, rng):
    p.prism_xz([(-HALF, 0), (HALF, 0), (HALF, 2.0)], -HALF, HALF, "dirt", rot=(0, 0, 90))
    L = math.hypot(CELL, 2.0)
    p.push(Matrix.Translation((0, -HALF, 0)) @ Matrix.Rotation(SLOPE, 4, "X"))
    track_y(p, 0, L)
    for s in (-1, 1):
        p.box((s * 1.85, L / 2, 0.08), (0.24, L, 0.16), "wood_dark", 0.02)
        for k in range(5):
            sz = rng.uniform(0.25, 0.4)
            p.rock((s * rng.uniform(1.25, 1.5), 0.45 + k * 0.9, sz * 0.25), (sz, sz * 1.2, sz * 0.6), rng.choice(ROCKS), rng,
                   rot=(0, 0, rng.uniform(0, 90)))
    p.pop()
    p.info["col"] = [("prism", [(-HALF, 0), (HALF, 0), (HALF, 2.0)])]


@piece("mine_floor_pit", "structure", "Floor tile with a 1.5 m deep rocky pit (span it with mine_rail_bridge or mine_bridge)", "floor")
def _floor_pit(p, rng):
    p.box((0, 0, -1.45), (CELL, CELL, 0.1), floor_mat())
    m = rock_mat()
    for s in (-1, 1):   # solid rock sides, full depth (the stones are in the texture)
        p.box((0, s * 1.9, -0.75), (CELL, 0.2, 1.5), m)
        p.box((s * 1.9, 0, -0.75), (0.2, 3.6, 1.5), m)
    for (x, y, sz) in ((-0.8, 0.5, 0.45), (0.9, -0.7, 0.38), (0.3, 1.1, 0.3)):   # a few fallen stones at the bottom
        p.rock((x, y, -1.4 + sz * 0.3), (sz, sz, sz * 0.7), rng.choice(ROCKS), rng)
    p.info["col"] = [("box", (0, 0, -1.45), (CELL, CELL, 0.1))] + \
        [("box", (0, s * 1.9, -0.75), (CELL, 0.2, 1.5)) for s in (-1, 1)] + \
        [("box", (s * 1.9, 0, -0.75), (0.2, 3.6, 1.5)) for s in (-1, 1)]


@piece("mine_rail_bridge", "structure",
       "Timber trestle carrying a rail track over a pit, 4 m along Blender Y, rails at the same height as the rail floors", "below")
def _rail_bridge(p, rng):
    track_y(p, -HALF, HALF)
    for s in (-1, 1):
        p.box((s * 0.5, 0, -0.12), (0.24, CELL, 0.24), "wood_dark", 0.02)
        p.box((s * 0.9, 0, 0.05), (0.14, CELL, 0.1), "wood", 0.01)
    for y in (-1.3, 1.3):
        for s in (-1, 1):
            beam(p, (s * 0.5, y, -0.24), (s * 0.85, y, -1.5), 0.2, 0.2, "wood_dark", 0.02)
        p.box((0, y, -0.32), (1.5, 0.22, 0.16), "wood_dark", 0.02)
        p.box((0, y, -1.42), (2.0, 0.24, 0.16), "wood_dark", 0.02)
        beam(p, (-0.6, y - 0.12, -0.45), (0.78, y - 0.12, -1.35), 0.1, 0.06, "wood", 0.01)
        beam(p, (0.6, y + 0.12, -0.45), (-0.78, y + 0.12, -1.35), 0.1, 0.06, "wood", 0.01)
    for s in (-1, 1):
        beam(p, (s * 0.7, -1.3, -0.9), (s * 0.7, 1.3, -0.9), 0.08, 0.12, "wood", 0.01)
    p.info["col"] = [("box", (0, 0, -0.1), (1.8, CELL, 0.2)), ("box", (0, -1.3, -0.85), (1.8, 0.3, 1.3)),
                     ("box", (0, 1.3, -0.85), (1.8, 0.3, 1.3))]


@piece("mine_floor_puddles", "structure", "Floor tile with water puddles", "floor")
def _floor_puddles(p, rng):
    pud = [(-0.9, 0.6, 0.85, 0.55, 20), (0.9, -0.8, 0.6, 0.42, -30), (0.6, 1.3, 0.35, 0.25, 70), (-1.1, -1.2, 0.3, 0.22, 10)]
    floor_base(p, rng, avoid=lambda x, y, s: any(((x - a) / (rx + s / 2)) ** 2 + ((y - b) / (ry + s / 2)) ** 2 < 1.3
                                                 for a, b, rx, ry, _ in pud))
    for a, b, rx, ry, r in pud:
        p.push(Matrix.Translation((a, b, -0.02)) @ Matrix.Rotation(math.radians(r), 4, "Z") @ Matrix.Diagonal((rx, ry, 1, 1)))
        p.cyl((0, 0, 0), 1.08, 0.03, "rock_dark", seg=10)
        p.cyl((0, 0, 0), 1.0, 0.035, "water", seg=10)
        p.pop()
    p.info["col"] = [("box", (0, 0, -0.12), (CELL, CELL, 0.24))]


@piece("mine_floor_rubble", "structure", "Floor tile strewn with gravel, loose stones and a broken plank", "floor")
def _floor_rubble(p, rng):
    p.box((0, 0, -0.1), (CELL, CELL, 0.2), tex_mat("stonefloor", ["rock_brown", "stone_b", "rock_dark", "stone_c", "dirt", "dirt"], mortar="dirt"))
    for (x, y, sz) in ((-1.0, 0.8, 0.42), (1.1, -0.6, 0.36), (-1.3, -1.2, 0.3), (1.2, 1.4, 0.32)):   # a few loose stones
        p.rock((x, y, sz * 0.2), (sz, sz * 0.8, sz * 0.55), rng.choice(ROCKS), rng, rot=(0, 0, rng.uniform(0, 180)))
    p.box((0.3, 0.4, 0.03), (1.2, 0.2, 0.06), "wood", rot=(0, 0, 25))
    p.box((-0.5, -0.3, 0.03), (0.5, 0.18, 0.06), "wood_dark", rot=(0, 0, -40))
    p.info["col"] = [("box", (0, 0, -0.12), (CELL, CELL, 0.24))]


@piece("mine_floor_planks", "structure", "Plank floor tile on timber joists, walkable top at 0", "floor")
def _floor_planks(p, rng):
    plank_deck(p, -HALF, HALF, -HALF, HALF, 0.0, 0.07)
    for x in (-1.5, 0.0, 1.5):   # joists under the boards (along Y)
        p.box((x, 0, -0.13), (0.16, CELL, 0.12), "wood_dark")
    p.info["col"] = [("box", (0, 0, -0.1), (CELL, CELL, 0.2))]


@piece("mine_wall_silver", "structure", "Rock wall crossed by a pale quartz lode studded with silver")
def _wall_silver(p, rng):
    rock_wall(p, rng)
    wave = lambda x: 0.28 * math.sin(x * 1.4)
    band(p, rng, 1.7, 0.4, "quartz", wave=wave)
    for k in range(8):
        x = -1.6 + k * 0.45 + rng.uniform(-0.1, 0.1)
        z = 1.7 + wave(x) + rng.uniform(-0.12, 0.12)
        p.rock((x, -0.37, z), (0.13, 0.1, 0.11), "silver", rng, rot=(rng.uniform(0, 40), 0, rng.uniform(0, 90)))
    for k in range(5):
        x = rng.uniform(-1.6, 1.6)
        z = 1.7 + wave(x)
        p.cyl((x, -0.35, z), 0.04, 0.22, "silver", seg=4, r2=0.0, rot=(90 + rng.uniform(-25, 25), 0, rng.uniform(-30, 30)))
    p.info["col"] = [("box", (0, 0, 2.0), (CELL, WALL_T, WALL_H))]


@piece("mine_wall_gems", "structure", "Rock wall with three geode pockets full of red and green gems")
def _wall_gems(p, rng):
    rock_wall(p, rng)
    for (cx, cz, r, mat) in ((-1.05, 1.25, 0.36, "gem_red"), (0.85, 2.35, 0.42, "gem_green"), (0.1, 0.65, 0.28, "gem_red"),):
        p.cyl((cx, -0.22, cz), r * 1.25, 0.14, "rock_dark", seg=8, rot=(90, 0, 0))     # geode rim
        p.cyl((cx, -0.355, cz), r * 0.95, 0.02, "void", seg=8, rot=(90, 0, 0))         # dark pocket
        for k in range(5):
            a = k * 2 * math.pi / 5 + rng.uniform(-0.3, 0.3)
            d = r * rng.uniform(0.1, 0.55)
            p.crystal((cx + d * math.cos(a), -0.36, cz + d * math.sin(a)), r * rng.uniform(0.18, 0.26), r * rng.uniform(0.6, 1.0),
                      mat, tilt=(90 - 35 * math.sin(a), 0, 35 * math.cos(a)), seg=5)
    p.info["col"] = [("box", (0, 0, 2.0), (CELL, WALL_T, WALL_H))]


@piece("mine_wall_coal_seam", "structure", "Rock wall cut through two thick coal seams, with loose coal at its foot")
def _wall_coal(p, rng):
    rock_wall(p, rng)
    for zc, h in ((0.95, 0.42), (2.55, 0.3)):
        band(p, rng, zc, h, "coal", y0=-0.35, n=7, wave=lambda x, zc=zc: 0.12 * math.sin(x * 1.7 + zc))
    for k in range(4):
        s = rng.uniform(0.18, 0.3)
        p.rock((-1.4 + k * 0.9 + rng.uniform(-0.2, 0.2), -0.5 - rng.uniform(0, 0.25), s * 0.3), (s, s, s * 0.7), "coal", rng)
    p.info["col"] = [("box", (0, 0, 2.0), (CELL, WALL_T, WALL_H))]


def low_cut(z0, z1):
    return [(-0.74, 0.74)] if z0 < 1.45 else []


@piece("mine_wall_low_tunnel", "structure", "Rock wall with a low 1.5 x 1.5 m crawl tunnel framed in timber")
def _wall_low_tunnel(p, rng):
    rock_wall(p, rng, cut=low_cut)
    for s in (-1, 1):
        p.box((s * 0.83, 0, 0.75), (0.18, 0.6, 1.5), "wood_dark", 0.02)
    p.box((0, 0, 1.6), (2.0, 0.62, 0.22), "wood_dark", 0.02)
    p.box((0, -0.05, 1.86), (1.6, 0.4, 0.3), "stone_dark")
    p.box((0, 0, -0.0), (1.48, 0.5, 0.01), "dirt")
    p.info["col"] = [("box", (-1.4, 0, 2.0), (1.2, WALL_T, 4.0)), ("box", (1.4, 0, 2.0), (1.2, WALL_T, 4.0)),
                     ("box", (0, 0, 2.75), (1.6, WALL_T, 2.5))]


def alcove_cut(z0, z1):
    return [(-0.8, 0.8)] if z1 > 0.55 and z0 < 2.45 else []


@piece("mine_wall_alcove", "structure", "Rock wall with a timber-framed niche, a shelf with ore samples and a small lamp")
def _wall_alcove(p, rng):
    rock_wall(p, rng, cut=alcove_cut)
    p.box((0, 0.14, 1.55), (1.9, 0.3, 2.6), "stone_dark")
    for s in (-1, 1):
        p.box((s * 0.85, -0.12, 1.55), (0.16, 0.36, 2.2), "wood_dark", 0.02)
    p.box((0, -0.12, 2.6), (2.0, 0.38, 0.2), "wood_dark", 0.02)
    p.box((0, -0.12, 0.55), (1.86, 0.4, 0.1), "wood_dark", 0.02)
    p.box((0, -0.1, 1.45), (1.5, 0.32, 0.05), "wood", 0.01)
    for (x, m) in ((-0.5, "gold"), (-0.3, "copper"), (0.05, "silver"), (0.35, "gem_green")):
        p.rock((x, -0.1, 1.53), (0.12, 0.12, 0.1), m, rng)
    lantern(p, (0.35, -0.12, 0.6), 0.7)
    p.info["col"] = [("box", (0, 0.1, 2.0), (CELL, 0.3, WALL_H)), ("box", (-1.4, 0, 2.0), (1.2, WALL_T, WALL_H)),
                     ("box", (1.4, 0, 2.0), (1.2, WALL_T, WALL_H))]


@piece("mine_wall_corner_round", "structure",
       "Rounded rock mass for an inner room corner: pivot on the grid vertex, fills the +X / +Y quadrant (Godot +X / -Z)")
def _wall_corner_round(p, rng):
    for layer, (z, h) in enumerate(((0.0, 1.05), (1.0, 1.0), (1.95, 1.05), (2.95, 1.05))):
        for k in range(4):
            a = math.radians(5 + k * 26.7 + (13 if layer % 2 else 0))
            r = 0.65 + rng.uniform(-0.05, 0.08)
            s = rng.uniform(0.85, 1.0)
            p.rock((r * math.cos(a), r * math.sin(a), z + h / 2 + (0.06 if layer == 0 else 0)), (s, s * 0.8, h * 1.35),
                   rng.choice(ROCKS), rng, rot=(0, 0, math.degrees(a) + rng.uniform(-10, 10)))
    p.info["col"] = [("box", (0.55, 0.55, 2.0), (1.1, 1.1, 4.0))]


@piece("mine_gate_bars", "structure",
       "Iron bar gate for mine_wall_entrance (another choice than the door). MOVING: pivot = hinge (left edge), turn around Z")
def _gate_bars(p, rng):
    for z in (0.1, 1.45, 2.82):
        p.box((0.95, 0, z), (1.9, 0.08, 0.1), "iron", 0.01)
    for x in (0.04, 1.86):
        p.box((x, 0, 1.45), (0.08, 0.08, 2.9), "iron", 0.01)
    x = 0.22
    while x < 1.75:
        p.cyl((x, 0, 0.05), 0.022, 2.82, "iron", seg=6)
        x += 0.19
    for z in (0.4, 2.5):
        p.cyl((0.0, 0, z), 0.05, 0.25, "iron", seg=6)
    p.box((1.72, -0.07, 1.3), (0.2, 0.06, 0.26), "rust", 0.01)
    p.cyl((1.72, -0.1, 1.33), 0.03, 0.06, "steel", seg=6, rot=(90, 0, 0))
    beam(p, (0.12, 0, 0.18), (1.78, 0, 1.38), 0.05, 0.05, "rust", 0.005)
    p.info["col"] = [("box", (0.95, 0, 1.45), (1.9, 0.1, 2.9))]


@piece("mine_support_braced", "structure",
       "Heavy support set across a tunnel: leaning posts, knee braces, cap beam and lagging boards (cell centre or edge)")
def _support_braced(p, rng):
    for s in (-1, 1):
        beam(p, (s * 1.8, 0, 0.0), (s * 1.5, 0, 3.55), 0.28, 0.28, "wood_dark", 0.03)
        p.box((s * 1.8, 0, 0.08), (0.42, 0.42, 0.16), "stone_dark", 0.03)
        beam(p, (s * 1.58, 0, 2.7), (s * 0.95, 0, 3.55), 0.16, 0.16, "wood", 0.02)
        p.box((s * 1.25, 0, 3.86), (0.3, 0.2, 0.08), "wood", 0.01, rot=(0, s * 6, 0))
    p.box((0, 0, 3.66), (3.6, 0.32, 0.26), "wood_dark", 0.03)
    for k in range(7):
        x = -1.5 + k * 0.5
        p.box((x, 0, 3.86), (0.3, 1.2, 0.06), rng.choice(["wood", "wood_dark"]), 0.01)
    p.info["col"] = [("box", (-1.65, 0, 1.8), (0.4, 0.32, 3.6)), ("box", (1.65, 0, 1.8), (0.4, 0.32, 3.6)),
                     ("box", (0, 0, 3.7), (3.6, 0.4, 0.4))]


@piece("mine_support_post", "structure", "Single timber prop with a cap board, wedged under the ceiling (3.9 m)")
def _support_post(p, rng):
    p.box((0, 0, 0.07), (0.5, 0.5, 0.14), "stone_dark", 0.03)
    p.box((0, 0, 1.9), (0.28, 0.28, 3.55), "wood_dark", 0.03, rot=(0, 0, rng.uniform(-4, 4)))
    p.box((0, 0, 3.78), (1.3, 0.34, 0.2), "wood", 0.02)
    for s in (-1, 1):
        p.prism_xz([(-0.12, 3.68), (0.12, 3.68), (0.12, 3.88)], -0.08, 0.08, "wood", c=(s * 0.27, 0, 0))
        p.box((0, s * 0.145, 1.0 + (s + 1) * 0.9), (0.3, 0.02, 0.08), "iron")
    p.info["col"] = [("box", (0, 0, 1.95), (0.3, 0.3, 3.9))]


def ceiling_slab(p, rng, rects=((-HALF, HALF, -HALF, HALF),), bulge=(0.03, 0.1)):
    """Rock ceiling, bottom at 0, top at 0.44: one solid textured block per rectangle (xa, xb, ya, yb), its
    underside broken into a few big facets (they hang down to about -0.1, the outline stays at 0)."""
    p.push(Matrix.Rotation(math.radians(90), 4, "X"))   # rock_block's -Y face becomes the underside
    for xa, xb, ya, yb in rects:
        rock_block(p, rng, xa, xb, -yb, -ya, 0.0, 0.44, faces=(bool(bulge), False), bulge=bulge or (0, 0), bottom=True)
    p.pop()


@piece("mine_ceiling_timbered", "structure", "Rock ceiling tile held by three timber beams; place it at height 4", "ceiling")
def _ceiling_timbered(p, rng):
    ceiling_slab(p, rng, bulge=None)
    for y in (-1.33, 0.0, 1.33):   # beams under the rock (they rest on the wall tops)
        p.box((0, y, -0.09), (CELL, 0.24, 0.2), "wood_dark")
    for x in (-0.66, 0.66):   # lagging boards between the beams
        p.box((x, 0, -0.025), (0.28, CELL - 0.2, 0.05), "wood")
    p.info["col"] = [("box", (0, 0, 0.22), (CELL, CELL, 0.44))]


@piece("mine_ceiling_shaft", "structure",
       "Rock ceiling tile with a 2 x 2 m opening and a timber collar (a ladder or scaffold can go up); place it at height 4", "ceiling")
def _ceiling_shaft(p, rng):
    h = 1.0
    ceiling_slab(p, rng, ((-HALF, HALF, h, HALF), (-HALF, HALF, -HALF, -h), (h, HALF, -h, h), (-HALF, -h, -h, h)))
    for s in (-1, 1):
        p.box((0, s * 1.1, -0.09), (2.4, 0.2, 0.18), "wood_dark")
        p.box((s * 1.1, 0, -0.09), (0.2, 2.0, 0.18), "wood_dark")
        p.box((0, s * 1.05, 0.95), (2.2, 0.1, 1.3), rock_mat())
        p.box((s * 1.05, 0, 0.95), (0.1, 2.0, 1.3), rock_mat())
    p.box((0, 0, 1.62), (2.2, 2.2, 0.06), "void")
    p.info["col"] = [("box", (0, (HALF + h) / 2, 0.22), (CELL, HALF - h, 0.44)), ("box", (0, -(HALF + h) / 2, 0.22), (CELL, HALF - h, 0.44)),
                     ("box", ((HALF + h) / 2, 0, 0.22), (HALF - h, 2 * h, 0.44)), ("box", (-(HALF + h) / 2, 0, 0.22), (HALF - h, 2 * h, 0.44))]


@piece("mine_ceiling_stalactites", "structure", "Rock ceiling tile with stalactites hanging up to 1.3 m down; place it at height 4", "free")
def _ceiling_stalactites(p, rng):
    ceiling_slab(p, rng)
    for (x, y, r, h) in ((-1.1, -0.9, 0.3, 1.3), (-0.6, -1.3, 0.16, 0.6), (0.9, 0.7, 0.26, 1.0), (1.3, 0.2, 0.14, 0.55),
                         (0.2, -0.2, 0.18, 0.75), (-1.2, 1.1, 0.2, 0.85), (0.6, -1.4, 0.13, 0.45), (-0.3, 1.4, 0.12, 0.4)):
        p.lathe([(0, -h), (r * 0.12, -h * 0.88), (r * 0.42, -h * 0.6), (r * 0.75, -h * 0.28), (r, 0.12), (0, 0.12)],
                rng.choice(["rock_brown", "stone_b", "stone_c"]), c=(x, y, 0.0), seg=7)
    p.info["col"] = [("box", (0, 0, 0.22), (CELL, CELL, 0.44))]


@piece("mine_stairs_timber", "structure", "Open timber staircase 2 m wide with a handrail, rise 2 m over one cell (up toward +Y / Godot -Z)")
def _stairs_timber(p, rng):
    L = math.hypot(CELL, 2.0)
    for k in range(8):
        y0 = -HALF + k * 0.5
        top = (k + 1) * 0.25
        p.box((0, y0 + 0.27, top - 0.03), (1.9, 0.44, 0.06), rng.choice(["wood", "wood", "wood_dark"]), 0.01)
    for s in (-1, 1):
        beam(p, (s * 1.0, -HALF, 0.08), (s * 1.0, HALF, 2.08), 0.1, 0.3, "wood_dark", 0.02)
        p.box((s * 1.08, -1.9, 0.55), (0.12, 0.12, 1.1), "wood_dark", 0.01)
        p.box((s * 1.08, 1.9, 1.5), (0.12, 0.12, 3.0), "wood_dark", 0.01)
        p.box((s * 1.08, 0.0, 0.55), (0.1, 0.1, 1.95), "wood_dark", 0.01, rot=(0, 0, 0))
        beam(p, (s * 1.08, -1.95, 1.05), (s * 1.08, 1.95, 3.0), 0.07, 0.08, "wood", 0.01)
    p.info["col"] = [("box", (0, -HALF + k * 0.5 + 0.25, (k + 1) * 0.125), (2.0, 0.5, (k + 1) * 0.25)) for k in range(8)] + \
        [("box", (s * 1.08, 0, 1.5), (0.12, CELL, 3.0)) for s in (-1, 1)]


@piece("mine_walkway", "structure", "Timber walkway 4 m long along Blender Y, 1.6 m wide, deck top at 2 m, with railings")
def _walkway(p, rng):
    plank_deck(p, -0.8, 0.8, -HALF, HALF, 2.0)
    for s in (-1, 1):
        p.box((s * 0.68, 0, 1.82), (0.12, CELL, 0.2), "wood_dark", 0.02)
        for yy in (-1.85, 0.0, 1.85):
            p.box((s * 0.75, yy, 1.5), (0.14, 0.14, 3.0), "wood_dark", 0.02)
            beam(p, (s * 0.75, yy, 1.3), (s * 0.3, yy, 1.72), 0.08, 0.08, "wood", 0.01)
        p.box((s * 0.78, 0, 2.95), (0.08, CELL, 0.08), "wood", 0.01)
        p.box((s * 0.78, 0, 2.5), (0.06, CELL, 0.06), "wood", 0.01)
        beam(p, (s * 0.75, -1.8, 0.2), (s * 0.75, 0, 1.7), 0.06, 0.1, "wood", 0.01)
        beam(p, (s * 0.75, 1.8, 0.2), (s * 0.75, 0, 1.7), 0.06, 0.1, "wood", 0.01)
    p.info["col"] = [("box", (0, 0, 1.95), (1.6, CELL, 0.1))] + [("box", (s * 0.78, 0, 2.5), (0.12, CELL, 1.0)) for s in (-1, 1)] + \
        [("box", (s * 0.75, yy, 0.95), (0.14, 0.14, 1.9)) for s in (-1, 1) for yy in (-1.85, 0.0, 1.85)]


@piece("mine_platform", "structure", "Timber platform 4 x 4 m on posts, deck top at 2 m, railing on its +X side (upper track level, landings)")
def _platform(p, rng):
    plank_deck(p, -HALF, HALF, -HALF, HALF, 2.0)
    for y in (-1.85, 0.0, 1.85):
        p.box((0, y, 1.82), (CELL, 0.18, 0.2), "wood_dark", 0.02)
    for x in (-1.85, 0.0, 1.85):
        for y in (-1.85, 0.0, 1.85):
            p.box((x, y, 0.86), (0.2, 0.2, 1.72), "wood_dark", 0.02)
            p.box((x, y, 0.06), (0.32, 0.32, 0.12), "stone_dark", 0.02)
        beam(p, (x, -1.85, 0.25), (x, 0.0, 1.6), 0.08, 0.1, "wood", 0.01)
        beam(p, (x, 1.85, 0.25), (x, 0.0, 1.6), 0.08, 0.1, "wood", 0.01)
    for y in (-1.85, 0.0, 1.85):
        p.box((1.92, y, 2.5), (0.12, 0.12, 1.0), "wood_dark", 0.01)
    p.box((1.94, 0, 2.95), (0.08, CELL, 0.08), "wood", 0.01)
    p.box((1.94, 0, 2.5), (0.06, CELL, 0.06), "wood", 0.01)
    p.info["col"] = [("box", (0, 0, 1.95), (CELL, CELL, 0.1)), ("box", (1.94, 0, 2.5), (0.12, CELL, 1.0))] + \
        [("box", (x, y, 0.95), (0.2, 0.2, 1.9)) for x in (-1.85, 0.0, 1.85) for y in (-1.85, 0.0, 1.85)]


@piece("mine_cave_in", "structure", "Cave-in: a pile of boulders and broken beams that blocks a whole tunnel (4 m wide, 3.6 m high)")
def _cave_in(p, rng):
    for (x, z, s) in ((-1.4, 0.55, 1.4), (-0.2, 0.6, 1.5), (1.25, 0.55, 1.45), (-0.85, 1.6, 1.25), (0.6, 1.6, 1.3),
                      (-1.55, 2.4, 0.95), (0.0, 2.55, 1.1), (1.45, 2.3, 1.0), (-0.7, 3.25, 0.85), (0.8, 3.2, 0.9)):
        p.rock((x + rng.uniform(-0.08, 0.08), rng.uniform(-0.25, 0.25), z), (s, s * rng.uniform(0.85, 1.05), s * 0.8),
               rng.choice(ROCKS), rng, rot=(rng.uniform(-10, 10), 0, rng.uniform(0, 90)))
    scatter_rocks(p, rng, 0, -1.1, 10, 1.4, (0.2, 0.45))
    beam(p, (-1.7, -0.95, 0.1), (0.4, -0.5, 2.6), 0.24, 0.24, "wood_dark", 0.03)
    beam(p, (1.8, -0.7, 0.1), (0.9, -1.0, 1.0), 0.2, 0.2, "wood_dark", 0.03)
    p.info["col"] = [("box", (0, 0, 1.75), (CELL, 1.6, 3.5))]


@piece("mine_rock_arch", "structure", "Natural rock arch, 4 m wide and 3.7 m high (grotto entrances, cave halls)")
def _rock_arch(p, rng):
    for s in (-1, 1):
        z = 0.0
        for h, sz in ((0.9, 1.1), (0.85, 0.95), (0.8, 0.9), (0.7, 0.95)):
            p.rock((s * 1.55 + rng.uniform(-0.05, 0.05), rng.uniform(-0.05, 0.05), z + h / 2 + (0.06 if z == 0 else 0)),
                   (sz, sz * 0.85, h * 1.4), rng.choice(ROCKS), rng, rot=(0, 0, rng.uniform(0, 90)))
            z += h
    for k in range(7):
        t = k / 6
        x = -1.5 + 3.0 * t
        z = 3.15 + 0.35 * math.sin(t * math.pi)
        sz = rng.uniform(0.75, 0.95)
        p.rock((x, rng.uniform(-0.05, 0.05), z), (sz, sz * 0.8, 0.75), rng.choice(ROCKS), rng, rot=(0, rng.uniform(-15, 15), rng.uniform(0, 90)))
    p.info["col"] = [("box", (-1.55, 0, 1.6), (1.0, 0.9, 3.2)), ("box", (1.55, 0, 1.6), (1.0, 0.9, 3.2)),
                     ("box", (0, 0, 3.4), (4.0, 0.8, 0.7))]


@piece("mine_loading_chute", "structure",
       "Timber gantry with an ore bin and a chute that straddles a track along Blender Y (mine_chute_gate fits its mouth at local (0, -0.86, 1.62))")
def _loading_chute(p, rng):
    for x in (-1.5, 1.5):
        for y in (0.0, 1.4):
            p.box((x, y, 1.8), (0.22, 0.22, 3.6), "wood_dark", 0.02)
            p.box((x, y, 0.07), (0.34, 0.34, 0.14), "stone_dark", 0.02)
        beam(p, (x, 0.0, 0.5), (x, 1.4, 2.2), 0.08, 0.12, "wood", 0.01)
    for y in (0.0, 1.4):
        p.box((0, y, 2.4), (3.3, 0.24, 0.24), "wood_dark", 0.02)
    p.box((0, 0.7, 2.56), (1.9, 1.6, 0.08), "wood_dark", 0.01)
    for s in (-1, 1):
        p.box((s * 0.92, 0.7, 3.05), (0.08, 1.6, 1.0), "wood", 0.01)
    p.box((0, 1.47, 3.05), (1.9, 0.08, 1.0), "wood", 0.01)
    p.box((0, -0.07, 2.9), (1.9, 0.08, 0.7), "wood", 0.01)
    for x in (-0.92, 0.92):
        for y in (-0.07, 1.47):
            p.box((x, y, 3.05), (0.14, 0.14, 1.06), "wood_dark", 0.01)
    mound(p, rng, 0.8, 0.35, "stone_b", seg=8, c=(0, 0.7, 3.2))
    for k in range(7):
        s = rng.uniform(0.12, 0.2)
        p.rock((rng.uniform(-0.5, 0.5), 0.7 + rng.uniform(-0.45, 0.45), 3.3 + rng.uniform(0, 0.15)), (s, s, s * 0.8),
               rng.choice(["gold", "copper", "rock_dark", "stone_b"]), rng)
    # chute: from the bin bottom down to the mouth above the track
    a, b = Vector((0, 0.1, 2.62)), Vector((0, -0.86, 1.78))
    d = b - a
    ang = math.degrees(math.atan2(d.z, -d.y))
    p.push(Matrix.Translation((a + b) / 2) @ Matrix.Rotation(math.radians(-ang), 4, "X"))
    p.box((0, 0, 0), (0.7, d.length, 0.05), "iron", 0.01)
    for s in (-1, 1):
        p.box((s * 0.36, 0, 0.12), (0.04, d.length, 0.26), "iron", 0.005)
    p.pop()
    for s in (-1, 1):
        p.box((s * 0.36, -0.86, 1.7), (0.06, 0.08, 0.5), "iron", 0.005)
    p.box((0, -0.86, 1.98), (0.8, 0.08, 0.06), "iron", 0.005)
    p.info["col"] = [("box", (x, y, 1.8), (0.24, 0.24, 3.6)) for x in (-1.5, 1.5) for y in (0.0, 1.4)] + \
        [("box", (0, 0.7, 3.0), (2.0, 1.7, 1.1))]


# --- props ----------------------------------------------------------------------
@piece("mine_rails_switch_blade", "props",
       "Switch blades for mine_floor_rails_junction (local (0, -0.7, 0)). MOVING: pivot = heel, turn around Z (about 6 degrees)")
def _switch_blade(p, rng):
    p.box((0, 0, 0.05), (1.0, 0.2, 0.1), "iron", 0.01)
    for s in (-1, 1):
        p.box((s * 0.43, -0.6, 0.13), (0.05, 1.2, 0.06), "steel", 0.005)
        p.box((s * 0.43, -0.6, 0.095), (0.1, 1.2, 0.015), "iron")
    p.box((0, -1.08, 0.075), (0.95, 0.06, 0.05), "rust", 0.005)
    p.box((0.52, -1.08, 0.075), (0.25, 0.08, 0.06), "iron", 0.005)
    p.info["col"] = [("box", (0, -0.55, 0.08), (1.0, 1.25, 0.16))]


@piece("mine_conveyor", "props", "Inclined belt conveyor 3.6 m long (0.6 m to 2 m high) with ore on the belt")
def _conveyor(p, rng):
    L = math.hypot(3.6, 1.4)
    ang = math.atan2(1.4, 3.6)
    p.push(Matrix.Translation((0, -1.8, 0.6)) @ Matrix.Rotation(ang, 4, "X"))
    p.box((0, L / 2, 0.0), (0.66, L, 0.05), "leather")
    p.box((0, L / 2, -0.12), (0.66, L, 0.04), "leather")
    for s in (-1, 1):
        p.box((s * 0.4, L / 2, -0.04), (0.06, L + 0.1, 0.2), "wood_dark", 0.01)
    for k in range(9):
        p.cyl((-0.37, 0.15 + k * (L - 0.3) / 8, -0.06), 0.06, 0.74, "iron", seg=6, rot=(0, 90, 0))
    for k in range(7):
        s = rng.uniform(0.1, 0.18)
        p.rock((rng.uniform(-0.2, 0.2), 0.4 + k * 0.5 + rng.uniform(-0.1, 0.1), 0.03 + s * 0.3), (s, s, s * 0.8),
               rng.choice(["gold", "rock_dark", "stone_b", "copper"]), rng)
    p.cyl((-0.42, L, -0.06), 0.13, 0.84, "iron", seg=8, rot=(0, 90, 0))
    p.box((0.5, L, -0.06), (0.06, 0.06, 0.4), "iron")
    p.cyl((0.52, L, -0.3), 0.025, 0.2, "wood_dark", seg=6, rot=(0, 90, 0))
    p.pop()
    for y, h in ((-1.55, 0.6), (0.0, 1.17), (1.55, 1.78)):
        for s in (-1, 1):
            p.box((s * 0.4, y, h / 2 - 0.05), (0.1, 0.1, h - 0.1), "wood_dark", 0.01)
        p.box((0, y, 0.15), (0.9, 0.08, 0.08), "wood", 0.01)
    p.info["col"] = [("box", (0, 0, 0.6), (0.9, 3.8, 1.2)), ("box", (0, 0.9, 1.55), (0.9, 1.9, 0.6))]


@piece("mine_stamp_mill", "props", "Ore stamp mill: mortar box, timber frame and cam shaft (mine_stamp_head fits it at local (0, 0, 0.95))")
def _stamp_mill(p, rng):
    p.box((0, 0.1, 0.08), (1.9, 1.3, 0.16), "wood_dark", 0.02)
    p.box((0, 0, 0.55), (0.9, 0.7, 0.78), "iron", 0.02)
    for z in (0.3, 0.8):
        p.box((0, 0, z), (0.94, 0.74, 0.06), "rust", 0.01)
    p.box((0, -0.38, 0.5), (0.5, 0.04, 0.2), "steel", 0.005)
    for x in (-0.75, 0.75):
        for y in (0.0, 0.6):
            p.box((x, y, 1.65), (0.2, 0.2, 3.0), "wood_dark", 0.02)
        p.box((x, 0.3, 3.1), (0.24, 0.9, 0.2), "wood_dark", 0.02)
    for z in (1.55, 2.35):
        for s in (-1, 1):
            p.box((s * 0.41, 0, z), (0.68, 0.22, 0.16), "wood", 0.01)
    p.cyl((-0.9, 0.42, 2.75), 0.08, 1.8, "iron", seg=8, rot=(0, 90, 0))
    p.box((0, 0.3, 2.75), (0.12, 0.32, 0.12), "steel", 0.01, rot=(35, 0, 0))
    p.cyl((0.95, 0.42, 2.75), 0.5, 0.1, "wood_dark", seg=12, rot=(0, 90, 0))
    p.cyl((0.95, 0.42, 2.75), 0.1, 0.14, "iron", seg=8, rot=(0, 90, 0))
    for k in range(6):
        a = k * math.pi / 3
        p.box((1.0, 0.42 + 0.25 * math.cos(a), 2.75 + 0.25 * math.sin(a)), (0.04, 0.05, 0.46), "wood", rot=(math.degrees(a), 0, 0))
    p.info["col"] = [("box", (0, 0, 0.5), (1.0, 0.8, 1.0)), ("box", (-0.75, 0.3, 1.6), (0.22, 0.85, 3.2)),
                     ("box", (0.75, 0.3, 1.6), (0.22, 0.85, 3.2))]


@piece("mine_stamp_head", "props", "Stamp of the stamp mill: stem and iron shoe. MOVING: pivot = bottom of the shoe, slide it along Z (0.35 m)")
def _stamp_head(p, rng):
    p.cyl((0, 0, 0), 0.15, 0.3, "steel", seg=8)
    p.cyl((0, 0, 0.3), 0.11, 0.08, "iron", seg=8)
    p.cyl((0, 0, 0.38), 0.05, 1.95, "iron", seg=6)
    p.cyl((0, 0, 1.55), 0.1, 0.16, "steel", seg=8)
    p.box((0, 0.13, 1.63), (0.08, 0.2, 0.06), "steel")


@piece("mine_pulley_frame", "props",
       "Timber gallows frame with a pulley that straddles mine_floor_shaft (2.9 m wide); mine_ore_bucket hangs at local (0, 0, 2.55)")
def _pulley_frame(p, rng):
    for s in (-1, 1):
        p.box((s * 1.45, 0, 1.5), (0.2, 0.2, 3.0), "wood_dark", 0.02)
        p.box((s * 1.45, 0, 0.06), (0.36, 0.36, 0.12), "stone_dark", 0.02)
        for t in (-1, 1):
            beam(p, (s * 1.45, t * 0.85, 0.0), (s * 1.45, 0, 2.1), 0.1, 0.12, "wood", 0.01)
    p.box((0, 0, 3.05), (3.3, 0.22, 0.22), "wood_dark", 0.02)
    for s in (-1, 1):
        beam(p, (s * 1.45, 0, 2.5), (s * 0.95, 0, 2.95), 0.1, 0.1, "wood", 0.01)
    p.box((0, 0, 2.88), (0.16, 0.12, 0.14), "iron", 0.01)
    p.cyl((0, -0.04, 2.72), 0.17, 0.08, "iron", seg=10, rot=(-90, 0, 0))
    p.cyl((0, -0.1, 2.72), 0.03, 0.2, "steel", seg=6, rot=(-90, 0, 0))
    rope_seg(p, (0.17, 0, 2.72), (1.35, 0, 1.1), 0.016)
    p.box((1.36, -0.12, 1.1), (0.06, 0.06, 0.2), "iron")
    rope_seg(p, (-0.17, 0, 2.72), (0.0, 0, 2.55), 0.016)
    p.info["col"] = [("box", (s * 1.45, 0, 1.5), (0.24, 0.24, 3.0)) for s in (-1, 1)] + [("box", (0, 0, 3.05), (3.3, 0.24, 0.24))]


@piece("mine_ore_bucket", "props",
       "Wooden ore bucket on its rope, hangs below its pivot (top of the rope). MOVING: slide it along Z to lower it (-1.4 m)", "hanging")
def _ore_bucket(p, rng):
    p.box((0, 0, -0.04), (0.06, 0.04, 0.08), "iron")
    rope_seg(p, (0, 0, -0.06), (0, 0, -1.2), 0.016)
    p.box((0, 0, -1.22), (0.08, 0.03, 0.06), "iron")
    for s in (-1, 1):
        beam(p, (0, 0, -1.24), (s * 0.27, 0, -1.48), 0.025, 0.025, "iron", 0.0)
    p.lathe([(0, -1.95), (0.22, -1.95), (0.27, -1.5), (0.24, -1.5), (0.2, -1.88), (0, -1.88)], "wood", seg=10)
    for z in (-1.9, -1.58):
        r = 0.22 + (z + 1.95) / 0.45 * 0.05 + 0.012
        p.lathe([(r, z - 0.025), (r, z + 0.025), (r - 0.02, z + 0.025), (r - 0.02, z - 0.025), (r, z - 0.025)], "iron", seg=10, caps=False)
    mound(p, rng, 0.23, 0.12, "stone_b", seg=8, c=(0, 0, -1.58))
    for k in range(4):
        p.rock((rng.uniform(-0.1, 0.1), rng.uniform(-0.1, 0.1), -1.5), (0.09, 0.09, 0.07), rng.choice(["gold", "copper"]), rng)
    p.info["col"] = [("box", (0, 0, -1.72), (0.56, 0.56, 0.46))]


@piece("mine_chute_gate", "props", "Iron gate plate for the loading chute mouth. MOVING: slide it along Z to let the ore fall (0.35 m)")
def _chute_gate(p, rng):
    p.box((0, 0, 0.2), (0.66, 0.04, 0.4), "iron", 0.01)
    p.box((0, -0.03, 0.36), (0.5, 0.03, 0.05), "rust", 0.005)
    p.box((0, -0.06, 0.48), (0.06, 0.04, 0.2), "iron")
    p.cyl((-0.12, -0.08, 0.56), 0.02, 0.24, "wood_dark", seg=6, rot=(0, 90, 0))
    for x in (-0.25, 0.25):
        for z in (0.08, 0.3):
            p.cyl((x, -0.02, z), 0.018, 0.02, "steel", seg=5, rot=(90, 0, 0))


@piece("mine_lamp_miner", "props", "Small oil miner's lamp with a hook (put it on a table or a ledge)")
def _lamp_miner(p, rng):
    p.lathe([(0, 0), (0.07, 0), (0.08, 0.05), (0.06, 0.09), (0.02, 0.11), (0, 0.11)], "brass", seg=8)
    beam(p, (0.05, 0, 0.07), (0.15, 0, 0.13), 0.03, 0.03, "brass", 0.0)
    p.flame((0.16, 0, 0.13), 0.28)
    beam(p, (-0.04, 0, 0.1), (-0.06, 0, 0.26), 0.012, 0.012, "iron", 0.0)
    beam(p, (-0.06, 0, 0.26), (0.02, 0, 0.3), 0.012, 0.012, "iron", 0.0)


@piece("mine_lamp_string", "props", "Cable with three hanging lanterns, 4 m along Blender X; hangs below its pivot (cable at 0)", "hanging")
def _lamp_string(p, rng):
    pts = [(-2.0, 0.0), (-1.2, -0.12), (0.0, -0.17), (1.2, -0.12), (2.0, 0.0)]
    for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
        rope_seg(p, (x0, 0, z0 - 0.02), (x1, 0, z1 - 0.02), 0.012, "coal", 4)
    for x in (-2.0, 2.0):
        p.box((x, 0, -0.04), (0.06, 0.06, 0.08), "iron")
    for x, z in ((-1.2, -0.12), (0.0, -0.17), (1.2, -0.12)):
        chain(p, x, 0, z - 0.42, z - 0.04)
        lantern(p, (x, 0, z - 0.9), 0.85)
    p.info["col"] = [("box", (0, 0, -0.55), (2.8, 0.25, 0.9))]


@piece("mine_sign_arrow", "props", "Signpost with two blank arrow boards (no text)")
def _sign_arrow(p, rng):
    p.box((0, 0, 0.95), (0.12, 0.12, 1.9), "wood_dark", 0.02)
    for z, d, m in ((1.6, 1, "wood"), (1.25, -1, "wood_dark")):
        pts = [(-0.05, z - 0.11), (0.55, z - 0.11), (0.72, z), (0.55, z + 0.11), (-0.05, z + 0.11)]
        pts = [(x * d, zz) for x, zz in pts]
        if d < 0:
            pts = list(reversed(pts))
        p.prism_xz(pts, -0.1, -0.06, m)
        p.box((d * 0.33, -0.105, z), (0.4, 0.01, 0.05), "parchment")
    p.info["col"] = [("box", (0, -0.03, 0.95), (0.3, 0.2, 1.9))]


@piece("mine_sign_board", "props", "Blank wall plank sign with a painted crossed-picks mark (wall decor: use the wall's transform)", "decor")
def _sign_board(p, rng):
    y = -WALL_T / 2 - 0.06
    p.box((0, y, 2.35), (1.3, 0.05, 0.56), "wood", 0.01)
    p.box((0, y - 0.005, 2.35), (1.36, 0.04, 0.62), "wood_dark", 0.01)
    for s in (-1, 1):
        p.box((s * 0.5, y + 0.02, 2.66), (0.05, 0.08, 0.1), "iron")
        p.box((0.36 * s - 0.0, y - 0.03, 2.35), (0.03, 0.01, 0.42), "coal", rot=(0, s * 40, 0))
        p.box((0.36 * s + s * -0.12, y - 0.03, 2.5), (0.14, 0.01, 0.04), "coal", rot=(0, s * 40, 0))
    p.box((-0.0, y - 0.03, 2.35), (0.2, 0.01, 0.2), "cloth_red", rot=(0, 45, 0))


@piece("mine_crate_ore", "props", "Open crate full of ore and gold nuggets")
def _crate_ore(p, rng):
    s = 0.9
    p.box((0, 0, 0.05), (s, s, 0.1), "wood_dark", 0.01)
    for a in (-1, 1):
        p.box((a * (s / 2 - 0.03), 0, 0.33), (0.06, s, 0.62), "wood", 0.01)
        p.box((0, a * (s / 2 - 0.03), 0.33), (s - 0.1, 0.06, 0.62), "wood", 0.01)
        for b in (-1, 1):
            p.box((a * (s / 2 - 0.05), b * (s / 2 - 0.05), 0.34), (0.11, 0.11, 0.66), "wood_dark", 0.01)
        p.box((0, a * (s / 2 - 0.02), 0.56), (s, 0.08, 0.1), "wood_dark", 0.01)
    mound(p, rng, 0.42, 0.25, "stone_b", seg=8, c=(0, 0, 0.5))
    for k in range(9):
        sz = rng.uniform(0.09, 0.16)
        p.rock((rng.uniform(-0.28, 0.28), rng.uniform(-0.28, 0.28), 0.62 + rng.uniform(0, 0.08)), (sz, sz, sz * 0.8),
               rng.choice(["gold", "gold", "rock_dark", "copper"]), rng)


@piece("mine_barrel_powder", "props", "Black powder keg with a red band and a fuse")
def _barrel_powder(p, rng):
    barrel(p, 0.3, 0.78)
    p.lathe([(0.317, 0.32), (0.317, 0.46), (0.3, 0.46), (0.3, 0.32), (0.317, 0.32)], "cloth_red", seg=10, caps=False)
    p.box((0, -0.31, 0.39), (0.22, 0.02, 0.1), "parchment")
    p.cyl((0.08, 0.05, 0.78), 0.04, 0.04, "wood", seg=6)
    rope_seg(p, (0.08, 0.05, 0.8), (0.2, 0.15, 0.95), 0.008, "coal", 4)


@piece("mine_water_trough", "props", "Timber water trough on legs, 1.6 m")
def _water_trough(p, rng):
    p.box((0, 0, 0.33), (1.6, 0.6, 0.06), "wood_dark", 0.01)
    for s in (-1, 1):
        p.box((0, s * 0.28, 0.52), (1.6, 0.06, 0.4), "wood", 0.01)
        p.box((s * 0.78, 0, 0.52), (0.06, 0.6, 0.4), "wood_dark", 0.01)
        for t in (-1, 1):
            p.box((s * 0.62, t * 0.22, 0.17), (0.08, 0.08, 0.34), "wood_dark", 0.01)
        p.box((s * 0.55, 0, 0.52), (0.04, 0.64, 0.42), "iron")
    p.box((0, 0, 0.62), (1.48, 0.5, 0.02), "water")
    p.box((0.4, 0.1, 0.65), (0.1, 0.1, 0.06), "wood", 0.01)
    beam(p, (0.4, 0.1, 0.66), (0.65, 0.45, 0.82), 0.025, 0.025, "wood", 0.0)


@piece("mine_drill_hand", "props", "Hand rock drill on a tripod, with a crank wheel")
def _drill_hand(p, rng):
    apex = (0, 0, 1.45)
    for k in range(3):
        a = math.radians(90 + k * 120)
        beam(p, (0.75 * math.cos(a), 0.75 * math.sin(a), 0.0), apex, 0.07, 0.07, "wood_dark", 0.01)
    p.box((0, 0, 1.45), (0.18, 0.18, 0.14), "iron", 0.01)
    beam(p, (0, 0.2, 1.62), (0, -1.0, 0.75), 0.06, 0.06, "steel", 0.005)
    beam(p, (0, -1.0, 0.75), (0, -1.14, 0.65), 0.04, 0.04, "steel", 0.0)
    p.box((0, -0.1, 1.5), (0.16, 0.5, 0.16), "iron", 0.01, rot=(-36, 0, 0))
    p.cyl((0.12, 0.25, 1.68), 0.2, 0.04, "iron", seg=10, rot=(0, 90, 0))
    p.box((0.18, 0.25, 1.86), (0.04, 0.04, 0.16), "iron")
    p.cyl((0.18, 0.25, 1.94), 0.025, 0.14, "wood_dark", seg=6, rot=(0, 90, 0))


@piece("mine_mushroom_giant", "props", "Giant glowing cave mushroom, 2.6 m, with two small ones at its foot")
def _mushroom_giant(p, rng):
    p.lathe([(0, 0), (0.32, 0), (0.22, 0.25), (0.17, 1.0), (0.15, 1.7), (0.17, 2.05), (0, 2.05)], "parchment", seg=8)
    p.lathe([(0.12, 1.92), (0.98, 2.06), (0, 2.08)], "wax", seg=12)
    p.lathe([(0, 2.04), (1.02, 2.04), (0.92, 2.3), (0.55, 2.55), (0, 2.62)], "mushroom_glow", seg=12)
    for (x, y, h, r) in ((0.55, -0.3, 0.45, 0.22), (-0.45, 0.35, 0.32, 0.16)):
        p.cyl((x, y, 0), r * 0.3, h, "parchment", seg=6, r2=r * 0.22)
        p.lathe([(0, h - 0.02), (r, h - 0.02), (r * 0.85, h + r * 0.35), (r * 0.4, h + r * 0.6), (0, h + r * 0.65)],
                "mushroom_glow", c=(x, y, 0), seg=8)
    p.light((0, -1.3, 1.5), 1.0, "glow")
    p.info["col"] = [("box", (0, 0, 1.0), (0.4, 0.4, 2.0)), ("box", (0, 0, 2.3), (2.0, 2.0, 0.6))]


@piece("mine_mushrooms_wall", "props", "Glowing shelf fungi growing on a wall (wall decor: use the wall's transform)", "decor")
def _mushrooms_wall(p, rng):
    for (x, z, r) in ((-1.1, 0.7, 0.3), (-0.8, 1.0, 0.2), (-1.3, 1.15, 0.16), (0.6, 1.9, 0.36), (0.95, 2.2, 0.22),
                      (0.35, 2.3, 0.18), (0.75, 1.55, 0.16), (-0.2, 2.9, 0.22), (0.05, 3.15, 0.14)):
        p.push(Matrix.Translation((x, -0.24, z)) @ Matrix.Diagonal((1.0, 0.75, 1.0, 1.0)))
        p.lathe([(0, -0.03), (r, -0.03), (r * 0.9, 0.03), (r * 0.4, 0.07), (0, 0.075)], "mushroom_glow", seg=9)
        p.pop()
    p.light((0.0, -1.1, 1.9), 0.8, "glow")


@piece("mine_geode", "props", "Split geode bowl, 1.9 m wide, lined with violet crystals")
def _geode(p, rng):
    p.push(Matrix.Translation((0, 0.15, 0.32)) @ rotm((32, 0, 0)))
    p.lathe([(0, -0.1), (0.8, -0.05), (0.95, 0.4), (0.88, 0.8), (0.74, 0.78), (0.7, 0.42), (0.45, 0.12), (0, 0.06)],
            "rock_dark", seg=9)
    p.lathe([(0.71, 0.74), (0.73, 0.79), (0.87, 0.79), (0.86, 0.76)], "quartz", seg=9, caps=False)
    for k in range(13):
        a = k * 2 * math.pi / 13 + rng.uniform(-0.2, 0.2)
        d = rng.uniform(0.1, 0.55)
        p.crystal((d * math.cos(a), d * math.sin(a), 0.12 + d * 0.45), rng.uniform(0.05, 0.1), rng.uniform(0.25, 0.5),
                  "crystal_violet", tilt=(math.degrees(math.sin(a)) * -0.6 * d * 1.6, math.degrees(math.cos(a)) * 0.6 * d * 1.6, 0))
    p.pop()
    p.light((0.0, -1.2, 1.5), 1.0, "crystal_violet")
    p.info["col"] = [("box", (0, 0, 0.5), (1.9, 1.7, 1.0))]


@piece("mine_crystal_hanging", "props", "Cyan crystals hanging from a rock lump; hangs below its pivot (fix it under a ceiling)", "hanging")
def _crystal_hanging(p, rng):
    p.rock((0, 0, -0.18), (0.9, 0.75, 0.3), "rock_dark", rng)
    for (x, y, r, h, tx, tz) in ((0, 0, 0.12, 0.95, 0, 0), (0.22, 0.08, 0.08, 0.6, -25, 70), (-0.2, 0.1, 0.08, 0.5, -28, -60),
                                 (0.05, -0.2, 0.07, 0.45, -30, 0), (-0.15, -0.12, 0.06, 0.35, -35, 140)):
        p.crystal((x, y, -0.22), r, h, "crystal_cyan", tilt=(180 + tx, 0, tz))
    p.light((0, -0.7, -1.3), 0.8, "crystal")
    p.info["col"] = [("box", (0, 0, -0.55), (0.9, 0.75, 1.1))]


@piece("mine_crystal_shards", "props", "Small red and green gem shards scattered on a patch of gravel")
def _crystal_shards(p, rng):
    scatter_rocks(p, rng, 0, 0, 7, 0.45, (0.1, 0.22))
    for k in range(9):
        x, y = rng.uniform(-0.5, 0.5), rng.uniform(-0.4, 0.4)
        p.crystal((x, y, 0.02), rng.uniform(0.03, 0.06), rng.uniform(0.15, 0.32), "gem_red" if k % 2 else "gem_green",
                  tilt=(rng.uniform(-60, 60), rng.uniform(-60, 60), 0))


@piece("mine_rail_stack", "props", "Stack of spare sleepers with four rails on top")
def _rail_stack(p, rng):
    for layer in range(3):
        for k in range(3):
            p.box((-0.7 + k * 0.7 + rng.uniform(-0.03, 0.03), 0, 0.05 + layer * 0.1), (0.22, 1.5, 0.1) if layer % 2 == 0 else (0.22, 1.5, 0.1),
                  "wood_dark", 0.01, rot=(0, 0, 90 * (layer % 2) + rng.uniform(-3, 3)))
    for k in range(4):
        x = -0.35 + k * 0.23
        p.box((x, 0, 0.32), (0.14, 2.4, 0.02), "iron")
        p.box((x, 0, 0.36), (0.06, 2.4, 0.06), "rust")
    p.info["col"] = [("box", (0, 0, 0.2), (1.6, 2.4, 0.4))]


@piece("mine_wheelbarrow", "props", "Iron wheelbarrow with a load of ore")
def _wheelbarrow(p, rng):
    p.push(Matrix.Translation((0, -0.05, 0.0)) @ Matrix.Diagonal((1.0, 1.4, 1.0, 1.0)))
    p.lathe([(0, 0.32), (0.3, 0.32), (0.46, 0.66), (0.42, 0.66), (0.27, 0.36), (0, 0.36)], "rust", seg=4, rot=(0, 0, 45))
    p.pop()
    mound(p, rng, 0.36, 0.14, "stone_b", seg=8, c=(0, -0.05, 0.56))
    for s in (-1, 1):
        beam(p, (s * 0.2, 0.7, 0.22), (s * 0.3, -1.05, 0.62), 0.05, 0.06, "wood_dark", 0.01)
        beam(p, (s * 0.25, -0.45, 0.4), (s * 0.27, -0.5, 0.0), 0.05, 0.05, "wood_dark", 0.01)
    p.cyl((-0.06, 0.72, 0.22), 0.22, 0.12, "iron", seg=10, rot=(0, 90, 0))
    p.cyl((-0.25, 0.72, 0.22), 0.03, 0.5, "steel", seg=6, rot=(0, 90, 0))
    p.info["col"] = [("box", (0, -0.1, 0.4), (0.9, 1.9, 0.8))]


@piece("mine_sack_pile", "props", "Pile of six tied ore sacks")
def _sack_pile(p, rng):
    for (x, y, z, r) in ((-0.42, 0, 0.16, 5), (0.0, 0.05, 0.16, -4), (0.42, -0.02, 0.16, 8), (-0.21, 0.02, 0.45, 12),
                         (0.22, 0.0, 0.45, -10), (0.0, 0.0, 0.72, 3)):
        p.box((x, y, z), (0.42, 0.62, 0.32), "sack", 0.09, rot=(rng.uniform(-3, 3), 0, r))
        p.box((x, y + 0.27, z), (0.36, 0.04, 0.26), "rope", 0.01, rot=(0, 0, r))
        p.cyl((x, y + 0.31, z), 0.05, 0.08, "sack", seg=6, rot=(-90, 0, r))


@piece("mine_table", "props", "Miner's table and bench with a lunch tin, a mug and bread")
def _table(p, rng):
    p.box((0, 0, 0.78), (1.6, 0.8, 0.06), "wood", 0.01)
    for a in (-1, 1):
        for b in (-1, 1):
            p.box((a * 0.68, b * 0.3, 0.38), (0.09, 0.09, 0.76), "wood_dark", 0.01)
        p.box((a * 0.68, 0, 0.15), (0.06, 0.6, 0.06), "wood_dark", 0.01)
    p.box((0, -0.72, 0.43), (1.5, 0.3, 0.05), "wood", 0.01)
    for a in (-1, 1):
        p.box((a * 0.6, -0.72, 0.2), (0.08, 0.24, 0.4), "wood_dark", 0.01)
    p.box((-0.35, 0.1, 0.88), (0.3, 0.2, 0.14), "iron", 0.01)
    p.cyl((-0.35, 0.1, 0.95), 0.012, 0.06, "iron", seg=4)
    p.box((-0.35, 0.1, 1.0), (0.12, 0.02, 0.02), "iron")
    p.cyl((0.1, -0.1, 0.81), 0.05, 0.12, "clay", seg=8)
    p.box((0.16, -0.1, 0.88), (0.04, 0.02, 0.06), "clay")
    p.rock((0.45, 0.12, 0.85), (0.24, 0.13, 0.1), "sack", rng)
    p.info["col"] = [("box", (0, 0, 0.4), (1.6, 0.8, 0.8)), ("box", (0, -0.72, 0.23), (1.5, 0.3, 0.46))]


@piece("mine_canary_cage", "props", "Canary in a cage on a stand (the miners' gas alarm)")
def _canary_cage(p, rng):
    for k in range(3):
        a = math.radians(90 + k * 120)
        beam(p, (0, 0, 0.12), (0.32 * math.cos(a), 0.32 * math.sin(a), 0.0), 0.04, 0.04, "wood_dark", 0.0)
    p.box((0, 0, 0.8), (0.07, 0.07, 1.6), "wood_dark", 0.01)
    p.box((0.2, 0, 1.58), (0.42, 0.05, 0.05), "wood_dark", 0.01)
    cx, cz = 0.38, 1.0
    p.box((cx, 0, 1.5), (0.01, 0.01, 0.1), "iron")
    p.cyl((cx, 0, cz), 0.17, 0.03, "wood", seg=10)
    for k in range(12):
        a = k * math.pi / 6
        p.box((cx + 0.16 * math.cos(a), 0.16 * math.sin(a), cz + 0.2), (0.012, 0.012, 0.36), "brass")
    p.lathe([(0.17, 0.37), (0.12, 0.45), (0, 0.48)], "brass", c=(cx, 0, cz), seg=10)
    p.cyl((cx - 0.12, 0, cz + 0.16), 0.008, 0.24, "wood_dark", seg=4, rot=(0, 90, 0))
    p.rock((cx, 0, cz + 0.22), (0.1, 0.06, 0.07), "canary", rng, rot=(0, -20, 0))
    p.rock((cx + 0.05, 0, cz + 0.27), (0.05, 0.05, 0.05), "canary", rng)
    p.cyl((cx + 0.07, 0, cz + 0.27), 0.01, 0.03, "clay", seg=4, r2=0.0, rot=(0, 90, 0))
    p.box((cx - 0.06, 0, cz + 0.2), (0.07, 0.02, 0.02), "canary", rot=(0, -20, 0))
    p.info["col"] = [("box", (0.1, 0, 0.8), (0.75, 0.4, 1.6))]


@piece("mine_rope_coil", "props", "Coil of rope with an iron hook")
def _rope_coil(p, rng):
    for k, r in enumerate((0.34, 0.31, 0.28, 0.25)):
        z = k * 0.05
        p.lathe([(r, z), (r + 0.05, z), (r + 0.05, z + 0.05), (r, z + 0.05), (r, z)], "rope", seg=12, caps=False)
    rope_seg(p, (0.38, 0, 0.03), (0.75, 0.25, 0.02), 0.022)
    p.box((0.78, 0.27, 0.03), (0.1, 0.03, 0.06), "iron")
    p.cyl((0.84, 0.29, 0.0), 0.04, 0.03, "iron", seg=6)


@piece("mine_strongbox", "props", "Iron-bound strongbox for the gold, with a padlock")
def _strongbox(p, rng):
    p.box((0, 0, 0.24), (0.8, 0.5, 0.48), "wood_dark", 0.015)
    p.box((0, 0, 0.53), (0.82, 0.52, 0.1), "wood", 0.015)
    for x in (-0.3, 0.3):
        p.box((x, 0, 0.29), (0.06, 0.54, 0.6), "iron", 0.005)
    p.box((0, 0, 0.04), (0.84, 0.54, 0.06), "iron", 0.005)
    p.box((0, -0.27, 0.42), (0.1, 0.03, 0.14), "iron")
    p.box((0, -0.3, 0.32), (0.09, 0.04, 0.09), "brass", 0.005)
    p.cyl((0, -0.3, 0.37), 0.03, 0.01, "brass", seg=6, rot=(90, 0, 0))


@piece("mine_dynamite_bundle", "props", "Three tied sticks of dynamite with a long fuse on the ground")
def _dynamite_bundle(p, rng):
    for (y, z) in ((-0.045, 0.04), (0.045, 0.04), (0.0, 0.115)):
        p.cyl((-0.21, y, z), 0.04, 0.42, "cloth_red", seg=7, rot=(0, 90, 0))
    for x in (-0.1, 0.1):
        p.cyl((x, 0, 0.07), 0.1, 0.03, "rope", seg=8, rot=(0, 90, 0))
    pts = [(0.21, 0.0, 0.08), (0.35, 0.05, 0.015), (0.6, 0.2, 0.015), (0.75, 0.45, 0.015), (0.65, 0.7, 0.015), (0.35, 0.8, 0.015)]
    for a, b in zip(pts, pts[1:]):
        rope_seg(p, a, b, 0.008, "coal", 4)


@piece("mine_vent_fan", "props", "Hand-cranked ventilation fan with a canvas air duct")
def _vent_fan(p, rng):
    for s in (-1, 1):
        p.box((s * 0.35, 0, 0.3), (0.1, 0.8, 0.1), "wood_dark", 0.01)
        p.box((s * 0.35, 0, 0.05), (0.12, 0.9, 0.1), "wood_dark", 0.01)
        p.box((s * 0.35, 0, 0.35), (0.08, 0.08, 0.6), "wood_dark", 0.01)
    p.cyl((-0.3, 0, 0.75), 0.42, 0.6, "iron", seg=12, rot=(0, 90, 0))
    p.cyl((-0.32, 0, 0.75), 0.44, 0.04, "rust", seg=12, rot=(0, 90, 0))
    p.cyl((0.28, 0, 0.75), 0.44, 0.04, "rust", seg=12, rot=(0, 90, 0))
    p.cyl((0.3, 0, 0.75), 0.05, 0.12, "steel", seg=6, rot=(0, 90, 0))
    p.box((0.44, 0, 0.6), (0.04, 0.04, 0.34), "iron")
    p.cyl((0.44, 0, 0.45), 0.03, 0.16, "wood_dark", seg=6, rot=(0, 90, 0))
    p.cyl((0, 0.3, 0.98), 0.17, 0.25, "iron", seg=8, rot=(-90, 0, 0))
    p.cyl((0, 0.55, 0.98), 0.19, 1.4, "sack", seg=8, rot=(-90, 0, 0))
    for y in (0.7, 1.15, 1.6):
        p.cyl((0, y, 0.98), 0.205, 0.04, "rope", seg=8, rot=(-90, 0, 0))
    p.info["col"] = [("box", (0, 0.4, 0.6), (0.9, 1.9, 1.2))]


@piece("mine_vent_chimney", "props", "Square timber air duct from floor to ceiling (3.9 m) with an iron grille at the bottom")
def _vent_chimney(p, rng):
    for s in (-1, 1):
        p.box((s * 0.38, 0.04, 2.25), (0.06, 0.84, 3.3), "wood", 0.01)
        p.box((0, s * 0.38, 2.25), (0.72, 0.06, 3.3), "wood", 0.01)
        p.box((s * 0.38, 0, 0.3), (0.06, 0.8, 0.6), "wood", 0.01)
    p.box((0, 0.38, 0.3), (0.72, 0.06, 0.6), "wood", 0.01)
    for a in (-1, 1):
        for b in (-1, 1):
            p.box((a * 0.4, b * 0.4, 1.95), (0.1, 0.1, 3.9), "wood_dark", 0.01)
    for z in (0.65, 1.6, 2.6, 3.6):
        p.box((0, 0, z), (0.86, 0.86, 0.06), "iron")
    for k in range(5):
        p.cyl((-0.24 + k * 0.12, -0.38, 0.05), 0.015, 0.55, "iron", seg=5)
    p.box((0, -0.38, 0.06), (0.62, 0.04, 0.04), "iron")
    p.box((0, -0.38, 0.6), (0.62, 0.04, 0.04), "iron")
    p.info["col"] = [("box", (0, 0, 1.95), (0.9, 0.9, 3.9))]


@piece("mine_water_pump", "props", "Hand water pump on a timber base, with a bucket under the spout")
def _water_pump(p, rng):
    p.box((0, 0, 0.08), (0.9, 0.9, 0.16), "wood_dark", 0.02)
    p.cyl((0, 0, 0.16), 0.11, 1.0, "iron", seg=8)
    p.cyl((0, 0, 1.16), 0.13, 0.06, "iron", seg=8)
    p.box((0, -0.18, 0.95), (0.08, 0.3, 0.08), "iron", 0.005)
    p.box((0, -0.32, 0.9), (0.08, 0.06, 0.1), "iron", 0.005)
    p.box((0, 0.12, 1.3), (0.06, 0.06, 0.2), "iron")
    beam(p, (0, 0.12, 1.38), (0, 0.75, 1.2), 0.05, 0.05, "iron", 0.0)
    p.cyl((0, 0.75, 1.2), 0.03, 0.15, "wood_dark", seg=6, rot=(0, 90, 0))
    p.lathe([(0, 0.16), (0.14, 0.16), (0.17, 0.46), (0.15, 0.46), (0.12, 0.2), (0, 0.2)], "wood", c=(0, -0.42, 0), seg=8)
    p.box((0, -0.42, 0.44), (0.02, 0.02, 0.01), "iron")
    p.info["col"] = [("box", (0, 0, 0.6), (0.9, 0.9, 1.2))]


@piece("mine_scaffold_tall", "props", "Two-storey timber scaffold, 2 x 2 m, decks at 1.8 m and 3.4 m, with ladders")
def _scaffold_tall(p, rng):
    for a in (-1, 1):
        for b in (-1, 1):
            p.box((a * 0.92, b * 0.92, 1.8), (0.14, 0.14, 3.6), "wood_dark", 0.02)
        for z0 in (0.0, 1.8):
            beam(p, (a * 0.92, -0.92, z0 + 0.1), (a * 0.92, 0.92, z0 + 1.55), 0.06, 0.1, "wood", 0.01)
    for zt in (1.8, 3.4):
        for a in (-1, 1):
            p.box((0, a * 0.92, zt - 0.11), (1.98, 0.1, 0.12), "wood_dark", 0.01)
        plank_deck(p, -1.0, 0.25 if zt < 2 else 1.0, -1.025, 1.025, zt)   # ladder hole in the lower deck
    for s in (-1, 1):   # ladder to the lower deck (front) and through the hole to the upper deck
        p.box((0.25 + s * 0.24, -1.0, 0.95), (0.06, 0.07, 1.9), "wood_dark", 0.01)
        p.box((0.6 + s * 0.24, 0.0, 2.65), (0.06, 0.07, 1.7), "wood_dark", 0.01)
    for z in (0.3, 0.6, 0.9, 1.2, 1.5):
        p.cyl((0.01, -1.0, z), 0.022, 0.48, "wood", seg=5, rot=(0, 90, 0))
    for z in (2.0, 2.3, 2.6, 2.9, 3.2):
        p.cyl((0.36, 0.0, z), 0.022, 0.48, "wood", seg=5, rot=(0, 90, 0))
    p.info["col"] = [("box", (0, 0, 1.76), (2.05, 2.05, 0.1)), ("box", (0, 0, 3.36), (2.05, 2.05, 0.1))] + \
        [("box", (a * 0.92, b * 0.92, 1.8), (0.14, 0.14, 3.6)) for a in (-1, 1) for b in (-1, 1)]


@piece("mine_stalactite", "props", "Large stalactite with two smaller ones; hangs below its pivot (1.8 m)", "hanging")
def _stalactite(p, rng):
    p.rock((0, 0, -0.12), (0.95, 0.85, 0.22), "rock_brown", rng)
    for (x, y, r, h) in ((0, 0, 0.4, 1.8), (0.4, 0.2, 0.2, 0.8), (-0.32, 0.25, 0.16, 0.55)):
        p.lathe([(0, -h), (r * 0.15, -h * 0.9), (r * 0.42, -h * 0.62), (r * 0.72, -h * 0.3), (r, -0.12), (0, -0.12)],
                rng.choice(["rock_brown", "stone_b"]), c=(x, y, 0), seg=7)
    p.info["col"] = [("box", (0, 0, -0.9), (0.8, 0.8, 1.8))]


@piece("mine_bats", "props", "Three bats asleep under a rock lump; hangs below its pivot", "hanging")
def _bats(p, rng):
    p.rock((0, 0, -0.1), (0.7, 0.5, 0.18), "rock_dark", rng)
    for (x, y, r) in ((-0.2, 0.05, 10), (0.08, -0.08, -25), (0.26, 0.1, 40)):
        p.push(Matrix.Translation((x, y, -0.18)) @ Matrix.Rotation(math.radians(r), 4, "Z"))
        for s in (-1, 1):
            p.box((s * 0.025, 0, -0.03), (0.012, 0.012, 0.06), "coal")
        p.rock((0, 0, -0.16), (0.08, 0.07, 0.17), "leather", rng)
        for s in (-1, 1):
            p.prism_xz([(s * 0.02, -0.05), (s * 0.085, -0.09), (s * 0.06, -0.27), (s * 0.02, -0.25)][::s], -0.035, 0.035, "coal")
        p.rock((0, 0, -0.27), (0.055, 0.05, 0.06), "leather", rng)
        for s in (-1, 1):
            p.cyl((s * 0.018, 0, -0.29), 0.012, 0.04, "leather", seg=4, r2=0.0, rot=(180, 0, 0))
        p.pop()
    p.info["col"] = [("box", (0, 0, -0.2), (0.7, 0.5, 0.4))]


@piece("mine_cart_flat", "props", f"Flat cart loaded with timber beams. MOVING: roll it along Blender Y / Godot Z, at height {RAIL_TOP} on rails", "free")
def _cart_flat(p, rng):
    cart_chassis(p)
    p.box((0, 0, 0.39), (1.0, 1.55, 0.08), "wood", 0.01)
    for a in (-1, 1):
        for b in (-1, 1):
            p.box((a * 0.46, b * 0.7, 0.68), (0.07, 0.07, 0.6), "wood_dark", 0.01)
    for k, (x, z) in enumerate(((-0.25, 0.53), (0.0, 0.53), (0.25, 0.53), (-0.12, 0.73), (0.13, 0.73))):
        p.box((x + rng.uniform(-0.02, 0.02), 0, z), (0.2, 1.9, 0.2), rng.choice(["wood", "wood_dark"]), 0.02)
    for y in (-0.5, 0.5):
        p.box((0, y, 0.64), (0.62, 0.06, 0.4), "rope", 0.01)


@piece("mine_handcar", "props", f"Rail handcar with a pump lever. MOVING: roll it along Blender Y / Godot Z, at height {RAIL_TOP} on rails", "free")
def _handcar(p, rng):
    cart_chassis(p)
    y = -0.8
    while y < 0.79:
        p.box((0, y + 0.1, 0.39), (1.2, 0.19, 0.06), rng.choice(["wood", "wood", "wood_dark"]), 0.01)
        y += 0.2
    p.box((0, 0, 0.55), (0.4, 0.3, 0.25), "iron", 0.01)
    for s in (-1, 1):
        beam(p, (s * 0.18, -0.3, 0.42), (s * 0.12, 0, 1.15), 0.08, 0.08, "wood_dark", 0.01)
        beam(p, (s * 0.18, 0.3, 0.42), (s * 0.12, 0, 1.15), 0.08, 0.08, "wood_dark", 0.01)
    p.cyl((-0.2, 0, 1.15), 0.05, 0.4, "iron", seg=6, rot=(0, 90, 0))
    beam(p, (0, -0.85, 1.05), (0, 0.85, 1.25), 0.1, 0.1, "wood", 0.01)
    for yy, zz in ((-0.85, 1.05), (0.85, 1.25)):
        p.cyl((-0.35, yy, zz), 0.035, 0.7, "wood_dark", seg=6, rot=(0, 90, 0))
    for s in (-1, 1):
        p.box((s * 0.55, 0, 0.62), (0.05, 1.5, 0.05), "iron")
        p.box((s * 0.55, -0.72, 0.52), (0.05, 0.05, 0.22), "iron")
        p.box((s * 0.55, 0.72, 0.52), (0.05, 0.05, 0.22), "iron")


# --------------------------------------------------------------------------- build
def tri_count(me):
    return sum(len(pl.vertices) - 2 for pl in me.polygons)


def build_piece(name, fn, coll):
    rng = random.Random(sum(ord(c) * (i + 1) for i, c in enumerate(name)))
    p = Part(name)
    fn(p, rng)
    me = bpy.data.meshes.new(name)
    if PLACEMENT[name] in ("ground", "decor"):
        for v in p.bm.verts:  # stones sit flat on the ground: nothing below the pivot
            v.co.z = max(v.co.z, 0.0)
    bmesh.ops.remove_doubles(p.bm, verts=list(p.bm.verts), dist=0.0001)
    bmesh.ops.dissolve_degenerate(p.bm, dist=0.0001, edges=list(p.bm.edges))
    p.bm.to_mesh(me)
    p.bm.free()
    for m in p.mats:
        me.materials.append(MATS[m])
    LT.box_uv(me, {i for i, m in enumerate(p.mats) if m in LT.TEX_MATS})
    ob = bpy.data.objects.new(name, me)
    coll.objects.link(ob)
    cols = p.info["col"]
    if cols is None:
        bb = [Vector(v) for v in ob.bound_box]
        lo = min(v.z for v in bb)
        mn = Vector((min(v.x for v in bb), min(v.y for v in bb), lo if PLACEMENT[name] == "hanging" else max(0.0, lo)))
        mx = Vector((max(v.x for v in bb), max(v.y for v in bb), max(v.z for v in bb)))
        cols = [("box", tuple((mn + mx) / 2), tuple(mx - mn))]
    col_objs = []
    for i, c in enumerate(cols):
        cp = Part("col")
        if c[0] == "box":
            cp.box(c[1], c[2], "void")
        else:  # ramp profile in YZ, full cell width
            tbm = bmesh.new()
            pts = c[1]
            a = [tbm.verts.new((-HALF, y, z)) for y, z in pts]
            b = [tbm.verts.new((HALF, y, z)) for y, z in pts]
            tbm.faces.new(a)
            tbm.faces.new(list(reversed(b)))
            for k in range(len(pts)):
                k2 = (k + 1) % len(pts)
                tbm.faces.new((a[k], a[k2], b[k2], b[k]))
            bmesh.ops.remove_doubles(tbm, verts=list(tbm.verts), dist=0.0001)
            bmesh.ops.recalc_face_normals(tbm, faces=list(tbm.faces))
            cp._add(tbm, "void")
        cme = bpy.data.meshes.new(f"{name}_col{i}")
        cp.bm.to_mesh(cme)
        cp.bm.free()
        co = bpy.data.objects.new(f"{name}_col{i}-colonly", cme)
        coll.objects.link(co)
        co.parent = ob
        co.display_type = "WIRE"
        co.hide_render = True
        col_objs.append(co)
    dims = [round(d, 3) for d in ob.dimensions]
    return ob, col_objs, {"tris": tri_count(me), "size_m": dims, "lights": p.info["lights"],
                          "placement": PLACEMENT[name]}


def select_only(objs):
    bpy.ops.object.select_all(action="DESELECT")
    for o in objs:
        o.select_set(True)
    bpy.context.view_layer.objects.active = objs[0]


def export_piece(ob, cols):
    old = ob.location.copy()
    ob.location = (0, 0, 0)
    bpy.context.view_layer.update()
    for sub, objs in (("glb", [ob]), ("glb_godot", [ob] + cols)):
        select_only(objs)
        bpy.ops.export_scene.gltf(filepath=os.path.join(ROOT, "exports", sub, ob.name + ".glb"),
                                  export_format="GLB", use_selection=True, export_apply=True,
                                  export_yup=True, export_materials="EXPORT", export_cameras=False,
                                  export_lights=False, export_extras=False)
    select_only([ob])
    bpy.ops.export_scene.fbx(filepath=os.path.join(ROOT, "exports", "fbx", ob.name + ".fbx"), use_selection=True,
                             apply_scale_options="FBX_SCALE_ALL", axis_forward="-Z", axis_up="Y",
                             mesh_smooth_type="FACE", bake_space_transform=True, add_leaf_bones=False,
                             path_mode="COPY", embed_textures=True)
    ob.location = old


# --------------------------------------------------------------------------- demo layout
DIRS = {"N": (0, 1), "S": (0, -1), "E": (1, 0), "W": (-1, 0)}
WALL_ROT = {"N": 0.0, "S": 180.0, "E": -90.0, "W": 90.0}


def door_hinge(mx, my, rot):
    return mx + (-0.95) * math.cos(math.radians(rot)), my + (-0.95) * math.sin(math.radians(rot))


# --------------------------------------------------------------------------- moving parts (Godot scenes + demo)
# piece: (motion, axis in Blender coordinates, amount when fully open: degrees or metres, rest rot_x, duration)
MOVERS = {
    "mine_door": ("rotate", (0, 0, 1), -80.0, 0.0, 1.2),
    "mine_gate_bars": ("rotate", (0, 0, 1), -85.0, 0.0, 1.4),
    "mine_hatch": ("rotate", (1, 0, 0), 100.0, 0.0, 1.0),
    "mine_lift_cage": ("slide", (0, 0, 1), -1.3, 0.0, 3.0),
    "mine_cart": ("slide", (0, 1, 0), 4.0, 0.0, 3.0),
    "mine_cart_ore": ("slide", (0, 1, 0), 4.0, 0.0, 3.0),
    "mine_cart_flat": ("slide", (0, 1, 0), 4.0, 0.0, 3.0),
    "mine_handcar": ("slide", (0, 1, 0), 4.0, 0.0, 3.0),
    "mine_switch_lever_handle": ("rotate", (1, 0, 0), 60.0, -30.0, 0.4),
    "mine_rails_switch_blade": ("rotate", (0, 0, 1), 6.0, 0.0, 0.5),
    "mine_stamp_head": ("slide", (0, 0, 1), 0.35, 0.0, 0.4),
    "mine_ore_bucket": ("slide", (0, 0, 1), -1.4, 0.0, 2.5),
    "mine_chute_gate": ("slide", (0, 0, 1), 0.35, 0.0, 0.6),
}
GODOT_LIGHTS = {  # light kind: (colour, energy, range, shadow)
    "fire": ("Color(1, 0.6, 0.28, 1)", 1.6, 6.5, True),
    "crystal": ("Color(0.37, 0.9, 1, 1)", 1.4, 7.0, True),
    "crystal_violet": ("Color(0.77, 0.55, 1, 1)", 2.2, 8.0, True),
    "glow": ("Color(0.49, 1, 0.85, 1)", 0.6, 3.0, False),
}


def mover_matrix(piece, amount):
    """Local transform of a moving part opened by 'amount' (0..1), applied after its rest rotation."""
    if piece not in MOVERS:
        return Matrix.Identity(4)
    kind, axis, full, _, _ = MOVERS[piece]
    if kind == "rotate":
        return Matrix.Rotation(math.radians(full * amount), 4, Vector(axis))
    return Matrix.Translation(Vector(axis) * full * amount)


def item_matrix(it):
    return (Matrix.Translation(it["pos"]) @ Matrix.Rotation(math.radians(it["rot_z"]), 4, "Z")
            @ mover_matrix(it["piece"], it.get("open", 0.0))
            @ Matrix.Rotation(math.radians(it.get("rot_x", 0.0)), 4, "X"))


def demo_layout(meta):
    cells = {}

    def room(name, i0, i1, j0, j1):
        for i in range(i0, i1 + 1):
            for j in range(j0, j1 + 1):
                cells[(i, j)] = name

    room("yard", 0, 2, 0, 2)          # shaft room with the headframe
    room("drift", 3, 6, 1, 1)         # rail tunnel
    room("drift", 6, 7, 2, 3)         # ore chamber (same name: open to the tunnel)
    room("grotto", 8, 9, 2, 3)        # crystal grotto
    # v1.1: the branch line goes south from the tunnel to the ore works, then to a deep gallery
    room("drift", 4, 4, 0, 0)
    room("works", 3, 7, -3, -1)
    room("deep", 8, 9, -3, -1)
    special = {((2, 1), "E"): "door", ((7, 2), "E"): "open", ((4, -1), "N"): "gate", ((7, -1), "E"): "open"}
    decor = {((0, 2), "N"): "lantern", ((2, 0), "S"): "lantern", ((0, 0), "W"): "timbered",
             ((1, 2), "N"): "timbered", ((2, 2), "E"): "collapsed",
             ((3, 1), "N"): "timbered", ((4, 1), "N"): "timbered", ((5, 1), "N"): "timbered",
             ((3, 1), "S"): "timbered", ((4, 1), "S"): "lantern_t", ((5, 1), "S"): "timbered",
             ((6, 1), "S"): "timbered", ((6, 1), "E"): "collapsed",
             ((7, 3), "N"): "ore", ((6, 3), "N"): "ore", ((6, 3), "W"): "lantern", ((7, 2), "S"): "ore",
             ((6, 2), "W"): "ore",
             ((8, 3), "N"): "crystal", ((9, 2), "E"): "crystal", ((9, 2), "S"): "crystal", ((9, 3), "E"): "crystal",
             # v1.1
             ((3, 0), "W"): "timbered", ((4, 0), "W"): "timbered", ((4, 0), "E"): "timbered",
             ((3, -1), "W"): "coal", ((3, -2), "W"): "sign", ((3, -3), "W"): "alcove", ((3, -1), "N"): "timbered",
             ((5, -1), "N"): "lantern_t", ((6, -1), "N"): "timbered", ((7, -1), "N"): "coal",
             ((3, -3), "S"): "timbered", ((4, -3), "S"): "lantern", ((5, -3), "S"): "silver", ((6, -3), "S"): "timbered",
             ((7, -3), "S"): "lantern_t", ((7, -2), "E"): "timbered", ((7, -3), "E"): "low_tunnel",
             ((8, -1), "N"): "gems", ((9, -1), "N"): "silver", ((9, -1), "E"): "mushwall", ((9, -2), "E"): "gems",
             ((9, -3), "E"): "coal", ((9, -3), "S"): "crystal", ((8, -3), "S"): "gems"}
    items, seen, verts = [], set(), set()

    def add(piece, x, y, z=0.0, rot=0.0, tag=None, rot_x=0.0, open_=0.0):
        it = {"piece": piece, "pos": [round(x, 3), round(y, 3), round(z, 3)], "rot_z": rot,
              "tag": tag or ("ceiling" if piece.startswith("mine_ceiling") else "")}
        if rot_x:
            it["rot_x"] = rot_x
        if open_:
            it["open"] = open_
        items.append(it)

    floor_variant = {(1, 1): ("mine_floor_shaft", 0), (3, 1): ("mine_floor_rails", 90), (4, 1): ("mine_floor_rails_junction", -90),
                     (5, 1): ("mine_floor_rails", 90), (6, 1): ("mine_floor_rails_curve", 180),
                     (6, 2): ("mine_floor_rails", 0), (6, 3): ("mine_floor_rails_end", 0),
                     (7, 3): ("mine_floor_shaft", 0),
                     # v1.1
                     (4, 0): ("mine_floor_rails", 0), (4, -1): ("mine_floor_rails", 0), (4, -2): ("mine_floor_rails_cross", 0),
                     (3, -2): ("mine_floor_rails_end", 90), (5, -2): ("mine_floor_pit", 0), (6, -2): ("mine_floor_rails_slope", -90),
                     (7, -2): ("mine_platform", -90), (4, -3): ("mine_floor_rails_end", 180),
                     (3, -1): ("mine_floor_puddles", 0), (5, -1): ("mine_floor_planks", 0), (7, -1): ("mine_floor_rubble", 90),
                     (6, -3): ("mine_floor_puddles", 180), (7, -3): ("mine_floor_shaft", 0),
                     (8, -1): ("mine_floor_rubble", 0), (9, -2): ("mine_floor_puddles", 90), (8, -3): ("mine_floor_rubble", 180)}
    ceil_variant = {(4, -1): "mine_ceiling_timbered", (5, -1): "mine_ceiling_timbered", (6, -1): "mine_ceiling_timbered",
                    (3, -3): "mine_ceiling_shaft", (8, -2): "mine_ceiling_stalactites", (9, -3): "mine_ceiling_stalactites",
                    (4, 0): "mine_ceiling_timbered"}
    for (i, j), rn in sorted(cells.items()):
        piece_name, r = floor_variant.get((i, j), ("mine_floor", 90.0 * ((i * 7 + j * 3) % 4)))
        add(piece_name, i * CELL, j * CELL, rot=r)
        add(ceil_variant.get((i, j), "mine_ceiling"), i * CELL, j * CELL, WALL_H)
        for d, (di, dj) in DIRS.items():
            nb = (i + di, j + dj)
            if cells.get(nb) == rn:
                continue
            key = frozenset(((i, j), nb))
            if key in seen:
                continue
            seen.add(key)
            mx, my = i * CELL + di * HALF, j * CELL + dj * HALF
            rot = WALL_ROT[d]
            kind = special.get(((i, j), d)) or decor.get(((i, j), d), "wall")
            if kind in ("door", "open", "gate"):
                add("mine_wall_entrance", mx, my, rot=rot)
                hx, hy = door_hinge(mx, my, rot)
                if kind == "door":
                    add("mine_door", hx, hy, rot=rot, open_=75.0 / 80.0)
                elif kind == "gate":
                    add("mine_gate_bars", hx, hy, rot=rot, open_=1.0)
            elif kind in ("lantern", "lantern_t"):
                add("mine_wall_timbered" if kind == "lantern_t" else "mine_wall", mx, my, rot=rot)
                add("mine_lantern_wall", mx, my, rot=rot)
            elif kind == "sign":
                add("mine_wall", mx, my, rot=rot)
                add("mine_sign_board", mx, my, rot=rot)
            elif kind == "mushwall":
                add("mine_wall", mx, my, rot=rot)
                add("mine_mushrooms_wall", mx, my, rot=rot)
            else:
                add({"wall": "mine_wall", "timbered": "mine_wall_timbered", "collapsed": "mine_wall_collapsed",
                     "ore": "mine_wall_ore", "crystal": "mine_wall_crystal", "silver": "mine_wall_silver",
                     "gems": "mine_wall_gems", "coal": "mine_wall_coal_seam", "low_tunnel": "mine_wall_low_tunnel",
                     "alcove": "mine_wall_alcove"}[kind], mx, my, rot=rot)
            if di:
                verts.update({(mx, my - HALF), (mx, my + HALF)})
            else:
                verts.update({(mx - HALF, my), (mx + HALF, my)})
    for (x, y) in sorted(verts):
        add("mine_wall_corner", x, y)
    # yard: shaft with headframe and lift, tools, explosives
    add("mine_shaft_headframe", 4, 4)
    add("mine_lift_cage", 4, 4, -0.12)
    add("mine_lantern_hanging", 5.38, 4.6, 2.55)
    add("mine_lantern_post", 1.0, 3.0, rot=90)
    add("mine_winch", 0.2, 7.6, rot=0)
    add("mine_tool_rack", -1.45, 1.6, rot=90)
    add("mine_dynamite_crate", 8.7, -0.95, rot=12)
    add("mine_dynamite_crate", 8.85, -0.9, 0.8, rot=-20)
    add("mine_detonator", 7.4, -1.1, rot=-15)
    add("mine_plank_pile", 0.9, -1.05, rot=0)
    add("mine_lantern_post", 7.4, 1.3, rot=180)
    add("mine_sign_danger", 6.4, 5.9, rot=-25)
    add("mine_boulders", -0.4, 5.0, rot=30)
    add("mine_scaffold", 8.4, 8.4)
    add("mine_ladder", 8.4, 7.32, rot=0)
    add("mine_shovel", 2.8, 8.9, rot=-20)
    add("mine_pickaxe", 5.4, 1.4, rot=60)
    # drift: rail tunnel with support frames, a cart, hanging lanterns; v1.1 turnout at x = 16
    for x in (12, 20):
        add("mine_support_frame", x, 4, rot=90)
    add("mine_rails_switch_blade", 15.3, 4.0, rot=-90)
    add("mine_lantern_hanging", 12, 5.3, 2.65)
    add("mine_lantern_hanging", 20, 2.7, 2.65)
    add("mine_cart", 15.0, 4.0, RAIL_TOP, rot=90)
    add("mine_switch_lever", 22.6, 2.75, rot=0)
    add("mine_switch_lever_handle", 22.6, 2.75, 0.22, rot=0, rot_x=-30.0)
    add("mine_boulders", 25.0, 2.9, rot=80)
    # ore chamber
    add("mine_cart_ore", 24.0, 9.2, RAIL_TOP, rot=0)
    add("mine_ore_pile_gold", 26.9, 7.4)
    add("mine_ore_pile_iron", 29.0, 7.2, rot=40)
    add("mine_coal_pile", 22.9, 11.6, rot=10)
    add("mine_hatch", 28.0, 10.95, 0.12, rot=0, open_=1.0)
    add("mine_workbench", 29.35, 9.4, rot=90)
    add("mine_lantern_post", 25.9, 13.0, rot=0)
    add("mine_pickaxe", 26.0, 10.0, rot=110)
    add("mine_shovel", 26.6, 9.3, rot=200)
    add("mine_crystal_cluster", 22.8, 13.3, rot=40)
    # grotto
    add("mine_crystal_large", 36.4, 7.6, rot=10)
    add("mine_crystal_cluster", 33.0, 12.9, rot=0)
    add("mine_crystal_cluster", 37.3, 12.4, rot=-50)
    add("mine_rock_pillar", 34.2, 10.2)
    add("mine_stalagmite", 31.2, 12.9, rot=20)
    add("mine_stalagmite", 35.6, 13.1, rot=140)
    add("mine_mushrooms_glow", 32.2, 9.6)
    add("mine_mushrooms_glow", 37.2, 10.0, rot=70)
    add("mine_mushrooms_glow", 31.8, 6.8, rot=120)
    add("mine_boulders", 34.6, 6.9, rot=200)
    # --- v1.1 branch line and works (cells i 3..7, j -3..-1) --------------------------------
    add("mine_lantern_hanging", 16.9, 0.6, 2.65)
    add("mine_support_braced", 16.0, 0.0, rot=0)
    add("mine_loading_chute", 16, -4.6, rot=0)
    add("mine_chute_gate", 16, -5.46, 1.62, rot=0)
    add("mine_cart", 16, -5.4, RAIL_TOP, rot=0)
    add("mine_water_pump", 10.7, -2.9, rot=90)
    add("mine_water_trough", 10.9, -5.0, rot=90)
    add("mine_barrel_powder", 13.4, -2.7)
    add("mine_table", 20.6, -2.95, rot=0)
    add("mine_lamp_miner", 20.95, -2.85, 0.81, rot=-30)
    add("mine_canary_cage", 22.0, -4.9, rot=200)
    add("mine_strongbox", 18.9, -5.3, rot=80)
    add("mine_sack_pile", 25.3, -2.75, rot=0)
    add("mine_crate_ore", 23.3, -2.7, rot=15)
    add("mine_rope_coil", 22.9, -5.4, rot=40)
    add("mine_support_post", 24.0, -5.9)
    add("mine_stairs_timber", 28.0, -4.0, rot=180)
    add("mine_dynamite_bundle", 26.6, -2.7, rot=20)
    add("mine_cart_flat", 13.4, -8.0, RAIL_TOP, rot=90)
    add("mine_rail_stack", 12.4, -6.7, rot=90)
    add("mine_sign_arrow", 14.6, -6.4, rot=0)
    add("mine_rail_bridge", 20, -8, rot=90)
    add("mine_floor_rails_end", 28.0, -8.0, 2.01, rot=-90)
    add("mine_cart_ore", 28.4, -8.0, 2.01 + RAIL_TOP, rot=90)
    add("mine_wheelbarrow", 27.0, -10.9, rot=120)
    add("mine_lamp_string", 24.0, -8.0, 3.95, rot=0, tag="ceiling")
    add("mine_handcar", 16.0, -11.6, RAIL_TOP, rot=0)
    add("mine_lantern_hanging", 17.8, -10.5, 2.65)
    add("mine_lantern_hanging", 12.0, -9.2, 2.65)
    add("mine_lantern_post", 10.5, -7.0, rot=0)
    add("mine_lantern_hanging", 21.6, -5.6, 2.65)
    add("mine_scaffold_tall", 12.0, -12.0)
    add("mine_vent_chimney", 10.6, -13.3)
    add("mine_drill_hand", 13.9, -10.6, rot=-140)
    add("mine_stamp_mill", 19.2, -12.9, rot=0)
    add("mine_stamp_head", 19.2, -12.9, 0.95, rot=0)
    add("mine_conveyor", 21.9, -11.9, rot=180)
    add("mine_ore_pile_gold", 23.4, -10.6, rot=30)
    add("mine_vent_fan", 25.4, -13.2, rot=90)
    add("mine_pulley_frame", 28.0, -12.0, rot=0)
    add("mine_ore_bucket", 28.0, -12.0, 2.55, rot=0)
    add("mine_lantern_post", 29.3, -10.4, rot=180)
    # deep gallery (cells i 8..9, j -3..-1)
    add("mine_rock_arch", 34.0, -6.2, rot=0)
    add("mine_wall_corner_round", 38.0, -2.0, rot=180)
    add("mine_wall_corner_round", 38.0, -14.0, rot=90)
    add("mine_cave_in", 34.0, -12.9, rot=0)
    add("mine_mushroom_giant", 36.6, -4.3, rot=30)
    add("mine_geode", 32.0, -8.6, rot=-60)
    add("mine_crystal_shards", 35.0, -8.4, rot=0)
    add("mine_crystal_hanging", 33.2, -4.0, 3.98, tag="ceiling")
    add("mine_stalactite", 33.2, -10.4, 3.98, tag="ceiling")
    add("mine_bats", 31.4, -11.0, 3.98, tag="ceiling")
    add("mine_mushrooms_glow", 31.2, -3.2, rot=50)
    add("mine_walkway", 37.0, -8.0, rot=0)
    lights = []
    for it in items:
        m = item_matrix(it)
        for l in meta[it["piece"]]["lights"]:
            w = m @ Vector(l[:3])
            lights.append({"pos": [round(w.x, 3), round(w.y, 3), round(w.z, 3)], "size": l[3], "kind": l[4],
                           "piece": it["piece"]})
    cams = {
        "overview": {"pos": [18.0, -27.0, 37.0], "target": [18.0, 0.4, 0.0], "lens": 32},
        "yard_top": {"pos": [15.0, -7.5, 14.0], "target": [4.0, 4.5, 0.0], "lens": 24},
        "top": {"pos": [15.0, -7.5, 14.0], "target": [4.0, 4.5, 0.0], "lens": 24},
        "yard": {"pos": [8.8, 0.4, 2.3], "target": [1.5, 6.5, 0.9], "lens": 18},
        "drift": {"pos": [10.7, 3.0, 2.3], "target": [24.0, 4.6, 0.6], "lens": 22},
        "ore": {"pos": [22.9, 6.6, 2.7], "target": [28.6, 11.4, 0.3], "lens": 17},
        "grotto": {"pos": [30.6, 6.6, 2.0], "target": [36.0, 11.2, 0.9], "lens": 20},
        "works_top": {"pos": [33.0, -27.0, 19.0], "target": [21.0, -8.0, 0.0], "lens": 26},
        "works": {"pos": [23.6, -13.3, 3.0], "target": [14.0, -4.0, 0.5], "lens": 16},
        "works_track": {"pos": [13.0, -9.4, 2.4], "target": [28.0, -7.4, 1.4], "lens": 19},
        "deep": {"pos": [30.9, -11.6, 2.3], "target": [36.5, -3.5, 1.2], "lens": 17},
    }
    return {"cell_m": CELL, "rail_top_m": RAIL_TOP, "items": items, "lights": lights, "cameras": cams,
            "note": "Blender coordinates (Z up). Godot: (x, z, -y), rotation = (rot_x, rot_z, 0) in YXZ order; "
                    "moving parts: 'open' = how far open (0..1), see kit.json"}


# --------------------------------------------------------------------------- render helpers
def set_engine(scene):
    for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE"):
        try:
            scene.render.engine = eng
            break
        except TypeError:
            pass
    ee = scene.eevee
    for attr, val in (("taa_render_samples", 64), ("use_shadows", True), ("use_raytracing", True),
                      ("use_gtao", True), ("shadow_pool_size", "1024"), ("shadow_resolution_scale", 0.5)):
        try:
            setattr(ee, attr, val)
        except Exception:
            pass
    scene.view_settings.view_transform = "AgX"
    for look in ("AgX - Medium High Contrast", "Medium High Contrast"):
        try:
            scene.view_settings.look = look
            break
        except TypeError:
            pass


def world(scene, color, strength):
    w = bpy.data.worlds.get("dk_world") or bpy.data.worlds.new("dk_world")
    w.use_nodes = True
    bg = w.node_tree.nodes["Background"]
    bg.inputs[0].default_value = (*color, 1)
    bg.inputs[1].default_value = strength
    scene.world = w


def look_at(cam, pos, target):
    cam.location = pos
    d = Vector(target) - Vector(pos)
    cam.rotation_euler = d.to_track_quat("-Z", "Y").to_euler()


def clear_lights():
    for o in list(bpy.data.objects):
        if o.type == "LIGHT":
            bpy.data.objects.remove(o)


def add_light(kind, loc, energy, color=(1, 1, 1), size=0.1, rot=None, shadow=True, name="L"):
    ld = bpy.data.lights.new(name, kind)
    ld.energy = energy
    ld.color = color
    if kind == "SUN":
        ld.angle = math.radians(size)
    elif kind == "AREA":
        ld.size = size
    else:
        ld.shadow_soft_size = size
    ld.use_shadow = shadow
    o = bpy.data.objects.new(name, ld)
    bpy.context.scene.collection.objects.link(o)
    o.location = loc
    if rot:
        o.rotation_euler = [math.radians(a) for a in rot]
    return o


LIGHT_STYLE = {  # kind: (Blender watts, colour)
    "fire": (170, "ff9a4a"),
    "crystal": (120, "5fe6ff"),
    "crystal_violet": (220, "c58cff"),
    "glow": (35, "7dffd8"),
}


def render_thumbs(scene, objs, kit_coll, hidden):
    out = os.path.join(ROOT, "renders", "thumbs")
    os.makedirs(out, exist_ok=True)
    for c in hidden:
        c.hide_render = True
    kit_coll.hide_render = False
    clear_lights()
    world(scene, srgb("b9b4ac"), 0.9)
    add_light("SUN", (0, 0, 10), 3.2, srgb("fff1dc"), 6, rot=(50, 8, 35), name="key")
    add_light("SUN", (0, 0, 10), 0.8, srgb("c9dcff"), 20, rot=(60, 0, 200), shadow=False, name="fill")
    ground = bpy.data.objects.get("thumb_ground")
    if not ground:
        me = bpy.data.meshes.new("thumb_ground")
        bm = bmesh.new()
        bmesh.ops.create_grid(bm, x_segments=1, y_segments=1, size=200)
        bm.to_mesh(me)
        bm.free()
        gm = bpy.data.materials.new("thumb_ground")
        gm.use_nodes = True
        gm.node_tree.nodes["Principled BSDF"].inputs["Base Color"].default_value = (*srgb("a8a39b"), 1)
        gm.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 1.0
        me.materials.append(gm)
        ground = bpy.data.objects.new("thumb_ground", me)
        scene.collection.objects.link(ground)
    ground.hide_render = False
    cam = bpy.data.objects.get("thumb_cam") or bpy.data.objects.new("thumb_cam", bpy.data.cameras.new("thumb_cam"))
    if cam.name not in scene.collection.objects:
        scene.collection.objects.link(cam)
    cam.data.type = "ORTHO"
    cam.data.clip_end = 500
    scene.camera = cam
    scene.render.resolution_x = scene.render.resolution_y = 640
    scene.render.film_transparent = False
    dirv = Vector((0.75, -1.25, 0.95)).normalized()
    only = [a for a in ARGS if not a.startswith(("--", "shot="))]   # optional piece names: render only those
    for ob in [o for o in objs if not only or o.name in only]:
        for o in objs:
            o.hide_render = o is not ob
        bb = [ob.matrix_world @ Vector(v) for v in ob.bound_box]
        center = sum(bb, Vector()) / 8
        below = ob.name.startswith("mine_ceiling")  # look at the rocky underside
        ground.hide_render = below
        ground.location = (ob.location.x, ob.location.y, min(v.z for v in bb) - 0.005)
        d = Vector((dirv.x, dirv.y, -dirv.z * 0.8)) if below else dirv
        look_at(cam, center + d * 40, center)
        bpy.context.view_layer.update()
        inv = cam.matrix_world.inverted()
        loc = [inv @ v for v in bb]
        xs, ys = [v.x for v in loc], [v.y for v in loc]
        w, h = max(xs) - min(xs), max(ys) - min(ys)
        shift = cam.matrix_world.to_3x3() @ Vector(((max(xs) + min(xs)) / 2, (max(ys) + min(ys)) / 2, 0))
        cam.location = cam.location + shift
        cam.data.ortho_scale = max(w, h) * 1.18
        scene.render.filepath = os.path.join(out, ob.name + ".png")
        bpy.ops.render.render(write_still=True)
    for o in objs:
        o.hide_render = False
    ground.hide_render = True


def render_shots(scene, colls_on, colls_off, lights, cams, shots, prefix):
    for c in colls_off:
        c.hide_render = True
    for c in colls_on:
        c.hide_render = False
    out = os.path.join(ROOT, "renders")
    clear_lights()
    for i, l in enumerate(lights):
        watts, col = LIGHT_STYLE[l["kind"]]
        add_light("POINT", l["pos"], watts * l.get("mult", 1.0), srgb(col), 0.15, name=f"lamp{i}")
    cam = bpy.data.objects.get("beauty_cam") or bpy.data.objects.new("beauty_cam", bpy.data.cameras.new("beauty_cam"))
    if cam.name not in scene.collection.objects:
        scene.collection.objects.link(cam)
    cam.data.type = "PERSP"
    cam.data.clip_end = 500
    scene.camera = cam
    scene.render.resolution_x, scene.render.resolution_y = 1920, 1080
    moon = None
    for name, ceiling_coll, moon_strength in shots:
        c = cams[name]
        cam.data.lens = c["lens"]
        look_at(cam, c["pos"], c["target"])
        for cc in ceiling_coll[1]:
            cc.hide_render = not ceiling_coll[0]
        if moon:
            bpy.data.objects.remove(moon)
            moon = None
        if moon_strength:
            moon = add_light("SUN", (0, 0, 30), moon_strength, srgb("c4d2f0"), 8, rot=(30, 0, 25), name="moon")
            world(scene, srgb("1c2230"), 0.7)
        else:
            moon = add_light("POINT", c["pos"], 50, srgb("b8c8ff"), 0.5, shadow=False, name="fill")
            world(scene, srgb("0c0e14"), 0.25)
        scene.render.filepath = os.path.join(out, f"{prefix}{name}.png")
        bpy.ops.render.render(write_still=True)


# --------------------------------------------------------------------------- bundle preview
# A small scene that joins this kit to the Cryptstone Dungeon Kit (v1.0.0 GLBs, read from
# _cryptstone_ref/): a rail tunnel opens into a dungeon hall. Only used for a sales render.
CRYPT = os.path.join(ROOT, "_cryptstone_ref")
MIX_X = 80.0


def import_cryptstone(names):
    out = {}
    for n in names:
        before = set(bpy.data.objects)
        bpy.ops.import_scene.gltf(filepath=os.path.join(CRYPT, "cryptstone_dungeon_kit", "glb", n + ".glb"))
        new = [o for o in bpy.data.objects if o not in before]
        ob = [o for o in new if o.type == "MESH"][0]
        for slot in ob.material_slots:  # same name = same material: use ours, proves the palette matches
            base = slot.material.name.split(".")[0]
            if base.startswith("dk_") and base[3:] in MATS:
                slot.material = MATS[base[3:]]
        out[n] = ob.data
        for o in new:
            bpy.data.objects.remove(o)
    return out


def bundle_scene(scene, meta):
    if not os.path.isdir(CRYPT):
        return None
    cmeta = json.load(open(os.path.join(CRYPT, "pieces.json"), encoding="utf-8"))
    need = ["dungeon_floor", "dungeon_floor_cracked", "dungeon_wall", "dungeon_wall_torch", "dungeon_wall_corner",
            "dungeon_pillar_round", "dungeon_chest_open", "dungeon_chest", "dungeon_coin_pile", "dungeon_banner",
            "dungeon_barrel", "dungeon_brazier", "dungeon_crate", "dungeon_ceiling"]
    meshes = import_cryptstone(need)
    coll = bpy.data.collections.new("Bundle_preview")
    ceil = bpy.data.collections.new("Bundle_ceiling")
    scene.collection.children.link(coll)
    coll.children.link(ceil)
    items = []

    def add(piece, x, y, z=0.0, rot=0.0, c=None):
        items.append((piece, x, y, z, rot, c))

    # mine: two tunnel cells (0,0), (1,0); dungeon hall: cells 2..3 x -1..1
    for i in (0, 1):
        add("mine_floor_rails", i * 4, 0, rot=90)
        add("mine_ceiling", i * 4, 0, 4, c=ceil)
        for d, (mx, my) in (("N", (i * 4, 2)), ("S", (i * 4, -2))):
            add("mine_wall_timbered" if i == 1 or d == "N" else "mine_wall", mx, my, rot=WALL_ROT[d])
        add("mine_support_frame", i * 4, 0, rot=90)
    add("mine_wall", -2, 0, rot=WALL_ROT["W"])
    add("mine_lantern_hanging", 4, 1.2, 2.65)
    add("mine_cart_ore", 1.5, 0, RAIL_TOP, rot=90)
    for x in (-2, 2):
        for y in (-2, 2):
            add("mine_wall_corner", x, y)
    add("mine_wall_entrance", 6, 0, rot=WALL_ROT["E"])
    add("mine_floor_rails_end", 8, 0, rot=-90)
    for i in (2, 3):
        for j in (-1, 0, 1):
            if (i, j) != (2, 0):
                add("dungeon_floor_cracked" if (i + j) % 3 == 0 else "dungeon_floor", i * 4, j * 4)
            add("dungeon_ceiling", i * 4, j * 4, 4, c=ceil)
    for j in (-1, 1):
        add("dungeon_wall_torch" if j == 1 else "dungeon_wall", 6, j * 4, rot=WALL_ROT["W"])
    for j in (-1, 0, 1):
        add("dungeon_wall_torch" if j == 0 else "dungeon_wall", 14, j * 4, rot=WALL_ROT["E"])
    for i in (2, 3):
        add("dungeon_wall", i * 4, 6, rot=WALL_ROT["N"])
        add("dungeon_wall_torch" if i == 3 else "dungeon_wall", i * 4, -6, rot=WALL_ROT["S"])
    add("dungeon_banner", 8, 6, rot=WALL_ROT["N"])
    for x in (6, 10, 14):
        for y in (-6, -2, 2, 6):
            if x == 6 and y in (-2, 2):
                continue
            add("dungeon_wall_corner", x, y)
    add("dungeon_pillar_round", 10, -2)
    add("dungeon_pillar_round", 10, 2)
    add("dungeon_brazier", 11.6, -4.3)
    add("mine_lantern_wall", 0, 2, rot=WALL_ROT["N"])
    add("dungeon_chest_open", 12.6, 4.9, rot=180)
    add("dungeon_chest", 10.6, 5.0, rot=180)
    add("dungeon_coin_pile", 11.6, 3.6)
    add("dungeon_barrel", 7.2, -5.0)
    add("dungeon_crate", 8.2, -5.1, rot=10)
    lights = []
    for piece, x, y, z, rot, c in items:
        data = meshes[piece] if piece.startswith("dungeon_") else bpy.data.objects[piece].data
        o = bpy.data.objects.new(piece + "_mix", data)
        (c or coll).objects.link(o)
        o.location = (MIX_X + x, y, z)
        o.rotation_euler = (0, 0, math.radians(rot))
        src = cmeta if piece.startswith("dungeon_") else meta
        m = Matrix.Translation(o.location) @ Matrix.Rotation(math.radians(rot), 4, "Z")
        for l in src[piece]["lights"]:
            w = m @ Vector(l[:3])
            kind = l[4] if len(l) > 4 else "fire"
            lights.append({"pos": list(w), "kind": kind, "mult": 2.6 if piece == "dungeon_brazier" else 1.0})
    cams = {"bundle": {"pos": [MIX_X + 13.4, 0.9, 2.0], "target": [MIX_X + 1.0, -0.3, 1.2], "lens": 22},
            "bundle_top": {"pos": [MIX_X + 15.5, -13.0, 15.0], "target": [MIX_X + 6.5, 0.0, 0.0], "lens": 30}}
    return coll, ceil, lights, cams


# --------------------------------------------------------------------------- main
def main():
    for sub in ("exports/glb", "exports/glb_godot", "exports/fbx", "renders/thumbs"):
        os.makedirs(os.path.join(ROOT, sub), exist_ok=True)
    bpy.ops.wm.read_factory_settings(use_empty=True)
    scene = bpy.context.scene
    scene.unit_settings.system = "METRIC"
    set_engine(scene)
    make_materials()
    kit = bpy.data.collections.new("Kit")
    demo = bpy.data.collections.new("Demo")
    ceil = bpy.data.collections.new("Demo_ceiling")
    scene.collection.children.link(kit)
    scene.collection.children.link(demo)
    demo.children.link(ceil)

    meta, objs = {}, []
    ncol = 8
    for idx, (name, cat, desc, fn) in enumerate(PIECES):
        ob, cols, info = build_piece(name, fn, kit)
        export_piece(ob, cols)
        ob.location = ((idx % ncol) * 6.0, -40.0 - (idx // ncol) * 7.0, 0)
        meta[name] = {"category": cat, "description": desc, **info}
        objs.append(ob)
        print(f"[kit] {name:28s} {info['tris']:6d} tris  {info['size_m']}")
    layout = demo_layout(meta)
    for it in layout["items"]:
        src = bpy.data.objects[it["piece"]]
        o = bpy.data.objects.new(it["piece"] + "_inst", src.data)
        (ceil if it["tag"] == "ceiling" else demo).objects.link(o)
        o.matrix_world = item_matrix(it)
    with open(os.path.join(ROOT, "exports", "pieces.json"), "w", encoding="utf-8") as f:
        json.dump(meta, f, indent=1)
    with open(os.path.join(ROOT, "exports", "layout.json"), "w", encoding="utf-8") as f:
        json.dump(layout, f, indent=1)
    kitinfo = {"name": "Deepvein Mine Kit", "prefix": "mine_", "demo_scene": "demo_mine", "movers": {
        k: {"motion": v[0], "axis_godot": [v[1][0], v[1][2], -v[1][1]], "amount": v[2], "rest_rot_x": v[3],
            "duration": v[4]} for k, v in MOVERS.items()}, "godot_lights": GODOT_LIGHTS, "depth": 1.6,
        "floor_top": 0.2, "environment": "night"}
    with open(os.path.join(ROOT, "exports", "kit.json"), "w", encoding="utf-8") as f:
        json.dump(kitinfo, f, indent=1)
    bundle = bundle_scene(scene, meta)
    bpy.ops.wm.save_as_mainfile(filepath=os.path.join(ROOT, "deepvein_mine_kit.blend"))
    if "--no-render" not in ARGS:
        others = [demo] + ([bundle[0]] if bundle else [])
        if "--beauty-only" not in ARGS:
            render_thumbs(scene, objs, kit, others)
        if "--thumbs-only" not in ARGS:
            off = [kit] + ([bundle[0]] if bundle else [])
            render_shots(scene, [demo], off, layout["lights"], layout["cameras"],
                         [s for s in [("overview", (False, [ceil]), 1.6), ("yard_top", (False, [ceil]), 1.6),
                          ("yard", (True, [ceil]), 0.0), ("drift", (True, [ceil]), 0.0),
                          ("ore", (True, [ceil]), 0.0), ("grotto", (True, [ceil]), 0.0),
                          ("works_top", (False, [ceil]), 1.6), ("works", (True, [ceil]), 0.0),
                          ("works_track", (True, [ceil]), 0.0), ("deep", (True, [ceil]), 0.0)] if SHOT in (None, s[0])], "beauty_")
            if bundle and SHOT in (None, "bundle"):
                coll, bceil, blights, bcams = bundle
                render_shots(scene, [coll], [kit, demo], blights, bcams,
                             [("bundle", (True, [bceil]), 0.0), ("bundle_top", (False, [bceil]), 1.6)], "beauty_")
    print("[kit] done:", len(PIECES), "pieces")


main()
