# Rig a batch of raw Meshy chibi meshes into game-ready kawaii character GLBs.
# Run headless:
#
#   blender --background --python scripts/rig_kawaii_char.py -- jobs.json
#
# jobs.json is [{"in": "<raw_mesh.glb>", "out": "<rigged.glb>"}, ...]. For each
# mesh this: removes the Meshy display pedestal (a wide base slab whose
# min(width,depth) collapses at the leg-neck above it), welds + recomputes
# normals, decimates to ~14k tris, aligns it to the shared warrior skeleton
# (Z-up, feet grounded, same height, centered), and auto-weights it to that
# skeleton so every class/NPC body reuses the warrior walk/attack clip donors by
# bone name plus the base GLB's bind-pose breathing idle. Post-compress each
# output with scripts/compress_kawaii_char.mjs (webp + meshopt). The skeleton +
# idle come from the committed warrior.glb (any prior kawaii body works - they
# all carry the same 24-bone rig).
import bpy, sys, os, mathutils, bmesh, json, traceback

argv = sys.argv[sys.argv.index('--')+1:]
JOBS = json.load(open(argv[0]))
REPO = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
WARRIOR = os.path.join(REPO, 'public/models/kawaii/warrior.glb')
TARGET_TRIS = 14000

def imp(path):
    before = set(bpy.data.objects)
    bpy.ops.import_scene.gltf(filepath=path)
    return [o for o in bpy.data.objects if o not in before]

