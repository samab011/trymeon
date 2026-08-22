/* ============================================================
   SPARKUP AI — interactions
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

  /* ── Hero fractal tree ────────────────────────────────── */
  /* Ported from the Fractal Bloom React component. Differences from the
     original: brand palette, DPR-aware sizing, sized to the hero rather than
     the window, pointer + touch input, strokes batched one Path2D per depth,
     redraws only while growing or when the pointer moves, paused off-screen,
     and a static fully-grown tree under prefers-reduced-motion. */
  (function heroTree() {
    var canvas = $('#heroTree');
    if (!canvas || !canvas.getContext) return;

    var ctx = canvas.getContext('2d');
    if (!ctx || typeof Path2D === 'undefined') return;

    var W = 0, H = 0;
    var MAX = window.innerWidth < 700 ? 7 : 9;   /* 2^(MAX+1)-1 segments */
    var SPREAD = Math.PI / 10;
    var DECAY = 0.78;

    var GROW_MS = 2600;          /* time-based, so 120Hz doesn't grow twice as fast */
    var depth = 0;
    var started = 0;
    var grown = false;
    var raf = null;
    var onScreen = true;
    var paused = 0;
    var pointer = { x: 0, y: 0, live: false };

    function size() {
      var dpr = Math.min(window.devicePixelRatio || 1, 2);
      var r = canvas.getBoundingClientRect();
      W = r.width; H = r.height;
      if (!W || !H) return false;
      canvas.width = Math.round(W * dpr);
      canvas.height = Math.round(H * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.lineCap = 'round';
      return true;
    }

    /* Collect segments into one Path2D per depth so each level is a single
       stroke call — 10 strokes a frame instead of ~1000. */
    function collect(x, y, angle, len, d, levels) {
      var f = depth - d;
      if (f <= 0) return;
      if (f > 1) f = 1;

      var cos = Math.cos(angle), sin = Math.sin(angle);
      var fx = x + cos * len, fy = y + sin * len;         /* full extent */
      var path = levels[d] || (levels[d] = new Path2D());
      path.moveTo(x, y);
      path.lineTo(x + cos * len * f, y + sin * len * f);  /* grown extent */

      if (f < 1 || d >= MAX) return;   /* children wait for a full parent */

      var off = 0;
      if (pointer.live) {
        var dist = Math.hypot(fx - pointer.x, fy - pointer.y);
        var infl = 1 - dist / (H * 0.55);
        if (infl > 0) off = (Math.PI / 9) * infl;
      }
      collect(fx, fy, angle - SPREAD - off, len * DECAY, d + 1, levels);
      collect(fx, fy, angle + SPREAD + off, len * DECAY, d + 1, levels);
    }

    function draw() {
      ctx.clearRect(0, 0, W, H);
      var levels = [];
      /* Root sits right of centre on wide screens so the trunk grows through
         open space instead of the left-aligned headline. */
      var rootX = W < 700 ? W / 2 : W * 0.66;
      collect(rootX, H, -Math.PI / 2, H / 5, 0, levels);
      for (var d = 0; d < levels.length; d++) {
        if (!levels[d]) continue;
        var t = d / MAX;
        ctx.strokeStyle = 'rgba(204,255,46,' + ((1 - t) * 0.55).toFixed(3) + ')';
        ctx.lineWidth = Math.max(0.4, 1.6 - t * 1.25);
        ctx.stroke(levels[d]);
      }
    }

    function schedule() {
      if (raf === null && onScreen) raf = requestAnimationFrame(loop);
    }

    function loop(now) {
      raf = null;
      if (!grown) {
        if (!started) started = now;
        var p = (now - started) / GROW_MS;
        if (p >= 1) { p = 1; grown = true; }
        depth = MAX * p;
      }
      draw();
      if (!grown) schedule();
    }

    if (!size()) return;
    canvas.classList.add('is-on');

    if (reduced) {
      depth = MAX; grown = true;
      draw();
      return;                       /* static tree, no loop, no listeners */
    }

    schedule();

    /* Redraw on pointer move only once the tree has finished growing. */
    function movePointer(cx, cy) {
      var r = canvas.getBoundingClientRect();
      pointer.x = cx - r.left;
      pointer.y = cy - r.top;
      pointer.live = true;
      if (grown) schedule();
    }
    window.addEventListener('mousemove', function (e) {
      movePointer(e.clientX, e.clientY);
    }, { passive: true });
    window.addEventListener('touchmove', function (e) {
      if (e.touches && e.touches[0]) movePointer(e.touches[0].clientX, e.touches[0].clientY);
    }, { passive: true });

    var resizeTimer;
    window.addEventListener('resize', function () {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(function () {
        if (size()) { pointer.live = false; draw(); }
      }, 160);
    }, { passive: true });

    /* Stop burning frames once the hero scrolls away. */
    if ('IntersectionObserver' in window) {
      new IntersectionObserver(function (entries) {
        onScreen = entries[0].isIntersecting;
        if (!onScreen) {
          if (raf !== null) { cancelAnimationFrame(raf); raf = null; }
          paused = performance.now();
        } else if (!grown) {
          if (paused && started) started += performance.now() - paused;
          paused = 0;
          schedule();
        }
      }, { threshold: 0 }).observe(canvas);
    }
  })();

  /* ── Year ─────────────────────────────────────────────── */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
