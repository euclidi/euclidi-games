"""Original Creatture instrument art. Run with Blender 4.x, not system Python.
Outputs: transparent 192px element objects and 1024x512 panoramic habitat plates.
These are authored parametric first-pass assets, not a finished production sculpt library.
"""
import bpy, math, os, random
from mathutils import Vector
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'public'/'rendered'
OUT.mkdir(parents=True,exist_ok=True)
TAU=math.tau

def reset():
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.object.delete(use_global=False)
    for m in list(bpy.data.materials):
        if m.users==0: bpy.data.materials.remove(m)
    scene=bpy.context.scene
    scene.render.engine='CYCLES'
    scene.cycles.samples=20
    scene.cycles.use_denoising=True
    scene.render.image_settings.file_format='PNG'
    scene.render.image_settings.color_mode='RGBA'
    scene.render.resolution_percentage=100
    scene.view_settings.view_transform='Standard'
    scene.view_settings.exposure=0
    scene.view_settings.gamma=1
    scene.world.use_nodes=True
    bg=scene.world.node_tree.nodes.get('Background')
    bg.inputs['Color'].default_value=(0.16,0.20,0.17,1)
    bg.inputs['Strength'].default_value=0.42
    return scene

def mat(name,color,rough=.45,metal=0.,coat=0.,trans=0.):
    m=bpy.data.materials.new(name);m.use_nodes=True
    b=m.node_tree.nodes.get('Principled BSDF')
    for k,v in [('Base Color',(*color,1)),('Roughness',rough),('Metallic',metal),('Coat Weight',coat),('Transmission Weight',trans)]:
        if k in b.inputs:b.inputs[k].default_value=v
    m.diffuse_color=(*color,1)
    return m

def mesh(name,verts,faces,material,smooth=True):
    me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update()
    ob=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(ob);ob.data.materials.append(material)
    for f in me.polygons:f.use_smooth=smooth
    return ob

def lathe(name,profile,material,n=64,ripple=0.,lobes=5):
    vs=[];fs=[]
    for j,(z,r) in enumerate(profile):
        for i in range(n):
            a=TAU*i/n;rr=max(.001,r)*(1+ripple*math.sin(lobes*a+j*.25))
            vs.append((rr*math.cos(a),rr*math.sin(a),z))
    for j in range(len(profile)-1):
        for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    fs+=[tuple(reversed(range(n))),tuple((len(profile)-1)*n+i for i in range(n))]
    return mesh(name,vs,fs,material)

def tube(name,points,radius,material):
    cu=bpy.data.curves.new(name,'CURVE');cu.dimensions='3D';cu.resolution_u=12;cu.bevel_depth=radius;cu.bevel_resolution=4
    sp=cu.splines.new('POLY');sp.points.add(len(points)-1)
    for p,v in zip(sp.points,points):p.co=(*v,1)
    ob=bpy.data.objects.new(name,cu);bpy.context.collection.objects.link(ob);ob.data.materials.append(material)
    return ob

def crystal(name,center,r,h,material,n=6,phase=0.):
    x,y,z=center;vs=[]
    for level,radius in [(0,r*.8),(.17,r),(.72,r*.78)]:
        for i in range(n):
            a=TAU*i/n+phase;vs.append((x+radius*math.cos(a),y+radius*math.sin(a),z+h*level))
    vs.append((x+r*.13,y-r*.15,z+h))
    fs=[tuple(reversed(range(n)))]
    for j in range(2):
        for i in range(n):fs.append((j*n+i,j*n+(i+1)%n,(j+1)*n+(i+1)%n,(j+1)*n+i))
    for i in range(n):fs.append((2*n+i,2*n+(i+1)%n,3*n))
    return mesh(name,vs,fs,material,False)

def look(ob,target):ob.rotation_euler=(Vector(target)-ob.location).to_track_quat('-Z','Y').to_euler()
def area(name,loc,power,color,size,target=(0,0,.55)):
    d=bpy.data.lights.new(name,'AREA');d.energy=power;d.color=color;d.shape='DISK';d.size=size
    ob=bpy.data.objects.new(name,d);bpy.context.collection.objects.link(ob);ob.location=loc;look(ob,target)
def camera(scene,loc,target,ortho=2.45):
    d=bpy.data.cameras.new('Composition');d.type='ORTHO';d.ortho_scale=ortho
    ob=bpy.data.objects.new('Composition',d);bpy.context.collection.objects.link(ob);ob.location=loc;look(ob,target);scene.camera=ob;return ob

