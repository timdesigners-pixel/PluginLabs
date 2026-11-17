/* 3B önizleme (three.js, WebGL). Geometri Rust motorundan gelir; birim mm → sahnede metre. */
import { t as L, locale } from "./i18n.js";
import * as THREE from "./vendor/three.module.min.js";

const MM = 0.001;

export class View3D {
  constructor(canvas, info) {
    this.c = canvas;
    this.info = info;
    this.ok = true;
    try {
      this.r = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
    } catch (e) {
      this.ok = false;
      info.textContent = L("view3d.webgl_kullanilamiyor");
      return;
    }
    this.r.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
    this.r.shadowMap.enabled = true;
    this.r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.r.toneMapping = THREE.ACESFilmicToneMapping;
    this.r.toneMappingExposure = 0.9;
    this.r.outputColorSpace = THREE.SRGBColorSpace;
    this.scene = new THREE.Scene();
    this.cam = new THREE.PerspectiveCamera(45, 1, 0.05, 4000);
    this.hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.9);
    this.sun = new THREE.DirectionalLight(0xffffff, 2.2);
    this.sun.castShadow = true;
    this.sun.shadow.mapSize.set(2048, 2048);
    this.sun.shadow.bias = -0.0004;
    this.sun.shadow.normalBias = 0.02;
    this.scene.add(this.hemi, this.sun, this.sun.target);
    this.group = new THREE.Group();
    this.scene.add(this.group);
    this.orbit = { target: new THREE.Vector3(5, 1, 4), dist: 22, yaw: -2.4, pitch: 0.55 };
    this.drag = null;
    // Düzenleme kipi: sol tuş nesne seçer/taşır (hooks), boşlukta ve diğer tuşlarda kamera döner.
    this.edit = false;
    this.hooks = null;
    this.tex = {};
    this.ray = new THREE.Raycaster();
    this.box = null;
    canvas.addEventListener("pointerdown", (e) => {
      canvas.focus();
      const handled = this.edit && e.button === 0 && !e.shiftKey && this.hooks && this.hooks.down(e);
      this.drag = handled ? { edit: true } : { x: e.clientX, y: e.clientY, b: e.button, shift: e.shiftKey };
      canvas.setPointerCapture(e.pointerId);
    });
    canvas.addEventListener("pointermove", (e) => { if (this.drag && this.drag.edit) this.hooks.move(e); else this.onMove(e); });
    canvas.addEventListener("pointerup", (e) => {
      const d = this.drag;
      this.drag = null;
      try { canvas.releasePointerCapture(e.pointerId); } catch { /* yok */ }
      if (d && d.edit) this.hooks.up(e);
    });
    canvas.addEventListener("wheel", (e) => { e.preventDefault(); this.orbit.dist = Math.max(0.5, Math.min(200, this.orbit.dist * Math.exp(e.deltaY * 0.0012))); this.update(); }, { passive: false });
    canvas.addEventListener("contextmenu", (e) => e.preventDefault());
    canvas.addEventListener("keydown", (e) => {
      const k = { ArrowLeft: [-0.08, 0], ArrowRight: [0.08, 0], ArrowUp: [0, 0.05], ArrowDown: [0, -0.05] }[e.key];
      if (k) { e.preventDefault(); this.orbit.yaw += k[0]; this.orbit.pitch = Math.max(-1.4, Math.min(1.5, this.orbit.pitch + k[1])); this.update(); }
      if (e.key === "+" || e.key === "=") { this.orbit.dist *= 0.9; this.update(); }
      if (e.key === "-") { this.orbit.dist *= 1.1; this.update(); }
    });
    new ResizeObserver(() => this.resize()).observe(canvas);
    this.setAtmosphere("gunduz");
  }

  ndc(e) {
    const r = this.c.getBoundingClientRect();
    return new THREE.Vector2(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
  }
  /** İmlecin altındaki yüzey noktası (mm) ya da null. */
  pick(e) {
    if (!this.ok) return null;
    this.ray.setFromCamera(this.ndc(e), this.cam);
    const hits = this.ray.intersectObjects(this.group.children, false);
    if (!hits.length) return null;
    const p = hits[0].point;
    return { point: [p.x / MM, p.y / MM, p.z / MM], material: hits[0].object.userData.material };
  }
  /** İmleç ışınının y = yMm düzlemini kestiği nokta (mm) ya da null. */
  planePoint(e, yMm) {
    if (!this.ok) return null;
    this.ray.setFromCamera(this.ndc(e), this.cam);
    const o = this.ray.ray.origin, d = this.ray.ray.direction;
    if (Math.abs(d.y) < 1e-6) return null;
    const t = (yMm * MM - o.y) / d.y;
    if (t <= 0) return null;
    return [(o.x + d.x * t) / MM, yMm, (o.z + d.z * t) / MM];
  }
  /** Seçim kutusu (mm) göster ya da kaldır. */
  setBox(mn, mx) {
    if (!this.ok) return;
    if (this.box) { this.scene.remove(this.box); this.box.geometry.dispose(); this.box = null; }
    if (mn) {
      const b = new THREE.Box3(new THREE.Vector3(mn[0] * MM, mn[1] * MM, mn[2] * MM), new THREE.Vector3(mx[0] * MM, mx[1] * MM, mx[2] * MM));
      this.box = new THREE.Box3Helper(b, new THREE.Color(0x7c6cff));
      this.scene.add(this.box);
    }
    this.update();
  }
  /** Motorun ürettiği doku karoları: { malzeme: { width, height, rgb(base64), scale } }. */
  setTextures(tiles) {
    if (!this.ok) return;
    for (const t of Object.values(this.tex)) t.map.dispose();
    this.tex = {};
    for (const [id, t] of Object.entries(tiles)) {
      const bin = atob(t.rgb);
      const data = new Uint8Array(t.width * t.height * 4);
      for (let i = 0, j = 0; i < bin.length; i += 3, j += 4) { data[j] = bin.charCodeAt(i); data[j + 1] = bin.charCodeAt(i + 1); data[j + 2] = bin.charCodeAt(i + 2); data[j + 3] = 255; }
      const map = new THREE.DataTexture(data, t.width, t.height, THREE.RGBAFormat);
      map.wrapS = map.wrapT = THREE.RepeatWrapping;
      map.colorSpace = THREE.SRGBColorSpace;
      map.magFilter = THREE.LinearFilter;
      map.minFilter = THREE.LinearMipmapLinearFilter;
      map.generateMipmaps = true;
      map.flipY = true;
      map.anisotropy = 4;
      map.needsUpdate = true;
      this.tex[id] = { map, scale: t.scale };
    }
  }

  onMove(e) {
    const d = this.drag;
    if (!d) return;
    const dx = e.clientX - d.x, dy = e.clientY - d.y;
    d.x = e.clientX; d.y = e.clientY;
    if (d.b === 2 || d.b === 1 || d.shift) {
      const right = new THREE.Vector3().subVectors(this.cam.position, this.orbit.target).cross(this.cam.up).normalize();
      const k = this.orbit.dist * 0.0016;
      this.orbit.target.addScaledVector(right, dx * k);
      this.orbit.target.y += dy * k;
    } else {
      this.orbit.yaw -= dx * 0.006;
      this.orbit.pitch = Math.max(-1.4, Math.min(1.5, this.orbit.pitch + dy * 0.005));
    }
    this.update();
  }

  resize() {
    if (!this.ok) return;
    const r = this.c.getBoundingClientRect();
    if (r.width < 2 || r.height < 2) return;
    this.r.setSize(r.width, r.height, false);
    this.cam.aspect = r.width / r.height;
    this.cam.updateProjectionMatrix();
    this.update();
  }

  setMesh(data) {
    if (!this.ok) return;
    for (const ch of [...this.group.children]) { ch.geometry.dispose(); ch.material.dispose(); this.group.remove(ch); }
    for (const g of data.groups) {
      const geo = new THREE.BufferGeometry();
      const p = new Float32Array(g.positions.length);
      for (let i = 0; i < p.length; i++) p[i] = g.positions[i] * MM;
      geo.setAttribute("position", new THREE.BufferAttribute(p, 3));
      geo.setAttribute("normal", new THREE.BufferAttribute(new Float32Array(g.normals), 3));
      const col = new THREE.Color().setRGB(g.color[0], g.color[1], g.color[2], THREE.SRGBColorSpace);
      const tx = this.tex[g.material];
      if (tx) {
        // baskın düzlem izdüşümü: motorun render'da kullandığı eşlemeyle aynı
        const uv = new Float32Array((g.positions.length / 3) * 2);
        const P = g.positions, N = g.normals;
        for (let i = 0, k = 0; i < P.length; i += 3, k += 2) {
          const ax = Math.abs(N[i]), ay = Math.abs(N[i + 1]), az = Math.abs(N[i + 2]);
          let u, v;
          if (ay >= ax && ay >= az) { u = P[i]; v = P[i + 2]; } else if (az >= ax) { u = P[i]; v = P[i + 1]; } else { u = P[i + 2]; v = P[i + 1]; }
          uv[k] = u / tx.scale; uv[k + 1] = v / tx.scale;
        }
        geo.setAttribute("uv", new THREE.BufferAttribute(uv, 2));
        col.setRGB(1, 1, 1);
      }
      const mat = new THREE.MeshStandardMaterial({ map: tx ? tx.map : null, side: THREE.DoubleSide, color: col, roughness: g.roughness, metalness: g.metallic * 0.85, transparent: g.opacity < 0.99, opacity: Math.max(0.15, g.opacity) });
      if (g.emission > 0) { mat.emissive = new THREE.Color().setRGB(g.color[0], g.color[1], g.color[2], THREE.SRGBColorSpace); mat.emissiveIntensity = Math.min(3, g.emission / 3); }
      if (g.opacity < 0.99) mat.depthWrite = false;
      const mesh = new THREE.Mesh(geo, mat);
      mesh.castShadow = g.material !== "zemin-dis" && g.opacity >= 0.5;
      mesh.receiveShadow = true;
      mesh.userData.material = g.material;
      this.group.add(mesh);
    }
    const [mn, mx] = data.bounds;
    if (Number.isFinite(mn[0])) {
      this.bounds = { mn: mn.map((x) => x * MM), mx: mx.map((x) => x * MM) };
      const cx = (this.bounds.mn[0] + this.bounds.mx[0]) / 2, cz = (this.bounds.mn[2] + this.bounds.mx[2]) / 2;
      const size = Math.min(80, Math.max(this.bounds.mx[0] - this.bounds.mn[0], this.bounds.mx[2] - this.bounds.mn[2]));
      const sc = this.sun.shadow.camera;
      const half = Math.max(12, Math.min(60, size));
      sc.left = -half; sc.right = half; sc.top = half; sc.bottom = -half; sc.near = 0.5; sc.far = 200;
      sc.updateProjectionMatrix();
      this.sun.target.position.set(cx, 0, cz);
      this.placeSun();
    }
    this.info.textContent = `${L("app.ucgen", { p: data.triangles.toLocaleString(locale()) })}`;
    this.update();
  }

  placeSun() {
    const t = this.sun.target.position;
    const el = this.sunEl * Math.PI / 180, az = this.sunAz * Math.PI / 180;
    this.sun.position.set(t.x + Math.cos(el) * Math.sin(az) * 40, Math.sin(el) * 40, t.z + Math.cos(el) * Math.cos(az) * 40);
  }

  setAtmosphere(a) {
    if (!this.ok) return;
    const A = {
      gunduz: { bg: [0.62, 0.74, 0.88], sky: 0xcfe2ff, gr: 0x5a6150, hemi: 0.85, sun: 0xfff2dc, si: 2.4, el: 38, az: 215, exp: 0.95 },
      "gun-batimi": { bg: [0.86, 0.56, 0.40], sky: 0xffb38a, gr: 0x3a3028, hemi: 0.55, sun: 0xff9a55, si: 2.0, el: 8, az: 175, exp: 0.95 },
      aksam: { bg: [0.03, 0.04, 0.08], sky: 0x1b2440, gr: 0x0a0a0c, hemi: 0.18, sun: 0x223355, si: 0.0, el: 30, az: 215, exp: 1.2 },
    }[a] || {};
    this.scene.background = new THREE.Color().setRGB(A.bg[0], A.bg[1], A.bg[2], THREE.SRGBColorSpace);
    this.hemi.color.set(A.sky);
    this.hemi.groundColor.set(A.gr);
    this.hemi.intensity = A.hemi;
    this.sun.color.set(A.sun);
    this.sun.intensity = A.si;
    this.sunEl = A.el; this.sunAz = A.az;
    this.r.toneMappingExposure = A.exp;
    for (const m of this.group.children) if (m.material.emissive && m.userData.material === "lamba-isik") m.material.emissiveIntensity = a === "aksam" ? 3 : 1.5;
    this.placeSun();
    this.update();
  }

  /** Motor kamera biçimi (mm, eye/target/fov) ile yerleştirir. */
  setCamera(c) {
    const eye = new THREE.Vector3(...c.eye).multiplyScalar(MM);
    const tgt = new THREE.Vector3(...c.target).multiplyScalar(MM);
    const v = eye.clone().sub(tgt);
    this.orbit.target.copy(tgt);
    this.orbit.dist = v.length();
    if (c.projection === "isometric") {
      // paralel izdüşümü çok dar açılı uzak kamerayla yaklaştır
      c = { ...c, fov: 6 };
      this.orbit.dist = (c.orthoHeight * MM) / 2 / Math.tan((3 * Math.PI) / 180);
    }
    this.orbit.yaw = Math.atan2(v.x, v.z);
    this.orbit.pitch = Math.asin(Math.max(-1, Math.min(1, v.y / v.length())));
    this.cam.fov = c.fov;
    this.cam.updateProjectionMatrix();
    this.update();
  }

  /** Render için geçerli kamera (mm). */
  getCamera() {
    const p = this.cam.position, t = this.orbit.target;
    return { eye: [p.x / MM, p.y / MM, p.z / MM], target: [t.x / MM, t.y / MM, t.z / MM], fov: this.cam.fov, orthoHeight: (2 * this.orbit.dist * Math.tan((this.cam.fov * Math.PI) / 360)) / MM };
  }

  update() {
    if (!this.ok) return;
    const o = this.orbit;
    const cp = Math.cos(o.pitch);
    this.cam.position.set(o.target.x + Math.sin(o.yaw) * cp * o.dist, o.target.y + Math.sin(o.pitch) * o.dist, o.target.z + Math.cos(o.yaw) * cp * o.dist);
    this.cam.lookAt(o.target);
    this.r.render(this.scene, this.cam);
  }
}
