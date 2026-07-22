#!/usr/bin/env python3
"""
Retheme 7 additional OpenMMO humanoid GLBs into the Emberwood palette, to give
distinct visuals to Eastbrook NPCs that currently share a generic look
(the_merchant/trader_wilkes/fisherman_brandt/groundskeeper_bram all fall back
to the plain villager visual; apothecary_lin/card_master share the robed
villager visual; smith_haldren/foreman_odell share the smith visual).

Produces a 7-identity set of distinct rethemed NPC GLBs:
  valkyrie.glb        -> emberwood_provisioner.glb   (trader_wilkes)
  caveman.glb         -> emberwood_fisherman.glb     (fisherman_brandt)
  cavewoman.glb       -> emberwood_groundskeeper.glb (groundskeeper_bram)
  female_priest.glb   -> emberwood_herbalist.glb     (apothecary_lin)
  female_knight.glb   -> emberwood_dealer.glb        (card_master)
  female_barbarian.glb-> emberwood_armorer.glb       (smith_haldren)
  female_rogue.glb    -> emberwood_foreman.glb       (foreman_odell)

Source GLBs are staged raw pulls from github.com/Julian-adv/OpenMMO
(client/public/models/characters/), not yet used elsewhere in this project.
Keeps the OpenMMO Rig_Medium skeleton + all clips so the game's ClipMap
definitions (see src/render/characters/manifest.ts) keep working unchanged.

Run headless from the project root:
  blender --background --python scripts/retheme_openmmo_npc_variety.py
"""

import os
import bpy

PROJECT = "/Volumes/ExternalSSD/world-of-claudecraft-npc-diversity"
SRC_DIR = f"{PROJECT}/tmp/asset_src/openmmo_src"
OUT_DIR = f"{PROJECT}/tmp/asset_src/emberwood/npcs"
os.makedirs(OUT_DIR, exist_ok=True)

# Emberwood-palette retheme. Each identity gets a distinct palette, chosen to
# not collide with the 9 palettes already used in retheme_openmmo_npc.py
# (knight/paladin/mage/barbarian/rogue/ranger/priest/guard/npc_woman).
# (body_rgb, accent_rgb, trim_rgb, roughness, metalness)
PALETTES = {
    "provisioner": {
        "src": f"{SRC_DIR}/valkyrie.glb",
        "out": f"{OUT_DIR}/emberwood_provisioner.glb",
        "body":  (0.62, 0.52, 0.36),   # parchment tan trader garb
        "metal": (0.55, 0.45, 0.28),   # brass buckles
        "trim":  (0.72, 0.58, 0.32),   # warm oak highlight
        "roughness": 0.75,
        "metalness": 0.25,
    },
    "fisherman": {
        "src": f"{SRC_DIR}/caveman.glb",
        "out": f"{OUT_DIR}/emberwood_fisherman.glb",
        "body":  (0.30, 0.38, 0.42),   # weathered smoke-blue oilskin
        "metal": (0.42, 0.42, 0.40),   # dull pewter
        "trim":  (0.35, 0.55, 0.52),   # faded teal
        "roughness": 0.85,
        "metalness": 0.20,
    },
    "groundskeeper": {
        "src": f"{SRC_DIR}/cavewoman.glb",
        "out": f"{OUT_DIR}/emberwood_groundskeeper.glb",
        "body":  (0.24, 0.30, 0.20),   # muted moss green
        "metal": (0.35, 0.33, 0.30),   # dark iron
        "trim":  (0.40, 0.18, 0.16),   # oxblood accent
        "roughness": 0.80,
        "metalness": 0.25,
    },
    "herbalist": {
        "src": f"{SRC_DIR}/female_priest.glb",
        "out": f"{OUT_DIR}/emberwood_herbalist.glb",
        "body":  (0.32, 0.40, 0.26),   # sage-green robe
        "metal": (0.50, 0.48, 0.42),   # pewter
        "trim":  (0.70, 0.62, 0.45),   # parchment thread
        "roughness": 0.70,
        "metalness": 0.20,
    },
    "dealer": {
        "src": f"{SRC_DIR}/female_knight.glb",
        "out": f"{OUT_DIR}/emberwood_dealer.glb",
        "body":  (0.42, 0.12, 0.14),   # oxblood
        "metal": (0.75, 0.60, 0.30),   # brass
        "trim":  (0.90, 0.78, 0.40),   # gold
        "roughness": 0.45,
        "metalness": 0.60,
    },
    "armorer": {
        "src": f"{SRC_DIR}/female_barbarian.glb",
        "out": f"{OUT_DIR}/emberwood_armorer.glb",
        "body":  (0.18, 0.17, 0.16),   # soot-dark charcoal
        "metal": (0.45, 0.42, 0.40),   # raw iron
        "trim":  (0.85, 0.45, 0.15),   # ember-orange forge glow
        "roughness": 0.60,
        "metalness": 0.55,
    },
    "foreman": {
        "src": f"{SRC_DIR}/female_rogue.glb",
        "out": f"{OUT_DIR}/emberwood_foreman.glb",
        "body":  (0.38, 0.22, 0.16),   # rust/oxblood-brown dirt stain
        "metal": (0.38, 0.36, 0.34),   # dark iron
        "trim":  (0.60, 0.46, 0.26),   # brass
        "roughness": 0.80,
        "metalness": 0.30,
    },
}


