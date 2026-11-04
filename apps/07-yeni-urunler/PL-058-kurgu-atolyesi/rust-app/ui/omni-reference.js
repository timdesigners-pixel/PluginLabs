
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const S = {
    ws: 'edit',
    t: 24, total: 100, playing: false, loop: false, muted: false,
    view: { start: 6, span: 32 },
    tool: 'sec', selected: 'v2',
    lanes: { t1: { lock: false, eye: true, solo: true }, t2: { mute: false, eye: true, solo: true }, t3: { lock: false, mute: false, eye: true } },
    curve: [[0, 8], [40, 30], [60, 73], [100, 84]],
    rigAngle: 15
  };

  const LIB = [
    { id: 'p1', dur: '10:40', cap: 'ARCHIVE_01 · Establishing', art: 1, min: 10.7, tag: 'AE Katman' },
    { id: 'p2', dur: '02:32', cap: 'VO_03 · Anlatım kaydı', art: 2, min: 2.5, tag: 'Fairlight' },
    { id: 'p3', dur: '07:11', cap: 'CAM_A · Ana plan', art: 3, min: 7.2, tag: '4K RAW' },
    { id: 'p4', dur: '04:05', cap: 'CHAR_01 · Karakter rig', art: 6, min: 4.1, tag: 'AI Karakter' },
    { id: 'p5', dur: '03:18', cap: 'COMP_04 · Katman birleşimi', art: 5, min: 3.3, tag: 'Fusion DAG' },
    { id: 'p6', dur: '05:52', cap: 'Biyolüminesans denizanası', art: 'scene', min: 5.9, tag: 'ACEScct' },
  ];

  const CLIPS = {
    t1: [
      { id: 'x1', type: 'text', s: 8.6, e: 19.6, label: 'Başlık · DERİNLİK / Ana kompozisyon' },
      { id: 'x2', type: 'fx', s: 25.0, e: 34.2, label: 'Efekt · Volumetrik ışık / Glow' },
      { id: 'x3', type: 'text', s: 40, e: 52, label: 'Alt başlık · BÖLÜM 02' },
    ],
    t2: [
      { id: 'v1', type: 'video', s: 6.6, e: 17.6, arts: [6, 1, 3], label: 'Sunucu_giriş.mp4' },
      { id: 'v2', type: 'video', s: 19.0, e: 29.0, arts: ['scene', 'scene', 'scene'], label: 'Denizanası_sahnesi.mp4' },
      { id: 'v3', type: 'video', s: 30.2, e: 41, arts: [6, 1, 6, 2], label: 'Pastel_portre.mp4' },
    ],
    t3: [
      { id: 'a1', type: 'audio', s: 9.4, e: 21.6, label: 'Anlatım_01.wav' },
      { id: 'a2', type: 'audio', s: 22.6, e: 37.2, label: 'Anlatım_02.wav' },
    ],
  };
  const LINKS = [['x1', 'v2', 'top'], ['x2', 'v3', 'side']];

  const pad = n => String(Math.floor(n)).padStart(2, '0');
  const mmss = s => `${pad(s / 60)}:${pad(s % 60)}`;
  const hms = s => `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}`;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pct = s => ((s - S.view.start) / S.view.span) * 100;
  const ico = id => `<svg class="pl-ico"><use href="#${id}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const wave = (i, seed) => { const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return 20 + Math.abs(x - Math.floor(x)) * 80; };

  function toast(msg, sub) {
    const el = document.createElement('div');
    el.className = 'pl-toast';
    el.innerHTML = `${ico('i-check')}<div><b>${esc(msg)}</b>${sub ? `<div style="font-size:10.5px;color:var(--pl-fg-3)">${esc(sub)}</div>` : ''}</div>`;
    $('#toasts').append(el);
    setTimeout(() => el.remove(), 3400);
  }

  /* --- 6 Çalışma Alanı Geçişi --- */
  window.switchWorkspace = function(ws) {
    S.ws = ws;
    $$('.pl-ws-page').forEach(p => { p.hidden = p.id !== `ws-${ws}`; });
    $$('.pl-ws-tab').forEach(b => b.classList.toggle('is-active', b.dataset.ws === ws));
    if (ws === 'edit') requestAnimationFrame(drawOverlays);
    if (ws === 'fusion') requestAnimationFrame(() => { drawFusionCables(); drawRigCanvas(); });
    if (ws === 'color') requestAnimationFrame(drawScopes);
    if (ws === 'audio') requestAnimationFrame(initAudioMeters);
  };
  $$('.pl-ws-tab').forEach(b => b.addEventListener('click', () => switchWorkspace(b.dataset.ws)));

  /* --- Sol Kitaplık --- */
  let libSel = 'p6', libShort = false;
  function renderLib() {
    const q = $('#lib-q').value.trim().toLocaleLowerCase('tr');
    const items = LIB.filter(v => (!q || v.cap.toLocaleLowerCase('tr').includes(q)) && (!libShort || v.min < 5));
    $('#lib-list').innerHTML = items.map(v => `<li><button class="pl-kurgu-vcard" role="option" aria-selected="${v.id === libSel}" data-lib="${v.id}">
      <span class="pl-kurgu-art pl-kurgu-art--${v.art}"></span>
      <span class="pl-kurgu-dur">${v.dur}</span>
      <span class="pl-kurgu-tag">${esc(v.tag)}</span>
      <span class="pl-kurgu-cap">${esc(v.cap)}</span></button></li>`).join('');
  }
  $('#lib-q').addEventListener('input', renderLib);
  $('#lib-filter').addEventListener('click', e => {
    libShort = !libShort; e.currentTarget.setAttribute('aria-pressed', libShort); renderLib();
  });
  $('#lib-list').addEventListener('click', e => {
    const b = e.target.closest('[data-lib]'); if (!b) return;
    libSel = b.dataset.lib; renderLib();
    const v = LIB.find(x => x.id === libSel);
    $('#preview-clip-name').textContent = v.cap + '.mp4';
    toast(`“${v.cap}” seçildi`, v.tag);
  });
  $('#btn-add-media').addEventListener('click', () => {
    const id = 'p' + (LIB.length + 1);
    LIB.unshift({ id, dur: '03:20', cap: 'Yeni Sahne Çekimi', art: 4, min: 3.3, tag: 'Yeni' });
    libSel = id; renderLib();
    toast('Yeni medya kitaplığa eklendi');
  });

  /* --- Zaman Çizelgesi --- */
  const tracksEl = $('#tl-tracks');
  function clipHTML(c) {
    const st = `--pl-x:${pct(c.s).toFixed(3)};--pl-w:${((c.e - c.s) / S.view.span * 100).toFixed(3)}`;
    const sel = c.id === S.selected ? ' is-selected' : '';
    if (c.type === 'video') {
      return `<button class="pl-kurgu-clip pl-kurgu-clip--film${sel}" style="${st}" data-clip="${c.id}">${c.arts.map(a => `<span class="pl-kurgu-art pl-kurgu-art--${a}"></span>`).join('')}</button>`;
    }
    if (c.type === 'audio') {
      const bars = Array.from({ length: 36 }, (_, i) => { const s = c.s + (i / 36) * (c.e - c.s); return `<i style="--pl-v:${wave(i, c.s).toFixed(0)}" data-s="${s.toFixed(2)}"></i>`; }).join('');
      return `<button class="pl-kurgu-clip pl-kurgu-clip--audio${sel}" style="${st}" data-clip="${c.id}"><span class="pl-kurgu-clip__ico">${ico('i-mic')}</span><span class="pl-waveform">${bars}</span></button>`;
    }
    const icon = c.type === 'text' ? 'i-type' : 'i-blend';
    return `<button class="pl-kurgu-clip pl-kurgu-clip--chip${sel}" style="${st}" data-clip="${c.id}"><span class="pl-kurgu-clip__ico">${ico(icon)}</span><span>${esc(c.label)}</span></button>`;
  }

  function renderTimeline() {
    const end = S.view.start + S.view.span;
    for (const [lane, list] of Object.entries(CLIPS)) {
      $(`[data-lane="${lane}"]`, tracksEl).innerHTML = list.map(clipHTML).join('');
    }
    let html = '';
    for (let s = Math.ceil(S.view.start); s <= end; s++) {
      const x = pct(s);
      html += s % 5 === 0 ? `<span style="left:${x}%">${hms(s)}</span>` : `<i style="left:${x}%"></i>`;
    }
    $('#tl-ruler').innerHTML = html + '<b id="tl-ruler-ph"></b>';
    requestAnimationFrame(drawOverlays);
  }

  function relRect(el) {
    const a = el.getBoundingClientRect(), b = tracksEl.getBoundingClientRect();
    return { l: a.left - b.left, r: a.right - b.left, t: a.top - b.top, b: a.bottom - b.top, w: a.width, h: a.height, my: a.top - b.top + a.height / 2 };
  }
  function drawOverlays() {
    if (S.ws !== 'edit') return;
    const svg = $('#tl-links'); let out = '';
    for (const [from, to, kind] of LINKS) {
      const ea = $(`[data-clip="${from}"]`, tracksEl), eb = $(`[data-clip="${to}"]`, tracksEl);
      if (!ea || !eb) continue;
      const a = relRect(ea), b = relRect(eb), r = 10;
      if (kind === 'top') {
        const tx = clamp(b.l + b.w * .5, a.r + 18, b.r - 12);
        out += `<path d="M${a.r} ${a.my} H${tx - r} Q${tx} ${a.my} ${tx} ${a.my + r} V${b.t - 3}"/><circle cx="${tx}" cy="${b.t - 3}" r="3"/>`;
      } else {
        const sx = clamp(b.l - 20, a.l + 12, a.r - 12);
        out += `<path d="M${sx} ${a.b} V${b.my - r} Q${sx} ${b.my} ${sx + r} ${b.my} H${b.l - 3}"/><circle cx="${b.l - 3}" cy="${b.my}" r="3"/>`;
      }
    }
    svg.innerHTML = out;
    const v2 = $('[data-clip="v2"]', tracksEl), cur = $('#cur-mert');
    if (v2) { const r = relRect(v2); cur.style.left = `${r.r - 12}px`; cur.style.top = `${r.b - 14}px`; }
  }

  tracksEl.addEventListener('click', e => {
    const b = e.target.closest('[data-clip]'); if (!b) return;
    const lane = b.parentElement.dataset.lane, id = b.dataset.clip;
    const c = Object.values(CLIPS).flat().find(x => x.id === id);
    if (S.tool === 'jilet' && c && (c.e - c.s) > 3) {
      const mid = +((c.s + c.e) / 2).toFixed(1);
      CLIPS[lane].push({ ...c, id: c.id + '_cut', s: mid + 0.3, e: c.e });
      c.e = mid; renderTimeline();
      toast('Klip jilet aracıyla ikiye bölündü', `Kesim: ${hms(mid)}`);
      return;
    }
    S.selected = id; renderTimeline();
  });

  /* --- Üst Araçlar --- */
  $$('.pl-kurgu-tool').forEach(b => b.addEventListener('click', () => {
    S.tool = b.dataset.tool;
    $$('.pl-kurgu-tool').forEach(x => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-pressed', on); });
    if (S.tool === 'jilet') toast('Jilet (Kesme) aracı aktif', 'Bölmek istediğiniz klibe tıklayın');
  }));

  /* --- Oynatma --- */
  let raf = 0, last = 0;
  function setPlaying(p) {
    S.playing = p;
    $('#pv-play').innerHTML = ico(p ? 'i-pause' : 'i-play');
    $('[data-act="present"]').innerHTML = ico(p ? 'i-pause' : 'i-play');
    if (p) { last = performance.now(); raf = requestAnimationFrame(tick); } else cancelAnimationFrame(raf);
  }
  function tick(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    S.t = (S.t + dt) % S.total;
    update();
    if (S.playing) raf = requestAnimationFrame(tick);
  }
  function update() {
    const p = (S.t / S.total) * 100;
    $('#pv-scrub').style.setProperty('--pl-p', `${p}%`);
    $('#pv-time').innerHTML = `${mmss(S.t)}<small>/${mmss(S.total)}</small>`;
    const x = pct(S.t);
    $('#tl-ph').style.setProperty('--pl-p', x);
    const rph = $('#tl-ruler-ph'); if (rph) rph.style.left = `${x}%`;
    $$('.pl-waveform i[data-s]', tracksEl).forEach(i => i.classList.toggle('is-played', +i.dataset.s <= S.t));
    $('#sc-drift')?.setAttribute('transform', `translate(${Math.sin(S.t * .4) * 8} ${Math.sin(S.t * .7) * 9})`);
    $('.pl-kurgu-queen')?.setAttribute('transform', `translate(470 ${270 + Math.sin(S.t * .6) * 8})`);
    if (S.ws === 'fusion') drawRigCanvas();
    if (S.ws === 'color') drawScopes();
  }
  $('#pv-play').addEventListener('click', () => setPlaying(!S.playing));
  $('[data-act="present"]').addEventListener('click', () => setPlaying(!S.playing));
  $('#pv-rew').addEventListener('click', () => { S.t = clamp(S.t - 5, 0, S.total); update(); });
  $('#pv-ffw').addEventListener('click', () => { S.t = clamp(S.t + 5, 0, S.total); update(); });

  function dragSeek(el, toTime) {
    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      const move = ev => { S.t = clamp(toTime(ev, el.getBoundingClientRect()), 0, S.total); update(); };
      move(e); el.onpointermove = move; el.onpointerup = () => { el.onpointermove = null; };
    });
  }
  dragSeek($('#pv-scrub'), (e, r) => ((e.clientX - r.left) / r.width) * S.total);
  dragSeek($('#tl-ruler'), (e, r) => S.view.start + ((e.clientX - r.left) / r.width) * S.view.span);

  /* --- Sağ Denetçi & Eğriler --- */
  $$('[data-insp]').forEach(b => b.addEventListener('click', () => {
    $$('[data-insp]').forEach(x => x.classList.toggle('is-active', x === b));
    ['video', 'anim', 'track'].forEach(k => { $(`#insp-${k}`).hidden = k !== b.dataset.insp; });
  }));
  $$('[data-cc]').forEach(b => b.addEventListener('click', () => {
    $$('[data-cc]').forEach(x => x.classList.toggle('pl-chip--accent', x === b));
    $$('[data-ccpane]').forEach(p => { p.hidden = p.dataset.ccpane !== b.dataset.cc; });
  }));

  const curveSvg = $('#curve');
  const cx = v => v * 2, cy = v => 110 - v * 1.1;
  function smooth(pts) {
    const P = pts.map(([x, y]) => [cx(x), cy(y)]);
    let d = `M${P[0][0]} ${P[0][1]}`;
    for (let i = 0; i < P.length - 1; i++) {
      const p0 = P[i - 1] || P[i], p1 = P[i], p2 = P[i + 1], p3 = P[i + 2] || p2;
      d += ` C${p1[0] + (p2[0] - p0[0]) / 6} ${p1[1] + (p2[1] - p0[1]) / 6} ${p2[0] - (p3[0] - p1[0]) / 6} ${p2[1] - (p3[1] - p1[1]) / 6} ${p2[0]} ${p2[1]}`;
    }
    return d;
  }
  function drawCurve() {
    const L = smooth(S.curve), m = S.curve[2], mx = cx(m[0]);
    $('#curve-l').setAttribute('d', L);
    $('#curve-y').setAttribute('d', smooth([[0, 62], [45, 70], [70, 40], [100, 52]]));
    $('#curve-area').setAttribute('d', `${L} V110 H0 Z`);
    $('#curve-mark').setAttribute('x1', mx); $('#curve-mark').setAttribute('x2', mx);
    $('#curve-dot').setAttribute('cx', mx); $('#curve-dot').setAttribute('cy', cy(m[1]));
    const brt = 100 + (m[1] - 73) * 0.45;
    $('#main-scene-svg').style.filter = `brightness(${brt}%)`;
  }
  curveSvg.addEventListener('pointerdown', e => {
    curveSvg.setPointerCapture(e.pointerId);
    const move = ev => {
      const r = curveSvg.getBoundingClientRect();
      S.curve[2] = [clamp(((ev.clientX - r.left) / r.width) * 100, 46, 94), clamp(100 - ((ev.clientY - r.top) / r.height) * 100, 5, 95)];
      drawCurve();
    };
    move(e); curveSvg.onpointermove = move; curveSvg.onpointerup = () => { curveSvg.onpointermove = null; };
  });

  $$('.pl-kurgu-wheel').forEach(w => {
    w.addEventListener('pointerdown', e => {
      w.setPointerCapture(e.pointerId);
      const dot = w.querySelector('i');
      const move = ev => {
        const r = w.getBoundingClientRect();
        const x = clamp(((ev.clientX - r.left) / r.width) * 100, 18, 82);
        const y = clamp(((ev.clientY - r.top) / r.height) * 100, 18, 82);
        dot.style.setProperty('--pl-x', `${x}%`); dot.style.setProperty('--pl-y', `${y}%`);
        const hue = Math.round((x - 50) * 1.4);
        $('#main-scene-svg').style.filter = `hue-rotate(${hue}deg)`;
        const rs = $('#resolve-scene-svg'); if (rs) rs.style.filter = `hue-rotate(${hue}deg)`;
      };
      move(e); w.onpointermove = move; w.onpointerup = () => { w.onpointermove = null; };
    });
  });

  /* MyMind preview: no provider request, no fabricated output. */
  $$('[data-ai]').forEach(b=>b.addEventListener('click',()=>toast('MyMind · Tasarım önizlemesi','Bu özellik henüz bağlı değil; veri gönderilmedi.')));
  /* --- SEKME 2: Fusion Düğüm Editörü & 3D AI Karakter Rig --- */
  function bindFusionDrag() {
    const box = $('#fusion-graph-box');
    $$('#fusion-nodes-layer .pl-fusion-node').forEach(node => {
      node.onpointerdown = e => {
        node.setPointerCapture(e.pointerId);
        $$('#fusion-nodes-layer .pl-fusion-node').forEach(n => n.classList.remove('is-selected'));
        node.classList.add('is-selected');
        const titleEl = $('#fusion-insp-title');
        if (titleEl) titleEl.textContent = node.querySelector('span:not(.pl-fusion-port):not(.pl-fusion-node__badge)')?.textContent || 'Node';
        const sx = e.clientX, sy = e.clientY, ox = parseFloat(node.style.left) || 0, oy = parseFloat(node.style.top) || 0;
        node.onpointermove = ev => {
          node.style.left = `${clamp(ox + (ev.clientX - sx), 12, box.clientWidth - 190)}px`;
          node.style.top = `${clamp(oy + (ev.clientY - sy), 42, box.clientHeight - 96)}px`;
          drawFusionCables();
        };
        node.onpointerup = () => { node.onpointermove = null; };
      };
    });
  }
  function drawFusionCables() {
    const svg = $('#fusion-svg-lines'); if (!svg) return;
    const nodes = $$('#fusion-nodes-layer .pl-fusion-node');
    if (nodes.length < 5) return;
    const p = nodes.map(el => ({ x: parseFloat(el.style.left) || 0, y: parseFloat(el.style.top) || 0, w: el.offsetWidth || 176, h: el.offsetHeight || 96 }));
    const link = (a, b, col) => {
      const x1 = a.x + a.w, y1 = a.y + a.h / 2, x2 = b.x, y2 = b.y + b.h / 2, dx = Math.abs(x2 - x1) * 0.5;
      return `<path d="M${x1} ${y1} C${x1 + dx} ${y1}, ${x2 - dx} ${y2}, ${x2} ${y2}" stroke="${col}" stroke-width="2.2" fill="none"/>`;
    };
    let html = link(p[0], p[2], 'var(--pl-viz-1)') + link(p[2], p[3], 'var(--pl-viz-5)') + link(p[1], p[3], 'var(--pl-viz-4)') + link(p[3], p[4], 'var(--pl-viz-3)');
    for (let i = 5; i < p.length; i++) html += link(p[2], p[i], 'var(--pl-viz-6)') + link(p[i], p[3], 'var(--pl-accent)');
    svg.innerHTML = html;
  }
  window.addFusionNode = function(title, sub, colVar, art = 5) {
    const layer = $('#fusion-nodes-layer');
    const el = document.createElement('div');
    el.className = 'pl-fusion-node is-selected';
    el.style.left = `${310 + Math.round(Math.random() * 140)}px`;
    el.style.top = `${160 + Math.round(Math.random() * 45)}px`;
    el.innerHTML = `<span class="pl-fusion-port pl-fusion-port--in"></span><span class="pl-fusion-port pl-fusion-port--out"></span><div class="pl-fusion-node__thumb"><div class="pl-kurgu-art pl-kurgu-art--${art}" style="width:100%;height:100%"></div><span class="pl-fusion-node__badge">AI Node</span></div><div style="display:flex;justify-content:space-between;align-items:center;font-size:11.5px;font-weight:600;color:var(--pl-fg-1)"><span>${esc(title)}</span><span class="pl-fusion-dot" style="--pl-c:var(${colVar})"></span></div><div style="font-size:10px;color:var(--pl-fg-3);font-family:var(--pl-font-mono)">${esc(sub)}</div>`;
    layer.append(el); bindFusionDrag(); drawFusionCables();
    toast(`${title} düğümü ağaca eklendi`);
  };
  bindFusionDrag();

  function drawRigCanvas() {
    const c = $('#fusion-rig-canvas'); if (!c || !c.offsetParent) return;
    if (c.width !== c.clientWidth) { c.width = c.clientWidth; c.height = c.clientHeight; }
    const ctx = c.getContext('2d'), w = c.width, h = c.height, cx = w / 2, cy = h / 2;
    ctx.clearRect(0, 0, w, h);
    // 3D Perspektif Zemin Izgarası
    ctx.strokeStyle = 'rgba(139,124,255,0.14)'; ctx.lineWidth = 1;
    for (let i = -4; i <= 4; i++) {
      ctx.beginPath(); ctx.moveTo(cx + i * 28, cy + 50); ctx.lineTo(cx + i * 65, h); ctx.stroke();
    }
    const rad = (S.rigAngle * Math.PI) / 180 + Math.sin(S.t * 2) * 0.08;
    const joints = [
      [cx, cy - 68], [cx, cy - 28],
      [cx - 52 * Math.cos(rad), cy - 26 + 42 * Math.sin(rad)],
      [cx + 52 * Math.cos(rad), cy - 26 - 42 * Math.sin(rad)],
      [cx, cy + 32], [cx - 28, cy + 88], [cx + 28, cy + 88]
    ];
    const bones = [[0,1],[1,2],[1,3],[1,4],[4,5],[4,6]];
    ctx.strokeStyle = '#8b7cff'; ctx.lineWidth = 3;
    bones.forEach(([a, b]) => { ctx.beginPath(); ctx.moveTo(joints[a][0], joints[a][1]); ctx.lineTo(joints[b][0], joints[b][1]); ctx.stroke(); });
    joints.forEach(([x, y], i) => { ctx.fillStyle = i === 0 ? '#ff7eb6' : '#34d399'; ctx.beginPath(); ctx.arc(x, y, i === 0 ? 13 : 5.5, 0, Math.PI * 2); ctx.fill(); });
  }
  $('#rig-angle-slider')?.addEventListener('input', e => {
    S.rigAngle = +e.target.value;
    $('#rig-angle-lbl').textContent = `${S.rigAngle}°`;
    drawRigCanvas();
  });

  /* --- SEKME 4: DaVinci Hollow Ring Tekerlekler, LUT & Yoğun Skoplar --- */
  window.applyResolveLut = function(hue, sat, name) {
    const rs = $('#resolve-scene-svg');
    if (rs) rs.style.filter = `hue-rotate(${hue}deg) saturate(${sat}%)`;
    $('#main-scene-svg').style.filter = `hue-rotate(${hue}deg) saturate(${sat}%)`;
    const badge = $('#resolve-active-lut'); if (badge) badge.textContent = `LUT: ${name}`;
    toast(`3D LUT uygulandı: ${name}`);
  };

  $$('.pl-pro-ring').forEach(ring => {
    ring.addEventListener('pointerdown', e => {
      ring.setPointerCapture(e.pointerId);
      const dot = ring.querySelector('i');
      const move = ev => {
        const r = ring.getBoundingClientRect();
        const x = clamp(((ev.clientX - r.left) / r.width) * 100, 22, 78);
        const y = clamp(((ev.clientY - r.top) / r.height) * 100, 22, 78);
        dot.style.setProperty('--pl-x', `${x}%`); dot.style.setProperty('--pl-y', `${y}%`);
        const hue = Math.round((x - 50) * 1.6);
        const rs = $('#resolve-scene-svg'); if (rs) rs.style.filter = `hue-rotate(${hue}deg)`;
        $('#main-scene-svg').style.filter = `hue-rotate(${hue}deg)`;
      };
      move(e); ring.onpointermove = move; ring.onpointerup = () => { ring.onpointermove = null; };
    });
  });

  $$('.pl-pro-thumb').forEach(t => t.addEventListener('click', () => {
    $$('.pl-pro-thumb').forEach(x => x.classList.remove('is-active'));
    t.classList.add('is-active');
  }));

  function drawScopes() {
    const p = $('#scope-parade'), v = $('#scope-vector');
    if (p && p.offsetParent) {
      p.width = p.clientWidth; p.height = p.clientHeight;
      const ctx = p.getContext('2d'), cw = p.width / 3, h = p.height;
      ctx.strokeStyle = 'rgba(255,255,255,0.06)';
      [0.2, 0.5, 0.8].forEach(y => { ctx.beginPath(); ctx.moveTo(0, h * y); ctx.lineTo(p.width, h * y); ctx.stroke(); });
      [['rgba(255,94,126,0.38)', 0], ['rgba(52,211,153,0.38)', 1], ['rgba(56,189,248,0.42)', 2]].forEach(([col, idx]) => {
        ctx.fillStyle = col;
        for (let i = 0; i < 140; i++) {
          const x = idx * cw + (i / 140) * cw;
          const waveY = h * (0.28 + 0.42 * Math.sin(i * 0.08 + S.t * 0.8 + idx));
          ctx.fillRect(x, waveY - 14, 1.8, 28);
          ctx.fillRect(x, waveY - 4, 1.8, 8);
        }
      });
    }
    if (v && v.offsetParent) {
      v.width = v.clientWidth; v.height = v.clientHeight;
      const ctx = v.getContext('2d'), cx = v.width / 2, cy = v.height / 2, r = Math.min(cx, cy) - 10;
      ctx.strokeStyle = 'rgba(255,255,255,0.14)';
      ctx.beginPath(); ctx.arc(cx, cy, r, 0, Math.PI * 2); ctx.stroke();
      ctx.beginPath(); ctx.arc(cx, cy, r * 0.5, 0, Math.PI * 2); ctx.stroke();
      ctx.fillStyle = 'rgba(52, 211, 153, 0.45)';
      for (let i = 0; i < 95; i++) {
        const a = i * 0.25 + S.t * 0.3, d = (Math.sin(i * 1.3) * 0.35 + 0.38) * r;
        ctx.fillRect(cx + Math.cos(a) * d, cy + Math.sin(a) * d, 2.2, 2.2);
      }
    }
  }

  /* --- SEKME 5: Fairlight LED VU Meter & Fader --- */
  function initAudioMeters() {
    $$('.pl-meter-led').forEach(m => {
      if (!m.children.length) {
        const lvl = +m.dataset.meter || 75;
        m.innerHTML = Array.from({ length: 24 }, (_, i) => {
          const pct = (i / 24) * 100;
          const col = pct > 85 ? 'var(--pl-viz-1)' : pct > 68 ? 'var(--pl-viz-4)' : 'var(--pl-viz-5)';
          return `<i class="${pct <= lvl ? 'is-lit' : ''}" style="--pl-c:${col}"></i>`;
        }).join('');
      }
    });
  }
  initAudioMeters();

  $$('.pl-fader-cap').forEach(cap => {
    cap.addEventListener('pointerdown', e => {
      cap.setPointerCapture(e.pointerId);
      const track = cap.parentElement;
      const move = ev => {
        const r = track.getBoundingClientRect();
        const pct = clamp(((ev.clientY - r.top) / r.height) * 100, 6, 88);
        cap.style.top = `${pct}%`;
      };
      move(e); cap.onpointermove = move; cap.onpointerup = () => { cap.onpointermove = null; };
    });
  });

  /* --- SEKME 3: After Effects Bezier Teğet Kolu --- */
  const aeSvg = $('#ae-bezier-svg'), aeDot = $('#ae-handle-dot');
  if (aeSvg && aeDot) {
    aeDot.addEventListener('pointerdown', e => {
      aeDot.setPointerCapture(e.pointerId);
      const move = ev => {
        const r = aeSvg.getBoundingClientRect();
        const x = clamp(((ev.clientX - r.left) / r.width) * 600, 80, 420);
        const y = clamp(((ev.clientY - r.top) / r.height) * 150, 15, 140);
        aeDot.setAttribute('cx', x); aeDot.setAttribute('cy', y);
        $('#ae-handle-line').setAttribute('x2', x); $('#ae-handle-line').setAttribute('y2', y);
        $('#ae-bezier-curve').setAttribute('d', `M 60 125 C ${x} ${y}, 360 25, 540 25`);
      };
      move(e); aeDot.onpointermove = move; aeDot.onpointerup = () => { aeDot.onpointermove = null; };
    });
  }

  /* Deliver preview does not create a fake render job. */
  $('#start-rust-render-btn')?.addEventListener('click',()=>toast('Teslim arayüzü · Önizleme','Bu ekranda render çalıştırılmaz.'));
  /* --- Ses Kaydırıcısı & Komut Paleti --- */
  const vol = $('#vol');
  vol?.addEventListener('input', () => {
    vol.style.setProperty('--pl-val', `${vol.value}%`);
    $('#vol-out').textContent = `%${vol.value}`;
  });
  $$('.pl-slider').forEach(s => s.addEventListener('input', () => s.style.setProperty('--pl-val', `${((s.value - (s.min || 0)) / ((s.max || 100) - (s.min || 0))) * 100}%`)));

  const dlg = $('#cmdk');
  document.addEventListener('keydown', e => {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
      e.preventDefault();
      if (dlg.open) dlg.close();
      else {
        $('#cmdk-list').innerHTML = [
          ['1. Kurgu Atölyesi (Edit)', () => switchWorkspace('edit')],
          ['2. AI Karakter & Düğüm Editörü (Fusion)', () => switchWorkspace('fusion')],
          ['3. Hareketli Grafik (After Effects)', () => switchWorkspace('ae')],
          ['4. Renk Laboratuvarı (DaVinci ACES)', () => switchWorkspace('color')],
          ['5. Ses Mikseri (Fairlight)', () => switchWorkspace('audio')],
          ['6. Dışa Aktar & Rust Telemetri', () => switchWorkspace('deliver')]
        ].map(([lbl], i) => `<div class="pl-cmdk__item" data-cmd="${i}"><span>${lbl}</span><span class="pl-badge pl-badge--soft">Git</span></div>`).join('');
        $$('[data-cmd]', dlg).forEach((el, i) => el.onclick = () => { dlg.close(); switchWorkspace(['edit','fusion','ae','color','audio','deliver'][i]); });
        dlg.showModal();
      }
    }
  });

  /* --- Başlangıç Çizimleri --- */
  $('#pv-ticks').innerHTML = CLIPS.t2.map(c => `<i style="left:${(c.s / S.total) * 100}%"></i>`).join('');
  renderLib();
  renderTimeline();
  drawCurve();
  update();
  window.addEventListener('resize', () => {
    requestAnimationFrame(drawOverlays);
    if (S.ws === 'fusion') { drawFusionCables(); drawRigCanvas(); }
    if (S.ws === 'color') drawScopes();
  });
})();
