"""İzometrik 3B plan motoru — duvarlı kat planı, mobilya kutuları, ışık lekeleri (saf SVG).
Koordinat: plan birimi (x sağa, y aşağı), z yukarı. Çıktı: <svg> dizgesi.
"""
import math, random

C30, S30 = math.cos(math.radians(30)), 0.5

def P(x, y, z, s, ox, oy):
    return (round(ox + (x - y) * C30 * s, 1), round(oy + (x + y) * S30 * s - z * s, 1))

def _pts(pts):
    return " ".join(f"{a},{b}" for a, b in pts)

def shade(rgb, k):
    r, g, b = rgb
    return f"rgb({max(0,min(255,int(r*k)))} {max(0,min(255,int(g*k)))} {max(0,min(255,int(b*k)))})"

def box(x, y, w, d, h, rgb, s, ox, oy, z0=0, op=1, stroke=None, glow=None):
    """Görünen 3 yüz (üst, sol-ön [y+d], sağ-ön [x+w])."""
    q = lambda a, b, c: P(a, b, c, s, ox, oy)
    top = [q(x, y, z0+h), q(x+w, y, z0+h), q(x+w, y+d, z0+h), q(x, y+d, z0+h)]
    left = [q(x, y+d, z0+h), q(x+w, y+d, z0+h), q(x+w, y+d, z0), q(x, y+d, z0)]
    right = [q(x+w, y, z0+h), q(x+w, y+d, z0+h), q(x+w, y+d, z0), q(x+w, y, z0)]
    st = f' stroke="{stroke}" stroke-width=".6"' if stroke else ""
    g = f' filter="url(#{glow})"' if glow else ""
    return (f'<g opacity="{op}"{g}><polygon points="{_pts(left)}" fill="{shade(rgb,.72)}"{st}/>'
            f'<polygon points="{_pts(right)}" fill="{shade(rgb,.55)}"{st}/>'
            f'<polygon points="{_pts(top)}" fill="{shade(rgb,1)}"{st}/></g>')

def floor(x, y, w, d, fill, s, ox, oy, z=0, stroke=None, op=1):
    q = lambda a, b: P(a, b, z, s, ox, oy)
    st = f' stroke="{stroke}" stroke-width="1"' if stroke else ""
    return f'<polygon points="{_pts([q(x,y),q(x+w,y),q(x+w,y+d),q(x,y+d)])}" fill="{fill}" opacity="{op}"{st}/>'

def wall(x1, y1, x2, y2, t, h, rgb, s, ox, oy, op=1, stroke=None):
    if x1 == x2:  # dikey (y boyunca)
        return box(x1 - t/2, min(y1, y2), t, abs(y2 - y1), h, rgb, s, ox, oy, op=op, stroke=stroke)
    return box(min(x1, x2), y1 - t/2, abs(x2 - x1), t, h, rgb, s, ox, oy, op=op, stroke=stroke)

def blob(x, y, r, color, s, ox, oy, z=0, op=.7):
    cx, cy = P(x, y, z, s, ox, oy)
    return f'<ellipse cx="{cx}" cy="{cy}" rx="{r*s*1.2}" ry="{r*s*.7}" fill="{color}" opacity="{op}" filter="url(#isoblur)"/>'

def svg(items, vb, defs=""):
    """items: (sıralama_anahtarı, svg) listesi; arkadan öne çizilir."""
    body = "".join(t for _, t in sorted(items, key=lambda i: i[0]))
    return (f'<svg viewBox="{vb}" style="width:100%;height:100%;display:block" aria-hidden="true">'
            f'<defs><filter id="isoblur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="14"/></filter>'
            f'<filter id="isoglow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="4"/></filter>{defs}</defs>{body}</svg>')

def plan(rooms, walls, furniture=(), lights=(), s=10, ox=400, oy=60, wall_rgb=(230, 232, 238), wall_h=3.2, t=.35,
         slab=None, wall_op=1, wall_stroke=None, extra=()):
    """rooms: (x,y,w,d,fill,[stroke]) · walls: (x1,y1,x2,y2) · furniture: (x,y,w,d,h,rgb) · lights: (x,y,r,color)"""
    it = []
    if slab:
        sx, sy, sw, sd, sh, srgb = slab
        it.append((-1e6, box(sx, sy, sw, sd, sh, srgb, s, ox, oy, z0=-sh)))
    for r in rooms:
        x, y, w, d, f = r[:5]; stc = r[5] if len(r) > 5 else None
        it.append((-1e5 + x + y, floor(x, y, w, d, f, s, ox, oy, stroke=stc)))
    for (x, y, rr, c) in lights:
        it.append((-5e4, blob(x, y, rr, c, s, ox, oy)))
    for (x, y, w, d, h, rgb) in furniture:
        it.append((x + w + y + d - .01, box(x, y, w, d, h, rgb, s, ox, oy)))
    for wl in walls:
        x1, y1, x2, y2 = wl[:4]; hh = wl[4] if len(wl) > 4 else wall_h
        k = max(x1, x2) + max(y1, y2)
        it.append((k, wall(x1, y1, x2, y2, t, hh, wall_rgb, s, ox, oy, op=wall_op, stroke=wall_stroke)))
    it.extend(extra)
    return it

def to_screen(x, y, z, s, ox, oy, vb):
    """Plan noktasının, verilen viewBox içindeki yüzde konumu (sıcak nokta yerleşimi için)."""
    vx, vy, vw, vh = [float(v) for v in vb.split()]
    px, py = P(x, y, z, s, ox, oy)
    return round((px - vx) / vw * 100, 1), round((py - vy) / vh * 100, 1)
