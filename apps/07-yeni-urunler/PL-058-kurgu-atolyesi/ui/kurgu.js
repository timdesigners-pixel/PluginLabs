/* PL-058 · Kurgu Atölyesi — arayüz davranışı (bağımlılıksız, tek dosya)
   Durum tek nesnede (S) tutulur; çizim fonksiyonları durumdan DOM'u üretir. */
(() => {
  'use strict';
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const root = $('[data-pl]');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------------- Durum ve veri ---------------- */
  const S = {
    t: 31, total: 100, playing: false, loop: false, muted: false,
    view: { start: 8, span: 30 },
    volume: 75, musicMuted: true, tool: 'sec', selected: 'v2',
    lanes: { t1: { lock: false, eye: true, solo: true }, t2: { mute: false, eye: true, solo: true }, t3: { lock: false, mute: false, eye: true } },
    curve: [[0, 8], [40, 30], [60, 73], [100, 84]], // giriş → çıkış (%)
  };

  const LIB = [
    { id: 'p1', dur: '10:40', cap: 'Metin üretimine giriş', art: 1, min: 10.7 },
    { id: 'p2', dur: '02:32', cap: 'Ses üretimine giriş', art: 2, min: 2.5 },
    { id: 'p3', dur: '07:11', cap: 'Video üretimine giriş', art: 3, min: 7.2 },
    { id: 'p4', dur: '04:05', cap: 'Avatar üretimine giriş', art: 6, min: 4.1 },
    { id: 'p5', dur: '03:18', cap: 'Görsel üretimi atölyesi', art: 5, min: 3.3 },
    { id: 'p6', dur: '05:52', cap: 'Projeyi dışa aktarma ipuçları', art: 4, min: 5.9 },
  ];

  const CLIPS = {
    t1: [
      { id: 'x1', type: 'text', s: 8.6, e: 19.6, label: 'Metin: Eğitim oturumumuza hoş geldiniz! Başlayalım…' },
      { id: 'x2', type: 'fx', s: 26.4, e: 34.2, label: 'Efekt: Gölge_koleksiyonu_01' },
      { id: 'x3', type: 'text', s: 40, e: 52, label: 'Metin: Bölüm 2 — Ses üretimi' },
      { id: 'x4', type: 'fx', s: 58, e: 66, label: 'Efekt: Yumuşak_geçiş_02' },
      { id: 'x5', type: 'text', s: 72, e: 86, label: 'Metin: Özet ve sonraki adımlar' },
      { id: 'x6', type: 'fx', s: 90, e: 98, label: 'Efekt: Kapanış_parıltısı' },
    ],
    t2: [
      { id: 'v0', type: 'video', s: 0, e: 6.2, arts: [4, 4], label: 'Açılış.mp4' },
      { id: 'v1', type: 'video', s: 6.6, e: 16.6, arts: [6, 1, 3], label: 'Sunucu_giriş.mp4' },
      { id: 'v2', type: 'video', s: 19.6, e: 28.6, arts: ['scene', 'scene', 'scene'], label: 'Denizanası_sahnesi.mp4' },
      { id: 'v3', type: 'video', s: 30.2, e: 41, arts: [6, 1, 6, 2], label: 'Pastel_portre.mp4' },
      { id: 'v4', type: 'video', s: 42, e: 55, arts: [2, 2, 3, 2], label: 'Kış_balonları.mp4' },
      { id: 'v5', type: 'video', s: 56, e: 70, arts: [3, 3, 5, 3], label: 'Buz_dağı.mp4' },
      { id: 'v6', type: 'video', s: 71, e: 84, arts: [5, 'scene', 5, 5], label: 'Mercan_bahçesi.mp4' },
      { id: 'v7', type: 'video', s: 85, e: 100, arts: [1, 6, 1, 4], label: 'Kapanış.mp4' },
    ],
    t3: [
      { id: 'a1', type: 'audio', s: 9.4, e: 21.6, label: 'Anlatım_01.wav' },
      { id: 'a2', type: 'audio', s: 22.6, e: 37.2, label: 'Anlatım_02.wav' },
      { id: 'a3', type: 'audio', s: 38, e: 60, label: 'Anlatım_03.wav' },
      { id: 'a4', type: 'audio', s: 61, e: 80, label: 'Anlatım_04.wav' },
      { id: 'a5', type: 'audio', s: 81, e: 99, label: 'Anlatım_05.wav' },
    ],
  };
  const LINKS = [['x1', 'v2', 'top'], ['x2', 'v3', 'side'], ['x3', 'v4', 'top'], ['x5', 'v6', 'top']];
  const clipById = id => Object.values(CLIPS).flat().find(c => c.id === id);

  /* ---------------- Yardımcılar ---------------- */
  const pad = n => String(Math.floor(n)).padStart(2, '0');
  const mmss = s => `${pad(s / 60)}:${pad(s % 60)}`;
  const hms = s => `${pad(s / 3600)}:${pad((s % 3600) / 60)}:${pad(s % 60)}`;
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const pct = s => ((s - S.view.start) / S.view.span) * 100;
  const ico = id => `<svg class="pl-ico"><use href="#${id}"/></svg>`;
  const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  // Deterministik dalga (her yüklemede aynı)
  const wave = (i, seed) => { const x = Math.sin(i * 12.9898 + seed * 78.233) * 43758.5453; return 18 + Math.abs(x - Math.floor(x)) * 82; };

  /* ---------------- Geri al / yinele ---------------- */
  const hist = { past: [], future: [] };
  function act(label, redo, undo) { redo(); hist.past.push({ label, redo, undo }); hist.future = []; }
  function undo() { const h = hist.past.pop(); if (!h) return toast('Geri alınacak işlem yok', null, 'info'); h.undo(); hist.future.push(h); toast(`Geri alındı: ${h.label}`, null, 'info'); }
  function redo() { const h = hist.future.pop(); if (!h) return toast('Yinelenecek işlem yok', null, 'info'); h.redo(); hist.past.push(h); toast(`Yinelendi: ${h.label}`, null, 'info'); }

  /* ---------------- Toast ---------------- */
  function toast(msg, sub, kind = 'success', action) {
    const color = { success: 'var(--pl-success)', info: 'var(--pl-info)', warning: 'var(--pl-warning)', ai: 'var(--pl-gold)' }[kind];
    const icon = kind === 'success' ? 'i-check' : kind === 'ai' ? 'i-spark' : 'i-info';
    const el = document.createElement('div');
    el.className = 'pl-toast';
    el.style.setProperty('--pl-c', color);
    el.innerHTML = `${ico(icon)}<div class="pl-toast__body">${esc(msg)}${sub ? `<small>${esc(sub)}</small>` : ''}</div>${action ? `<button class="pl-toast__action">${esc(action.label)}</button>` : ''}`;
    if (action) el.querySelector('button').onclick = () => { action.run(); el.remove(); };
    $('#toasts').append(el);
    setTimeout(() => el.remove(), action ? 6000 : 3600);
  }

  /* ---------------- Kitaplık ---------------- */
  let libSel = 'p1', libShort = false;
  function renderLib() {
    const q = $('#lib-q').value.trim().toLocaleLowerCase('tr');
    const items = LIB.filter(v => (!q || v.cap.toLocaleLowerCase('tr').includes(q)) && (!libShort || v.min < 5));
    $('#lib-list').innerHTML = items.map(v => `<li><button class="pl-kurgu-vcard" role="option" aria-selected="${v.id === libSel}" data-lib="${v.id}">
      <span class="pl-kurgu-art pl-kurgu-art--${v.art}"></span><span class="pl-kurgu-dur">${v.dur}</span><span class="pl-kurgu-cap">${esc(v.cap)}</span></button></li>`).join('');
    $('#lib-empty').hidden = items.length > 0;
  }
  $('#lib-q').addEventListener('input', renderLib);
  $('#lib-filter').addEventListener('click', e => {
    libShort = !libShort; e.currentTarget.setAttribute('aria-pressed', libShort); renderLib();
    toast(libShort ? 'Süzgeç: 5 dakikadan kısa videolar' : 'Süzgeç kaldırıldı', null, 'info');
  });
  $('#lib-list').addEventListener('click', e => {
    const b = e.target.closest('[data-lib]'); if (!b) return;
    const prev = libSel, id = b.dataset.lib, v = LIB.find(x => x.id === id);
    act('video seçimi', () => { libSel = id; renderLib(); }, () => { libSel = prev; renderLib(); });
    toast(`“${v.cap}” önizlemeye alındı`, `Süre ${v.dur}`);
  });

  /* ---------------- Araçlar ---------------- */
  const TOOL_NAMES = { sec: 'Seç', metin: 'Metin', sekil: 'Şekil', gorsel: 'Görsel', efekt: 'Efekt' };
  function setTool(t) {
    S.tool = t;
    $$('.pl-kurgu-tool').forEach(b => { const on = b.dataset.tool === t; b.classList.toggle('is-active', on); b.setAttribute('aria-pressed', on); });
  }
  $$('.pl-kurgu-tool').forEach(b => b.addEventListener('click', () => {
    const prev = S.tool, next = b.dataset.tool; if (prev === next) return;
    act(`${TOOL_NAMES[next]} aracı`, () => setTool(next), () => setTool(prev));
  }));

  /* ---------------- Oynatma ---------------- */
  const playBtn = $('#pv-play');
  let raf = 0, last = 0;
  function setPlaying(p) {
    S.playing = p;
    playBtn.innerHTML = ico(p ? 'i-pause' : 'i-play');
    playBtn.setAttribute('aria-label', p ? 'Duraklat (Boşluk)' : 'Oynat (Boşluk)');
    $('[data-act="present"]').innerHTML = ico(p ? 'i-pause' : 'i-play');
    if (p) { if (S.t >= S.total) S.t = 0; last = performance.now(); raf = requestAnimationFrame(tick); }
    else cancelAnimationFrame(raf);
  }
  function tick(now) {
    const dt = Math.min(.1, (now - last) / 1000); last = now;
    S.t += dt;
    if (S.t >= S.total) { if (S.loop) S.t = 0; else { S.t = S.total; setPlaying(false); } }
    update();
    if (S.playing) raf = requestAnimationFrame(tick);
  }
  function seek(t) { S.t = clamp(t, 0, S.total); update(); }
  playBtn.addEventListener('click', () => setPlaying(!S.playing));
  $('[data-act="present"]').addEventListener('click', () => setPlaying(!S.playing));
  $('#pv-rew').addEventListener('click', () => seek(S.t - 5));
  $('#pv-ffw').addEventListener('click', () => seek(S.t + 5));
  $('#pv-loop').addEventListener('click', e => { S.loop = !S.loop; e.currentTarget.setAttribute('aria-pressed', S.loop); toast(S.loop ? 'Döngü açık' : 'Döngü kapalı', null, 'info'); });
  function setMuted(m) {
    S.muted = m; const b = $('#pv-mute');
    b.innerHTML = ico(m ? 'i-volx' : 'i-vol'); b.setAttribute('aria-pressed', m); b.setAttribute('aria-label', m ? 'Sesi aç (M)' : 'Sesi kapat (M)');
  }
  $('#pv-mute').addEventListener('click', () => setMuted(!S.muted));
  function fullscreen() {
    const el = $('.pl-kurgu-preview');
    if (document.fullscreenElement) document.exitFullscreen(); else el.requestFullscreen?.().catch(() => toast('Tam ekran bu ortamda kullanılamıyor', null, 'warning'));
  }
  $('#pv-full').addEventListener('click', fullscreen);
  $('#pv-tune').addEventListener('click', () => toast('Önizleme: %100 · 1920×1080 · 30 FPS', 'Oynatma kalitesi Ayarlar’dan değiştirilir', 'info'));

  // Sürüklenebilir konum çubukları (önizleme + cetvel)
  function dragSeek(el, toTime) {
    el.addEventListener('pointerdown', e => {
      el.setPointerCapture(e.pointerId);
      const move = ev => seek(toTime(ev, el.getBoundingClientRect()));
      move(e);
      el.onpointermove = move;
      el.onpointerup = () => { el.onpointermove = null; };
    });
    el.addEventListener('keydown', e => {
      const step = e.shiftKey ? 5 : 1;
      if (e.key === 'ArrowLeft') { seek(S.t - step); e.preventDefault(); e.stopPropagation(); }
      if (e.key === 'ArrowRight') { seek(S.t + step); e.preventDefault(); e.stopPropagation(); }
      if (e.key === 'Home') { seek(0); e.preventDefault(); }
      if (e.key === 'End') { seek(S.total); e.preventDefault(); }
    });
  }
  dragSeek($('#pv-scrub'), (e, r) => ((e.clientX - r.left) / r.width) * S.total);
  dragSeek($('#tl-ruler'), (e, r) => S.view.start + ((e.clientX - r.left) / r.width) * S.view.span);

  /* ---------------- Zaman çizelgesi ---------------- */
  const tracksEl = $('#tl-tracks');
  function clipHTML(c) {
    const st = `--x:${pct(c.s).toFixed(3)};--w:${((c.e - c.s) / S.view.span * 100).toFixed(3)}`;
    const sel = c.id === S.selected ? ' is-selected' : '';
    const aria = `${c.label}, başlangıç ${hms(c.s)}, süre ${Math.round(c.e - c.s)} sn`;
    if (c.type === 'video') {
      return `<button class="pl-kurgu-clip pl-kurgu-clip--film${sel}" style="${st}" data-clip="${c.id}" aria-label="Video klibi: ${esc(aria)}" aria-pressed="${!!sel}">${c.arts.map(a => `<span class="pl-kurgu-art pl-kurgu-art--${a}"></span>`).join('')}</button>`;
    }
    if (c.type === 'audio') {
      const n = Math.max(8, Math.round((c.e - c.s) * 5));
      const bars = Array.from({ length: n }, (_, i) => { const s = c.s + (i / n) * (c.e - c.s); return `<i style="--v:${wave(i, c.s).toFixed(0)}" data-s="${s.toFixed(2)}"></i>`; }).join('');
      return `<button class="pl-kurgu-clip pl-kurgu-clip--audio${sel}" style="${st}" data-clip="${c.id}" aria-label="Ses klibi: ${esc(aria)}" aria-pressed="${!!sel}"><span class="pl-kurgu-clip__ico">${ico('i-mic')}</span><span class="pl-waveform" aria-hidden="true">${bars}</span></button>`;
    }
    const icon = c.type === 'text' ? 'i-type' : 'i-blend';
    return `<button class="pl-kurgu-clip pl-kurgu-clip--chip${sel}" style="${st}" data-clip="${c.id}" aria-label="${c.type === 'text' ? 'Metin' : 'Efekt'} klibi: ${esc(aria)}" aria-pressed="${!!sel}"><span class="pl-kurgu-clip__ico">${ico(icon)}</span><span>${esc(c.label)}</span></button>`;
  }
  function renderTimeline() {
    const end = S.view.start + S.view.span;
    for (const [lane, list] of Object.entries(CLIPS)) {
      $(`[data-lane="${lane}"]`, tracksEl).innerHTML = list.filter(c => c.e > S.view.start - 1 && c.s < end + 1).map(clipHTML).join('');
    }
    // Cetvel: her 5 sn etiket, arada 4 nokta
    let html = '';
    for (let s = Math.ceil(S.view.start); s <= end; s++) {
      const x = pct(s);
      html += s % 5 === 0 ? `<span style="left:${x}%">${hms(s)}</span>` : `<i style="left:${x}%"></i>`;
    }
    $('#tl-ruler').innerHTML = html + '<b id="tl-ruler-ph"></b>';
    applyLaneState();
    requestAnimationFrame(drawOverlays);
  }
  function relRect(el) {
    const a = el.getBoundingClientRect(), b = tracksEl.getBoundingClientRect();
    return { l: a.left - b.left, r: a.right - b.left, t: a.top - b.top, b: a.bottom - b.top, w: a.width, h: a.height, my: a.top - b.top + a.height / 2 };
  }
  function drawOverlays() {
    const svg = $('#tl-links'); let out = '';
    for (const [from, to, kind] of LINKS) {
      const ea = $(`[data-clip="${from}"]`, tracksEl), eb = $(`[data-clip="${to}"]`, tracksEl);
      if (!ea || !eb) continue;
      const a = { ...relRect(ea), next: ea.nextElementSibling }, b = relRect(eb), r = 10;
      if (kind === 'top') {
        // Dönüş noktası aynı izdeki bir sonraki klibin önünde kalır (çizgi yazının üstünden geçmez)
        const next = a.next ? relRect(a.next).l - 14 : Infinity;
        const tx = Math.min(clamp(b.l + b.w * .62, a.r + 24, b.r - 14), next);
        out += `<path d="M${a.r} ${a.my} H${tx - r} Q${tx} ${a.my} ${tx} ${a.my + r} V${b.t - 3}"/><circle cx="${tx}" cy="${b.t - 3}" r="3"/>`;
      } else {
        const sx = clamp(b.l - 28, a.l + 12, a.r - 12);
        out += `<path d="M${sx} ${a.b} V${b.my - r} Q${sx} ${b.my} ${sx + r} ${b.my} H${b.l - 3}"/><circle cx="${b.l - 3}" cy="${b.my}" r="3"/>`;
      }
    }
    svg.innerHTML = out;
    // Mert'in imleci v2 klibinin sağ altında durur
    const v2 = $('[data-clip="v2"]', tracksEl), cur = $('#cur-mert');
    if (v2) { const r = relRect(v2); cur.hidden = false; cur.style.left = `${r.r - 12}px`; cur.style.top = `${r.b - 14}px`; } else cur.hidden = true;
  }
  tracksEl.addEventListener('click', e => {
    const b = e.target.closest('[data-clip]'); if (!b) return;
    const lane = b.parentElement.dataset.lane;
    if (S.lanes[lane].lock) return toast('Bu iz kilitli', 'Düzenlemek için kilidi aç', 'warning');
    const prev = S.selected, next = b.dataset.clip;
    if (prev === next) return;
    act('klip seçimi', () => { S.selected = next; renderTimeline(); }, () => { S.selected = prev; renderTimeline(); });
    const c = clipById(next);
    if (S.tool === 'sec') seek(c.s);
  });

  // İz başlıkları: kilit / görünürlük / ses
  const TOG_ICON = { lock: ['i-lock', 'i-unlock'], eye: ['i-eye', 'i-eyex'], mute: ['i-volx', 'i-vol'], solo: ['i-videox', 'i-video'] };
  function applyLaneState() {
    for (const [lane, st] of Object.entries(S.lanes)) {
      const el = $(`[data-lane="${lane}"]`, tracksEl);
      el.classList.toggle('is-locked', !!st.lock); el.classList.toggle('is-hidden', st.eye === false);
      $$(`.pl-kurgu-head[data-track="${lane}"] [data-tog]`).forEach(b => {
        const k = b.dataset.tog, on = !!st[k];
        b.setAttribute('aria-pressed', on);
        b.innerHTML = ico(TOG_ICON[k][on ? 0 : 1]);
      });
    }
    $('.pl-kurgu-preview').classList.toggle('is-hidden', S.lanes.t2.eye === false);
  }
  $('.pl-kurgu-heads').addEventListener('click', e => {
    const b = e.target.closest('[data-tog]'); if (!b) return;
    const lane = b.closest('[data-track]').dataset.track, k = b.dataset.tog, prev = !!S.lanes[lane][k];
    const names = { lock: prev ? 'kilidi aç' : 'kilitle', eye: prev ? 'izi gizle' : 'izi göster', mute: prev ? 'sesi aç' : 'sustur', solo: prev ? 'kaynağı kapat' : 'kaynağı aç' };
    act(names[k], () => { S.lanes[lane][k] = !prev; applyLaneState(); }, () => { S.lanes[lane][k] = prev; applyLaneState(); });
  });

  /* ---------------- Her karede güncelle ---------------- */
  const scrub = $('#pv-scrub');
  function update() {
    const end = S.view.start + S.view.span;
    if (S.t < S.view.start || S.t > end - .5) { S.view.start = clamp(S.t - 5, 0, S.total - S.view.span); renderTimeline(); }
    const p = (S.t / S.total) * 100;
    scrub.style.setProperty('--p', `${p}%`);
    scrub.setAttribute('aria-valuenow', Math.round(p));
    scrub.setAttribute('aria-valuetext', `${mmss(S.t)} / ${mmss(S.total)}`);
    $('#pv-time').innerHTML = `${mmss(S.t)}<small>/${mmss(S.total)}</small>`;
    const x = pct(S.t);
    $('#tl-ph').style.setProperty('--p', x);
    const rph = $('#tl-ruler-ph'); if (rph) rph.style.left = `${x}%`;
    $('#tl-ruler').setAttribute('aria-valuenow', Math.round(S.t));
    $('#tl-ruler').setAttribute('aria-valuetext', hms(S.t));
    $$('.pl-waveform i[data-s]', tracksEl).forEach(i => i.classList.toggle('is-played', +i.dataset.s <= S.t));
    if (!reduced) {
      $('#sc-drift').setAttribute('transform', `translate(${Math.sin(S.t * .35) * 6} ${Math.sin(S.t * .6) * 8})`);
      $('.pl-kurgu-queen').setAttribute('transform', `translate(470 ${270 + Math.sin(S.t * .5) * 6})`);
    }
  }
  function renderTicks() {
    $('#pv-ticks').innerHTML = CLIPS.t2.slice(1).map(c => `<i style="left:${(c.s / S.total) * 100}%"></i>`).join('');
  }

  /* ---------------- Denetçi ---------------- */
  function tabs(groupSel, attr, onChange) {
    $$(groupSel).forEach(b => b.addEventListener('click', () => {
      $$(groupSel).forEach(x => { const on = x === b; x.classList.toggle('is-active', on); x.setAttribute('aria-selected', on); });
      onChange(b.getAttribute(attr));
    }));
  }
  tabs('.pl-kurgu-seg [data-insp]', 'data-insp', k => { ['video', 'anim', 'track'].forEach(n => { $(`#insp-${n}`).hidden = n !== k; }); });
  tabs('.pl-kurgu-tabs [data-cc]', 'data-cc', k => { $$('[data-ccpane]').forEach(p => { p.hidden = p.dataset.ccpane !== k; }); });
  $$('.pl-slider').forEach(s => s.addEventListener('input', () => s.style.setProperty('--pl-val', `${s.value}%`)));

  const vol = $('#vol');
  vol.addEventListener('input', () => { S.volume = +vol.value; $('#vol-out').textContent = `%${vol.value}`; vol.setAttribute('aria-valuetext', `%${vol.value}`); });
  let volStart = S.volume;
  vol.addEventListener('pointerdown', () => { volStart = S.volume; });
  vol.addEventListener('change', () => {
    const a = volStart, b = S.volume; if (a === b) return;
    const set = v => { S.volume = v; vol.value = v; vol.style.setProperty('--pl-val', `${v}%`); $('#vol-out').textContent = `%${v}`; };
    hist.past.push({ label: 'ses düzeyi', redo: () => set(b), undo: () => set(a) }); hist.future = [];
  });
  $('#music-mute').addEventListener('click', e => {
    S.musicMuted = !S.musicMuted;
    e.currentTarget.setAttribute('aria-pressed', S.musicMuted);
    e.currentTarget.innerHTML = ico(S.musicMuted ? 'i-volx' : 'i-vol');
    e.currentTarget.setAttribute('aria-label', S.musicMuted ? 'Müziğin sesini aç' : 'Müziği sustur');
  });
  const menu = $('#music-menu'), pick = $('#music-pick');
  pick.addEventListener('click', () => { menu.hidden = !menu.hidden; pick.setAttribute('aria-expanded', !menu.hidden); });
  menu.addEventListener('click', e => {
    const li = e.target.closest('li'); if (!li) return;
    $$('li', menu).forEach(x => x.setAttribute('aria-selected', x === li));
    $('#music-name').textContent = li.textContent; menu.hidden = true; pick.setAttribute('aria-expanded', false);
  });
  document.addEventListener('click', e => { if (!menu.hidden && !e.target.closest('.pl-kurgu-vol')) { menu.hidden = true; pick.setAttribute('aria-expanded', false); } });
  $('[data-act="track"]').addEventListener('click', () => toast('Takip için önizlemede bir nesne seç', 'Nesne seçildiğinde takip başlar', 'info'));

  // Eğriler: noktaları Catmull-Rom ile yumuşat, işaretçiyi sürükleyerek orta noktayı düzenle
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
    const L = smooth(S.curve), m = S.curve[2];
    $('#curve-l').setAttribute('d', L);
    $('#curve-y').setAttribute('d', smooth([[0, 62], [45, 70], [70, 40], [100, 52]]));
    // Taralı alan: işaretçinin solunda, eğrinin altında
    const mx = cx(m[0]);
    $('#curve-area').setAttribute('d', `${L} V110 H0 Z`);
    $('#curve-area').setAttribute('clip-path', 'url(#curve-clip)');
    let clip = $('#curve-clip');
    if (!clip) { clip = document.createElementNS('http://www.w3.org/2000/svg', 'clipPath'); clip.id = 'curve-clip'; clip.innerHTML = '<rect x="0" y="0" height="110"/>'; $('defs', curveSvg).append(clip); }
    clip.firstChild.setAttribute('width', mx);
    $('#curve-mark').setAttribute('x1', mx); $('#curve-mark').setAttribute('x2', mx);
    $('#curve-dot').setAttribute('cx', mx); $('#curve-dot').setAttribute('cy', cy(m[1]));
  }
  curveSvg.addEventListener('pointerdown', e => {
    curveSvg.setPointerCapture(e.pointerId);
    const move = ev => {
      const r = curveSvg.getBoundingClientRect();
      const x = clamp(((ev.clientX - r.left) / r.width) * 100, S.curve[1][0] + 6, 94);
      const y = clamp(100 - ((ev.clientY - r.top) / r.height) * 100, 2, 98);
      S.curve[2] = [x, y]; drawCurve();
    };
    move(e); curveSvg.onpointermove = move; curveSvg.onpointerup = () => { curveSvg.onpointermove = null; };
  });

  /* ---------------- MyMind asistanı ---------------- */
  const aiBody = $('#ai-body');
  const AI = {
    text: { q: 'Metin üret', a: 'Başlık önerisi: <b>“Üretken yapay zekâyla ilk eğitim videon”</b>. Açılış metni: “Hoş geldin! Bu oturumda metin, ses ve video üretimini adım adım deneyeceğiz.”', apply: 'Başlık · Üretken yapay zekâyla ilk eğitim videon' },
    image: { q: 'Görsel üret', a: '4 kapak taslağı hazırlandı: <b>denizanası, buz dağı, kış balonları, pastel portre</b>. Kitaplığa taslak olarak eklenebilir.' },
    avatar: { q: 'Avatar üret', a: 'Avatar taslağı: <b>“Sunucu — sıcak ton, yarı beden”</b>. A1 ses izindeki anlatımla dudak eşlemesi önerilir.' },
  };
  function aiSay(q, html, apply) {
    $('.pl-kurgu-ai__hello')?.remove();
    aiBody.insertAdjacentHTML('beforeend', `<div class="pl-kurgu-msg pl-kurgu-msg--user">${esc(q)}</div>`);
    const wait = document.createElement('div');
    wait.className = 'pl-kurgu-msg pl-kurgu-msg--ai';
    wait.innerHTML = '<span class="pl-typing" aria-label="MyMind yazıyor"><i></i><i></i><i></i></span>';
    aiBody.append(wait); aiBody.scrollTop = aiBody.scrollHeight;
    setTimeout(() => {
      wait.innerHTML = `<span class="pl-row" style="gap:6px"><span class="pl-badge pl-badge--pro" lang="en">MyMind</span><small>önizleme yanıtı</small></span><span>${html}</span>${apply ? '<button class="pl-btn pl-btn--secondary pl-btn--sm" data-apply>Metin klibine uygula</button>' : ''}<small>Kaynak: zaman çizelgesi ve proje videoları · Hub üzerinden MyMind bağlantısı bekleniyor</small>`;
      if (apply) wait.querySelector('[data-apply]').onclick = () => {
        const c = clipById('x1'), prev = c.label;
        act('metin klibi', () => { c.label = `Metin: ${apply.replace('Başlık · ', '')}`; renderTimeline(); }, () => { c.label = prev; renderTimeline(); });
        toast('Metin klibi güncellendi', null, 'success', { label: 'Geri al', run: undo });
      };
      aiBody.scrollTop = aiBody.scrollHeight;
    }, reduced ? 0 : 700);
  }
  $$('[data-ai]').forEach(b => b.addEventListener('click', () => { const k = AI[b.dataset.ai]; aiSay(k.q, k.a, k.apply); }));
  $('#ai-form').addEventListener('submit', e => {
    e.preventDefault();
    const q = $('#ai-in').value.trim(); if (!q) return;
    $('#ai-in').value = '';
    const c = clipById(S.selected);
    aiSay(q, `“${esc(q)}” isteğini seçili klibe (<b>${esc(c.label)}</b>, ${hms(c.s)}–${hms(c.e)}) uygulayabilirim. Zaman çizelgesinde 3 iz ve ${CLIPS.t2.length} video klibi var.`);
  });
  $('#ai-mic').addEventListener('click', e => {
    const on = e.currentTarget.getAttribute('aria-pressed') !== 'true';
    e.currentTarget.setAttribute('aria-pressed', on);
    toast(on ? 'Sesle yazma açık' : 'Sesle yazma kapandı', on ? 'Mikrofon izni Hub üzerinden onaylanır' : null, 'info');
  });
  $('[data-act="ai-open"]').addEventListener('click', () => toast('MyMind ayrı pencerede açılacak', 'Hub → MyMind', 'ai'));

  /* ---------------- Üst çubuk eylemleri ---------------- */
  $('[data-act="undo"]').addEventListener('click', undo);
  $('[data-act="redo"]').addEventListener('click', redo);
  $('[data-act="back"]').addEventListener('click', () => toast('Projeler listesine dönülüyor', 'Değişiklikler otomatik kaydedildi', 'info'));
  function exportVideo() {
    toast('Dışa aktarma sıraya alındı', `1920×1080 · 30 FPS · MP4 · ${mmss(S.total)}`, 'success');
  }
  $('[data-act="export"]').addEventListener('click', exportVideo);

  /* ---------------- Komut paleti (Ctrl/⌘+K) ---------------- */
  const dlg = $('#cmdk'), cq = $('#cmdk-q'), clist = $('#cmdk-list');
  const COMMANDS = () => [
    { g: 'Oynatma', n: S.playing ? 'Duraklat' : 'Oynat', k: 'Boşluk', run: () => setPlaying(!S.playing), i: S.playing ? 'i-pause' : 'i-play' },
    { g: 'Oynatma', n: 'Başa git', k: 'Home', run: () => seek(0), i: 'i-rew' },
    { g: 'Oynatma', n: S.loop ? 'Döngüyü kapat' : 'Döngüyü aç', run: () => $('#pv-loop').click(), i: 'i-repeat' },
    { g: 'Oynatma', n: S.muted ? 'Sesi aç' : 'Sesi kapat', k: 'M', run: () => setMuted(!S.muted), i: 'i-vol' },
    { g: 'Oynatma', n: 'Tam ekran', k: 'F', run: fullscreen, i: 'i-scan' },
    ...Object.entries(TOOL_NAMES).map(([id, n]) => ({ g: 'Araçlar', n: `${n} aracı`, k: { sec: 'V', metin: 'T', sekil: 'S', gorsel: 'G', efekt: 'E' }[id], run: () => setTool(id), i: { sec: 'i-pointer', metin: 'i-type', sekil: 'i-shapes', gorsel: 'i-image', efekt: 'i-fx' }[id] })),
    { g: 'MyMind', n: 'Metin üret', run: () => $('[data-ai="text"]').click(), i: 'i-spark' },
    { g: 'MyMind', n: 'Görsel üret', run: () => $('[data-ai="image"]').click(), i: 'i-spark' },
    { g: 'MyMind', n: 'Avatar üret', run: () => $('[data-ai="avatar"]').click(), i: 'i-spark' },
    { g: 'Proje', n: 'Dışa aktar', k: 'Ctrl E', run: exportVideo, i: 'i-export' },
    { g: 'Proje', n: 'Geri al', k: 'Ctrl Z', run: undo, i: 'i-undo' },
    { g: 'Proje', n: 'Yinele', k: 'Ctrl Y', run: redo, i: 'i-redo' },
    ...LIB.map(v => ({ g: 'Videolar', n: `Aç: ${v.cap}`, k: v.dur, run: () => { libSel = v.id; renderLib(); toast(`“${v.cap}” önizlemeye alındı`); }, i: 'i-video' })),
  ];
  let cmdItems = [], cmdIdx = 0;
  function renderCmd() {
    const q = cq.value.trim().toLocaleLowerCase('tr');
    cmdItems = COMMANDS().filter(c => !q || c.n.toLocaleLowerCase('tr').includes(q) || c.g.toLocaleLowerCase('tr').includes(q));
    cmdIdx = clamp(cmdIdx, 0, Math.max(0, cmdItems.length - 1));
    let g = '', html = '';
    cmdItems.forEach((c, i) => {
      if (c.g !== g) { g = c.g; html += `<div class="pl-cmdk__group pl-label">${esc(g)}</div>`; }
      html += `<div class="pl-menuitem" role="option" id="cmd-${i}" data-i="${i}" aria-selected="${i === cmdIdx}">${ico(c.i)}${esc(c.n)}${c.k ? `<span class="pl-menuitem__meta">${esc(c.k)}</span>` : ''}</div>`;
    });
    clist.innerHTML = html || '<div class="pl-menuitem">Sonuç yok</div>';
    cq.setAttribute('aria-activedescendant', `cmd-${cmdIdx}`);
    $(`#cmd-${cmdIdx}`)?.scrollIntoView({ block: 'nearest' });
  }
  function openCmd() { cq.value = ''; cmdIdx = 0; renderCmd(); dlg.showModal(); cq.focus(); }
  function runCmd(i) { const c = cmdItems[i]; if (!c) return; dlg.close(); c.run(); }
  cq.addEventListener('input', () => { cmdIdx = 0; renderCmd(); });
  cq.addEventListener('keydown', e => {
    if (e.key === 'ArrowDown') { cmdIdx = (cmdIdx + 1) % cmdItems.length; renderCmd(); e.preventDefault(); }
    if (e.key === 'ArrowUp') { cmdIdx = (cmdIdx - 1 + cmdItems.length) % cmdItems.length; renderCmd(); e.preventDefault(); }
    if (e.key === 'Enter') { runCmd(cmdIdx); e.preventDefault(); }
  });
  clist.addEventListener('click', e => { const it = e.target.closest('[data-i]'); if (it) runCmd(+it.dataset.i); });
  dlg.addEventListener('click', e => { if (e.target === dlg) dlg.close(); });

  /* ---------------- Klavye kısayolları ---------------- */
  document.addEventListener('keydown', e => {
    const mod = e.ctrlKey || e.metaKey;
    if (mod && e.key.toLowerCase() === 'k') { e.preventDefault(); dlg.open ? dlg.close() : openCmd(); return; }
    if (dlg.open) return;
    const tgt = e.target instanceof Element ? e.target : document.body;
    const typing = tgt.closest('input, textarea, select, [contenteditable]') && tgt.type !== 'range';
    if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
    if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
    if (mod && e.key.toLowerCase() === 'e') { e.preventDefault(); exportVideo(); return; }
    if (typing || mod || e.altKey) return;
    const k = e.key.toLowerCase();
    if (e.key === ' ' && !tgt.closest('button')) { e.preventDefault(); setPlaying(!S.playing); }
    else if (k === 'k') setPlaying(false);
    else if (k === 'j') seek(S.t - 5);
    else if (k === 'l') seek(S.t + 5);
    else if (k === 'm') setMuted(!S.muted);
    else if (k === 'f') fullscreen();
    else if (e.key === 'Home') seek(0);
    else if (e.key === 'ArrowLeft' && !tgt.closest('[role="slider"]')) seek(S.t - (e.shiftKey ? 5 : 1));
    else if (e.key === 'ArrowRight' && !tgt.closest('[role="slider"]')) seek(S.t + (e.shiftKey ? 5 : 1));
    else { const t = { v: 'sec', t: 'metin', s: 'sekil', g: 'gorsel', e: 'efekt' }[k]; if (t) setTool(t); }
  });

  /* ---------------- Başlat ---------------- */
  renderLib(); renderTicks(); renderTimeline(); drawCurve(); update();
  addEventListener('resize', () => requestAnimationFrame(drawOverlays));
  root.dataset.ready = '1';
})();
