/* Local design-preview interactions. No model, media upload or render is invoked. */
(()=>{
  'use strict';
  const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
  const names={edit:'Kurgu',fusion:'Düğüm & Karakter',ae:'Hareket',color:'Renk',audio:'Ses',deliver:'Teslim'};
  const plan={edit:'Çok izli kurgu · Kaynak / program · Proxy · Ripple / Roll / Slip · Multicam',fusion:'Tipli DAG · Maske / roto · Planar tracker · 3B sahne · Karakter kimliği · Model girişleri',ae:'Katman kompozisyonu · Anahtar kareler · Bezier eğrileri · İfadeler · Kamera / ışık',color:'Düğüm tabanlı grade · Lift / Gamma / Gain · HSL · Power windows · Scopes / ACES',audio:'Kanal mikseri · EQ / Dynamics · Bus routing · Otomasyon · Loudness / True peak',deliver:'Çıktı profilleri · İş kuyruğu · Kodlayıcı seçimi · Renk yönetimi · İş günlükleri'};
  function note(text){const e=document.createElement('div');e.className='pl-toast';e.textContent=text;$('#toasts').append(e);setTimeout(()=>e.remove(),4000);}
  const app=$('#app');
  const oldSwitch=window.switchWorkspace;
  window.switchWorkspace=w=>{oldSwitch(w);document.title=names[w]+' · Kurgu Atölyesi';};
  $$('[data-preview-workspace]').forEach(b=>b.onclick=()=>window.switchWorkspace(b.dataset.previewWorkspace));
  $$('.pl-ws-page').forEach(p=>{const w=p.id.slice(3),bar=document.createElement('div');bar.className='pl-omni-plan';bar.innerHTML='<span>TASARIM ÖRNEĞİ</span> '+plan[w];p.append(bar);});
  $$('.pl-kurgu-tool,.pl-iconbtn,.pl-kurgu-pbtn').forEach((b,i)=>{if(!b.getAttribute('aria-label'))b.setAttribute('aria-label',b.title||b.textContent.trim()||'Önizleme aracı '+(i+1));});
  $$('input,textarea,select').forEach((e,i)=>{if(!e.getAttribute('aria-label')&&!e.closest('label'))e.setAttribute('aria-label',e.placeholder||'Parametre '+(i+1));});
  $('#preview-command')?.addEventListener('click',()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'k',ctrlKey:true,bubbles:true})));
  const dlg=$('#cmdk');dlg?.addEventListener('close',()=>$('#preview-command')?.focus());
  const library=$('#ws-fusion aside');if(library){const more=document.createElement('div');more.className='pl-omni-node-library';more.innerHTML='<span class="pl-eyebrow">İleri kompozisyon</span>'+['Roto & Maske','Planar Tracker','Camera Solve','Particle System','Depth & Relight','Character Identity'].map((n,i)=>'<button class="pl-btn pl-btn--secondary pl-btn--sm" data-plan-node="'+i+'">'+n+'<small>PLAN</small></button>').join('');library.append(more);}
  $$('[data-plan-node]').forEach(b=>b.onclick=()=>note(b.textContent.replace('PLAN','')+' · Arayüz planı; motor bağlantısı sonraki aşamada.'));
  $('#ws-fusion')?.querySelectorAll('.pl-kurgu-aiact').forEach((b,i)=>b.addEventListener('click',()=>{if(typeof window.addFusionNode==='function')window.addFusionNode(['Pose_01','FaceRig_01','Keyer_01','Flow_01'][i], 'Önizleme düğümü','--pl-viz-3',3);note('Örnek düğüm · AI/model çalıştırılmadı.');}));
  $$('canvas').forEach(c=>{c.setAttribute('role','img');c.setAttribute('aria-label',c.id.includes('scope')?'Örnek renk ölçüm grafiği; gerçek medya analizi yapılmıyor.':'Örnek karakter iskeleti; model çıkarımı yapılmıyor.');});
  const scope=$('#scope-parade');if(scope){const d=document.createElement('p');d.className='pl-omni-summary';d.textContent='Örnek ölçüm: RGB parade ve vectorscope, referans verisi. Canlı analiz bağlı değil.';scope.parentElement.append(d);}
  const voice=$('#ws-audio');if(voice){const d=document.createElement('div');d.className='pl-omni-summary';d.textContent='Gösterilen LUFS, true peak ve kanal seviyeleri örnek değerlerdir.';voice.append(d);}
  $$('[data-cmd]').forEach(e=>{e.setAttribute('role','button');e.tabIndex=0;});
  const observer=new MutationObserver(()=>{$$('#cmdk-list [data-cmd]').forEach(e=>{e.setAttribute('role','button');e.tabIndex=0;e.onkeydown=k=>{if(k.key==='Enter'||k.key===' '){k.preventDefault();e.click();}};});});if($('#cmdk-list'))observer.observe($('#cmdk-list'),{childList:true});
  let chip=$('.pl-omni-previewlabel');if(chip&&window.__TAURI__)window.__TAURI__.core.invoke('snapshot').then(()=>{chip.textContent='RUST · ARAYÜZ ÖNİZLEMESİ';}).catch(()=>{});
  // Disabled rendering is intentional in this visual proposal.
  $('#start-rust-render-btn')?.setAttribute('aria-description','Yalnız tasarım önizlemesi; çıktı dosyası üretilmez.');
})();