def icon(i):
    sc=reset()
    colors=[(.43,.58,.32),(.71,.43,.13),(.09,.37,.56),(.81,.64,.20),(.37,.52,.51),(.56,.22,.16),(.67,.52,.28),(.35,.49,.17),(.55,.38,.61),(.75,.22,.08),(.12,.54,.44),(.42,.39,.65)]
    c=colors[i];m=mat('primary',c,.36,0.,.26,.12 if i in [0,2,10] else 0.)
    dark=mat('secondary',tuple(v*.40 for v in c),.54,.12)
    pale=mat('highlight',tuple(min(1,v*1.4+.08) for v in c),.3,0.,.22)
    if i==0:
        lathe('folded membrane',[(-.46,.08),(-.36,.34),(-.15,.57),(.13,.66),(.36,.53),(.48,.21),(.50,.015)],m,ripple=.12,lobes=7)
        for k in range(7):
            a=TAU*k/7;pts=[((.14+.41*math.sin(t*math.pi))*math.cos(a+.2*t),(.14+.41*math.sin(t*math.pi))*math.sin(a+.2*t),-.35+.77*t) for t in [j/32 for j in range(33)]]
            tube('tissue fold',pts,.023,pale)
    elif i==1:
        for k,(x,y,z,s) in enumerate([(-.24,0,.0,.55),(.28,.04,.04,.52),(0,.21,.39,.43)]):
            o=lathe('nutrient grain',[(-.40,.02),(-.3,.29),(0,.41),(.31,.29),(.43,.02)],m if k!=2 else pale,ripple=.035,lobes=4);o.location=(x,y,z);o.scale=(s,s,s*1.32)
    elif i==2:
        lathe('water drop',[(-.56,.05),(-.48,.32),(-.25,.53),(.03,.51),(.29,.37),(.53,.22),(.78,.02)],m,n=96)
        tube('surface sheen',[(.33*math.cos(a),-.37,.05+.28*math.sin(a)) for a in [j*.065 for j in range(32)]],.019,pale)
    elif i==3:
        crystal('central light prism',(0,0,-.52),.36,1.25,m,8,.2)
        for k in range(6):
            a=TAU*k/6;crystal('collector',(.45*math.cos(a),.45*math.sin(a),-.40),.13,.58,pale,5,a)
    elif i==4:
        for k,(x,y,z,r,h) in enumerate([(-.28,.1,-.54,.34,.89),(.1,.05,-.56,.42,1.23),(.38,-.22,-.5,.23,.72),(-.1,-.36,-.52,.20,.58)]):crystal('mineral lattice',(x,y,z),r,h,m if k%2==0 else pale,5+k%2,k)
    elif i==5:
        lathe('contractile tissue',[(-.55,.10),(-.40,.31),(0,.49),(.39,.31),(.56,.08)],dark,ripple=.05)
        for k in range(14):
            a=TAU*k/14;pts=[]
            for j in range(48):
                t=j/47;z=-.54+1.08*t;r=.10+.39*math.sin(math.pi*t)**.85;aa=a+.65*math.sin(t*math.pi)
                pts.append((r*math.cos(aa),r*math.sin(aa),z))
            tube('muscle fiber',pts,.046,m if k%3 else pale)
    elif i==6:
        o=lathe('ganglion',[(-.25,.015),(-.19,.25),(0,.33),(.19,.25),(.25,.015)],m)
        for k in range(7):
            a=TAU*k/7
            for side in [-1,1]:
                pts=[]
                for j in range(30):
                    t=j/29;aa=a+side*.38*t;rad=.19+.54*t
                    pts.append((rad*math.cos(aa),rad*math.sin(aa),.08+.25*math.sin(t*math.pi)+side*.13*t))
                tube('nerve',pts,.025 if side>0 else .018,pale)
    elif i==7:
        for k in range(5):
            a=TAU*k/5;o=lathe('microbial capsule',[(-.24,.02),(-.18,.17),(0,.19),(.18,.17),(.24,.02)],m,ripple=.04,lobes=4);o.location=(.34*math.cos(a),.34*math.sin(a),.04*math.sin(2*a));o.rotation_euler=(a*.2,.7,a)
            for j in range(3):tube('flagellum',[(o.location.x+.05*t,o.location.y+.19*t*math.sin(j*2+t*5),o.location.z-.18-.29*t) for t in [q/20 for q in range(21)]],.012,pale)
    elif i==8:
        for k in range(7):
            a=TAU*k/7;h=.28+.34*((k*3)%7)/6;rad=.12+.28*(k>0);x=rad*math.cos(a);y=rad*math.sin(a)
            tube('stalk',[(x*t,y*t,-.47+(h+.47)*t) for t in [q/16 for q in range(17)]],.033,dark)
            o=lathe('spore pod',[(-.10,.02),(-.08,.15),(.02,.20),(.16,.17),(.24,.02)],m,ripple=.06,lobes=6);o.location=(x,y,h)
    elif i==9:
        core=lathe('thermal ceramic',[(-.55,.11),(-.4,.26),(.35,.26),(.56,.10)],dark)
        tube('heating filament',[(.35*math.cos(t*TAU*4),.35*math.sin(t*TAU*4),-.45+.90*t) for t in [q/180 for q in range(181)]],.075,m)
    elif i==10:
        lathe('catalytic vessel',[(-.55,.17),(-.45,.41),(-.21,.46),(.18,.40),(.34,.19),(.55,.15),(.62,.20),(.67,.18)],m,n=80)
        tube('neck band',[(.177*math.cos(a),.177*math.sin(a),.51) for a in [TAU*q/64 for q in range(65)]],.026,pale)
    else:
        for k in range(3):
            radius=.22+.17*k
            pts=[(radius*math.cos(a),.045*math.sin(a*2+k),radius*math.sin(a)) for a in [TAU*q/96 for q in range(97)]]
            tube('resonator ring',pts,.045,m if k%2==0 else pale)
        lathe('signal core',[(-.13,.01),(-.08,.09),(.08,.09),(.13,.01)],pale)
    area('Warm key',(-3,-4,5),430,(1,.86,.65),3)
    area('Cool fill',(4,-1,3),190,(.65,.81,1),3)
    area('Rim',(0,3,4),320,(1,.96,.84),2)
    camera(sc,(3.0,-5.0,2.8),(0,0,.04),2.2)
    sc.render.film_transparent=True;sc.render.resolution_x=192;sc.render.resolution_y=192
    sc.render.filepath=str(OUT/f'element-{i:02d}.png')
    bpy.ops.render.render(write_still=True)

