/* 余村青来集介绍 H5 — 内容由 data.json 维护。 */
(function () {
  'use strict';
  var DATA, modules = [], currentRoute = '', timer, toastTimer, mediaCounter = 0;
  var main = document.getElementById('main');
  var homeHTML = main.innerHTML;
  var actionBar = document.getElementById('actionBar');
  var dialog = document.getElementById('overlayDialog');
  var overlayContent = document.getElementById('overlayContent');
  var controls = document.getElementById('galleryControls');
  var mediaRegistry = new Map();
  var galleryIndex = 0;
  var activeGallery = null;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  var aliases = {top:'home',agenda:'explore',venue:'about',community:'events',recent:'events',guide:'about',aifriends:'ai'};
  function el(id) { return document.getElementById(id); }
  function esc(value) { return String(value == null ? '' : value).replace(/[&<>"']/g, function(c) { return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]; }); }
  function asset(path) { return window.__QL_ASSETS__ && window.__QL_ASSETS__[path] || path; }
  function image(path, alt, cls, eager, small) { return '<img src="'+esc(asset(small||path))+'"'+(small?' srcset="'+esc(asset(small))+' 640w, '+esc(asset(path))+' 1200w" sizes="(max-width: 880px) calc(100vw - 44px), 836px"':'')+' alt="'+esc(alt)+'" class="'+(cls||'')+'" loading="'+(eager?'eager':'lazy')+'" decoding="async">'; }
  function moduleById(id) { return modules.find(function(m) { return m.id === id; }); }
  function register(info) { var key = 'media-'+(++mediaCounter); mediaRegistry.set(key, info); return key; }
  function mediaButton(info, title, cls) { return '<button type="button" class="'+(cls||'document-button')+'" data-gallery="'+register(info)+'"><span>'+esc(title||info.title)+'</span><span aria-hidden="true">↗</span></button>'; }
  function phoneHref(value) { return 'tel:'+String(value).replace(/[^+\d]/g,''); }
  function mapHref(value) { return 'https://uri.amap.com/search?keyword='+encodeURIComponent(value)+'&city='+encodeURIComponent('安吉')+'&view=map&src=qinglaiji'; }
  function routeFromHash() { var raw = location.hash.slice(1) || 'home'; return aliases[raw] || raw; }
  function showToast(text) { el('toast').textContent=text; el('toast').classList.add('show'); clearTimeout(toastTimer); toastTimer=setTimeout(function(){el('toast').classList.remove('show');},2300); }
  function eventCard(item) {
    var meta=item.date.replace(/-/g,'.')+(item.time?' · '+item.time:'');
    return '<details class="event" data-category="'+esc(item.category)+'"><summary>'+image(item.poster,item.title,'event-thumb')+'<div><h3>'+esc(item.title)+'</h3><div class="event-meta">'+esc(meta)+'<br>'+esc(item.place)+'</div><span class="event-tag">往期 · '+esc(item.category)+'</span></div><span aria-hidden="true">↗</span></summary><div class="expanded"><p>'+esc(item.description)+'</p>'+mediaButton({title:item.title,images:[item.poster]},'查看活动海报','button secondary')+(item.phone?'<p><a class="text-link" href="'+phoneHref(item.phone)+'">活动咨询 '+esc(item.phone)+' ↗</a></p>':'')+'</div></details>';
  }
  function renderBlock(b) {
    var body = '';
    if (b.type === 'text') body=b.paragraphs.map(function(p){return '<p class="body-copy">'+esc(p)+'</p>';}).join('');
    if (b.type === 'features') body='<div class="feature-list">'+b.items.map(function(i){return '<article class="feature"><h3>'+esc(i.title)+'</h3><p>'+esc(i.text)+'</p></article>';}).join('')+'</div>';
    if (b.type === 'steps') body='<ol class="step-list">'+b.items.map(function(i,n){return '<li class="step"><span class="step-index">'+(n+1)+'</span><div><h3>'+esc(i.title)+'</h3><p>'+esc(i.text)+'</p></div></li>';}).join('')+'</ol>';
    if (b.type === 'tags') body='<div class="tag-list">'+b.items.map(function(i){return '<span class="tag">'+esc(i)+'</span>';}).join('')+'</div>';
    if (b.type === 'gallery') {
      var key=register(b.media);
      body='<div class="photo-grid">'+b.media.images.map(function(src,n){return '<button type="button" class="photo-button" data-gallery="'+key+'" data-index="'+n+'" aria-label="查看'+esc(b.title)+'第'+(n+1)+'张照片">'+image(src,b.title+' · '+(n+1))+'<span>放大 ↗</span></button>';}).join('')+'</div>';
    }
    if (b.type === 'documents') body=b.items.map(function(i){return mediaButton(i);}).join('');
    if (b.type === 'links') body='<div class="related-links">'+b.items.map(function(i){return '<a href="'+esc(i.href)+'">'+esc(i.title)+'<span aria-hidden="true">↗</span></a>';}).join('')+'</div>';
    if (b.type === 'notice') body='<div class="notice"><ul>'+b.items.map(function(i){return '<li>'+esc(i)+'</li>';}).join('')+'</ul></div>';
    if (b.type === 'spaces') body=b.items.map(function(i){return '<details class="space-item"><summary><div><strong>'+esc(i.title)+'</strong><small>'+esc(i.area)+' · '+esc(i.use)+'</small></div><span class="plus" aria-hidden="true">+</span></summary><div class="expanded"><p>'+esc(i.address)+'</p>'+mediaButton({title:i.title,images:[i.image]},'查看空间实景与完整介绍','button secondary')+'</div></details>';}).join('');
    if (b.type === 'products') body=b.items.map(function(i){return '<details class="product"><summary><div><strong>'+esc(i.title)+'</strong><small>'+esc(i.duration)+'</small></div><span class="plus" aria-hidden="true">+</span></summary><div class="expanded"><p>'+esc(i.description)+'</p><p class="price">原折页参考价：'+esc(i.price)+'</p><ol class="route-list">'+i.route.map(function(r){return '<li>'+esc(r)+'</li>';}).join('')+'</ol><p>'+esc(i.included)+'</p>'+mediaButton(i.media,'查看完整行程与预订须知','button secondary')+'</div></details>';}).join('');
    if (b.type === 'events') {
      body=(b.filter?'<div class="filters" role="group" aria-label="筛选往期活动">'+['全部','公益','手作','自然'].map(function(t,n){return '<button type="button" class="filter" data-filter="'+t+'" aria-pressed="'+(n===0)+'">'+t+'</button>';}).join('')+'</div>':'')+'<div class="event-list">'+b.items.map(eventCard).join('')+'</div>';
    }
    return '<section class="content-block"><h2>'+esc(b.title)+'</h2>'+(b.note?'<p class="note">'+esc(b.note)+'</p>':'')+body+'</section>';
  }
  function renderDirectory() {
    return '<section class="page directory"><div class="directory-heading"><p class="page-kicker">八个方向，一起探索</p><h1>从这里，<br>走进青来集。</h1><p>选择一个感兴趣的方向，慢慢了解。</p></div><nav class="entry-grid" aria-label="青来集八个模块">'+modules.map(function(m,n){return '<a class="entry" href="#'+m.id+'" data-color="'+m.color+'" style="--i:'+n+'"><span class="entry-number">'+String(n+1).padStart(2,'0')+'</span><strong>'+esc(m.title)+'</strong><span class="arrow" aria-hidden="true">↗</span></a>';}).join('')+'</nav><p class="source-note">余村青来集 · 青年与乡村，一起生长。</p></section>';
  }
  function renderModule(m) {
    var n=modules.indexOf(m);
    return '<article class="page detail" data-color="'+m.color+'"><a class="page-back" href="#explore">← 全部模块</a><header class="detail-header"><p class="page-kicker">'+String(n+1).padStart(2,'0')+' / '+esc(m.title)+'</p><h1 id="detailTitle">'+esc(m.headline)+'</h1><p class="page-lead">'+esc(m.description)+'</p></header>'+(m.photos?renderPhotoStrip(m):(['ai','events'].indexOf(m.id)<0?image(m.image,m.title+' · 原始资料配图','detail-photo',true,m.imageSmall):''))+m.blocks.map(renderBlock).join('')+'<p class="source-note">内容依据青来集提供的手册、海报与实景资料整理。</p></article>';
  }
  function renderPhotoStrip(m) {
    var key=register({title:'OPC 办公与生活实景',images:m.photos.map(function(p){return p.image;})});
    return '<section class="photo-carousel" aria-label="OPC 办公与生活实景图集"><div class="photo-strip" tabindex="0" aria-label="左右滑动或使用方向键查看照片">'+m.photos.map(function(p,n){return '<figure class="photo-slide" role="group" aria-label="第'+(n+1)+'张，共'+m.photos.length+'张"><button type="button" data-gallery="'+key+'" data-index="'+n+'" aria-label="放大'+esc(p.caption)+'">'+image(p.image,p.caption,'',n===0)+'</button><figcaption>'+esc(p.caption)+'</figcaption></figure>';}).join('')+'</div><div class="photo-strip-footer"><span>左右滑动 · 点图放大</span><div class="photo-strip-controls"><button type="button" data-photo-step="-1" aria-label="上一张实景照片" disabled>←</button><span class="photo-counter" aria-live="polite">1 / '+m.photos.length+'</span><button type="button" data-photo-step="1" aria-label="下一张实景照片">→</button></div></div></section>';
  }
  function initPhotoStrip() {
    var strip=main.querySelector('.photo-strip');if(!strip)return;
    var box=strip.closest('.photo-carousel'),slides=Array.from(strip.children);
    function update(){var index=0;slides.forEach(function(s,n){if(Math.abs(s.offsetLeft-strip.scrollLeft)<Math.abs(slides[index].offsetLeft-strip.scrollLeft))index=n;});strip.dataset.index=index;box.querySelector('.photo-counter').textContent=(index+1)+' / '+slides.length;box.querySelector('[data-photo-step="-1"]').disabled=index===0;box.querySelector('[data-photo-step="1"]').disabled=index===slides.length-1;slides.forEach(function(s,n){s.querySelector('button').tabIndex=n===index?0:-1;});}
    strip.addEventListener('scroll',update,{passive:true});
    strip.addEventListener('keydown',function(e){if(e.key==='ArrowLeft'||e.key==='ArrowRight'){e.preventDefault();movePhoto(strip,e.key==='ArrowLeft'?-1:1);}});update();
  }
  function movePhoto(strip,step){var index=Math.max(0,Math.min(strip.children.length-1,Number(strip.dataset.index||0)+step));strip.scrollTo({left:strip.children[index].offsetLeft,behavior:reduced.matches?'instant':'smooth'});}
  function enterAnimation() { main.classList.remove('is-entering');void main.offsetWidth;main.classList.add('is-entering'); }
  function renderRoute(route, scroll, focus) {
    if (!DATA) return;
    var m=moduleById(route);
    if (!m && route!=='home' && route!=='explore') route='home';
    var changed=route!==currentRoute;
    if (changed) {
      currentRoute=route;document.body.dataset.view=route;
      mediaRegistry.clear();mediaCounter=0;
      main.innerHTML=route==='home'?homeHTML:route==='explore'?renderDirectory():renderModule(m);
      initPhotoStrip();
      document.title=(m?m.title+' · ':'')+'余村青来集';
      actionBar.hidden=!m;
      actionBar.innerHTML=m?'<a class="button secondary" href="#explore">全部模块</a><button type="button" class="button primary" data-contact="'+m.id+'">'+esc(m.action)+' <span aria-hidden="true">↗</span></button>':'';
      enterAnimation();
    }
    if (scroll!==undefined) window.scrollTo({top:scroll,behavior:'instant'});
    if (focus && changed) main.focus({preventScroll:true});
  }
  function navigate(route) {
    if (!DATA) {showToast('内容加载中，请稍候');return;}
    route=aliases[route]||route;
    if (route===currentRoute){window.scrollTo({top:0,behavior:reduced.matches?'instant':'smooth'});return;}
    clearTimeout(timer);
    history.replaceState(Object.assign({},history.state,{scroll:window.scrollY}),'',location.href);
    function commit(){history.pushState({route:route,scroll:0},'','#'+route);renderRoute(route,0,true);}
    if (reduced.matches){commit();return;}
    el('pageWipe').classList.remove('play');void el('pageWipe').offsetWidth;el('pageWipe').classList.add('play');
    timer=setTimeout(commit,160);
  }
  function openOverlay(state) {
    history.pushState(Object.assign({route:currentRoute,scroll:window.scrollY},state),'',location.href);
    renderOverlay(state);
  }
  function closeOverlay() {
    if (history.state && history.state.overlay) history.back();
    else {dialog.close();document.body.classList.remove('modal-open');}
  }
  function renderContacts(id) {
    var m=moduleById(id);if(!m)return;
    el('overlayTitle').textContent=m.action;
    controls.hidden=true;dialog.classList.remove('gallery-mode');
    overlayContent.innerHTML=m.contacts.map(function(c){
      var inner='';
      if(c.type==='phone')inner='<a class="contact-value" href="'+phoneHref(c.value)+'">'+esc(c.value)+' ↗</a>';
      if(c.type==='email')inner='<a class="contact-value" href="mailto:'+esc(c.value)+'">'+esc(c.value)+' ↗</a><br><button class="text-link" type="button" data-copy="'+esc(c.value)+'">复制邮箱</button>';
      if(c.type==='map')inner='<p class="body-copy">'+esc(c.value)+'</p><a class="button primary" target="_blank" rel="noopener noreferrer" href="'+mapHref(c.value)+'">打开高德地图 ↗</a>';
      if(c.type==='qr')inner='<button type="button" class="qr-preview" data-gallery="'+register({title:c.title,images:[c.image],note:c.note})+'" aria-label="放大'+esc(c.title)+'二维码">'+image(c.image,c.title+'二维码','',true)+'<span>点开放大 · 长按识别</span></button>';
      return '<section class="contact-item"><h3>'+esc(c.title)+'</h3>'+inner+(c.note?'<p>'+esc(c.note)+'</p>':'')+'</section>';
    }).join('');
  }
  function renderGallery() {
    if(!activeGallery)return;
    var info=activeGallery;
    el('overlayTitle').textContent=info.title;
    dialog.classList.add('gallery-mode');
    var long=info.mode==='long';
    overlayContent.innerHTML=(info.note?'<p class="gallery-note">'+esc(info.note)+'</p>':'')+(long?info.images.map(function(src,i){return image(src,info.title+' · 第'+(i+1)+'部分','gallery-image',i===0);}).join(''):image(info.images[galleryIndex],info.title+' · 第'+(galleryIndex+1)+'张','gallery-image',true));
    controls.hidden=long || info.images.length<2;
    controls.innerHTML=controls.hidden?'':'<button type="button" data-gallery-step="-1" '+(galleryIndex===0?'disabled':'')+'>← 上一张</button><span aria-live="polite">'+(galleryIndex+1)+' / '+info.images.length+'</span><button type="button" data-gallery-step="1" '+(galleryIndex===info.images.length-1?'disabled':'')+'>下一张 →</button>';
    overlayContent.scrollTop=0;
    // Warm only neighboring pages, after the visible page has finished loading.
    if(!long){var visible=overlayContent.querySelector('.gallery-image'),index=galleryIndex;function warm(){if(activeGallery!==info||galleryIndex!==index)return;[index-1,index+1].forEach(function(n){if(info.images[n]){var nextImage=new Image();nextImage.decoding='async';nextImage.fetchPriority='low';nextImage.src=asset(info.images[n]);}});}if(visible.complete&&visible.naturalWidth)warm();else visible.addEventListener('load',warm,{once:true});}
  }
  function renderOverlay(state) {
    if(!state || !state.overlay){if(dialog.open)dialog.close();document.body.classList.remove('modal-open');return;}
    if(state.overlay==='contact')renderContacts(state.module);
    else if(state.overlay==='gallery'){
      activeGallery=mediaRegistry.get(state.key);
      if(!activeGallery){dialog.close();document.body.classList.remove('modal-open');return;}
      galleryIndex=state.index||0;renderGallery();
    }
    if(!dialog.open)dialog.showModal();
    document.body.classList.add('modal-open');overlayContent.scrollTop=0;
  }
  document.addEventListener('click',function(event){
    var target=event.target.closest('[data-photo-step]');
    if(target){movePhoto(target.closest('.photo-carousel').querySelector('.photo-strip'),Number(target.dataset.photoStep));return;}
    target=event.target.closest('[data-gallery]');
    if(target){openOverlay({overlay:'gallery',key:target.dataset.gallery,index:Number(target.dataset.index)||0});return;}
    target=event.target.closest('[data-contact]');
    if(target){openOverlay({overlay:'contact',module:target.dataset.contact});return;}
    target=event.target.closest('[data-gallery-step]');
    if(target){galleryIndex=Math.max(0,Math.min(activeGallery.images.length-1,galleryIndex+Number(target.dataset.galleryStep)));renderGallery();return;}
    target=event.target.closest('[data-copy]');
    if(target){var value=target.dataset.copy;if(navigator.clipboard)navigator.clipboard.writeText(value).then(function(){showToast('已复制');}).catch(function(){showToast('请长按邮箱复制');});else showToast('请长按邮箱复制');return;}
    target=event.target.closest('[data-filter]');
    if(target){var block=target.closest('.content-block');block.querySelectorAll('[data-filter]').forEach(function(b){b.setAttribute('aria-pressed',String(b===target));});block.querySelectorAll('.event').forEach(function(row){row.hidden=target.dataset.filter!=='全部'&&row.dataset.category!==target.dataset.filter;});var list=block.querySelector('.event-list');list.classList.remove('filtered');void list.offsetWidth;list.classList.add('filtered');return;}
    target=event.target.closest('a[href^="#"]');
    if(target&&target.getAttribute('href')!=='#main'){event.preventDefault();navigate(target.getAttribute('href').slice(1));}
  });
  document.addEventListener('pointerdown',function(event){
    if(reduced.matches)return;
    var target=event.target.closest('.button,.entry');if(!target)return;
    var rect=target.getBoundingClientRect(),wave=document.createElement('span');wave.className='tap-wave';wave.setAttribute('aria-hidden','true');wave.style.left=(event.clientX-rect.left)+'px';wave.style.top=(event.clientY-rect.top)+'px';target.appendChild(wave);setTimeout(function(){wave.remove();},530);
  },{passive:true});
  el('closeOverlay').addEventListener('click',closeOverlay);
  dialog.addEventListener('cancel',function(e){e.preventDefault();closeOverlay();});
  dialog.addEventListener('click',function(e){if(e.target===dialog)closeOverlay();});
  window.addEventListener('popstate',function(e){clearTimeout(timer);el('pageWipe').classList.remove('play');if(e.state&&e.state.overlay){renderOverlay(e.state);}else{renderOverlay(null);renderRoute(routeFromHash(),e.state&&e.state.scroll||0,true);}});
  window.addEventListener('hashchange',function(){if(!(history.state&&history.state.overlay)&&routeFromHash()!==currentRoute)renderRoute(routeFromHash(),0,true);});
  function load(){
    Promise.resolve(window.__QL_DATA__ || fetch('data.json?v=20260928-intro9').then(function(r){if(!r.ok)throw Error('内容加载失败');return r.json();})).then(function(data){
      DATA=data;modules=data.modules;
      if(!Array.isArray(modules)||modules.length!==8)throw Error('模块数据不完整');
      history.replaceState({route:routeFromHash(),scroll:0},'',location.href);
      renderRoute(routeFromHash(),0,false);
    }).catch(function(error){console.error(error);showToast('内容加载失败，请重试');var retry=document.createElement('button');retry.type='button';retry.className='button primary';retry.textContent='重新加载内容';retry.onclick=function(){retry.remove();load();};main.appendChild(retry);});
  }
  load();
})();
