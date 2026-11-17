"""Ultimate Home Design Toolkit — Cycles (Blender) render köprüsü.

Motorun `export_cycles` komutuyla ürettiği sahne paketini (JSON) Blender'ın Cycles motoruyla
render eder ve PNG yazar. İki biçimde çalışır:

    blender -b --factory-startup -P uhd_cycles.py -- sahne.json cikti.png
    python uhd_cycles.py sahne.json cikti.png        (bpy paketi kuruluysa)

Ağ erişimi yoktur; yalnız verilen sahne dosyası okunur ve çıktı dosyası yazılır.
Koordinatlar paket içinde milimetre ve Y yukarıdır; Blender'a metre ve Z yukarı olarak aktarılır.
"""

import base64
import json
import math
import os
import struct
import sys
import tempfile
import zlib

import bpy

try:
    import numpy as np
except ImportError:  # Blender her zaman numpy ile gelir; güvenlik için
    np = None


def log(msg):
    print(f"[uhd-cycles] {msg}", flush=True)


# ---------------------------------------------------------------- yardımcılar
def to_bl(v):
    """(x, y, z) mm, Y yukarı → Blender metre, Z yukarı."""
    return (v[0] * 0.001, -v[2] * 0.001, v[1] * 0.001)


def dir_bl(v):
    return (v[0], -v[2], v[1])


def norm(v):
    length = math.sqrt(sum(c * c for c in v)) or 1.0
    return tuple(c / length for c in v)


def lum(c):
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]


def set_input(node, name, value):
    sock = node.inputs.get(name)
    if sock is not None:
        try:
            sock.default_value = value
        except (TypeError, ValueError):
            pass
    return sock


def write_png(path, rgb, w, h):
    """8 bit RGB PNG (numpy dizisi, satırlar yukarıdan aşağı)."""
    raw = b"".join(b"\x00" + rgb[y].tobytes() for y in range(h))

    def chunk(tag, data):
        c = struct.pack(">I", len(data)) + tag + data
        return c + struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)

    with open(path, "wb") as f:
        f.write(b"\x89PNG\r\n\x1a\n")
        f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 2, 0, 0, 0)))
        f.write(chunk(b"IDAT", zlib.compress(raw, 6)))
        f.write(chunk(b"IEND", b""))


# Desen türlerine göre kabartı gücü (dahili motordaki RELIEF ile aynı sıra ve anlam)
RELIEF = {"parke": 0.18, "ahsap": 0.12, "karo": 0.45, "mermer": 0.03, "beton": 0.3, "kumas": 0.25, "hali": 0.6, "cim": 0.6, "tas": 0.7, "image": 0.15}
POLISHED = {"parke", "ahsap", "mermer", "karo"}


# ---------------------------------------------------------------- sahne
def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)


