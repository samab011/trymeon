/* ============================================================
   SPARKUP AI — depth, orbit and scroll scenes
   Everything here is decoration on top of markup that already
   reads without it. Under prefers-reduced-motion each scene
   settles into a static, fully-legible resting state.
   ============================================================ */
(function () {
  'use strict';

  var reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var coarse  = window.matchMedia('(hover: none), (pointer: coarse)').matches;
  var $  = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var clamp = function (v, a, b) { return v < a ? a : v > b ? b : v; };

  /* One rAF loop drives every continuous scene, so the page never runs
     more than a single animation frame callback at a time. */
  var frames = [];
  var running = false;
  function addFrame(fn) {
    frames.push(fn);
    if (!running) { running = true; requestAnimationFrame(loop); }
  }
  function loop(t) {
    for (var i = 0; i < frames.length; i++) frames[i](t);
    requestAnimationFrame(loop);
  }

  /* Pointer position as -1..1 from the viewport centre, eased. */
  var ptr = { x: 0, y: 0, tx: 0, ty: 0 };
  if (!coarse) {
    window.addEventListener('pointermove', function (e) {
      ptr.tx = (e.clientX / window.innerWidth) * 2 - 1;
      ptr.ty = (e.clientY / window.innerHeight) * 2 - 1;
    }, { passive: true });
  }
  addFrame(function () {
    ptr.x += (ptr.tx - ptr.x) * 0.08;
    ptr.y += (ptr.ty - ptr.y) * 0.08;
  });

  /* Only animate what is on screen. */
  function whenVisible(el, on, off) {
    if (!('IntersectionObserver' in window)) { on(); return; }
    new IntersectionObserver(function (entries) {
      entries.forEach(function (e) { e.isIntersecting ? on() : (off && off()); });
    }, { rootMargin: '120px' }).observe(el);
  }

  /* ── Cursor halo ──────────────────────────────────────── */
  (function () {
    var dot = $('#cursor');
    if (!dot || coarse || reduced) return;
    var x = -100, y = -100, cx = -100, cy = -100;
    window.addEventListener('pointermove', function (e) {
      x = e.clientX; y = e.clientY; dot.classList.add('is-on');
    }, { passive: true });
    document.addEventListener('pointerleave', function () { dot.classList.remove('is-on'); });
    document.addEventListener('pointerover', function (e) {
      var t = e.target.closest('a, button, .ind, .dz__btn, .week, .atype');
      dot.classList.toggle('is-big', !!t);
    });
    addFrame(function () {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      dot.style.transform = 'translate3d(' + cx.toFixed(1) + 'px,' + cy.toFixed(1) + 'px,0)';
    });
  })();

  /* ── Magnetic buttons ─────────────────────────────────── */
  if (!coarse && !reduced) {
    $$('.magnet').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / r.width;
        var dy = (e.clientY - (r.top + r.height / 2)) / r.height;
        el.style.transform = 'translate(' + (dx * 12).toFixed(1) + 'px,' + (dy * 8).toFixed(1) + 'px)';
      });
      el.addEventListener('pointerleave', function () { el.style.transform = ''; });
    });
  }

  /* ── Particle field (hero + final CTA) ────────────────── */
  /* Slow-drifting dust with a light trail between near neighbours.
     Count scales with area and is capped, so a 4K monitor doesn't get
     ten times the work of a laptop. */
  function field(canvas) {
    if (!canvas) return;
    var ctx = canvas.getContext('2d', { alpha: true });
    if (!ctx) return;
    var dots = [], w = 0, h = 0, dpr = 1, alive = false, drawn = false;

    function size() {
      var r = canvas.getBoundingClientRect();
      dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = r.width; h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      var n = clamp(Math.round((w * h) / 17000), 18, 70);
      dots = [];
      for (var i = 0; i < n; i++) {
        dots.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.16, vy: (Math.random() - 0.5) * 0.16,
          r: Math.random() * 1.5 + 0.5, a: Math.random() * 0.5 + 0.2
        });
      }
      drawn = false;
    }

    function draw() {
      ctx.clearRect(0, 0, w, h);
      var px = ptr.x * 18, py = ptr.y * 12;
      for (var i = 0; i < dots.length; i++) {
        var d = dots[i];
        if (!reduced) {
          d.x += d.vx; d.y += d.vy;
          if (d.x < -10) d.x = w + 10; else if (d.x > w + 10) d.x = -10;
          if (d.y < -10) d.y = h + 10; else if (d.y > h + 10) d.y = -10;
        }
        var x = d.x + px * d.r * 0.4, y = d.y + py * d.r * 0.4;
        ctx.beginPath();
        ctx.arc(x, y, d.r, 0, 6.2832);
        ctx.fillStyle = 'rgba(204,255,46,' + d.a.toFixed(2) + ')';
        ctx.fill();
        /* one trail per pair, drawn only when they are close */
        for (var j = i + 1; j < dots.length; j++) {
          var o = dots[j], ddx = x - o.x, ddy = y - o.y;
          var dist2 = ddx * ddx + ddy * ddy;
          if (dist2 > 13000) continue;
          ctx.beginPath();
          ctx.moveTo(x, y); ctx.lineTo(o.x, o.y);
          ctx.strokeStyle = 'rgba(204,255,46,' + (0.1 * (1 - dist2 / 13000)).toFixed(3) + ')';
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
    }

    size();
    canvas.classList.add('is-on');
    if (reduced) { draw(); return; }

    whenVisible(canvas, function () { alive = true; }, function () { alive = false; });
    addFrame(function () { if (alive) draw(); });

    var rt;
    window.addEventListener('resize', function () {
      clearTimeout(rt); rt = setTimeout(function () { size(); if (!alive || reduced) draw(); }, 180);
    }, { passive: true });
  }
  field($('#heroField'));
  field($('#ctaField'));

  /* ── Hero: the three services orbit the core ──────────── */
  (function () {
    var stage = $('#stage'), space = $('#stageSpace');
    if (!stage || !space) return;
    var orbs = $$('.orb', space);
    var alive = true, hero = $('#hero');

    /* Radius follows the stage, so the orbit never overflows its box. */
    var rx = 150, ry = 62;
    function measure() {
      var r = stage.getBoundingClientRect();
      /* the orbit is measured from the panel, not the viewport, so the far
         side of the ring never leaves the stage on a narrow screen */
      var ow = orbs.length ? orbs[0].offsetWidth : 184;
      rx = clamp(((r.width - ow) / 2) * 0.94, 60, 260);
      ry = clamp(r.height * 0.26, 40, 108);
    }
    measure();
    window.addEventListener('resize', measure, { passive: true });

    function place(t) {
      for (var i = 0; i < orbs.length; i++) {
        var a = t + (i * 2.0944);                       /* 120° apart */
        var x = Math.sin(a) * rx;
        var z = Math.cos(a) * rx * 0.75;
        var y = Math.cos(a * 0.8) * ry;
        var depth = (z + rx * 0.75) / (rx * 1.5);        /* 0 far … 1 near */
        var o = orbs[i];
        o.style.setProperty('--x', x.toFixed(1));
        o.style.setProperty('--y', y.toFixed(1));
        o.style.setProperty('--z', z.toFixed(1));
        o.style.setProperty('--s', (0.82 + depth * 0.24).toFixed(3));
        o.style.opacity = (0.55 + depth * 0.45).toFixed(2);
        o.style.zIndex = Math.round(depth * 10);
      }
    }

    if (reduced) { place(0.6); return; }

    whenVisible(stage, function () { alive = true; }, function () { alive = false; });

    var scrollTilt = 0;
    window.addEventListener('scroll', function () {
      var r = hero.getBoundingClientRect();
      scrollTilt = clamp(-r.top / Math.max(r.height, 1), 0, 1);
    }, { passive: true });

    addFrame(function (t) {
      if (!alive) return;
      place(t / 7000);
      /* the whole stage leans toward the pointer and settles back as the
         hero scrolls away */
      var ry2 = ptr.x * 13 - scrollTilt * 4;
      var rx2 = -ptr.y * 9 + scrollTilt * 10;
      space.style.transform = 'rotateX(' + rx2.toFixed(2) + 'deg) rotateY(' + ry2.toFixed(2) + 'deg)';
      space.style.transition = 'none';
    });
  })();

  /* ── Problem panels flip into their solution ──────────── */
  (function () {
    var cards = $$('[data-shift]');
    if (!cards.length) return;
    if (reduced || !('IntersectionObserver' in window)) return;   /* CSS stacks both faces */
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (e) {
        var i = cards.indexOf(e.target);
        if (e.isIntersecting) {
          setTimeout(function () { e.target.classList.add('is-solved'); }, 420 + i * 260);
        } else if (e.boundingClientRect.top > 0) {
          e.target.classList.remove('is-solved');            /* replays on the way back up */
        }
      });
    }, { threshold: 0.55 });
    cards.forEach(function (c) { io.observe(c); });
  })();

  /* ── Mouse-tilt for the browser and the social frames ─── */
  if (!coarse && !reduced) {
    $$('[data-tilt]').forEach(function (box) {
      box.addEventListener('pointermove', function (e) {
        var r = box.getBoundingClientRect();
        var dx = (e.clientX - (r.left + r.width / 2)) / (r.width / 2);
        var dy = (e.clientY - (r.top + r.height / 2)) / (r.height / 2);
        box.style.setProperty('--tx', (dx * 11).toFixed(2) + 'deg');
        box.style.setProperty('--ty', (-dy * 8).toFixed(2) + 'deg');
      });
      box.addEventListener('pointerleave', function () {
        box.style.setProperty('--tx', '0deg');
        box.style.setProperty('--ty', '0deg');
      });
    });
  }

  /* ── The service-card transcript, on a loop ───────────── */
  (function () {
    var wa = $('[data-chat]');
    if (!wa) return;
    var steps = $$('[data-i]', wa).sort(function (a, b) {
      return a.getAttribute('data-i') - b.getAttribute('data-i');
    });
    if (reduced) { steps.forEach(function (s) { s.classList.add('is-on'); }); return; }

    var timers = [], playing = false;
    function reset() { timers.forEach(clearTimeout); timers = []; steps.forEach(function (s) { s.classList.remove('is-on'); }); }
    function play() {
      reset();
      var at = 500;
      steps.forEach(function (s, i) {
        var typing = s.classList.contains('wa__typing');
        timers.push(setTimeout(function () {
          s.classList.add('is-on');
          /* a typing bubble is a pause, not a message: it clears itself */
          if (typing) timers.push(setTimeout(function () { s.classList.remove('is-on'); }, 900));
        }, at));
        at += typing ? 1000 : (i === steps.length - 1 ? 900 : 1250);
      });
      timers.push(setTimeout(function () { if (playing) play(); }, at + 3600));
    }
    whenVisible(wa, function () { if (!playing) { playing = true; play(); } },
                    function () { playing = false; reset(); });
  })();

  /* ── Industry wall leans toward the pointer ───────────── */
  (function () {
    var wall = $('#wall');
    if (!wall || coarse || reduced || window.innerWidth < 1081) return;
    var grid = $('.wall__grid', wall), alive = false;
    whenVisible(wall, function () { alive = true; }, function () { alive = false; });
    addFrame(function () {
      if (!alive) return;
      var r = wall.getBoundingClientRect();
      var cx = (r.left + r.width / 2) / window.innerWidth * 2 - 1;
      grid.style.transform = 'rotateY(' + ((ptr.x - cx) * 4).toFixed(2) + 'deg) rotateX(' + (-ptr.y * 3).toFixed(2) + 'deg)';
      grid.style.transition = 'none';
    });
  })();

  /* ── Scroll progress: journey line + transformation tunnel ── */
  (function () {
    var journey = $('#process'), rail = $('#journeyRail'), line = $('.journey__line', journey || document);
    var tun = $('#tun'), section = $('#transform');
    var oldItems = $$('.tun__side--old li'), newItems = $$('.tun__side--new li');
    if (!journey && !tun) return;

    /* the timeline fills from how far the rail itself has been scrolled,
       falling back to the section's vertical progress on touch */
    function railProgress() {
      if (!rail || !line) return;
      var max = rail.scrollWidth - rail.clientWidth;
      var p = max > 8 ? rail.scrollLeft / max : sectionProgress(journey);
      line.style.setProperty('--p', p.toFixed(3));
    }
    function sectionProgress(el) {
      if (!el) return 0;
      var r = el.getBoundingClientRect();
      return clamp((window.innerHeight - r.top) / (window.innerHeight + r.height), 0, 1);
    }

    function tunnelProgress() {
      if (!tun || !section) return;
      var p = clamp((sectionProgress(section) - 0.18) / 0.5, 0, 1);
      section.style.setProperty('--p', p.toFixed(3));
      for (var i = 0; i < oldItems.length; i++) {
        var at = (i + 1) / (oldItems.length + 0.6);
        var on = p >= at;
        oldItems[i].classList.toggle('is-gone', on);
        if (newItems[i]) newItems[i].classList.toggle('is-here', on);
      }
    }

    var queued = false;
    function tick() {
      queued = false;
      railProgress();
      tunnelProgress();
    }
    function request() { if (!queued) { queued = true; requestAnimationFrame(tick); } }
    window.addEventListener('scroll', request, { passive: true });
    window.addEventListener('resize', request, { passive: true });
    if (rail) rail.addEventListener('scroll', request, { passive: true });
    tick();
  })();

  /* ── Booking dialog ───────────────────────────────────── */
  (function () {
    var dlg = $('#book');
    if (!dlg) return;
    var opener = null;

    function open(from) {
      opener = from || null;
      if (typeof dlg.showModal === 'function') {
        if (!dlg.open) dlg.showModal();
      } else {
        dlg.setAttribute('open', '');           /* very old browsers: inline panel */
      }
      var first = $('#fName');
      if (first) setTimeout(function () { first.focus(); }, 60);
    }
    function close() {
      if (typeof dlg.close === 'function' && dlg.open) dlg.close();
      else dlg.removeAttribute('open');
      if (opener && opener.focus) opener.focus();
    }

    $$('[data-book]').forEach(function (b) {
      b.addEventListener('click', function (e) { e.preventDefault(); open(b); });
    });
    /* the footer and nav links to #contact land on the CTA section, which is
       the right behaviour — only explicit [data-book] controls open the form */
    var x = $('#bookClose');
    if (x) x.addEventListener('click', close);
    dlg.addEventListener('click', function (e) { if (e.target === dlg) close(); });
  })();
})();
