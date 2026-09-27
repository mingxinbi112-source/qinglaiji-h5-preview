/* 青来集大会导览：内容从 data.json 读取；单文件版优先使用内联数据。 */
(function () {
  'use strict';
  var DATA, EVENT, MODULES = [];
  var media = new Map();
  var mediaIndex = 0;
  var currentFilter = 'all';
  var currentPeriod = 'all';
  var galleryObserver = null;
  var toastTimer = null;
  var moduleDialog = document.getElementById('moduleDialog');
  var galleryDialog = document.getElementById('galleryDialog');
  var dialogContent = document.getElementById('dialogContent');
  var galleryContent = document.getElementById('galleryContent');

  var groups = {
    opc: ['create', '创业与合作', 'assets/opc.jpg'],
    party: ['create', '研学与实践', 'assets/party_route_classic_cover.jpg'],
    partner: ['create', '创业与合作', 'assets/partner.jpg'],
    aifriends: ['connect', '社群与活动', 'assets/aifriends.jpg'],
    community: ['connect', '社群与活动', 'assets/community.jpg'],
    apartment: ['live', '在村生活', 'assets/apartment1.jpg'],
    recent: ['connect', '社群与活动', 'assets/event1.jpg'],
    guide: ['live', '在村生活', 'assets/yucun_map.jpg']
  };

  function el(id) { return document.getElementById(id); }
  function esc(value) {
    return String(value == null ? '' : value).replace(/[&<>"']/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];
    });
  }
  function tel(phone) { return 'tel:' + String(phone || '').replace(/[^\d+]/g, ''); }
  function asset(path) { return (window.__QL_ASSETS__ && window.__QL_ASSETS__[path]) || path; }
  function mapUrl(keyword) {
    return 'https://uri.amap.com/search?keyword=' + encodeURIComponent(keyword) + '&city=' + encodeURIComponent('安吉') + '&view=map&src=qinglaiji-guide';
  }
  function setText(id, value) { el(id).textContent = value || ''; }
  function section(title, content) { return '<section class="detail-section"><h3>' + esc(title) + '</h3>' + content + '</section>'; }
  function mediaButton(title, source, label, slices) {
    if (!source || (Array.isArray(source) && !source.length)) return '';
    var key = 'media-' + (++mediaIndex);
    media.set(key, {title:title, source:source, slices:!!slices});
    return '<button type="button" class="button button-outline" data-media="' + key + '">' + esc(label || '查看图片') + ' ↗</button>';
  }
  function imageMarkup(src, alt, className, loadMode) {
    return '<img class="' + (className || '') + '" src="' + esc(asset(src)) + '" alt="' + esc(alt || '') + '" loading="' + (loadMode || 'lazy') + '">';
  }
  function plainList(items) {
    return '<ul class="detail-list">' + items.map(function (item) { return '<li>' + esc(item) + '</li>'; }).join('') + '</ul>';
  }
  function flowList(items) {
    return '<ul class="detail-list">' + items.map(function (item) {
      return '<li><strong>' + esc(item.step) + '. ' + esc(item.title) + '</strong><span>' + esc(item.desc) + '</span></li>';
    }).join('') + '</ul>';
  }
  function policyList(items) {
    return '<ul class="detail-list">' + items.map(function (item) {
      return '<li><strong>' + esc(item.title) + '</strong><span>' + esc(item.desc) + '</span></li>';
    }).join('') + '</ul>';
  }
  function pastEvents(items) {
    return '<ul class="detail-list">' + items.map(function (item) {
      return '<li><strong>' + esc(item.title) + '</strong><span>' + esc(item.date) + ' · ' + esc(item.time) + ' · ' + esc(item.location) + '</span><br><span class="event-past">往期活动</span>' +
        (item.phone ? ' <a href="' + tel(item.phone) + '">电话：' + esc(item.phone) + '</a>' : '') + '</li>';
    }).join('') + '</ul>';
  }
  function contactActions(contact, options) {
    if (!contact) return '';
    var out = [];
    if (contact.phone) out.push('<a class="button button-dark" href="' + tel(contact.phone) + '">拨打 ' + esc(contact.phone) + ' ↗</a>');
    if (contact.email) out.push('<a class="button button-outline" href="mailto:' + encodeURIComponent(contact.email) + '">发送邮件 ↗</a>');
    if (contact.qrcode && contact.qrcode.indexOf('assets/') === 0) out.push(mediaButton(options || '联系二维码', contact.qrcode, '查看联系图片'));
    return '<div class="detail-actions">' + out.join('') + '</div>' + (contact.note ? '<p class="detail-note">' + esc(contact.note) + '</p>' : '');
  }

  function renderConference() {
    setText('heroLineTop', EVENT.headlineTop);
    setText('heroLineBottom', EVENT.headlineBottom);
    setText('heroTagline', EVENT.tagline);
    setText('eventName', EVENT.name);
    setText('eventDate', EVENT.dateLabel + '  ' + EVENT.timeLabel);
    setText('eventPlace', EVENT.place);
    setText('conferenceIntro', EVENT.intro);
    setText('agendaDate', EVENT.dateLabel + '  /  ' + EVENT.timeLabel);
    setText('venueName', EVENT.place);
    setText('venueAddress', EVENT.address);
    document.title = EVENT.name + ' · 大会导览';
    if (!EVENT.demo) {
      document.querySelectorAll('.demo-tag,.demo-note').forEach(function (node) { node.hidden = true; });
      setText('footerStatus', '大会导览 · 信息以现场为准');
    }
    el('mapLink').href = mapUrl(EVENT.mapKeyword);
    el('venuePoints').innerHTML = EVENT.venues.map(function (v) {
      return '<div class="venue-point"><b>' + esc(v.icon) + '</b><div><strong>' + esc(v.name) + '</strong><small>' + esc(v.meta) + ' · ' + esc(v.detail) + '</small></div></div>';
    }).join('');
    if (EVENT.heroImage) document.querySelector('.hero-photo').src = asset(EVENT.heroImage);
  }
  function renderAgenda() {
    var list = EVENT.agenda.filter(function (item) { return currentPeriod === 'all' || item.period === currentPeriod; });
    el('agendaList').innerHTML = list.map(function (item, index) {
      return '<details class="agenda-item" style="--entry-index:' + index + '"><summary><span class="agenda-time">' + esc(item.time) + '</span><span class="agenda-main"><strong>' + esc(item.title) + '</strong><small>' + esc(item.time) + ' — ' + esc(item.end) + ' · ' + esc(item.location) + '</small></span><span class="agenda-plus" aria-hidden="true">+</span></summary><div class="agenda-detail">' + esc(item.description) + '</div></details>';
    }).join('');
  }
  function renderModules() {
    var selected = MODULES.filter(function (item) {
      return currentFilter === 'all' || (groups[item.id] && groups[item.id][0] === currentFilter);
    });
    el('moduleGrid').innerHTML = selected.map(function (item, index) {
      var group = groups[item.id] || ['connect', '青来集', 'assets/community.jpg'];
      return '<button class="module-card" type="button" style="--entry-index:' + index + '" data-group="' + esc(group[0]) + '" data-open-module="' + esc(item.id) + '" aria-label="查看' + esc(item.title) + '详情">' +
        '<span class="module-image">' + imageMarkup(group[2], item.title, '', 'eager') + '<span class="module-number">' + String(index + 1).padStart(2, '0') + '</span></span>' +
        '<span class="module-info"><span class="module-category">' + esc(group[1]) + '</span><strong>' + esc(item.title) + '</strong><small>' + esc(item.summary) + '</small><span class="module-open" aria-hidden="true">↗</span></span></button>';
    }).join('');
  }
  function renderModule(item) {
    var html = '<p class="detail-lead">' + esc(item.summary) + '</p>';
    switch (item.id) {
      case 'opc':
        html += imageMarkup(item.images[0], 'OPC入驻宣传资料', 'detail-cover');
        html += section('入驻流程', flowList(item.flow));
        html += section('可获得的支持', policyList(item.policy));
        html += section('已入驻项目', plainList(item.cases));
        html += section('联系入驻', '<p>可直接电话咨询，也可查看原始折页了解更多。</p>' + contactActions(item.contact) + '<div class="detail-actions">' + mediaButton('OPC入驻折页', item.images[0], '查看宣传折页') + '</div>');
        break;
      case 'party':
        html += item.products.map(function (p) {
          return section(p.name, imageMarkup(p.cover, p.name, 'detail-cover') +
            '<p><strong>' + esc(p.duration) + '</strong></p>' +
            (p.desc ? '<p>' + esc(p.desc) + '</p>' : '') +
            (p.route ? plainList(p.route) : '') +
            '<p><strong>资料价格：</strong>' + esc(p.price) + '</p>' +
            '<div class="detail-actions">' + mediaButton(p.name + '完整折页', p.slices, '查看完整折页', true) + '</div>');
        }).join('');
        html += section('咨询研学产品', contactActions(item.contact, '研学负责人'));
        html += '<p class="detail-note">产品价格与行程来自原始折页，实际安排请向负责人确认。</p>';
        break;
      case 'partner':
        html += imageMarkup(item.images[0], '全球合伙人招募资料', 'detail-cover');
        html += section('加入流程', flowList(item.flow));
        html += section('招募方向与支持', policyList(item.policy));
        html += section('联系合伙人计划', contactActions(item.contact) + '<div class="detail-actions">' + mediaButton('合伙人招募海报', item.images[0], '查看招募海报') + '</div>');
        break;
      case 'aifriends':
        html += imageMarkup(item.images[0], 'AI朋友局往期活动', 'detail-cover');
        html += section('往期活动', pastEvents(item.events));
        html += section('加入社群', '<p>点击查看群二维码。群码可能过期，请以现场或官方最新信息为准。</p><div class="detail-actions">' + mediaButton('AI朋友局群二维码', item.group.qrcode, '查看群二维码') + '</div>');
        break;
      case 'community':
        html += imageMarkup(item.images[0], '青聚落往期活动', 'detail-cover');
        html += section('往期活动', pastEvents(item.events));
        html += section('联系社区负责人', contactActions(item.contact));
        break;
      case 'apartment':
        html += imageMarkup(item.images[0], '青来集人才公寓', 'detail-cover');
        html += section('公寓位置', '<p>' + esc(item.address) + '</p><div class="detail-actions"><a class="button button-outline" href="' + mapUrl(item.address) + '" target="_blank" rel="noopener noreferrer">地图搜索 ↗</a></div>');
        html += section('入住须知', plainList(item.rules));
        html += section('服务电话', '<ul class="detail-list">' + item.contacts.map(function (c) {
          return '<li><strong>' + esc(c.label) + (c.hours ? ' · ' + esc(c.hours) : '') + '</strong><a href="' + tel(c.phone) + '">' + esc(c.phone) + '</a></li>';
        }).join('') + '</ul>');
        html += section('公寓环境', '<div class="detail-gallery">' + item.images.map(function (src, i) {
          var key = 'media-' + (++mediaIndex);
          media.set(key, {title:'公寓环境 ' + (i + 1),source:src,slices:false});
          return '<button type="button" data-media="' + key + '" aria-label="放大公寓照片' + (i + 1) + '">' + imageMarkup(src, '公寓环境照片' + (i + 1)) + '</button>';
        }).join('') + '</div>');
        break;
      case 'recent':
        html += section('往期村中活动', pastEvents(item.events));
        html += '<p class="detail-note">此处展示资料包里的往期活动；大会新活动以正式日程为准。</p>';
        break;
      case 'guide':
        html += imageMarkup(item.map, '余村漫游地图', 'detail-cover');
        html += '<div class="detail-actions">' + mediaButton('余村漫游地图', item.map, '放大余村地图') + mediaButton('饭店推荐长图', item.restaurantSlices, '查看饭店推荐长图', true) + '</div>';
        html += section('附近饭店', '<div class="rest-list">' + item.restaurants.map(function (r) {
          return '<div class="rest-item"><strong>' + esc(r.name) + '</strong><small>' + esc(r.address) + '</small><a href="' + tel(r.phone) + '">' + esc(r.phone) + '</a></div>';
        }).join('') + '</div>');
        break;
    }
    return html;
  }
  function openModule(id) {
    var item = MODULES.find(function (m) { return m.id === id; });
    if (!item) return;
    media.clear();
    moduleDialog.dataset.group = (groups[id] || ['connect'])[0];
    setText('dialogTitle', item.title);
    dialogContent.innerHTML = renderModule(item);
    dialogContent.scrollTop = 0;
    if (!moduleDialog.open) moduleDialog.showModal();
  }
  function openMedia(key) {
    var info = media.get(key);
    if (!info) return;
    setText('galleryTitle', info.title);
    galleryContent.innerHTML = '';
    if (galleryObserver) { galleryObserver.disconnect(); galleryObserver = null; }
    if (info.slices) {
      info.source.forEach(function (src) {
        var holder = document.createElement('div');
        holder.className = 'slice-holder';
        holder.dataset.src = src;
        galleryContent.appendChild(holder);
      });
      galleryObserver = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (!entry.isIntersecting || entry.target.dataset.loaded) return;
          var img = document.createElement('img');
          img.alt = info.title;
          img.src = entry.target.dataset.src;
          entry.target.dataset.loaded = '1';
          entry.target.appendChild(img);
          galleryObserver.unobserve(entry.target);
        });
      }, {root:galleryContent,rootMargin:'500px'});
      galleryContent.querySelectorAll('.slice-holder').forEach(function (holder) { galleryObserver.observe(holder); });
    } else {
      var img = document.createElement('img');
      img.alt = info.title;
      img.src = info.source;
      galleryContent.appendChild(img);
    }
    galleryContent.scrollTop = 0;
    galleryDialog.showModal();
  }
  function closeGallery() {
    if (galleryObserver) { galleryObserver.disconnect(); galleryObserver = null; }
    galleryDialog.close();
    galleryContent.innerHTML = '';
  }
  function toast(message) {
    var node = el('toast');
    node.textContent = message;
    node.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { node.classList.remove('show'); }, 2500);
  }
  function copyAddress() {
    var value = EVENT.address;
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(value).then(function () { toast('地址已复制'); }).catch(copyFallback);
    } else copyFallback();
    function copyFallback() {
      var input = document.createElement('textarea');
      input.value = value;
      input.style.position = 'fixed';
      input.style.opacity = '0';
      document.body.appendChild(input);
      input.select();
      var okay = document.execCommand('copy');
      input.remove();
      toast(okay ? '地址已复制' : '复制失败，请长按地址复制');
    }
  }
  function selectGroup(selector, attribute, value) {
    document.querySelectorAll(selector).forEach(function (button) {
      var active = button.getAttribute(attribute) === value;
      button.classList.toggle('is-active', active);
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
    });
  }
  function setupNavigation() {
    var mobile = window.matchMedia('(max-width:620px), (orientation:landscape) and (max-height:500px) and (max-width:900px)');
    var views = ['home', 'agenda', 'venue', 'explore'];
    var transition = el('pageTransition');
    var transitionTimer;
    var revealTimer;
    var reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
    function setMobileView(view, resetScroll) {
      if (!mobile.matches) return;
      if (views.indexOf(view) < 0) view = 'home';
      document.body.dataset.mobileView = view;
      document.body.classList.remove('view-animate');
      void document.body.offsetWidth;
      document.body.classList.add('view-animate');
      document.querySelectorAll('[data-nav]').forEach(function (link) {
        var active = link.dataset.nav === (view === 'home' ? 'top' : view);
        link.classList.toggle('is-active', active);
        if (active) link.setAttribute('aria-current', 'page');
        else link.removeAttribute('aria-current');
      });
      if (resetScroll) requestAnimationFrame(function () { window.scrollTo(0, 0); });
    }
    function viewFromHash() {
      var hash = location.hash.slice(1);
      return views.indexOf(hash) >= 0 ? hash : 'home';
    }
    function syncView() {
      clearTimeout(transitionTimer);
      clearTimeout(revealTimer);
      transition.className = 'page-transition';
      setMobileView(viewFromHash(), true);
    }
    document.addEventListener('click', function (event) {
      if (!mobile.matches) return;
      var link = event.target.closest('a[href^="#"]');
      if (!link) return;
      var hash = link.getAttribute('href').slice(1);
      if (['top', 'home', 'agenda', 'venue', 'explore'].indexOf(hash) < 0) return;
      event.preventDefault();
      var view = hash === 'top' ? 'home' : hash;
      if (view === document.body.dataset.mobileView) {
        window.scrollTo(0, 0);
        return;
      }
      function commitView() {
        history.pushState({view:view}, '', view === 'home' ? '#top' : '#' + view);
        setMobileView(view, true);
      }
      if (reducedMotion.matches) { commitView(); return; }
      clearTimeout(transitionTimer);
      clearTimeout(revealTimer);
      transition.style.setProperty('--touch-x', (event.clientX || innerWidth / 2) + 'px');
      transition.style.setProperty('--touch-y', (event.clientY || innerHeight / 2) + 'px');
      transition.style.setProperty('--transition-color', view === 'agenda' ? '#86cee3' : view === 'venue' ? '#a9cf9d' : view === 'explore' ? '#f0a469' : '#b9e1d5');
      transition.className = 'page-transition';
      void transition.offsetWidth;
      transition.className = 'page-transition is-covering';
      transitionTimer = setTimeout(function () {
        commitView();
        transition.className = 'page-transition is-revealing';
        revealTimer = setTimeout(function () { transition.className = 'page-transition'; }, 260);
      }, 190);
    });
    window.addEventListener('popstate', syncView);
    window.addEventListener('hashchange', syncView);
    if (mobile.addEventListener) mobile.addEventListener('change', syncView);
    else mobile.addListener(syncView);
    syncView();

    var ids = ['top','agenda','venue','explore'];
    var observer = new IntersectionObserver(function (entries) {
      if (mobile.matches) return;
      entries.forEach(function (entry) {
        if (!entry.isIntersecting) return;
        document.querySelectorAll('[data-nav]').forEach(function (link) {
          var active = link.dataset.nav === entry.target.id;
          link.classList.toggle('is-active', active);
          if (active) link.setAttribute('aria-current', 'location');
          else link.removeAttribute('aria-current');
        });
      });
    }, {rootMargin:'-35% 0px -60% 0px'});
    ids.forEach(function (id) { observer.observe(el(id)); });
  }
  document.addEventListener('pointerdown', function (event) {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    var target = event.target.closest('.quick-item,.hero-actions .button,.bottom-nav a,.mobile-page-header a,.segmented button,.filter-list button,.module-card,.venue-actions .button,.agenda-item summary,.icon-button');
    if (!target) return;
    var box = target.getBoundingClientRect();
    var ripple = document.createElement('span');
    ripple.className = 'tap-ripple';
    ripple.style.left = event.clientX - box.left + 'px';
    ripple.style.top = event.clientY - box.top + 'px';
    target.appendChild(ripple);
    setTimeout(function () { ripple.remove(); }, 540);
  }, {passive:true});
  document.addEventListener('click', function (event) {
    var trigger = event.target.closest('[data-open-module]');
    if (trigger) { openModule(trigger.dataset.openModule); return; }
    trigger = event.target.closest('[data-media]');
    if (trigger) { openMedia(trigger.dataset.media); return; }
    trigger = event.target.closest('[data-filter]');
    if (trigger) {
      currentFilter = trigger.dataset.filter;
      selectGroup('[data-filter]', 'data-filter', currentFilter);
      renderModules();
      return;
    }
    trigger = event.target.closest('[data-period]');
    if (trigger) {
      currentPeriod = trigger.dataset.period;
      selectGroup('[data-period]', 'data-period', currentPeriod);
      renderAgenda();
    }
  });
  el('closeModule').addEventListener('click', function () { moduleDialog.close(); });
  el('closeGallery').addEventListener('click', closeGallery);
  el('copyAddress').addEventListener('click', copyAddress);
  moduleDialog.addEventListener('click', function (event) { if (event.target === moduleDialog) moduleDialog.close(); });
  galleryDialog.addEventListener('click', function (event) { if (event.target === galleryDialog) closeGallery(); });
  galleryDialog.addEventListener('close', function () {
    if (galleryObserver) { galleryObserver.disconnect(); galleryObserver = null; }
    galleryContent.innerHTML = '';
  });

  Promise.resolve(window.__QL_DATA__ || fetch('data.json?v=20260927-visual5').then(function (response) {
    if (!response.ok) throw new Error('data.json ' + response.status);
    return response.json();
  })).then(function (data) {
    DATA = data;
    EVENT = data.conference;
    MODULES = data.modules || [];
    if (!EVENT || !EVENT.agenda) throw new Error('大会配置缺失');
    renderConference();
    renderAgenda();
    renderModules();
  }).catch(function (error) {
    console.error('青来集数据加载失败', error);
    el('agendaList').innerHTML = '<p>内容加载失败，请检查网络后刷新页面。</p><button class="button button-dark" type="button" onclick="location.reload()">重新加载</button>';
    toast('内容加载失败');
  });
  setupNavigation();
})();