def recolor_material(mat, body, metal, trim, rough, metalness):
    """Override a Principled BSDF material with the given palette."""
    if not mat or not mat.use_nodes:
        if mat:
            mat.use_nodes = True
        else:
            return
    nt = mat.node_tree
    bsdf = nt.nodes.get("Principled BSDF")
    if not bsdf:
        return
    # 3-slot tint: assign the dominant body color to Base Color, then bias the
    # bsdf toward the metal/trim feel via Roughness/Metallic.
    bsdf.inputs["Base Color"].default_value = (*body, 1.0)
    if "Roughness" in bsdf.inputs:
        bsdf.inputs["Roughness"].default_value = rough
    if "Metallic" in bsdf.inputs:
        bsdf.inputs["Metallic"].default_value = metalness


def retheme_class(spec):
    """Open, recolor, and re-export one identity."""
    bpy.ops.wm.read_factory_settings(use_empty=True)
    if not os.path.exists(spec["src"]):
        print(f"  SKIP (missing): {spec['src']}")
        return False
    bpy.ops.import_scene.gltf(filepath=spec["src"])
    body_rgb = spec["body"]
    metal_rgb = spec["metal"]
    trim_rgb = spec["trim"]
    # Recolor every material across all meshes. Each mesh may have 1-3 materials
    # (body, accessory, weapon). Cycle through the 3 palette slots so different
    # sub-meshes pick up different accents - keeps the retheme visually rich.
    palette_slots = [body_rgb, metal_rgb, trim_rgb]
    roughness = spec["roughness"]
    metalness = spec["metalness"]
    for obj in bpy.data.objects:
        if obj.type != "MESH":
            continue
        for i, mat in enumerate(obj.data.materials):
            if not mat:
                continue
            slot = palette_slots[i % 3]
            recolor_material(mat, slot, metal_rgb, trim_rgb, roughness, metalness)
    # Export GLB; keep armature + all actions.
    bpy.ops.export_scene.gltf(
        filepath=spec["out"],
        export_format="GLB",
        use_selection=False,
        export_animations=True,
        export_yup=True,
    )
    print(f"  EXPORTED {os.path.basename(spec['out'])}  ({os.path.getsize(spec['out'])} bytes)")
    return True


def main():
    print("=== Emberwood NPC variety retheme (7 identities) ===")
    for name, spec in PALETTES.items():
        print(f"-- {name}")
        retheme_class(spec)
    print("=== done ===")


if __name__ == "__main__":
    main()
