/* «Время шоу» — скрипты лендинга. © 2026 Полунин Лев */
(function () {
  'use strict';

  /* Если подключите приём заявок на сервере (Telegram-бот, CRM, formspree и т.п.) — укажите URL.
     Скрипт отправит POST с JSON { name, phone, date, city, program, comment, calc, page }. */
  var CONFIG = { endpoint: '' };

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var SHOWS = window.SHOWS || [];
  var bySlug = {};
  SHOWS.forEach(function (s) { bySlug[s.slug] = s; });
  var PAPER = { name: 'Бумажное шоу в финале', price: 4000 };
  var rub = function (n) { return String(n).replace(/\B(?=(\d{3})+(?!\d))/g, ' ') + ' ₽'; };
  var root = document.documentElement;

  /* ---------- header + burger ---------- */
  var header = $('.header');
  var burger = $('.burger');
  var mbar = $('.mbar');
  var hero = $('.hero');
  function onScroll() {
    var y = window.pageYOffset || 0;
    header.classList.toggle('is-scrolled', y > 30);
    if (mbar && hero) mbar.classList.toggle('is-on', y > hero.offsetHeight * 0.6);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setMenu(open) {
    root.classList.toggle('menu-open', open);
    document.body.classList.toggle('modal-lock', open);
    burger.setAttribute('aria-expanded', open ? 'true' : 'false');
    burger.setAttribute('aria-label', open ? 'Закрыть меню' : 'Открыть меню');
  }
  burger.addEventListener('click', function () { setMenu(!root.classList.contains('menu-open')); });
  $$('#nav a').forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });
  window.addEventListener('resize', function () { if (window.innerWidth > 960) setMenu(false); });

  /* ---------- reveal ---------- */
  var rvEls = $$('.why__card, .bento__item, .ticket, .about, .step, .qa, .form, .order__txt, .reel');
  if ('IntersectionObserver' in window) {
    rvEls.forEach(function (el) { el.classList.add('rv'); });
    var io = new IntersectionObserver(function (en) {
      en.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('is-in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    rvEls.forEach(function (el) { io.observe(el); });
  }

  /* ---------- catalog filter ---------- */
  var cards = $$('.tc');
  var moreBtn = $('#showMore');
  var LIMIT = 8;
  var expanded = false;
  var current = 'all';
  function applyFilter() {
    var shown = 0;
    cards.forEach(function (c) {
      var ok = current === 'all' || c.getAttribute('data-cats').split(' ').indexOf(current) > -1;
      var vis = ok && (expanded || current !== 'all' || shown < LIMIT);
      if (ok && vis) { shown++; c.style.setProperty('--d', shown); }
      c.hidden = !vis;
    });
    moreBtn.parentNode.hidden = expanded || current !== 'all';
  }
  $$('.chip[data-f]').forEach(function (b) {
    b.addEventListener('click', function () {
      current = b.getAttribute('data-f');
      $$('.chip[data-f]').forEach(function (x) { x.classList.toggle('is-on', x === b); x.setAttribute('aria-selected', x === b ? 'true' : 'false'); });
      applyFilter();
    });
  });
  moreBtn.addEventListener('click', function () { expanded = true; applyFilter(); });
  applyFilter();

  /* ---------- dialogs ---------- */
  function openDlg(d) {
    if (typeof d.showModal === 'function') { if (!d.open) d.showModal(); } else d.setAttribute('open', '');
    document.body.classList.add('modal-lock');
  }
  function closeDlg(d) {
    if (typeof d.close === 'function') d.close(); else d.removeAttribute('open');
    document.body.classList.remove('modal-lock');
  }
  $$('dialog').forEach(function (d) {
    d.addEventListener('click', function (e) { if (e.target === d || e.target.hasAttribute('data-close')) closeDlg(d); });
    d.addEventListener('close', function () { document.body.classList.remove('modal-lock'); });
  });

  var modal = $('#showModal');
  var modalSlug = '';
  function openShow(slug) {
    var s = bySlug[slug]; if (!s) return;
    modalSlug = slug;
    $('#mTitle').textContent = s.name;
    $('#mPoster').src = 'img/posters/' + slug + '.jpg';
    $('#mPosterW').srcset = 'img/posters/' + slug + '.webp';
    $('#mPoster').alt = 'Афиша программы «' + s.name + '» — Время шоу';
    var price = s.variants.length ? s.variants.map(function (v) { return rub(v[1]); }).join(' / ') : (s.from ? 'от ' : '') + rub(s.price);
    $('#mMeta').textContent = price + ' · ' + s.dur;
    $('#mList').innerHTML = '';
    s.items.forEach(function (t) { var li = document.createElement('li'); li.textContent = t; $('#mList').appendChild(li); });
    var add = $('#mAddons'); add.innerHTML = '';
    var list = s.variants.map(function (v) { return v[0] + ' — ' + rub(v[1]); }).concat(s.addons.map(function (a) { return a[0] + ' — +' + rub(a[1]); }));
    if (s.addonOnly) list = ['Заказывается дополнительно к основной программе'];
    if (list.length) {
      var box = document.createElement('div'); box.className = 'modal__add';
      var b = document.createElement('b'); b.textContent = s.addonOnly ? 'Важно' : 'Варианты и дополнения'; box.appendChild(b);
      list.forEach(function (t) { var p = document.createElement('div'); p.textContent = '• ' + t; box.appendChild(p); });
      add.appendChild(box);
    }
    $('#mCalc').hidden = !!s.addonOnly;
    openDlg(modal);
  }
  cards.forEach(function (c) {
    var slug = c.getAttribute('data-slug');
    $$('.tc__open, .tc__more', c).forEach(function (b) { b.addEventListener('click', function () { openShow(slug); }); });
  });

  /* ---------- builder ---------- */
  var bProgram = $('#bProgram');
  var bVariants = $('#bVariants');
  var bAddons = $('#bAddons');
  var calcText = '';
  function renderBuilder() {
    var s = bySlug[bProgram.value]; if (!s) return;
    bVariants.innerHTML = ''; bAddons.innerHTML = '';
    $('#bVariantsWrap').hidden = !s.variants.length;
    s.variants.forEach(function (v, i) {
      var l = document.createElement('label'); l.className = 'opt';
      l.innerHTML = '<input type="radio" name="bVar"' + (i === 0 ? ' checked' : '') + ' value="' + i + '"><span></span><b>' + rub(v[1]) + '</b>';
      l.querySelector('span').textContent = v[0];
      bVariants.appendChild(l);
    });
    var adds = s.addons.slice();
    adds.push([PAPER.name + ' (20–30 мин)', PAPER.price]);
    adds.forEach(function (a, i) {
      var l = document.createElement('label'); l.className = 'opt';
      l.innerHTML = '<input type="checkbox" value="' + i + '"><span></span><b>+' + rub(a[1]) + '</b>';
      l.querySelector('span').textContent = a[0];
      l.dataset.name = a[0]; l.dataset.price = a[1];
      bAddons.appendChild(l);
    });
    calc();
  }
  function calc() {
    var s = bySlug[bProgram.value]; if (!s) return;
    var base = s.price, baseName = s.name;
    var vr = $('input[name="bVar"]:checked', bVariants);
    if (vr) { var v = s.variants[+vr.value]; base = v[1]; baseName = s.name + ' — ' + v[0].toLowerCase(); }
    var total = base, lines = [];
    $$('.opt', bAddons).forEach(function (l) {
      var on = $('input', l).checked; l.classList.toggle('is-on', on);
      if (on) { total += +l.dataset.price; lines.push([l.dataset.name, +l.dataset.price]); }
    });
    $$('.opt', bVariants).forEach(function (l) { l.classList.toggle('is-on', $('input', l).checked); });
    $('#bName').textContent = s.name;
    $('#bDur').textContent = s.dur;
    var list = $('#bList'); list.innerHTML = '';
    [[baseName, base]].concat(lines).forEach(function (x) {
      var d = document.createElement('div'); var a = document.createElement('span'); a.textContent = x[0];
      var b = document.createElement('b'); b.textContent = rub(x[1]); d.appendChild(a); d.appendChild(b); list.appendChild(d);
    });
    $('#bTotal').textContent = (s.from ? 'от ' : '') + rub(total);
    calcText = 'Расчёт: ' + baseName + ' (' + rub(base) + ')' + lines.map(function (x) { return ' + ' + x[0] + ' (' + rub(x[1]) + ')'; }).join('') + ' = ' + (s.from ? 'от ' : '') + rub(total);
  }
  bProgram.addEventListener('change', renderBuilder);
  bAddons.addEventListener('change', calc);
  bVariants.addEventListener('change', calc);
  renderBuilder();

  var fProgram = $('#fProgram');
  var fComment = $('#orderForm textarea[name="comment"]');
  var useCalc = false;
  $('#bOrder').addEventListener('click', function () {
    fProgram.value = bProgram.value; useCalc = true;
    if (fComment && fComment.value.indexOf('Расчёт:') === -1) fComment.value = (fComment.value ? fComment.value + '\n' : '') + calcText;
  });
  function pick(slug) {
    if (bySlug[slug] && !bySlug[slug].addonOnly) { fProgram.value = slug; bProgram.value = slug; renderBuilder(); }
  }
  $('#mPick').addEventListener('click', function () { var s = modalSlug; closeDlg(modal); pick(s); jump('#order'); });
  $('#mCalc').addEventListener('click', function () { var s = modalSlug; closeDlg(modal); pick(s); jump('#builder'); });
  $$('[data-pick]').forEach(function (a) { a.addEventListener('click', function () { pick(a.getAttribute('data-pick')); }); });
  function jump(sel) { var el = $(sel); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' }); }

  /* ---------- reels ---------- */
  var reels = $$('.reel');
  function stopAll(except) {
    reels.forEach(function (r) {
      if (r === except) return;
      var v = $('video', r); if (v) { v.pause(); }
      r.classList.remove('is-playing');
    });
  }
  reels.forEach(function (r) {
    var btn = $('.reel__play', r);
    btn.addEventListener('click', function () {
      stopAll(r);
      var v = $('video', r);
      if (!v) {
        v = document.createElement('video');
        v.src = r.getAttribute('data-src');
        v.setAttribute('playsinline', ''); v.setAttribute('webkit-playsinline', '');
        v.controls = true; v.preload = 'auto';
        v.addEventListener('ended', function () { r.classList.remove('is-playing'); });
        v.addEventListener('pause', function () { if (!v.seeking) r.classList.remove('is-playing'); });
        v.addEventListener('play', function () { stopAll(r); r.classList.add('is-playing'); });
        $('.reel__frame', r).appendChild(v);
      }
      var p = v.play(); if (p && p.catch) p.catch(function () {});
      r.classList.add('is-playing');
    });
  });

  /* ---------- steps clock ---------- */
  var stepsSec = $('#steps'), hand = $('#bigHand'), steps = $$('.step');
  var ticking = false;
  function clockTick() {
    ticking = false;
    var r = stepsSec.getBoundingClientRect(), vh = window.innerHeight;
    var p = Math.min(1, Math.max(0, (vh * 0.85 - r.top) / (r.height + vh * 0.3)));
    hand.style.transform = 'rotate(' + Math.round(p * 360) + 'deg)';
    var idx = Math.min(steps.length - 1, Math.floor(p * steps.length));
    steps.forEach(function (s, i) { s.classList.toggle('is-on', i === idx && p > 0.02); });
  }
  if (stepsSec && hand) {
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(clockTick); } }, { passive: true });
    clockTick();
  }

  /* ---------- reviews slider ---------- */
  var slider = $('#revSlider'), dotsBox = $('#revDots');
  if (slider) {
    var slides = $$('.rev', slider);
    var step = function () { return slides[0].getBoundingClientRect().width + 26; };
    var pages = function () { return Math.max(1, Math.ceil((slider.scrollWidth - slider.clientWidth) / step()) + 1); };
    var buildDots = function () {
      dotsBox.innerHTML = '';
      for (var i = 0; i < pages(); i++) {
        (function (i) {
          var b = document.createElement('button'); b.type = 'button'; b.setAttribute('aria-label', 'Отзыв ' + (i + 1));
          b.addEventListener('click', function () { slider.scrollTo({ left: i * step(), behavior: 'smooth' }); });
          dotsBox.appendChild(b);
        })(i);
      }
      syncDots();
    };
    var syncDots = function () {
      var i = Math.round(slider.scrollLeft / step());
      if (slider.scrollLeft + slider.clientWidth >= slider.scrollWidth - 4) i = pages() - 1;
      $$('button', dotsBox).forEach(function (b, k) { b.classList.toggle('is-on', k === i); });
    };
    var go = function (dir) {
      var max = slider.scrollWidth - slider.clientWidth;
      var to = slider.scrollLeft + dir * step();
      if (to > max + 4) to = 0; else if (to < -4) to = max;
      slider.scrollTo({ left: to, behavior: 'smooth' });
    };
    $('#revPrev').addEventListener('click', function () { go(-1); });
    $('#revNext').addEventListener('click', function () { go(1); });
    slider.addEventListener('keydown', function (e) { if (e.key === 'ArrowRight') go(1); if (e.key === 'ArrowLeft') go(-1); });
    var st; slider.addEventListener('scroll', function () { clearTimeout(st); st = setTimeout(syncDots, 60); }, { passive: true });
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(buildDots, 150); });
    buildDots();
  }

  /* ---------- order form ---------- */
  var form = $('#orderForm'), err = $('#formErr'), F = form.elements;
  var phone = $('input[name="phone"]', form);
  phone.addEventListener('input', function () {
    var d = phone.value.replace(/\D/g, '');
    if (!d) { phone.value = ''; return; }
    if (d[0] === '8') d = '7' + d.slice(1);
    if (d[0] !== '7') d = '7' + d;
    d = d.slice(0, 11);
    var o = '+7';
    if (d.length > 1) o += ' (' + d.slice(1, 4);
    if (d.length >= 4) o += ')';
    if (d.length > 4) o += ' ' + d.slice(4, 7);
    if (d.length > 7) o += '-' + d.slice(7, 9);
    if (d.length > 9) o += '-' + d.slice(9, 11);
    phone.value = o;
  });
  var today = new Date(); var iso = new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
  $('input[name="date"]', form).min = iso;

  function copy(text) {
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).catch(function () { legacy(text); });
    legacy(text); return Promise.resolve();
  }
  function legacy(text) {
    var t = document.createElement('textarea'); t.value = text; t.setAttribute('readonly', '');
    t.style.cssText = 'position:fixed;top:-1000px;opacity:0'; document.body.appendChild(t); t.select();
    try { document.execCommand('copy'); } catch (e) {} document.body.removeChild(t);
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    err.textContent = '';
    $$('.field', form).forEach(function (f) { f.classList.remove('is-bad'); });
    var name = F.name.value.trim(), digits = phone.value.replace(/\D/g, '');
    var bad = [];
    if (name.length < 2) bad.push(F.name);
    if (digits.length !== 11) bad.push(phone);
    if (bad.length) {
      bad.forEach(function (i) { i.closest('.field').classList.add('is-bad'); });
      err.textContent = 'Проверьте имя и номер телефона — нам нужно как-то с вами связаться 🙂';
      bad[0].focus(); return;
    }
    if (!F.agree.checked) { err.textContent = 'Нужно согласие на обработку персональных данных.'; return; }
    var prog = fProgram.value ? bySlug[fProgram.value].name : 'нужна помощь с выбором';
    var date = F.date.value ? F.date.value.split('-').reverse().join('.') : 'не выбрана';
    var msg = 'Здравствуйте! Хочу заказать праздник 🎉\n' +
      'Имя: ' + name + '\nТелефон: ' + phone.value + '\nДата: ' + date + '\nГород: ' + F.city.value +
      '\nПрограмма: ' + prog + (F.comment.value.trim() ? '\nКомментарий: ' + F.comment.value.trim() : '');
    $('#okMsg').textContent = msg;
    copy(msg);
    if (CONFIG.endpoint) {
      try {
        fetch(CONFIG.endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: name, phone: phone.value, date: date, city: F.city.value, program: prog,
            comment: F.comment.value, calc: useCalc ? calcText : '', page: location.href }) })
          .then(function (r) { if (r.ok) $('#okText').textContent = 'Спасибо! Заявка отправлена — скоро перезвоним. Можно также написать нам в мессенджер:'; })
          .catch(function () {});
      } catch (x) {}
    }
    if (typeof window.ym === 'function') { try { window.ym(window.YM_ID, 'reachGoal', 'order'); } catch (x) {} }
    openDlg($('#okModal'));
  });
})();
