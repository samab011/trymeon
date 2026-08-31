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

  /* ── Work showcase ────────────────────────────────────── */
  (function showcase() {
    var dlg = $('#showcase');
    var open = $('#workBtn');
    if (!dlg || !open || typeof dlg.showModal !== 'function') return;  /* link fallback */

    var tabs  = $$('[role="tab"]', dlg);
    var panes = tabs.map(function (t) { return $('#' + t.getAttribute('aria-controls')); });

    function select(i) {
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panes[n].hidden = !on;
      });
      $('.showcase__body', dlg).scrollTop = 0;
    }

    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      /* left/right arrows move between tabs, as a tablist should */
      t.addEventListener('keydown', function (e) {
        var d = e.key === 'ArrowRight' ? 1 : e.key === 'ArrowLeft' ? -1 : 0;
        if (!d) return;
        e.preventDefault();
        var n = (i + d + tabs.length) % tabs.length;
        select(n);
        tabs[n].focus();
      });
    });
    select(0);

    open.addEventListener('click', function (e) {
      e.preventDefault();
      dlg.showModal();
      document.body.style.overflow = 'hidden';
      tabs[0].focus();
    });

    function close() {
      if (dlg.open) dlg.close();
    }
    $('#showcaseClose').addEventListener('click', close);
    $$('[data-close]', dlg).forEach(function (a) { a.addEventListener('click', close); });

    /* click the backdrop to dismiss — compare against the box rather than the
       event target, since the inner wrapper covers the dialog's own padding */
    dlg.addEventListener('click', function (e) {
      var r = dlg.getBoundingClientRect();
      if (e.clientX < r.left || e.clientX > r.right ||
          e.clientY < r.top  || e.clientY > r.bottom) close();
    });
    dlg.addEventListener('close', function () {
      document.body.style.overflow = '';
      open.focus();
    });
  })();

  /* ── Mini-site previews & viewer ──────────────────────── */
  /* Each site is authored once in a <template> at a fixed 1080px design
     width, then cloned into the card preview and into the viewer and
     scaled to fit. One source, two sizes — and a layout that cannot
     break at any viewport because the design width never changes. */
  (function miniSites() {
    var DESIGN_W = 1080;
    var meta = window.SITE_META || {};
    var keys = Object.keys(meta);
    if (!keys.length) return;

    function clone(key) {
      var t = document.getElementById('site-' + key);
      return t && t.content ? t.content.cloneNode(true) : null;
    }

    /* ── card previews ── */
    var cards = $$('.dz__btn');
    cards.forEach(function (btn) {
      var key = btn.dataset.site;
      var host = $('#prev-' + key);
      var node = clone(key);
      if (host && node) host.appendChild(node);
    });

    function fitCards() {
      cards.forEach(function (btn) {
        var shot = $('.dz__shot', btn);
        var host = $('.dz__scale', btn);
        if (!shot || !host) return;
        host.style.setProperty('--s', shot.clientWidth / DESIGN_W);
      });
    }

    /* ── viewer ── */
    var dlg = $('#viewer');
    var fit = $('#viewerFit');
    var stage = $('#viewerStage');
    var urlOut = $('#viewerUrl');
    var current = 0;

    function fitViewer() {
      if (!dlg || !dlg.open) return;
      var s = Math.min(1, stage.clientWidth / DESIGN_W);
      fit.style.setProperty('--vs', s);
      /* the scaled child no longer contributes its real height, so set it */
      var inner = fit.firstElementChild;
      fit.style.height = inner ? (inner.offsetHeight * s) + 'px' : '';
    }

    function show(i) {
      current = (i + keys.length) % keys.length;
      var key = keys[current];
      fit.innerHTML = '';
      var node = clone(key);
      if (node) fit.appendChild(node);
      urlOut.textContent = 'https://' + meta[key].url;
      stage.scrollTop = 0;
      fitViewer();
    }

    if (dlg && typeof dlg.showModal === 'function') {
      cards.forEach(function (btn) {
        btn.addEventListener('click', function () {
          var i = keys.indexOf(btn.dataset.site);
          dlg.showModal();
          document.body.style.overflow = 'hidden';
          show(i < 0 ? 0 : i);
        });
      });

      $('#viewerNext').addEventListener('click', function () { show(current + 1); });
      $('#viewerPrev').addEventListener('click', function () { show(current - 1); });
      $('#viewerClose').addEventListener('click', function () { dlg.close(); });
      dlg.addEventListener('click', function (e) {
        var r = dlg.getBoundingClientRect();
        if (e.clientX < r.left || e.clientX > r.right ||
            e.clientY < r.top  || e.clientY > r.bottom) dlg.close();
      });
      dlg.addEventListener('close', function () {
        document.body.style.overflow = '';
        fit.innerHTML = '';
      });
      dlg.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight') { e.preventDefault(); show(current + 1); }
        if (e.key === 'ArrowLeft')  { e.preventDefault(); show(current - 1); }
      });
    }

    function fitAll() { fitCards(); fitViewer(); }
    fitAll();
    window.addEventListener('resize', fitAll, { passive: true });
    /* the showcase dialog has zero width until opened, so re-fit on open */
    var sc = $('#showcase');
    if (sc && 'ResizeObserver' in window) new ResizeObserver(fitAll).observe(sc);
  })();

  /* ── Service card: number drifts toward the cursor ────── */
  (function cardPointer() {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    if (!window.matchMedia('(hover: hover)').matches) return;

    $$('.services .card').forEach(function (card) {
      var no = $('.card__no', card);
      if (!no) return;

      card.addEventListener('pointermove', function (e) {
        var r = card.getBoundingClientRect();
        /* -1..1 across the card, so the number leans the way the cursor sits */
        no.style.setProperty('--nx', ((e.clientX - r.left) / r.width * 2 - 1).toFixed(3));
        no.style.setProperty('--ny', ((e.clientY - r.top) / r.height * 2 - 1).toFixed(3));
      });
      card.addEventListener('pointerleave', function () {
        no.style.setProperty('--nx', 0);
        no.style.setProperty('--ny', 0);
      });
    });
  })();

  /* ── Showreel tiles that hold a real film ─────────────── */
  (function reelPlayers() {
    var reels = $$('.reel--live');
    if (!reels.length) return;
    var motion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var canHover = window.matchMedia('(hover: hover)').matches;

    reels.forEach(function (tile) {
      var vid = $('.reel__vid', tile);
      if (!vid) return;

      /* Where to park the playhead at rest. Once any frame has decoded the
         browser paints it INSTEAD of the poster, so parking at 0 shows the
         film's opening black frame and the thumbnail appears to vanish.
         Parking on the frame the poster was cut from keeps the two identical. */
      var still = parseFloat(tile.dataset.still || vid.dataset.still || '0') || 0;
      function park() {
        vid.pause();
        try { vid.currentTime = still; } catch (e) {}
      }
      if (still) vid.addEventListener('loadedmetadata', park);

      /* hover gives a silent preview; the click is what turns the sound on */
      if (canHover && !motion) {
        tile.addEventListener('pointerenter', function () {
          if (tile.classList.contains('is-playing')) return;
          vid.currentTime = 0;
          vid.play().catch(function () {});
        });
        tile.addEventListener('pointerleave', function () {
          if (tile.classList.contains('is-playing')) return;
          park();
        });
      }

      tile.addEventListener('click', function () {
        if (tile.classList.contains('is-playing')) {
          vid.muted = true;
          park();
          tile.classList.remove('is-playing');
          return;
        }
        /* only one film audible at a time */
        reels.forEach(function (other) {
          if (other === tile) return;
          var v = $('.reel__vid', other);
          if (v) {
            v.pause(); v.muted = true;
            var s = parseFloat(other.dataset.still || '0') || 0;
            if (s) { try { v.currentTime = s; } catch (e) {} }
          }
          other.classList.remove('is-playing');
        });
        vid.muted = false;
        vid.currentTime = 0;
        vid.play().then(function () {
          tile.classList.add('is-playing');
        }).catch(function () {
          /* autoplay with sound refused — fall back to a muted play */
          vid.muted = true;
          vid.play().catch(function () {});
          tile.classList.add('is-playing');
        });
      });

      vid.addEventListener('pause', function () {
        if (vid.ended) tile.classList.remove('is-playing');
      });
    });

    /* closing the showcase must not leave a film running behind it */
    var sc = $('#showcase');
    if (sc) sc.addEventListener('close', function () {
      reels.forEach(function (tile) {
        var v = $('.reel__vid', tile);
        if (v) {
          v.pause(); v.muted = true;
          var s = parseFloat(tile.dataset.still || '0') || 0;
          try { v.currentTime = s; } catch (e) {}
        }
        tile.classList.remove('is-playing');
      });
    });
  })();

  /* ── Year ─────────────────────────────────────────────── */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
