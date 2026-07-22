/* SENJA — interactions */
(function () {
  'use strict';

  var prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---- Preloader ---- */
  window.addEventListener('load', function () {
    var pre = $('#preloader');
    if (pre) setTimeout(function () { pre.classList.add('done'); }, 600);
  });
  // Failsafe in case 'load' is delayed by slow images.
  setTimeout(function () { var p = $('#preloader'); if (p) p.classList.add('done'); }, 3500);

  /* ---- Header shrink on scroll ---- */
  var header = $('#siteHeader');
  var hero = $('#home');

  /* ---- Booking bar dock ---- */
  var bar = $('#quickBook');
  var barWrap = $('#bookbarWrap');
  var barOffset = 0;
  function measureBar() { if (barWrap) barOffset = barWrap.offsetTop; }

  function onScroll() {
    var y = window.scrollY;
    if (y > 40) header.classList.add('scrolled'); else header.classList.remove('scrolled');

    // Dock the booking bar under the header on scroll — desktop/tablet only.
    // On phones a fixed 5-field stack would swallow the screen, so we skip it.
    var canDock = window.innerWidth > 720;
    if (bar && barWrap) {
      if (canDock && y > barOffset + 20) {
        if (!bar.classList.contains('docked')) {
          barWrap.style.height = bar.offsetHeight + 'px';
          bar.classList.add('docked');
        }
      } else if (bar.classList.contains('docked')) {
        bar.classList.remove('docked');
        barWrap.style.height = '';
      }
    }

    var toTop = $('#toTop');
    if (toTop) { if (y > 600) toTop.classList.add('show'); else toTop.classList.remove('show'); }
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', measureBar);
  measureBar();
  onScroll();

  /* ---- Mobile nav ---- */
  var toggle = $('#navToggle');
  var nav = $('#primaryNav');
  toggle.addEventListener('click', function () {
    var open = nav.classList.toggle('open');
    toggle.classList.toggle('open', open);
    toggle.setAttribute('aria-expanded', String(open));
    document.body.classList.toggle('no-scroll', open);
  });
  nav.addEventListener('click', function (e) {
    if (e.target.tagName === 'A') {
      nav.classList.remove('open');
      toggle.classList.remove('open');
      toggle.setAttribute('aria-expanded', 'false');
      document.body.classList.remove('no-scroll');
    }
  });

  /* ---- Language switch (demo toggle) ---- */
  var lang = $('#langSwitch');
  if (lang) {
    var states = ['EN · Rp', 'ID · Rp', 'EN · $'];
    var li = 0;
    lang.addEventListener('click', function () { li = (li + 1) % states.length; lang.textContent = states[li]; });
  }

  /* ---- Hero slideshow (Ken Burns) ---- */
  (function heroSlides() {
    var slides = $$('#heroSlides .hero-slide');
    var dotsWrap = $('#heroDots');
    if (!slides.length) return;
    var idx = 0, timer;

    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.setAttribute('role', 'tab');
      b.setAttribute('aria-label', 'Go to slide ' + (i + 1));
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = $$('button', dotsWrap);

    function go(n) {
      slides[idx].classList.remove('is-active');
      if (dots[idx]) dots[idx].classList.remove('active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('is-active');
      if (dots[idx]) dots[idx].classList.add('active');
    }
    function next() { go(idx + 1); }
    function restart() { if (timer) clearInterval(timer); if (!prefersReduced) timer = setInterval(next, 6000); }
    restart();
  })();

  /* ---- Reveal on scroll (visible by default; JS enhances) ---- */
  var reveals = $$('.reveal');
  function revealInView() {
    var vh = window.innerHeight || document.documentElement.clientHeight;
    reveals.forEach(function (el) {
      var r = el.getBoundingClientRect();
      if (r.top < vh * 0.92 && r.bottom > 0) el.classList.add('in');
    });
  }
  if (prefersReduced || !('IntersectionObserver' in window)) {
    reveals.forEach(function (el) { el.classList.add('in'); });
  } else {
    document.documentElement.classList.add('js-anim');
    revealInView();
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.12, rootMargin: '0px 0px -60px 0px' });
    reveals.forEach(function (el) { io.observe(el); });
    window.addEventListener('load', revealInView);
    setTimeout(function () { reveals.forEach(function (el) { el.classList.add('in'); }); }, 3000);
  }

  /* ---- Count-up stats ---- */
  (function counters() {
    var nums = $$('#stats strong');
    if (!nums.length) return;
    var done = false;
    function run() {
      if (done) return; done = true;
      nums.forEach(function (el) {
        var target = parseInt(el.getAttribute('data-count'), 10) || 0;
        var suffix = el.getAttribute('data-suffix') || '';
        if (prefersReduced) { el.textContent = target + suffix; return; }
        var start = null, dur = 1400;
        function step(ts) {
          if (!start) start = ts;
          var p = Math.min((ts - start) / dur, 1);
          var eased = 1 - Math.pow(1 - p, 3);
          el.textContent = Math.round(target * eased) + suffix;
          if (p < 1) requestAnimationFrame(step);
        }
        requestAnimationFrame(step);
      });
    }
    var stats = $('#stats');
    if ('IntersectionObserver' in window) {
      var o = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.isIntersecting) { run(); o.disconnect(); } }); }, { threshold: 0.4 });
      o.observe(stats);
    } else { run(); }
  })();

  /* ---- Parallax ---- */
  (function parallax() {
    if (prefersReduced) return;
    var els = $$('[data-speed]');
    if (!els.length) return;
    var ticking = false;
    function update() {
      var vh = window.innerHeight;
      els.forEach(function (el) {
        var r = el.getBoundingClientRect();
        if (r.bottom < 0 || r.top > vh) return;
        var speed = parseFloat(el.getAttribute('data-speed')) || 0.15;
        var offset = (r.top + r.height / 2 - vh / 2) * -speed;
        el.style.transform = 'translateY(' + offset.toFixed(1) + 'px)';
      });
      ticking = false;
    }
    window.addEventListener('scroll', function () { if (!ticking) { requestAnimationFrame(update); ticking = true; } }, { passive: true });
    update();
  })();

  /* ---- Testimonials carousel ---- */
  (function testimonials() {
    var slides = $$('#testiCarousel .testi');
    var dotsWrap = $('#testiDots');
    if (slides.length < 2) return;
    var idx = 0, timer;
    slides.forEach(function (_, i) {
      var b = document.createElement('button');
      b.setAttribute('aria-label', 'Story ' + (i + 1));
      if (i === 0) b.classList.add('active');
      b.addEventListener('click', function () { go(i); restart(); });
      dotsWrap.appendChild(b);
    });
    var dots = $$('button', dotsWrap);
    function go(n) {
      slides[idx].classList.remove('is-active'); if (dots[idx]) dots[idx].classList.remove('active');
      idx = (n + slides.length) % slides.length;
      slides[idx].classList.add('is-active'); if (dots[idx]) dots[idx].classList.add('active');
    }
    function restart() { if (timer) clearInterval(timer); timer = setInterval(function () { go(idx + 1); }, 6500); }
    restart();
  })();

  /* ---- Lightbox gallery ---- */
  (function lightbox() {
    var items = $$('#galleryGrid .g-item');
    var lb = $('#lightbox'), img = $('#lbImg');
    if (!items.length || !lb) return;
    var sources = items.map(function (it) { return it.getAttribute('data-full'); });
    var current = 0;
    function open(i) { current = i; img.src = sources[i]; lb.classList.add('open'); lb.setAttribute('aria-hidden', 'false'); document.body.classList.add('no-scroll'); }
    function close() { lb.classList.remove('open'); lb.setAttribute('aria-hidden', 'true'); document.body.classList.remove('no-scroll'); }
    function nav(d) { current = (current + d + sources.length) % sources.length; img.src = sources[current]; }
    items.forEach(function (it, i) { it.addEventListener('click', function () { open(i); }); });
    $('#lbClose').addEventListener('click', close);
    $('#lbPrev').addEventListener('click', function () { nav(-1); });
    $('#lbNext').addEventListener('click', function () { nav(1); });
    lb.addEventListener('click', function (e) { if (e.target === lb) close(); });
    document.addEventListener('keydown', function (e) {
      if (!lb.classList.contains('open')) return;
      if (e.key === 'Escape') close();
      else if (e.key === 'ArrowLeft') nav(-1);
      else if (e.key === 'ArrowRight') nav(1);
    });
  })();

  /* ---- Villa carousel ---- */
  (function villaCarousel() {
    var track = $('#villaTrack');
    var prev = $('#villaPrev'), next = $('#villaNext'), counter = $('#villaCount');
    if (!track) return;
    var cards = $$('.villa-card', track);
    var index = 0;

    function step() {
      var card = cards[0];
      var style = getComputedStyle(track);
      var gap = parseFloat(style.columnGap || style.gap) || 0;
      return card.offsetWidth + gap;
    }
    function perView() { return Math.max(1, Math.round(track.parentElement.clientWidth / step())); }
    function maxIndex() { return Math.max(0, cards.length - perView()); }

    function update() {
      index = Math.min(Math.max(index, 0), maxIndex());
      track.style.transform = 'translateX(' + (-index * step()) + 'px)';
      var pad = function (n) { return (n < 10 ? '0' : '') + n; };
      if (counter) counter.textContent = pad(index + 1) + ' / ' + pad(cards.length);
      if (prev) prev.disabled = index <= 0;
      if (next) next.disabled = index >= maxIndex();
    }
    if (prev) prev.addEventListener('click', function () { index--; update(); });
    if (next) next.addEventListener('click', function () { index++; update(); });
    window.addEventListener('resize', update);
    window.addEventListener('load', update);

    // Touch swipe (mobile)
    var carousel = $('#villaCarousel');
    if (carousel) {
      var startX = 0, startY = 0, swiping = false;
      carousel.addEventListener('touchstart', function (e) {
        startX = e.touches[0].clientX; startY = e.touches[0].clientY; swiping = true;
      }, { passive: true });
      carousel.addEventListener('touchend', function (e) {
        if (!swiping) return; swiping = false;
        var dx = e.changedTouches[0].clientX - startX;
        var dy = e.changedTouches[0].clientY - startY;
        if (Math.abs(dx) > 45 && Math.abs(dx) > Math.abs(dy)) {
          index += dx < 0 ? 1 : -1;
          update();
        }
      }, { passive: true });
    }

    update();
  })();

  /* ---- FAQ accordion ---- */
  (function accordion() {
    var heads = $$('#accordion .acc-head');
    heads.forEach(function (head) {
      var panel = head.nextElementSibling;
      head.addEventListener('click', function () {
        var isOpen = head.getAttribute('aria-expanded') === 'true';
        // close others
        heads.forEach(function (h) {
          h.setAttribute('aria-expanded', 'false');
          h.nextElementSibling.style.maxHeight = null;
        });
        if (!isOpen) {
          head.setAttribute('aria-expanded', 'true');
          panel.style.maxHeight = panel.scrollHeight + 'px';
        }
      });
    });
  })();

  /* ---- Back to top ---- */
  var toTop = $('#toTop');
  if (toTop) toTop.addEventListener('click', function () { window.scrollTo({ top: 0, behavior: prefersReduced ? 'auto' : 'smooth' }); });

  /* ---- Dates ---- */
  var today = new Date().toISOString().split('T')[0];
  $$('input[type="date"]').forEach(function (d) { d.min = today; });
  function linkDates(inId, outId) {
    var ci = $('#' + inId), co = $('#' + outId);
    if (ci && co) ci.addEventListener('change', function () { co.min = ci.value || today; if (co.value && co.value <= ci.value) co.value = ''; });
  }
  linkDates('bb-in', 'bb-out');
  linkDates('bf-checkin', 'bf-checkout');

  /* ---- Quick book -> scroll to full form, prefill ---- */
  var qb = $('#quickBook');
  if (qb) qb.addEventListener('submit', function (e) {
    e.preventDefault();
    var ci = $('#bb-in').value, co = $('#bb-out').value;
    if (ci) $('#bf-checkin').value = ci;
    if (co) $('#bf-checkout').value = co;
    $('#bf-guests').value = $('#bb-guests').value;
    if ($('#bb-villa').value !== 'Any villa') $('#bf-villa').value = $('#bb-villa').value;
    $('#booking').scrollIntoView({ behavior: prefersReduced ? 'auto' : 'smooth' });
  });

  /* ---- Booking form ---- */
  var form = $('#bookingForm');
  var note = $('#formNote');
  if (form) form.addEventListener('submit', function (e) {
    e.preventDefault();
    note.className = 'form-note';
    var name = form.name.value.trim(), email = form.email.value.trim();
    var ci = form.checkin.value, co = form.checkout.value;
    if (!name || !email || !ci || !co) { note.textContent = 'Please complete every required field so we can hold your dates.'; note.classList.add('err'); return; }
    if (co <= ci) { note.textContent = 'Your check-out date must be after your check-in date.'; note.classList.add('err'); return; }
    note.textContent = 'Terima kasih, ' + name + '. Our concierge will confirm your reservation by email shortly.';
    note.classList.add('ok');
    form.reset();
  });

  /* ---- Newsletter ---- */
  var news = $('#newsForm');
  if (news) news.addEventListener('submit', function (e) {
    e.preventDefault();
    var val = $('#newsEmail').value.trim();
    var n = $('#newsNote');
    if (!val || val.indexOf('@') === -1) { n.textContent = 'Please enter a valid email.'; return; }
    n.textContent = 'Terima kasih — you are subscribed.';
    news.reset();
  });

  /* ---- Year ---- */
  var y = $('#year'); if (y) y.textContent = String(new Date().getFullYear());
})();