def panorama(i):
    sc=reset();rng=random.Random(773+i)
    palettes=[((.11,.18,.10),(.37,.39,.23)),((.025,.07,.14),(.11,.25,.37)),((.12,.075,.045),(.35,.20,.13)),((.09,.12,.21),(.32,.37,.53)),((.12,.12,.10),(.37,.31,.22)),((.10,.16,.12),(.30,.39,.22))]
    dark,accent=palettes[i];sc.world.node_tree.nodes.get('Background').inputs['Color'].default_value=(*dark,1)
    soil=mat('far terrain',dark,.9);ridge=mat('formations',accent,.75,.18 if i in [3,4] else 0.)
    bpy.ops.mesh.primitive_plane_add(size=100,location=(0,0,-3))
    bpy.context.object.data.materials.append(soil)
    for j in range(38):
        a=TAU*j/38+rng.uniform(-.04,.04);r=rng.uniform(13,23);x=r*math.cos(a);y=r*math.sin(a);h=rng.uniform(2.6,7.5)
        if i==3:crystal('far mineral', (x,y,-3),rng.uniform(.9,2.2),h,ridge,6,a)
        elif i==4:
            o=lathe('distant apparatus',[(-3,1.0),(-2.8,1.4),(-2.2,1.0),(h-3,.75),(h-2.8,1.1),(h-2.5,.8)],ridge,n=24);o.location=(x,y,0)
        elif i==2:
            tube('distant stalk',[(x+.3*math.sin(t*3+a),y,-3+h*t) for t in [q/20 for q in range(21)]],.30,ridge)
            o=lathe('canopy',[(-.3,.1),(0,1.3),(.42,1.6),(.8,.8),(.86,.02)],ridge,n=32,ripple=.07,lobes=6);o.location=(x,y,h-3)
        else:
            o=lathe('weathered mound',[(-3,.4),(-2.5,1.8),(-.8,1.5),(h-3,.6),(h-2.7,.02)],ridge,n=32,ripple=.20,lobes=5);o.location=(x,y,0);o.rotation_euler.z=a
    area('broad light',(-8,-12,15),3500,(.88,.92,1),9,(0,0,0))
    area('far warmth',(12,8,9),2300,(1,.79,.55),8,(0,0,0))
    ob=camera(sc,(0,0,1.3),(0,-1,1.3));ob.data.type='PANO'
    if hasattr(ob.data,'panorama_type'):ob.data.panorama_type='EQUIRECTANGULAR'
    elif hasattr(ob.data,'cycles'):ob.data.cycles.panorama_type='EQUIRECTANGULAR'
    sc.render.film_transparent=False;sc.render.resolution_x=1024;sc.render.resolution_y=512;sc.cycles.samples=12
    sc.render.image_settings.color_mode='RGB';sc.render.filepath=str(OUT/f'habitat-{i}.png')
    bpy.ops.render.render(write_still=True)

for i in range(12):icon(i)
for i in range(6):panorama(i)
print('CREATTURE_ART_COMPLETE',len(list(OUT.glob('*.png'))))
