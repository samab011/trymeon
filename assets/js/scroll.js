/* ============================================================
   SPARKUP AI — scroll as a timeline

   One rAF loop, one scroll read per frame. Nothing here measures
   layout during a frame and nothing writes styles during a scroll
   event: tracks are measured once (and on resize), the loop only
   writes CSS custom properties, and CSS does the compositing. That
   is what keeps a page this heavy on a 60fps budget.

   Everything degrades to the plain document. Under
   prefers-reduced-motion the file returns before adding its root
   class, so every CSS rule below it never applies and the page is
   the same static, readable page it was — including the pinned
   services section, which falls back to its original grid.

   This file deliberately owns no content and no forms. It reads
   geometry and writes numbers.
   ============================================================ */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Bail before the root class is set, so the CSS half never engages. */
  if (reduced.matches) return;
  if (!('requestAnimationFrame' in window) || !CSS.supports('(--a:0)')) return;

  root.classList.add('js-scroll');
  /* A reduced-motion preference switched on mid-session should take effect
     without a reload; the page reverts to the static layout. */
  reduced.addEventListener('change', function (e) {
    if (e.matches) { root.classList.remove('js-scroll'); tracks.length = 0; }
  });

  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };
  var clamp01 = function (v) { return clamp(v, 0, 1); };
  /* progress through [a,b], clamped — the workhorse of the whole file */
  var range = function (v, a, b) { return clamp01((v - a) / (b - a)); };
  var lerp = function (a, b, t) { return a + (b - a) * t; };
  var easeOut = function (p) { return 1 - Math.pow(1 - p, 3); };
  var easeIO = function (p) { return p < .5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2; };
  /* rises 0→1→0 across [a,b] — how a panel takes the screen and gives it back */
  var bell = function (v, a, b) {
    var p = range(v, a, b);
    return p <= 0 || p >= 1 ? 0 : Math.sin(p * Math.PI);
  };
  var round = function (v) { return Math.round(v * 1000) / 1000; };

  /* ── The loop ───────────────────────────────────────────────
     A track is an element plus a function of its scroll progress.
     `span` says how much scroll the track occupies, measured in
     viewport heights beyond the element's own height. */
  var tracks = [];
  var vh = window.innerHeight;
  var vw = window.innerWidth;

  function track(el, opts) {
    if (!el) return null;
    var t = {
      el: el,
      /* where progress starts and ends, as offsets from the element's top */
      from: opts.from || function () { return -vh; },
      to: opts.to || function (h) { return h; },
      on: opts.on,
      top: 0, h: 0, p: -1
    };
    tracks.push(t);
    return t;
  }

  function measure() {
    vh = window.innerHeight;
    vw = window.innerWidth;
    var sy = window.pageYOffset;
    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      var r = t.el.getBoundingClientRect();
      t.top = r.top + sy;
      t.h = r.height;
    }
  }

  var running = false;
  function frame() {
    running = false;
    var y = window.pageYOffset;
    for (var i = 0; i < tracks.length; i++) {
      var t = tracks[i];
      var a = t.top + t.from(t.h);
      var b = t.top + t.to(t.h);
      var p = b === a ? 0 : clamp01((y - a) / (b - a));
      /* Skip the write when the number has not visibly moved. Most tracks
         are off-screen most of the time; this keeps the loop nearly free. */
      if (Math.abs(p - t.p) < 0.0004) continue;
      t.p = p;
      t.on(p, y);
    }
  }
  function request() {
    if (!running) { running = true; requestAnimationFrame(frame); }
  }

  window.addEventListener('scroll', request, { passive: true });

  /* ── Ground: one unbroken world ─────────────────────────────
     A single fixed layer behind everything. Its glow drifts, warms
     and cools across the whole document, so travelling down the page
     reads as moving through one space rather than past a stack of
     boxes. Sections tint it as they arrive; nothing ever cuts. */
  var ground = document.createElement('div');
  ground.className = 'ground';
  ground.setAttribute('aria-hidden', 'true');
  ground.innerHTML = '<div class="ground__glow"></div><div class="ground__glow ground__glow--2"></div>';
  document.body.insertBefore(ground, document.body.firstChild);

  var docTrack = track(document.body, {
    from: function () { return 0; },
    to: function (h) { return h - vh; },
    on: function (p) {
      /* The light travels: down and across, slowly, over the whole page. */
      ground.style.setProperty('--gx', round(lerp(58, 30, easeIO(p)) ) + '%');
      ground.style.setProperty('--gy', round(lerp(-4, 92, p)) + '%');
      ground.style.setProperty('--g2x', round(lerp(96, 12, easeIO(clamp01(p * 1.2)))) + '%');
      ground.style.setProperty('--g2y', round(lerp(30, 118, p)) + '%');
      /* and dims as the page settles toward the contact form */
      ground.style.setProperty('--gA', round(lerp(1, .42, range(p, .55, 1))));
    }
  });

  /* ── Hero ───────────────────────────────────────────────────
     The first screen recedes rather than scrolling away: the
     headline, the CTA and the lede sit at three different
     depths and separate as you leave, and the canvas network behind
     them pushes back and dims. It reads as a camera pulling out of
     the composition instead of a page moving up. */
  var hero = $('.hero');
  if (hero) {
    var heroTitle = $('.hero__title', hero);
    var heroCta   = $('.hero__cta', hero);
    var heroFoot  = $('.hero__foot', hero);
    var heroTree  = $('.hero__tree', hero);

    /* Depth pairs: [element, how far it lags, how much it fades]. The
       headline is nearest the camera, so it moves most and leaves last. */
    var heroLayers = [
      [heroTitle, -120, .55],
      [heroCta,    -84, .70],
      [heroFoot,   -54, .80]
    ];

    track(hero, {
      from: function () { return 0; },
      to: function (h) { return h * .92; },
      on: function (p) {
        var e = easeIO(p);
        for (var i = 0; i < heroLayers.length; i++) {
          var el = heroLayers[i][0];
          if (!el) continue;
          el.style.setProperty('--sy', round(heroLayers[i][1] * e) + 'px');
          el.style.setProperty('--sa', round(1 - range(p, heroLayers[i][2], 1)));
        }
        if (heroTitle) {
          /* a touch of scale on the nearest layer only — enough to read
             as perspective, not enough to soften the type */
          heroTitle.style.setProperty('--ss', round(1 - .05 * e));
        }
        if (heroTree) {
          heroTree.style.setProperty('--sy', round(-70 * e) + 'px');
          heroTree.style.setProperty('--ss', round(1 + .16 * e));
          heroTree.style.setProperty('--sa', round(1 - range(p, .15, .9)));
        }
        root.style.setProperty('--heroLift', round(1 - p));
      }
    });

    /* Pointer parallax — the one motion on the page that is not scroll.
       Kept small and heavily damped: it should register as the light
       being three-dimensional, never as something following the mouse. */
    var px = 0, py = 0, tx = 0, ty = 0, pointing = false;
    hero.addEventListener('pointermove', function (e) {
      if (e.pointerType !== 'mouse') return;
      var r = hero.getBoundingClientRect();
      tx = ((e.clientX - r.left) / r.width - .5) * 2;
      ty = ((e.clientY - r.top) / r.height - .5) * 2;
      if (!pointing) { pointing = true; requestAnimationFrame(drift); }
    }, { passive: true });
    hero.addEventListener('pointerleave', function () { tx = 0; ty = 0; }, { passive: true });

    function drift() {
      px = lerp(px, tx, .055);
      py = lerp(py, ty, .055);
      hero.style.setProperty('--px', round(px));
      hero.style.setProperty('--py', round(py));
      if (Math.abs(px - tx) > .001 || Math.abs(py - ty) > .001) {
        requestAnimationFrame(drift);
      } else { pointing = false; }
    }
  }

  /* ── The signature move: services pin and advance ───────────
     The three things SparkUP sells stop being three cards in a row
     and become three panels that each take the screen in turn. The
     markup is untouched — the cards keep their headings, copy and
     tags exactly — the stage only changes where they sit and how
     they hand over.

     The pin is a plain `position:sticky` inside a tall track, so the
     browser owns the scrolling. Nothing is intercepted, momentum is
     never cancelled, and a single flick still carries you past the
     whole section. */
  var stage = $('#svcStage');
  var panels = stage ? $$('.card', stage) : [];

  if (stage && panels.length) {
    var rail = $('.stage__rail', stage);
    var pips = rail ? $$('.stage__pip', rail) : [];
    var n = panels.length;
    /* Each panel owns a slice of the track. The handover is deliberately a cut,
       not a cross-dissolve: two panels of body copy at half opacity on top of
       each other is unreadable mud. The outgoing panel's fall and the incoming
       panel's rise are sequenced so they barely overlap — at the crossing each
       is around 13% opaque and both are blurred out of focus, which reads as a
       cut in a film rather than as two things fighting. */
    var slice = 1 / n;
    var hand = slice * .30;

    track(stage, {
      from: function () { return 0; },
      to: function (h) { return h - vh; },
      on: function (p) {
        for (var i = 0; i < n; i++) {
          var a = i * slice;
          var b = (i + 1) * slice;
          /* `pass` runs 0→1 through the whole slice and drives the travel;
             `hold` is the trapezoid that decides what you can actually see. */
          var pass = range(p, a - hand, b + hand);
          var rise = easeOut(range(p, a - hand * .55, a + hand * .45));
          var fall = easeOut(range(p, b - hand * .55, b + hand * .45));
          var hold = rise * (1 - fall);
          var el = panels[i];
          el.style.setProperty('--hold', round(hold));
          el.style.setProperty('--pass', round(pass));
          /* Depth of field is what makes the overlap legible rather than muddy.
             Opacity alone cannot do it: sequence the two panels and you get a
             dark beat between them, overlap them and you get two half-opaque
             blocks of body copy on top of each other. So they do overlap — and
             the one handing over is thrown out of focus and blown up past the
             camera, which reads as foreground blur instead of as text. */
          el.style.setProperty('--pf', round((1 - Math.min(hold * 1.5, 1)) * 18) + 'px');
          /* Arrives from behind the screen, leaves past the camera. The near
             end accelerates (pass^1.7) so a panel lingers at reading size and
             then gets out of the way quickly. */
          el.style.setProperty('--pz', round(-300 + 660 * Math.pow(pass, 1.7)) + 'px');
          el.style.setProperty('--pr', round(lerp(6, -4.5, pass)) + 'deg');
          el.classList.toggle('is-live', hold > .5);
          if (pips[i]) pips[i].classList.toggle('is-on', hold > .5);
        }
        /* The ground goes lime while the AI-agent panel owns the screen —
           the page itself changes colour for the one service whose card
           was always the accent one. */
        var limeIdx = -1;
        for (var j = 0; j < n; j++) {
          if (panels[j].classList.contains('card--accent')) { limeIdx = j; break; }
        }
        if (limeIdx > -1) {
          var lr = range(p, limeIdx * slice - hand * .55, limeIdx * slice + hand * .45);
          var lf = range(p, (limeIdx + 1) * slice - hand * .55, (limeIdx + 1) * slice + hand * .45);
          root.style.setProperty('--lime', round(lr * (1 - lf)));
        }
        stage.style.setProperty('--p', round(p));
      }
    });
  }

  /* ── Section depth ──────────────────────────────────────────
     Everything marked with data-depth drifts against the scroll
     while it is on screen. The value is how many pixels it lags at
     the extremes; small numbers read as depth, large ones read as
     a bug, so nothing here goes past 90. */
  $$('[data-depth]').forEach(function (el) {
    var d = parseFloat(el.getAttribute('data-depth')) || 0;
    if (!d) return;
    track(el, {
      from: function (h) { return -vh; },
      to: function (h) { return h; },
      on: function (p) {
        el.style.setProperty('--sy', round((p - .5) * -2 * d) + 'px');
      }
    });
  });

  /* ── Headline assembly ──────────────────────────────────────
     Section headings arrive a word at a time rather than a block at
     a time. Words are wrapped here rather than in the HTML so the
     source stays readable and the copy stays one editable string. */
  $$('.h2, .cta__title').forEach(function (h) {
    if (h.closest('.tpl')) return;           /* leave the mini-site samples alone */
    var walk = document.createTreeWalker(h, NodeFilter.SHOW_TEXT);
    var nodes = [], node;
    while ((node = walk.nextNode())) nodes.push(node);
    nodes.forEach(function (t) {
      if (!t.nodeValue.trim()) return;
      var frag = document.createDocumentFragment();
      t.nodeValue.split(/(\s+)/).forEach(function (chunk) {
        if (!chunk) return;
        if (!chunk.trim()) { frag.appendChild(document.createTextNode(chunk)); return; }
        var w = document.createElement('span');
        w.className = 'w';
        w.textContent = chunk;
        frag.appendChild(w);
      });
      t.parentNode.replaceChild(frag, t);
    });
    $$('.w', h).forEach(function (w, i) {
      w.style.setProperty('--wi', i);
    });
    h.classList.add('h2--split');
  });

  if ('IntersectionObserver' in window) {
    var wio = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (!e.isIntersecting) return;
        e.target.classList.add('is-set');
        wio.unobserve(e.target);
      });
    }, { threshold: .25, rootMargin: '0px 0px -6% 0px' });
    $$('.h2--split').forEach(function (h) { wio.observe(h); });
  } else {
    $$('.h2--split').forEach(function (h) { h.classList.add('is-set'); });
  }

  /* ── Measure ────────────────────────────────────────────────
     Fonts and the tab panels both change the document height after
     first paint, so re-measure on anything that can move geometry. */
  function remeasure() { measure(); tracks.forEach(function (t) { t.p = -1; }); request(); }

  measure();
  request();

  window.addEventListener('resize', remeasure, { passive: true });
  window.addEventListener('orientationchange', remeasure);
  window.addEventListener('load', remeasure);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
  if ('ResizeObserver' in window) {
    var ro = new ResizeObserver(function () { remeasure(); });
    ro.observe(document.body);
  }
  /* The work section's tabs swap panels of different heights. */
  document.addEventListener('click', function (e) {
    if (e.target.closest('[role="tab"], .showcase__tabs button, details')) {
      setTimeout(remeasure, 60);
    }
  }, true);
})();
