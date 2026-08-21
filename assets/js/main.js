/* ============================================================
   MEON — interactions
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── Reveal on scroll ─────────────────────────────────── */
  var revealables = $$('.reveal, .hero__title .line');
  if (reduced || !('IntersectionObserver' in window)) {
    revealables.forEach(function (el) { el.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        var siblings = Array.prototype.slice.call(e.target.parentNode.children);
        var i = siblings.indexOf(e.target);
        e.target.style.transitionDelay = Math.min(i, 6) * 70 + 'ms';
        e.target.classList.add('in');
        io.unobserve(e.target);
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.12 });
    revealables.forEach(function (el) { io.observe(el); });
  }

  /* ── Stat counters ────────────────────────────────────── */
  var counters = $$('[data-count]');
  function runCount(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var suffix = el.getAttribute('data-suffix') || '';
    if (reduced) { el.textContent = target.toLocaleString('en-PK') + suffix; return; }
    var start = performance.now(), dur = 1400;
    (function tick(now) {
      var p = Math.min((now - start) / dur, 1);
      var eased = 1 - Math.pow(1 - p, 3);
      el.textContent = Math.round(target * eased).toLocaleString('en-PK') + suffix;
      if (p < 1) requestAnimationFrame(tick);
    })(start);
  }
  if ('IntersectionObserver' in window) {
    var cio = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        if (!e.isIntersecting) return;
        runCount(e.target);
        cio.unobserve(e.target);
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { cio.observe(el); });
  } else {
    counters.forEach(runCount);
  }

  /* ── Nav: stuck state + hide on scroll down ───────────── */
  var nav = $('#nav'), lastY = window.pageYOffset, ticking = false;
  function onScroll() {
    var y = window.pageYOffset;
    nav.classList.toggle('is-stuck', y > 24);
    var menuOpen = $('#burger').getAttribute('aria-expanded') === 'true';
    nav.classList.toggle('is-hidden', !menuOpen && y > 420 && y > lastY);
    lastY = y;
    ticking = false;
  }
  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  }, { passive: true });

  /* ── Mobile menu ──────────────────────────────────────── */
  var burger = $('#burger'), menu = $('#mobileMenu');
  function setMenu(open) {
    burger.setAttribute('aria-expanded', String(open));
    burger.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    menu.hidden = !open;
    document.body.style.overflow = open ? 'hidden' : '';
  }
  burger.addEventListener('click', function () {
    setMenu(burger.getAttribute('aria-expanded') !== 'true');
  });
  $$('a', menu).forEach(function (a) { a.addEventListener('click', function () { setMenu(false); }); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setMenu(false); });

  /* ── Work rail ────────────────────────────────────────── */
  var rail = $('#rail');
  $$('[data-rail]').forEach(function (btn) {
    btn.addEventListener('click', function () {
      var card = $('.case', rail);
      var step = card ? card.offsetWidth + 14 : 400;
      rail.scrollBy({ left: btn.dataset.rail === 'next' ? step : -step, behavior: reduced ? 'auto' : 'smooth' });
    });
  });

  /* ── Plan builder (base + upsell add-ons) ─────────────── */
  /* PKR: en-PK groups in plain thousands (145,000) and uses the Rs symbol. */
  var fmt = function (n) { return n.toLocaleString('en-PK'); };
  var rs  = function (n) { return 'Rs ' + fmt(n); };

  var state = {
    bill: 'monthly',
    plan: $('.plan.is-on'),
    addons: []
  };
  var DISCOUNT = 0.15;

  var quoteMix   = $('#quoteMix');
  var quoteTotal = $('#quoteTotal');
  var quoteUnit  = $('#quoteUnit');
  var quoteSave  = $('#quoteSave');
  var planField  = $('#fPlan');

  function priceOf(el) { return parseInt(el.getAttribute('data-price'), 10) || 0; }

  function render() {
    if (!state.plan) return;
    var base = priceOf(state.plan);
    var addTotal = state.addons.reduce(function (sum, el) { return sum + priceOf(el); }, 0);
    var monthly = base + addTotal;
    var quarterly = Math.round(monthly * 3 * (1 - DISCOUNT));

    /* per-plan headline prices follow the billing toggle */
    $$('.plan').forEach(function (p) {
      var out = $('[data-price-out]', p);
      var per = priceOf(p);
      out.textContent = state.bill === 'monthly'
        ? fmt(per)
        : fmt(Math.round(per * (1 - DISCOUNT)));
    });

    var planName = $('h3', state.plan).textContent.trim();
    var names = state.addons.map(function (el) { return $('b', el).textContent.trim(); });
    var mix = planName + ' — ' + (names.length ? names.join(' + ') : 'no add-ons');
    quoteMix.textContent = mix;

    if (state.bill === 'monthly') {
      quoteTotal.textContent = fmt(monthly);
      quoteUnit.textContent = '/month';
      quoteSave.hidden = true;
    } else {
      quoteTotal.textContent = fmt(quarterly);
      quoteUnit.textContent = '/quarter';
      quoteSave.hidden = false;
      quoteSave.textContent = 'You save ' + rs(monthly * 3 - quarterly);
    }

    if (planField) {
      planField.value = mix + ' — ' + (state.bill === 'monthly'
        ? rs(monthly) + '/month'
        : rs(quarterly) + '/quarter');
    }
  }

  $$('.plan').forEach(function (p) {
    p.addEventListener('click', function () {
      $$('.plan').forEach(function (o) {
        o.classList.remove('is-on');
        o.setAttribute('aria-checked', 'false');
      });
      p.classList.add('is-on');
      p.setAttribute('aria-checked', 'true');
      state.plan = p;
      render();
    });
  });

  $$('.addon').forEach(function (a) {
    a.addEventListener('click', function () {
      var on = a.getAttribute('aria-pressed') === 'true';
      a.setAttribute('aria-pressed', String(!on));
      var i = state.addons.indexOf(a);
      if (!on && i === -1) state.addons.push(a);
      if (on && i > -1) state.addons.splice(i, 1);
      render();
    });
  });

  $$('[data-bill]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-bill]').forEach(function (o) {
        o.classList.remove('is-on');
        o.setAttribute('aria-pressed', 'false');
      });
      b.classList.add('is-on');
      b.setAttribute('aria-pressed', 'true');
      state.bill = b.dataset.bill;
      render();
    });
  });

  render();

  /* ── Contact form (client-side only) ──────────────────── */
  var form = $('#form'), note = $('#formNote');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      [['#fName', function (v) { return v.length > 1; }],
       ['#fEmail', function (v) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v); }],
       ['#fMsg', function (v) { return v.length > 4; }]
      ].forEach(function (pair) {
        var input = $(pair[0]);
        var valid = pair[1](input.value.trim());
        input.parentNode.classList.toggle('is-bad', !valid);
        if (!valid) ok = false;
      });

      if (!ok) { note.textContent = 'Check the highlighted fields.'; return; }

      note.textContent = 'Sent. We reply within one working day.';
      form.reset();
      render(); /* restores the plan summary field */
    });
  }

  /* ── Year ─────────────────────────────────────────────── */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