def setup_render(pkg, out_w, out_h, samples):
    sc = bpy.context.scene
    sc.render.engine = "CYCLES"
    cy = sc.cycles
    # mümkünse ekran kartı (OptiX, CUDA, HIP, Metal, oneAPI), yoksa işlemci
    device = "CPU"
    try:
        prefs = bpy.context.preferences.addons["cycles"].preferences
        for kind in ("OPTIX", "CUDA", "HIP", "METAL", "ONEAPI"):
            try:
                prefs.compute_device_type = kind
                prefs.get_devices()
                devs = [d for d in prefs.devices if d.type == kind]
                if devs:
                    for d in prefs.devices:
                        d.use = d.type == kind
                    device = "GPU"
                    log(f"aygıt: {kind}")
                    break
            except TypeError:
                continue
    except Exception as e:  # tercih eklentisi bpy paketinde olmayabilir
        log(f"aygıt seçimi atlandı: {e}")
    cy.device = device
    cy.samples = samples
    cy.use_adaptive_sampling = True
    cy.adaptive_threshold = 0.008
    cy.use_denoising = True
    try:
        cy.denoiser = "OPENIMAGEDENOISE"
        cy.denoising_input_passes = "RGB_ALBEDO_NORMAL"
        cy.denoising_prefilter = "ACCURATE"
        cy.denoising_quality = "HIGH"
    except (TypeError, AttributeError):
        pass
    bounces = max(8, int(pkg.get("bounces", 8)))
    cy.max_bounces = bounces + 4
    cy.diffuse_bounces = bounces
    cy.glossy_bounces = max(4, bounces // 2)
    cy.transmission_bounces = 12
    cy.transparent_max_bounces = 32
    cy.volume_bounces = 0
    cy.sample_clamp_indirect = 8.0
    cy.blur_glossy = 0.6
    cy.caustics_reflective = False
    cy.caustics_refractive = True
    try:
        cy.use_light_tree = True
    except AttributeError:
        pass
    r = sc.render
    r.resolution_x = out_w
    r.resolution_y = out_h
    r.resolution_percentage = 100
    r.film_transparent = False
    r.use_persistent_data = False
    r.image_settings.file_format = "PNG"
    r.image_settings.color_mode = "RGB"
    r.image_settings.color_depth = "8"
    return sc


def color_management(sc, pkg):
    style = pkg.get("style", "default")
    vs = sc.view_settings
    for name in ("AgX", "Filmic"):
        try:
            vs.view_transform = name
            break
        except TypeError:
            continue
    look_by_style = {
        "editorial": ["Medium High Contrast", "AgX - Medium High Contrast", "Punchy"],
        "archviz": ["Base Contrast", "AgX - Base Contrast", "Medium Low Contrast"],
        "clay": ["Medium Low Contrast", "AgX - Medium Low Contrast"],
        "clay-white": ["Low Contrast", "AgX - Low Contrast"],
    }
    for look in look_by_style.get(style, ["Base Contrast", "AgX - Base Contrast"]):
        try:
            vs.look = look
            break
        except TypeError:
            continue
    wb = float(pkg.get("post", {}).get("white_balance", 0) or 0)
    if wb > 1000 and abs(wb - 6500.0) > 300 and hasattr(vs, "use_white_balance"):
        # yalnız belirgin bir istek varsa: Blender'da sıcaklık sahne ışığını belirtir, görüntü ters yönde kayar
        vs.use_white_balance = True
        vs.white_balance_temperature = 6500.0 - (wb - 6500.0) * 0.5
    log(f"renk yönetimi: {vs.view_transform} / {vs.look}")


def material_for(spec, clay, cache_dir):
    m = bpy.data.materials.new(spec["id"] or "malzeme")
    nt = m.node_tree
    nodes, links = nt.nodes, nt.links
    for n in list(nodes):
        nodes.remove(n)
    out = nodes.new("ShaderNodeOutputMaterial")
    color = tuple(spec.get("color", [0.8, 0.8, 0.8]))
    rough = float(spec.get("roughness", 0.8))
    metal = float(spec.get("metallic", 0.0))
    emission = float(spec.get("emission", 0.0))
    opacity = float(spec.get("opacity", 1.0))
    cat = spec.get("category", "")
    tex = spec.get("texture")
    mid = spec.get("id", "")

    keep = True
    if clay == "shell":
        keep = cat in ("zemin", "mobilya", "tekstil", "dekor", "metal", "genel", "dograma", "palet")
    elif clay == "all":
        keep = opacity < 0.5 or emission > 0
    if not keep:
        color, rough, metal, tex = (0.82, 0.82, 0.8), 0.85, 0.0, None

    if emission > 0:
        em = nodes.new("ShaderNodeEmission")
        bb = nodes.new("ShaderNodeBlackbody")
        bb.inputs["Temperature"].default_value = 2200.0 if clay == "all" else 2900.0
        links.new(bb.outputs["Color"], em.inputs["Color"])
        em.inputs["Strength"].default_value = 18.0 * emission * spec.get("_lamp_gain", 1.0)
        # gövde yüzü de biraz ışık geçirir: emisyon + yayınık
        diff = nodes.new("ShaderNodeBsdfDiffuse")
        diff.inputs["Color"].default_value = (*color, 1)
        mix = nodes.new("ShaderNodeAddShader")
        links.new(em.outputs[0], mix.inputs[0])
        links.new(diff.outputs[0], mix.inputs[1])
        links.new(mix.outputs[0], out.inputs["Surface"])
        return m

    if opacity < 0.5 and (cat == "tekstil" or mid.startswith("perde")):
        # tül: ışığı süzerek geçiren ince kumaş
        transp = nodes.new("ShaderNodeBsdfTransparent")
        transp.inputs["Color"].default_value = (0.96, 0.95, 0.93, 1)
        transl = nodes.new("ShaderNodeBsdfTranslucent")
        transl.inputs["Color"].default_value = (*color, 1)
        diff = nodes.new("ShaderNodeBsdfDiffuse")
        diff.inputs["Color"].default_value = (*color, 1)
        cloth = nodes.new("ShaderNodeMixShader")
        cloth.inputs["Fac"].default_value = 0.5
        links.new(transl.outputs[0], cloth.inputs[1])
        links.new(diff.outputs[0], cloth.inputs[2])
        mix = nodes.new("ShaderNodeMixShader")
        mix.inputs["Fac"].default_value = min(0.85, 0.25 + opacity)
        links.new(transp.outputs[0], mix.inputs[1])
        links.new(cloth.outputs[0], mix.inputs[2])
        links.new(mix.outputs[0], out.inputs["Surface"])
        return m

    bsdf = nodes.new("ShaderNodeBsdfPrincipled")
    links.new(bsdf.outputs[0], out.inputs["Surface"])
    set_input(bsdf, "Base Color", (*color, 1))
    set_input(bsdf, "Roughness", rough)
    set_input(bsdf, "Metallic", metal)

    if opacity < 0.5:
        # pencere camı: ince duvar, kırılmasız geçiş (gölge ve gün ışığı doğru düşer)
        set_input(bsdf, "Base Color", (0.98, 0.99, 1.0, 1))
        set_input(bsdf, "Transmission Weight", 1.0)
        set_input(bsdf, "Roughness", 0.0)
        set_input(bsdf, "IOR", 1.52)
        set_input(bsdf, "Thin Wall", True)
        # mimari görselleştirmede olağan yöntem: gölge ve yayınık ışınlar camdan kayıpsız geçer,
        # böylece güneş lekesi ve gün ışığı içeri düşer; görünen yüz yine gerçek cam gibi yansıtır
        lp = nodes.new("ShaderNodeLightPath")
        either = nodes.new("ShaderNodeMath")
        either.operation = "MAXIMUM"
        links.new(lp.outputs["Is Shadow Ray"], either.inputs[0])
        links.new(lp.outputs["Is Diffuse Ray"], either.inputs[1])
        transp = nodes.new("ShaderNodeBsdfTransparent")
        transp.inputs["Color"].default_value = (0.92, 0.94, 0.95, 1)
        mix = nodes.new("ShaderNodeMixShader")
        links.new(either.outputs[0], mix.inputs["Fac"])
        links.new(bsdf.outputs[0], mix.inputs[1])
        links.new(transp.outputs[0], mix.inputs[2])
        links.new(mix.outputs[0], out.inputs["Surface"])
        return m

    height = None
    kind = None
    if keep and (spec.get("uv") or (tex and tex.get("data"))):
        # glTF modeli: kendi UV'leri, renk / normal / pürüzlülük-metal haritaları, alfa kesme
        uvn = nodes.new("ShaderNodeUVMap")

        def image_node(t, color):
            ext = ".png" if "png" in t.get("mime", "") else ".jpg"
            path = os.path.join(cache_dir, f"{mid}-{len(os.listdir(cache_dir))}{ext}")
            with open(path, "wb") as f:
                f.write(base64.b64decode(t["data"]))
            img = bpy.data.images.load(path)
            img.colorspace_settings.name = "sRGB" if color else "Non-Color"
            node = nodes.new("ShaderNodeTexImage")
            node.image = img
            node.interpolation = "Cubic" if color else "Linear"
            links.new(uvn.outputs[0], node.inputs["Vector"])
            return node

        if tex and tex.get("data"):
            node = image_node(tex, True)
            mul = nodes.new("ShaderNodeMix")
            mul.data_type = "RGBA"
            mul.blend_type = "MULTIPLY"
            mul.inputs["Factor"].default_value = 1.0
            links.new(node.outputs["Color"], mul.inputs[6])
            mul.inputs[7].default_value = (*color, 1)
            links.new(mul.outputs[2], bsdf.inputs["Base Color"])
            cut = float(spec.get("alpha_cutoff", 0) or 0)
            if cut > 0:
                gt = nodes.new("ShaderNodeMath")
                gt.operation = "GREATER_THAN"
                gt.inputs[1].default_value = cut
                links.new(node.outputs["Alpha"], gt.inputs[0])
                links.new(gt.outputs[0], bsdf.inputs["Alpha"])
        if spec.get("orm_map"):
            orm = image_node(spec["orm_map"], False)
            sep = nodes.new("ShaderNodeSeparateColor")
            links.new(orm.outputs["Color"], sep.inputs[0])
            for out_name, sock, factor in (("Green", "Roughness", rough), ("Blue", "Metallic", metal)):
                m2 = nodes.new("ShaderNodeMath")
                m2.operation = "MULTIPLY"
                m2.inputs[1].default_value = factor
                links.new(sep.outputs[out_name], m2.inputs[0])
                links.new(m2.outputs[0], bsdf.inputs[sock])
        if spec.get("normal_map"):
            nm = image_node(spec["normal_map"], False)
            nmap = nodes.new("ShaderNodeNormalMap")
            nmap.uv_map = "UVMap"
            links.new(nm.outputs["Color"], nmap.inputs["Color"])
            links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
        if cat == "tekstil" or "fabric" in mid.lower():
            set_input(bsdf, "Sheen Weight", 0.5)
        return m
    if tex and tex.get("png"):
        kind = tex.get("kind", "image")
        path = os.path.join(cache_dir, f"{mid or 'doku'}.png")
        with open(path, "wb") as f:
            f.write(base64.b64decode(tex["png"]))
        img = bpy.data.images.load(path)
        img.colorspace_settings.name = "sRGB"
        node = nodes.new("ShaderNodeTexImage")
        node.image = img
        node.interpolation = "Cubic"
        uv = nodes.new("ShaderNodeUVMap")
        links.new(uv.outputs[0], node.inputs["Vector"])
        if kind == "image":
            # yüklenen görsel düz renk yerine geçer
            links.new(node.outputs["Color"], bsdf.inputs["Base Color"])
        else:
            links.new(node.outputs["Color"], bsdf.inputs["Base Color"])
        bw = nodes.new("ShaderNodeRGBToBW")
        links.new(node.outputs["Color"], bw.inputs[0])
        height = bw.outputs[0]
        # desene göre hafif pürüz değişimi (gerçek yüzeyler her yerde aynı parlamaz)
        rmap = nodes.new("ShaderNodeMapRange")
        rmap.inputs["From Min"].default_value = 0.0
        rmap.inputs["From Max"].default_value = 1.0
        rmap.inputs["To Min"].default_value = min(1.0, rough * 1.15)
        rmap.inputs["To Max"].default_value = max(0.02, rough * 0.85)
        links.new(bw.outputs[0], rmap.inputs["Value"])
        links.new(rmap.outputs[0], bsdf.inputs["Roughness"])
    elif cat in ("duvar", "tavan", "palet", "kabuk") or not keep:
        # boyalı sıva: çok ince rulo dokusu
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 850.0
        set_input(noise, "Detail", 6.0)
        set_input(noise, "Roughness", 0.6)
        height = noise.outputs["Fac"]
        kind = "paint"
    elif cat == "tekstil":
        noise = nodes.new("ShaderNodeTexNoise")
        noise.inputs["Scale"].default_value = 1400.0
        height = noise.outputs["Fac"]
        kind = "fabric"

    if cat == "tekstil" and keep:
        # kadife ve kumaş yüzeyler: kenarlarda parlayan hav
        set_input(bsdf, "Sheen Weight", 0.7)
        set_input(bsdf, "Sheen Roughness", 0.45)
        set_input(bsdf, "Roughness", max(rough, 0.75))
    if kind in POLISHED and keep:
        # cilalı parke, mermer ve karo: ince vernik katmanı
        set_input(bsdf, "Coat Weight", 0.35 if kind != "karo" else 0.5)
        set_input(bsdf, "Coat Roughness", 0.06)
    if cat == "mobilya" and metal < 0.5 and keep:
        set_input(bsdf, "Coat Weight", 0.15)
        set_input(bsdf, "Coat Roughness", 0.15)

    if height is not None:
        bump = nodes.new("ShaderNodeBump")
        strength = {"paint": 0.06, "fabric": 0.15}.get(kind, RELIEF.get(kind, 0.15))
        bump.inputs["Strength"].default_value = strength
        bump.inputs["Distance"].default_value = 0.0015
        links.new(height, bump.inputs["Height"])
        links.new(bump.outputs["Normal"], bsdf.inputs["Normal"])
    return m


def build_mesh(batch, mat, scale_mm):
    pos = batch["positions"]
    nor = batch["normals"]
    n = len(pos) // 3
    if n < 3:
        return None
    me = bpy.data.meshes.new(batch["material"])
    if np is not None:
        p = np.asarray(pos, dtype=np.float64).reshape(-1, 3)
        q = np.empty_like(p)
        q[:, 0], q[:, 1], q[:, 2] = p[:, 0] * 0.001, -p[:, 2] * 0.001, p[:, 1] * 0.001
        tris = n // 3
        me.vertices.add(n)
        me.vertices.foreach_set("co", q.astype(np.float32).ravel())
        me.loops.add(tris * 3)
        me.loops.foreach_set("vertex_index", np.arange(tris * 3, dtype=np.int32))
        me.polygons.add(tris)
        me.polygons.foreach_set("loop_start", np.arange(0, tris * 3, 3, dtype=np.int32))
        me.polygons.foreach_set("loop_total", np.full(tris, 3, dtype=np.int32))
        # baskın eksene göre düzlemsel UV (dahili motorla aynı kural), desen ölçüsüne bölünür
        tri = p.reshape(-1, 3, 3)
        gn = np.cross(tri[:, 1] - tri[:, 0], tri[:, 2] - tri[:, 0])
        ax = np.abs(gn)
        own = batch.get("uvs") or []
        if len(own) == n * 2:
            # modelin kendi UV'leri; glTF'de v aşağı, Blender'da yukarı
            uv = np.asarray(own, dtype=np.float64).reshape(tris, 3, 2)
            uv[:, :, 1] = 1.0 - uv[:, :, 1]
        else:
            uv = np.empty((tris, 3, 2))
            top = (ax[:, 1] >= ax[:, 0]) & (ax[:, 1] >= ax[:, 2])
            front = ~top & (ax[:, 2] >= ax[:, 0])
            side = ~top & ~front
            uv[top] = tri[top][:, :, [0, 2]]
            uv[front] = tri[front][:, :, [0, 1]]
            uv[side] = tri[side][:, :, [2, 1]]
            uv /= max(1.0, scale_mm)
        me.update(calc_edges=True)
        layer = me.uv_layers.new(name="UVMap")
        layer.data.foreach_set("uv", uv.astype(np.float32).ravel())
        nn = np.asarray(nor, dtype=np.float64).reshape(-1, 3)
        cn = np.empty_like(nn)
        cn[:, 0], cn[:, 1], cn[:, 2] = nn[:, 0], -nn[:, 2], nn[:, 1]
        lens = np.linalg.norm(cn, axis=1, keepdims=True)
        cn = cn / np.where(lens < 1e-6, 1.0, lens)
        me.polygons.foreach_set("use_smooth", np.ones(tris, dtype=bool))
        try:
            me.normals_split_custom_set(cn.tolist())
        except Exception as e:  # eski sürümlerde düz gölgeleme yeterli
            log(f"özel normaller atlandı: {e}")
    else:
        verts = [to_bl(pos[i * 3 : i * 3 + 3]) for i in range(n)]
        faces = [(i, i + 1, i + 2) for i in range(0, n, 3)]
        me.from_pydata(verts, [], faces)
        me.update()
    me.materials.append(mat)
    ob = bpy.data.objects.new(batch["material"], me)
    bpy.context.scene.collection.objects.link(ob)
    return ob


def build_world(sc, pkg):
    sky = pkg["sky"]
    w = bpy.data.worlds.new("Dunya")
    sc.world = w
    nt = w.node_tree
    nodes, links = nt.nodes, nt.links
    for n in list(nodes):
        nodes.remove(n)
    out = nodes.new("ShaderNodeOutputWorld")
    bg = nodes.new("ShaderNodeBackground")
    links.new(bg.outputs[0], out.inputs[0])
    sun_dir = norm(dir_bl(sky["sun_direction"]))

    if sky.get("studio"):
        # stüdyo: beyaz sonsuz fon ve yumuşak tepe ışığı
        bg.inputs["Color"].default_value = (1, 1, 1, 1)
        bg.inputs["Strength"].default_value = 1.0
        add_sun(sc, (-0.35, -0.37, 0.86), 2.2, (1.0, 0.98, 0.95), 12.0)
        return

    tex = nodes.new("ShaderNodeTexSky")
    for kind in ("MULTIPLE_SCATTERING", "SINGLE_SCATTERING", "NISHITA", "HOSEK_WILKIE"):
        try:
            tex.sky_type = kind
            break
        except TypeError:
            continue
    tex.sun_disc = False
    elev = math.asin(max(-1.0, min(1.0, sun_dir[2])))
    try:
        tex.sun_elevation = elev
        # Blender gök dokusunda dönüş açısı +Y ekseninden saat yönünde ölçülür
        tex.sun_rotation = math.atan2(sun_dir[0], sun_dir[1])
    except AttributeError:
        pass
    haze = float(sky.get("haze", 0.1))
    cloud = float(sky.get("cloud", 0.0))
    for prop, value in (("aerosol_density", 1.0 + 6.0 * haze), ("dust_density", 1.0 + 6.0 * haze), ("air_density", 1.0), ("ozone_density", 1.0)):
        if hasattr(tex, prop):
            setattr(tex, prop, value)
    sky_col = tex.outputs["Color"]
    if cloud > 0.02:
        # bulutlu gök: renk griye çekilir
        mix = nodes.new("ShaderNodeMix")
        mix.data_type = "RGBA"
        mix.inputs["Factor"].default_value = min(0.9, cloud)
        links.new(sky_col, mix.inputs[6])
        g = 0.35 * (1.0 - 0.4 * cloud)
        mix.inputs[7].default_value = (g, g * 1.02, g * 1.06, 1)
        sky_col = mix.outputs[2]
    links.new(sky_col, bg.inputs["Color"])
    night = bool(sky.get("night"))
    bg.inputs["Strength"].default_value = 0.004 if night else 1.0
    sun_col = sky.get("sun_color", [1, 1, 1])
    strength = lum(sun_col)
    if night:
        add_sun(sc, sun_dir, 0.03, (0.55, 0.65, 0.9), 1.0)
    elif elev > -0.02 and strength > 0.001:
        # dahili güneş gücü (≈2,4 gündüz) gerçek ışınım ölçeğine çevrilir
        add_sun(sc, sun_dir, 4.2 * min(1.6, strength / 2.2), norm_color(sun_col), max(0.53, float(sky.get("sun_angle", 1.2))))


def norm_color(c):
    m = max(c) or 1.0
    return tuple(x / m for x in c)


def add_sun(sc, direction, strength, color, angle_deg):
    li = bpy.data.lights.new("Gunes", "SUN")
    li.energy = strength
    li.color = color
    li.angle = math.radians(angle_deg)
    ob = bpy.data.objects.new("Gunes", li)
    sc.collection.objects.link(ob)
    # ışık −Z yönünde parlar: nesneyi güneşe bakacak biçimde döndür
    import mathutils

    ob.rotation_euler = mathutils.Vector(direction).to_track_quat("Z", "Y").to_euler()


def add_portals(sc, pkg):
    import mathutils

    for i, p in enumerate(pkg.get("portals", [])):
        li = bpy.data.lights.new(f"Portal{i}", "AREA")
        li.shape = "RECTANGLE"
        li.size = p["width"] * 0.001
        li.size_y = p["height"] * 0.001
        try:
            li.cycles.is_portal = True
        except AttributeError:
            pass
        ob = bpy.data.objects.new(f"Portal{i}", li)
        sc.collection.objects.link(ob)
        ob.location = to_bl(p["center"])
        inward = mathutils.Vector(norm(dir_bl(p["inward"])))
        along = mathutils.Vector(norm(dir_bl(p["along"])))
        up = inward.cross(along).normalized()
        if up.z < 0:
            along = -along
            up = -up
        # alan ışığı yerel −Z yönüne bakar; yerel X genişlik, Y yükseklik
        z = -inward
        mat = mathutils.Matrix((along, up, z)).transposed()
        ob.rotation_euler = mat.to_euler()


def setup_camera(sc, pkg):
    import mathutils

    c = pkg["camera"]
    cam = bpy.data.cameras.new("Kamera")
    ob = bpy.data.objects.new("Kamera", cam)
    sc.collection.objects.link(ob)
    sc.camera = ob
    eye = mathutils.Vector(to_bl(c["eye"]))
    target = mathutils.Vector(to_bl(c["target"]))
    ob.location = eye
    fwd = (target - eye).normalized()
    ob.rotation_euler = fwd.to_track_quat("-Z", "Y").to_euler()
    cam.sensor_fit = "VERTICAL"
    cam.sensor_height = 24.0
    cam.sensor_width = 36.0
    cam.clip_start = 0.02
    cam.clip_end = 2000.0
    fov = math.radians(float(c.get("fov", 50)))
    if c.get("projection") == "isometric":
        cam.type = "ORTHO"
        oh = c.get("ortho_height")
        cam.ortho_scale = (oh * 0.001) if oh else (target - eye).length * math.tan(fov / 2) * 2
    else:
        cam.angle = fov
        ap = float(c.get("aperture") or 0)
        if ap > 0:
            cam.dof.use_dof = True
            cam.dof.aperture_fstop = max(0.7, ap)
            focus = c.get("focus")
            if focus:
                cam.dof.focus_distance = float(focus) * 0.001
            else:
                dg = bpy.context.evaluated_depsgraph_get()
                hit, loc, *_ = sc.ray_cast(dg, eye, fwd)
                cam.dof.focus_distance = (loc - eye).length if hit else 5.0
    return ob


# ---------------------------------------------------------------- görüntü
def read_png(path):
    img = bpy.data.images.load(path)
    w, h = img.size
    px = np.empty(w * h * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    bpy.data.images.remove(img)
    # Blender pikselleri alttan yukarı verir
    return px.reshape(h, w, 4)[::-1, :, :3].copy(), w, h


def box_blur(a, r):
    if r < 1:
        return a
    k = 2 * r + 1
    for axis in (0, 1):
        pad = [(0, 0)] * a.ndim
        pad[axis] = (r + 1, r)
        c = np.cumsum(np.pad(a, pad, mode="edge"), axis=axis)
        hi = np.take(c, range(k, c.shape[axis]), axis=axis)
        lo = np.take(c, range(0, c.shape[axis] - k), axis=axis)
        a = (hi - lo) / k
    return a


def post(img, pkg):
    """Fotoğraf makinesi son işlemi: parlama, köşe kararması, keskinlik, gren."""
    p = pkg.get("post", {})
    h, w, _ = img.shape
    bloom = float(p.get("bloom", 0) or 0)
    if bloom > 0:
        bright = np.clip(img - 0.82, 0, None) * 3.0
        glow = box_blur(box_blur(bright, max(2, w // 120)), max(2, w // 120))
        img = img + glow * bloom * 0.8
    vig = float(p.get("vignette", 0) or 0)
    if vig > 0:
        yy, xx = np.mgrid[0:h, 0:w]
        dx = (xx + 0.5) / w * 2 - 1
        dy = (yy + 0.5) / h * 2 - 1
        r2 = (dx * dx + dy * dy) * 0.5
        img = img * (1 - vig * 0.55 * r2 * np.sqrt(r2))[:, :, None]
    sharp = float(p.get("sharpen", 0) or 0)
    if sharp > 0:
        img = img + (img - box_blur(img, 1)) * sharp * 0.7
    grain = float(p.get("grain", 0) or 0)
    if grain > 0:
        rng = np.random.default_rng(7)
        l = np.clip(img.mean(axis=2, keepdims=True), 0, 1)
        img = img + (rng.random((h, w, 1)) + rng.random((h, w, 1)) - 1) * grain * 0.06 * (0.25 + 3 * l * (1 - l))
    return np.clip(img, 0, 1)


def auto_exposure(sc, pkg, tmp):
    """Düşük çözünürlüklü ön render ile pozlama: ortalama parlaklık hedef orta griye çekilir."""
    r = sc.render
    full = (r.resolution_x, r.resolution_y, sc.cycles.samples)
    r.resolution_x = max(16, full[0] // 8)
    r.resolution_y = max(16, full[1] // 8)
    sc.cycles.samples = 16
    vs = sc.view_settings
    saved = (vs.view_transform, vs.look, vs.exposure)
    vs.exposure = 0.0
    try:
        vs.view_transform = "Standard"
    except TypeError:
        pass
    vs.look = "None"
    path = os.path.join(tmp, "olcum.png")
    r.filepath = path
    bpy.ops.render.render(write_still=True)
    img, _, _ = read_png(path)
    # sRGB → doğrusal
    lin = np.where(img <= 0.04045, img / 12.92, ((img + 0.055) / 1.055) ** 2.4)
    y = 0.2126 * lin[:, :, 0] + 0.7152 * lin[:, :, 1] + 0.0722 * lin[:, :, 2]
    clipped = float((y > 0.99).mean())
    avg = float(np.exp(np.log(y + 1e-4).mean()))
    target = float(pkg["sky"].get("auto_exposure_target", 0.2)) * (0.45 if pkg["sky"].get("night") else 1.0)
    ev = math.log2(target / max(avg, 1e-4))
    # ölçüm görüntüsü kırpılmışsa gerçek parlaklık daha yüksektir: bir kademe daha kıs
    ev -= 2.0 * clipped
    vs.view_transform, vs.look = saved[0], saved[1]
    r.resolution_x, r.resolution_y, sc.cycles.samples = full
    ev = max(-10.0, min(8.0, ev))
    log(f"otomatik pozlama: ortalama {avg:.4f} → {ev:+.2f} EV (kırpık %{clipped * 100:.1f})")
    return ev


def main(scene_path, out_path):
    with open(scene_path, encoding="utf-8") as f:
        pkg = json.load(f)
    if not str(pkg.get("format", "")).startswith("uhd-cycles/"):
        raise SystemExit("Geçersiz sahne paketi")
    reset()
    w, h = int(pkg["width"]), int(pkg["height"])
    sc = setup_render(pkg, w, h, int(pkg.get("samples", 256)))
    color_management(sc, pkg)
    tmp = tempfile.mkdtemp(prefix="uhd-cycles-")
    clay = pkg["sky"].get("clay", "none")
    lamp_gain = float(pkg["sky"].get("lamp_gain", 1.0))
    mats = {}
    for spec in pkg["materials"]:
        spec["_lamp_gain"] = lamp_gain
        mats[spec["id"]] = (material_for(spec, clay, tmp), (spec.get("texture") or {}).get("scale", 1000.0))
    for b in pkg["batches"]:
        mat, scale = mats.get(b["material"], (None, 1000.0))
        if mat is None:
            mat = material_for({"id": b["material"]}, clay, tmp)
        build_mesh(b, mat, float(scale or 1000.0))
    build_world(sc, pkg)
    if not pkg["sky"].get("studio"):
        add_portals(sc, pkg)
    setup_camera(sc, pkg)
    if pkg.get("auto_exposure", True):
        sc.view_settings.exposure = auto_exposure(sc, pkg, tmp) + math.log2(max(0.05, float(pkg.get("exposure", 0.62))) / 0.62)
    else:
        sc.view_settings.exposure = math.log2(max(0.05, float(pkg.get("exposure", 0.62))) / 0.62)
    raw = os.path.join(tmp, "render.png")
    sc.render.filepath = raw
    log(f"render: {w}×{h}, {sc.cycles.samples} örnek, {pkg.get('triangles', 0)} üçgen")
    bpy.ops.render.render(write_still=True)
    if np is not None:
        img, iw, ih = read_png(raw)
        img = post(img, pkg)
        write_png(out_path, (img * 255 + 0.5).astype(np.uint8), iw, ih)
    else:
        import shutil

        shutil.copyfile(raw, out_path)
    log(f"yazıldı: {out_path}")


if __name__ == "__main__":
    args = sys.argv[sys.argv.index("--") + 1 :] if "--" in sys.argv else sys.argv[1:]
    if len(args) != 2:
        raise SystemExit("Kullanım: uhd_cycles.py sahne.json cikti.png")
    main(args[0], args[1])