def process(mesh_in, out):
    # Fully clear the scene AND purge orphaned mesh/texture datablocks; without
    # the purge, the previous job's data can survive read_factory_settings and,
    # because Meshy meshes all share the name "Mesh_0", collide with this job's
    # import. Identify objects from each import's OWN return, never a global
    # bpy.data.objects scan, so a stray leftover can never be picked up.
    bpy.ops.wm.read_factory_settings(use_empty=True)
    bpy.ops.outliner.orphans_purge(do_local_ids=True, do_linked_ids=True, do_recursive=True)
    warr = imp(WARRIOR)
    arm = next(o for o in warr if o.type == 'ARMATURE')
    # The glTF import can add stray helper meshes (e.g. a tiny bone-display
    # Icosphere) alongside the body mesh; take the LARGEST as the alignment
    # reference and remove EVERY donor mesh, or a leftover exports on top of the
    # rigged job body.
    wmeshes = [o for o in warr if o.type == 'MESH']
    wmesh = max(wmeshes, key=lambda o: len(o.data.vertices))
    wbb = [wmesh.matrix_world @ mathutils.Vector(c) for c in wmesh.bound_box]
    wzmin = min(p.z for p in wbb); wzmax = max(p.z for p in wbb)
    wxmid = (min(p.x for p in wbb)+max(p.x for p in wbb))/2
    wymid = (min(p.y for p in wbb)+max(p.y for p in wbb))/2
    wheight = wzmax - wzmin
    for o in wmeshes:
        bpy.data.objects.remove(o, do_unlink=True)

    new = imp(mesh_in)
    mesh = next(o for o in new if o.type == 'MESH')
    extra = [o for o in new if o.type == 'MESH' and o is not mesh]
    if extra:
        bpy.ops.object.select_all(action='DESELECT')
        for o in extra: o.select_set(True)
        mesh.select_set(True); bpy.context.view_layer.objects.active = mesh
        bpy.ops.object.join()

    # Pedestal removal: the display base is a wide horizontal slab at the very
    # bottom; scanning up from it, the character's legs/feet form a "neck" where
    # the horizontal cross-section shrinks. No single width measure catches every
    # body, so we try two signals and take whichever fires:
    #   - min(width,depth) local minimum: the legs are narrow in DEPTH even under
    #     a wide cape, so the horizontal minimum dips at the leg-neck.
    #   - max(width,depth) collapse: a robe keeps depth wide but the whole
    #     cross-section still drops below the base disc above the feet.
    # A bare figure with no base slab (base extent too small) is left uncut.
    mw = mesh.matrix_world
    vs = [mw @ v.co for v in mesh.data.vertices]
    zs = [v.z for v in vs]; zmin, zmax = min(zs), max(zs); H = zmax-zmin
    N = 30; ext = [[1e9,-1e9,1e9,-1e9,0] for _ in range(N)]  # xmin,xmax,ymin,ymax,count
    for v in vs:
        i = min(N-1, int((v.z-zmin)/H*N)); e = ext[i]
        e[0]=min(e[0],v.x); e[1]=max(e[1],v.x); e[2]=min(e[2],v.y); e[3]=max(e[3],v.y); e[4]+=1
    dmin = [min(e[1]-e[0], e[3]-e[2]) if e[4] else 0 for e in ext]
    dmax = [max(e[1]-e[0], e[3]-e[2]) if e[4] else 0 for e in ext]
    lim = 0
    while lim < N and (zmin+(lim+1)/N*H - zmin)/H <= 0.30:
        lim += 1
    cut_z = None
    if max(dmin[:3]) > 0.6:  # a real base slab, not just narrow feet
        base_min = max(dmin[:3]); base_max = max(dmax[:3])
        for i in range(1, lim):
            local_min = dmin[i] <= dmin[i-1] and dmin[i] <= dmin[i+1] and 0 < dmin[i] < 0.88*base_min
            collapse = 0 < dmax[i] < 0.78*base_max
            if local_min or collapse:
                cut_z = zmin + i/N*H
                break
    if cut_z is not None:
        bm = bmesh.new(); bm.from_mesh(mesh.data)
        doomed = [v for v in bm.verts if (mw @ v.co).z < cut_z]
        bmesh.ops.delete(bm, geom=doomed, context='VERTS')
        bm.to_mesh(mesh.data); bm.free()

    bpy.context.view_layer.objects.active = mesh
    bpy.ops.object.select_all(action='DESELECT'); mesh.select_set(True)
    bpy.ops.object.mode_set(mode='EDIT')
    bpy.ops.mesh.select_all(action='SELECT')
    bpy.ops.mesh.remove_doubles(threshold=0.0001)
    # Degenerate faces (zero-area slivers from the Meshy soup + decimate) make
    # Blender's bone-heat auto-weighting fail silently, exporting an unskinned
    # mesh. Dissolving them first keeps the auto-weight solver stable.
    bpy.ops.mesh.dissolve_degenerate()
    bpy.ops.mesh.delete_loose()
    bpy.ops.mesh.normals_make_consistent(inside=False)
    bpy.ops.object.mode_set(mode='OBJECT')
    ntris = sum(len(p.vertices)-2 for p in mesh.data.polygons)
    if ntris > TARGET_TRIS:
        m = mesh.modifiers.new('dec','DECIMATE'); m.ratio = TARGET_TRIS/ntris
        bpy.ops.object.modifier_apply(modifier='dec')

    bpy.context.view_layer.update()
    def bb(): return [mesh.matrix_world @ mathutils.Vector(c) for c in mesh.bound_box]
    b = bb(); s = wheight/(max(p.z for p in b)-min(p.z for p in b))
    mesh.scale = (s,s,s); bpy.context.view_layer.update(); bpy.ops.object.transform_apply(scale=True)
    b = bb()
    mesh.location.x += wxmid-(min(p.x for p in b)+max(p.x for p in b))/2
    mesh.location.y += wymid-(min(p.y for p in b)+max(p.y for p in b))/2
    mesh.location.z += wzmin-min(p.z for p in b)
    bpy.context.view_layer.update(); bpy.ops.object.transform_apply(location=True, scale=True, rotation=True)

    bpy.ops.object.select_all(action='DESELECT')
    mesh.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
    bpy.ops.object.parent_set(type='ARMATURE_AUTO')
    # Verify the auto-weight actually bound the mesh; bone-heat fails silently on
    # some decimated soup meshes, leaving no vertex groups (a static, unskinned
    # export). Fall back to envelope weights, then to a rigid nearest-bone bind,
    # which is crude but always produces a usable, animating skin.
    if not any(vg.name in {b.name for b in arm.data.bones} for vg in mesh.vertex_groups):
        bpy.ops.object.select_all(action='DESELECT')
        mesh.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
        bpy.ops.object.parent_set(type='ARMATURE_ENVELOPE')
    bound = {b.name for b in arm.data.bones}
    weighted = any(
        any(g.group is not None for g in v.groups) for v in mesh.data.vertices
    ) and any(vg.name in bound for vg in mesh.vertex_groups)
    if not weighted:
        # Rigid fallback: parent_set(ARMATURE_NAME) establishes the proper skin
        # binding (parent + Armature modifier + an empty deform group per bone)
        # WITHOUT weighting; we then weight every vertex fully to its nearest bone
        # head. Crude (blocky joints) but exports a real, animating glTF skin.
        bpy.ops.object.select_all(action='DESELECT')
        mesh.select_set(True); arm.select_set(True); bpy.context.view_layer.objects.active = arm
        bpy.ops.object.parent_set(type='ARMATURE_NAME')
        heads = [(b.name, (arm.matrix_world @ b.head_local)) for b in arm.data.bones]
        groups = {name: (mesh.vertex_groups.get(name) or mesh.vertex_groups.new(name=name))
                  for name, _ in heads}
        mw = mesh.matrix_world
        for v in mesh.data.vertices:
            wco = mw @ v.co
            best = min(heads, key=lambda h: (h[1] - wco).length_squared)[0]
            groups[best].add([v.index], 1.0, 'REPLACE')
    skinned = any(m.type == 'ARMATURE' for m in mesh.modifiers)
    bpy.ops.object.select_all(action='SELECT')
    bpy.ops.export_scene.gltf(filepath=out, export_format='GLB', use_selection=True,
        export_apply=True, export_animations=True, export_skins=True, export_yup=True)
    return {'tris': sum(len(p.vertices)-2 for p in mesh.data.polygons),
            'pedestal': cut_z is not None, 'skinned': skinned}

results = {}
for job in JOBS:
    try:
        results[job['out']] = process(job['in'], job['out'])
        print("JOB_OK " + job['out'])
    except Exception as e:
        results[job['out']] = {'error': str(e)}
        print("JOB_FAIL " + job['out'] + " :: " + repr(e))
        traceback.print_exc()
print("BATCH_RESULT " + json.dumps(results))
