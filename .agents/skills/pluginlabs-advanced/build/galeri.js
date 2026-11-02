
(function(){
  var root=document.getElementById('root');
  document.querySelectorAll('[data-theme]').forEach(function(b){b.addEventListener('click',function(){
    root.setAttribute('data-pl-theme',b.dataset.theme);
    document.querySelectorAll('[data-theme]').forEach(function(x){x.classList.toggle('is-active',x===b)});
  })});
  document.querySelectorAll('.g-acc').forEach(function(b){b.addEventListener('click',function(){
    root.setAttribute('data-pl-product',b.dataset.p);
    document.querySelectorAll('.g-acc').forEach(function(x){x.classList.toggle('is-on',x===b)});
  })});
  var first=document.querySelector('.g-acc[data-p="hub"]'); if(first) first.classList.add('is-on');
  document.querySelectorAll('.g-surfbtn').forEach(function(b){b.addEventListener('click',function(){
    var s=b.dataset.s;
    document.querySelectorAll('.g-preview:not(.g-preview--themed)').forEach(function(p){ if(s==='varsayilan'){p.removeAttribute('data-pl-surface')} else {p.setAttribute('data-pl-surface',s)} });
    document.querySelectorAll('.g-surfbtn').forEach(function(x){x.classList.toggle('is-on',x===b)});
  })});
  var sv=document.querySelector('.g-surfbtn[data-s="varsayilan"]'); if(sv) sv.classList.add('is-on');
  document.querySelectorAll('[data-layer]').forEach(function(b){ if(b.tagName!=='BUTTON') return; b.addEventListener('click',function(){
    var l=b.dataset.layer;
    document.querySelectorAll('.g-card').forEach(function(c){c.classList.toggle('g-hidden-layer', l!=='all' && c.dataset.layer!==l)});
    document.querySelectorAll('.g-section').forEach(function(s){if(s.id==='tokenlar'||s.id==='desen')return;s.classList.toggle('g-hidden-layer',!s.querySelector('.g-card:not(.g-hidden-layer)'))});
    document.querySelectorAll('button[data-layer]').forEach(function(x){x.classList.toggle('is-active',x===b)});
  })});
  var q=document.getElementById('q');
  q.addEventListener('input',function(){
    var v=q.value.trim().toLocaleLowerCase('tr');
    document.querySelectorAll('.g-card').forEach(function(c){c.classList.toggle('g-hidden',v&&c.dataset.search.indexOf(v)<0)});
    document.querySelectorAll('.g-section').forEach(function(s){if(s.id==='tokenlar'||s.id==='desen')return;s.classList.toggle('g-hidden',!s.querySelector('.g-card:not(.g-hidden)'))});
  });
  document.addEventListener('keydown',function(e){if(e.key==='/'&&document.activeElement!==q){e.preventDefault();q.focus()}});
  document.querySelectorAll('.js-indet').forEach(function(i){i.indeterminate=true});
  document.querySelectorAll('.g-copy').forEach(function(b){b.addEventListener('click',function(){
    var t=b.parentNode.querySelector('pre').textContent;
    try{navigator.clipboard.writeText(t).then(function(){b.textContent='Kopyalandı';setTimeout(function(){b.textContent='Kopyala'},1400)})}catch(e){}
  })});
})();
