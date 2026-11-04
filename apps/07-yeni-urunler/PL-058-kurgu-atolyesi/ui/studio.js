/* PL-058: gerçek medya oturumu; kurgu.js tarihsel tasarım demosu olarak korunur. */
(() => {
  'use strict';
  const $=s=>document.querySelector(s), root=$('[data-pl]');
  let session,selected=null,past=[],future=[],saving=Promise.resolve(),dirty=0;
  const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const time=n=>`${String(Math.floor(n/60)).padStart(2,'0')}:${String(Math.floor(n%60)).padStart(2,'0')}`;
  const status=document.createElement('div');status.className='pl-studio-status';status.setAttribute('role','status');
  const report=message=>{status.textContent=message;};
  async function api(url,method='GET',data){
    const response=await fetch('/api/'+url,{method,headers:{'Content-Type':'application/json','X-Kurgu-Token':session?.token||''},body:data?JSON.stringify(data):undefined});
    const result=await response.json();if(!response.ok)throw new Error(result.error);return result;
  }
  function safe(fn){return (...args)=>Promise.resolve().then(()=>fn(...args)).catch(e=>report(e.message));}
  const media=id=>session.media.find(m=>m.id===id);
  const duration=()=>Math.max(1,...session.project.clips.map(c=>c.start+c.duration));
  function save(){
    const p=structuredClone(session.project), revision=++dirty;report('Kaydediliyor…');
    saving=saving.catch(()=>{}).then(()=>api('project','PUT',p)).then(()=>{if(revision===dirty)report('Proje cihazda kaydedildi');});
    return saving;
  }
  async function edit(fn){past.push(structuredClone(session.project));future=[];fn();draw();await save();}
  async function history(undo){const from=undo?past:future,to=undo?future:past;if(!from.length)return;to.push(structuredClone(session.project));session.project=from.pop();draw();await save();}
  const fileInput=document.createElement('input');fileInput.type='file';fileInput.multiple=true;fileInput.accept='video/*,audio/*,.cube';fileInput.hidden=true;root.append(fileInput);
  const projectInput=document.createElement('input');projectInput.type='file';projectInput.accept='.json';projectInput.hidden=true;root.append(projectInput);
  async function importFiles(files){
    for(const file of files){
      report(`${file.name} içe aktarılıyor…`);
      const r=await fetch('/api/import',{method:'POST',headers:{'X-Kurgu-Token':session.token,'X-Filename':encodeURIComponent(file.name)},body:file});
      const item=await r.json();if(!r.ok)throw new Error(item.error);session.media.push(item);
      if(item.kind!=='lut')await edit(()=>{const c={id:crypto.randomUUID(),mediaId:item.id,start:duration()===1&&!session.project.clips.length?0:duration(),in:0,duration:Math.min(item.duration,3600),layer:item.kind==='audio'?1:0,volume:1,fade:0};session.project.clips.push(c);selected=c.id;});
    }
    draw();report('Medya içe aktarıldı; orijinal dosya değiştirilmedi');
  }
  fileInput.onchange=safe(async()=>{await importFiles([...fileInput.files]);fileInput.value='';});
  projectInput.onchange=safe(async()=>{const p=JSON.parse(await projectInput.files[0].text());await api('project','PUT',p);session.project=p;draw();report('Proje açıldı');projectInput.value='';});
  function button(label,fn,kind='secondary'){const b=document.createElement('button');b.className=`pl-btn pl-btn--${kind} pl-btn--sm`;b.textContent=label;b.onclick=safe(fn);return b;}
  function setup(){
    document.querySelectorAll('.pl-kurgu-cursor,.pl-kurgu-collab').forEach(e=>e.remove());
    $('.pl-kurgu-scene').remove();
    const preview=$('.pl-kurgu-preview');
    const video=document.createElement('video');video.id='studio-video';video.className='pl-studio-video';video.controls=false;video.preload='metadata';preview.prepend(video);
    const label=document.createElement('span');label.id='preview-label';label.className='pl-studio-preview-label';label.textContent='Medya içe aktararak başlayın';preview.append(label);
    const tools=document.createElement('div');tools.className='pl-studio-actions';
    tools.append(button('Medya / LUT ekle',()=>fileInput.click(),'primary'),button('Projeyi kaydet',downloadProject),button('Proje aç',()=>projectInput.click()),button('Önizlemeyi üret',()=>render('preview')),button('Proxy üret',()=>render('proxy')));
    const brand=document.createElement('div');brand.className='pl-studio-brand';brand.textContent='PluginLabs APPS · Kurgu Atölyesi #058';$('.pl-kurgu-lib').prepend(brand,tools);
    $('.pl-kurgu-lib').append(status);
    $('[data-act="export"]').onclick=safe(()=>render('export'));
    $('[data-act="undo"]').onclick=safe(()=>history(true));$('[data-act="redo"]').onclick=safe(()=>history(false));
    $('[data-act="back"]').onclick=()=>projectInput.click();
    $('#pv-play').onclick=$('[data-act="present"]').onclick=safe(()=>video.paused?video.play():video.pause());
    $('#pv-mute').onclick=()=>{video.muted=!video.muted;$('#pv-mute').setAttribute('aria-pressed',video.muted);};
    $('#pv-loop').onclick=()=>{video.loop=!video.loop;$('#pv-loop').setAttribute('aria-pressed',video.loop);};
    $('#pv-rew').onclick=()=>video.currentTime=Math.max(0,video.currentTime-5);
    $('#pv-ffw').onclick=()=>video.currentTime=Math.min(video.duration||0,video.currentTime+5);
    $('#pv-full').onclick=safe(()=>video.requestFullscreen());
    $('#pv-tune').onclick=()=>report('Kaynak önizlemesi ham dosyadır. LUT, ses, katman ve altyazı sonucu için “Önizlemeyi üret” seçin.');
    const scrub=e=>{const r=$('#pv-scrub').getBoundingClientRect();if(video.duration)video.currentTime=Math.max(0,Math.min(video.duration,(e.clientX-r.left)/r.width*video.duration));};
    $('#pv-scrub').onclick=scrub;$('#pv-scrub').onkeydown=e=>{if(['ArrowRight','ArrowLeft'].includes(e.key)){e.preventDefault();video.currentTime=Math.max(0,Math.min(video.duration||0,video.currentTime+(e.key==='ArrowRight'?1:-1)));}};
    video.ontimeupdate=()=>{const percent=video.currentTime/(video.duration||1)*100;$('#pv-time').textContent=`${time(video.currentTime)} / ${time(video.duration||0)}`;$('#pv-fill').style.width=percent+'%';$('#pv-knob').style.left=percent+'%';$('#pv-scrub').setAttribute('aria-valuenow',Math.round(percent));};
    video.onerror=()=>report('Bu kaynak codec’i tarayıcıda açılamıyor. FFmpeg ile “Önizlemeyi üret” seçeneğini kullanın.');
    $('#lib-q').oninput=drawLibrary;$('#lib-filter').onclick=()=>{const b=$('#lib-filter');b.setAttribute('aria-pressed',b.getAttribute('aria-pressed')!=='true');drawLibrary();};
    $('.pl-kurgu-side').innerHTML='<section class="pl-kurgu-panel pl-studio-editor"><h2 class="pl-kurgu-h3">Seçili klip</h2><div id="clip-editor"></div><h3 class="pl-kurgu-h3">Altyazı</h3><form id="caption-form"><label>Metin<input class="pl-input" id="caption-text" required maxlength="2000"></label><label>Başlangıç (sn)<input class="pl-input" id="caption-start" type="number" min="0" step="0.1" value="0"></label><label>Süre (sn)<input class="pl-input" id="caption-duration" type="number" min="0.1" max="3600" step="0.1" value="3"></label><button class="pl-btn pl-btn--secondary pl-btn--sm">Altyazı ekle</button></form><div id="captions"></div><h3 class="pl-kurgu-h3">Render kuyruğu</h3><div id="render-jobs"></div><h3 class="pl-kurgu-h3">MyMind</h3><p class="pl-muted">Model bağlantısı kurulmadı. AI maske ve görsel üretimi kullanılamıyor. Temel kurgu cihazda çalışır.</p></section>';
    const ai=document.createElement('form');ai.innerHTML='<label>MyMind için metin<input class="pl-input" id="mymind-prompt" maxlength="4000" required></label><label><input id="mymind-consent" type="checkbox" required> Yalnız yazdığım metni Hub’a göndermeyi onaylıyorum.</label><button class="pl-btn pl-btn--secondary pl-btn--sm">MyMind’a gönder</button><p id="mymind-answer" class="pl-muted"></p>';
    $('.pl-studio-editor').append(ai);
    ai.onsubmit=safe(async e=>{e.preventDefault();report('MyMind yanıtı bekleniyor…');const result=await api('mymind','POST',{prompt:$('#mymind-prompt').value,consent:$('#mymind-consent').checked});$('#mymind-answer').textContent=result.source+' · '+result.text;report('MyMind yanıtı geldi');});
    if(session.capabilities.mymind)$('.pl-studio-editor .pl-muted').textContent='Hub yapılandırıldı. Yalnız onayladığınız metin gönderilir; medya gönderilmez. AI maske için segmentasyon modeli henüz bağlı değil.';
    $('#caption-form').onsubmit=safe(async e=>{e.preventDefault();await edit(()=>session.project.subtitles.push({text:$('#caption-text').value,start:+$('#caption-start').value,duration:+$('#caption-duration').value}));});
    document.querySelectorAll('[data-tool]').forEach(b=>b.onclick=()=>report('Klip düzenlemek için zaman çizelgesinden bir klip seçin. Metin eklemek için Altyazı bölümünü kullanın.'));
    $('.pl-kurgu-heads').innerHTML='<div class="pl-studio-track-label">Altyazılar</div><div class="pl-studio-track-label">Video katmanları</div><div class="pl-studio-track-label">Ses</div>';
    document.addEventListener('keydown',safe(async e=>{
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='k'){e.preventDefault();$('#cmdk-list').replaceChildren(button('Medya ekle',()=>fileInput.click()),button('Önizlemeyi üret',()=>render('preview')),button('Dışa aktar',()=>render('export')));$('#cmdk').showModal();$('#cmdk-q').focus();return;}
      if(e.target.closest?.('input,textarea,select'))return;
      if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();await history(!e.shiftKey);}
      if(e.code==='Space'){e.preventDefault();$('#pv-play').click();}
    }));
  }
  function source(item){if(item.kind!=='video'&&item.kind!=='audio')return;const v=$('#studio-video');v.src=(item.proxy?'/proxy/':'/media/')+item.id;$('#preview-label').textContent=(item.proxy?'Proxy önizlemesi · ':'Kaynak önizlemesi · ')+item.name;}
  function drawLibrary(){
    const list=$('#lib-list');list.replaceChildren();const q=$('#lib-q').value.toLocaleLowerCase('tr');
    for(const m of session.media.filter(m=>m.name.toLocaleLowerCase('tr').includes(q)&&($('#lib-filter').getAttribute('aria-pressed')!=='true'||m.kind==='video'))){
      const li=document.createElement('li');li.className='pl-studio-library-item';
      li.append(button(`${m.kind==='lut'?'LUT':time(m.duration)} · ${m.name}`,()=>source(m)));
      if(m.kind!=='lut')li.append(button('+ Klip',()=>edit(()=>{const c={id:crypto.randomUUID(),mediaId:m.id,start:duration(),in:0,duration:Math.min(m.duration,3600),layer:0,volume:1,fade:0};session.project.clips.push(c);selected=c.id;})));
      list.append(li);
    }
    $('#lib-empty').hidden=!!list.children.length;
    $('#lib-empty').textContent=session.media.length?'Eşleşen medya yok':'Medya ekle ile video, ses veya .cube dosyası seçin.';
  }
  function draw(){
    drawLibrary();const total=duration(),tracks=$('#tl-tracks');tracks.replaceChildren();$('#tl-total').textContent=time(total);
    const ruler=$('#tl-ruler');ruler.innerHTML=Array.from({length:6},(_,i)=>`<span style="left:${i*19}%">${time(total*i/5)}</span>`).join('');
    for(const c of session.project.clips){
      const m=media(c.mediaId),b=button(m.name,async()=>{selected=c.id;drawEditor();source(m);$('#studio-video').currentTime=c.in;});
      b.className='pl-studio-clip';b.style.left=(c.start/total*100)+'%';b.style.width=(c.duration/total*100)+'%';b.style.top=(m.kind==='audio'?142:58+c.layer*8)+'px';b.title=`${m.name} · ${c.start}s, ${c.duration}s · katman ${c.layer}`;b.setAttribute('aria-pressed',selected===c.id);tracks.append(b);
    }
    for(const s of session.project.subtitles){const b=document.createElement('span');b.className='pl-studio-caption';b.textContent=s.text;b.style.left=s.start/total*100+'%';b.style.width=Math.min(100,s.duration/total*100)+'%';tracks.append(b);}
    drawEditor();$('#captions').replaceChildren(...session.project.subtitles.map((s,i)=>button(`${time(s.start)} ${s.text} · kaldır`,()=>edit(()=>session.project.subtitles.splice(i,1)))));
  }
  function drawEditor(){
    const c=session.project.clips.find(x=>x.id===selected),area=$('#clip-editor');
    if(!c){area.textContent='Zaman çizelgesinden bir klip seçin.';return;}
    area.innerHTML=`<p>${esc(media(c.mediaId).name)}</p><form id="clip-form">${[['start','Konum (sn)'],['in','Kaynak girişi (sn)'],['duration','Süre (sn)'],['layer','Katman (0–8)'],['volume','Ses (0–2)'],['fade','Kararma geçişi (sn)']].map(([k,label])=>`<label>${label}<input class="pl-input" type="number" name="${k}" value="${c[k]}" min="0" step="${k==='layer'?'1':'0.01'}" required></label>`).join('')}<label>LUT<select class="pl-select" name="lutId"><option value="">Uygulama</option>${session.media.filter(m=>m.kind==='lut').map(m=>`<option value="${m.id}" ${m.id===c.lutId?'selected':''}>${esc(m.name)}</option>`).join('')}</select></label><button class="pl-btn pl-btn--secondary pl-btn--sm">Değişiklikleri uygula</button></form><label>Kesme konumu (klip içi sn)<input class="pl-input" id="split-at" type="number" min="0.04" step="0.01" value="${(c.duration/2).toFixed(2)}"></label>`;
    $('#clip-form').onsubmit=safe(async e=>{e.preventDefault();const values=new FormData(e.target),proposal=structuredClone(session.project),target=proposal.clips.find(x=>x.id===c.id);for(const [k,v]of values)target[k]=k==='lutId'?v:Number(v);await api('project','PUT',proposal);await edit(()=>{session.project=proposal;});});
    area.append(button('Klibi kes',()=>{const at=+$('#split-at').value;if(at<.04||at>c.duration-.04)throw new Error('Kesme konumu klibin içinde olmalı');return edit(()=>{const second={...c,id:crypto.randomUUID(),start:c.start+at,in:c.in+at,duration:c.duration-at,fade:0};c.duration=at;c.fade=0;session.project.clips.push(second);});}),button('Klibi arşivle',()=>{if(confirm('Seçili klip zaman çizelgesinden kaldırılsın mı?'))return edit(()=>{session.project.clips=session.project.clips.filter(x=>x.id!==c.id);selected=null;});}));
  }
  function downloadProject(){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(session.project,null,2)],{type:'application/json'}));a.download='kurgu-projesi.json';a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);}
  async function render(kind){await saving;const c=session.project.clips.find(c=>c.id===selected);await api('render','POST',{kind,mediaId:c?.mediaId});report(kind==='export'?'1080p dışa aktarma sırada':'360p önizleme sırada');await jobs();}
  async function jobs(){
    const fresh=await api('session');session.jobs=fresh.jobs;session.media=fresh.media;
    const area=$('#render-jobs');area.replaceChildren();
    for(const j of session.jobs){const row=document.createElement('div');row.className='pl-studio-job';const text=document.createElement('span');text.textContent=`${j.kind} · ${{queued:'Sırada',running:'İşleniyor',completed:'Hazır',failed:'Başarısız',cancelled:'İptal'}[j.status]} · %${Math.round(j.progress*100)} ${j.error||''}`;row.append(text);
      if(j.status==='completed'){row.append(button('Sonucu önizle',()=>{$('#studio-video').src='/output/'+j.id;$('#preview-label').textContent='İşlenmiş proje · LUT, katman, ses ve altyazı uygulanmış';}));const a=document.createElement('a');a.className='pl-btn pl-btn--secondary pl-btn--sm';a.href='/output/'+j.id+'?download=1';a.textContent='MP4 indir';row.append(a);}
      if(['queued','running'].includes(j.status))row.append(button('İptal et',()=>api('cancel','POST',{id:j.id})));area.append(row);
    }
  }
  safe(async()=>{session=await api('session');selected=session.project.clips[0]?.id;setup();draw();await jobs();const last=session.jobs.findLast(j=>j.status==='completed');if(last){$('#studio-video').src='/output/'+last.id;$('#preview-label').textContent='Son işlenmiş önizleme';}else if(session.project.clips.length)source(media(session.project.clips[0].mediaId));report('Hazır · dosyalar cihazda işlenir');root.dataset.ready='1';setInterval(()=>jobs().catch(e=>report(e.message)),1500);})().catch(e=>report(e.message));
})();
