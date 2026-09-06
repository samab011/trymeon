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
    });
  }

  /* ── Work tabs (on the page, no longer a dialog) ─────── */
  (function workTabs() {
    var list = $('[role="tablist"]');
    if (!list) return;
    var tabs  = $$('[role="tab"]', list);
    var panes = tabs.map(function (t) { return $('#' + t.getAttribute('aria-controls')); });

    function select(i) {
      tabs.forEach(function (t, n) {
        var on = n === i;
        t.classList.toggle('is-on', on);
        t.setAttribute('aria-selected', String(on));
        t.tabIndex = on ? 0 : -1;
        panes[n].hidden = !on;
      });
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
    /* a hidden pane has zero width, so re-fit when the panes resize and
       whenever the web tab is shown again */
    var panes = $('.workpanes');
    if (panes && 'ResizeObserver' in window) new ResizeObserver(fitAll).observe(panes);
    var webTab = $('#tab-web');
    if (webTab) webTab.addEventListener('click', function () { setTimeout(fitAll, 40); });
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
      }
      /* the cursor leaving stops the clip whatever started it — a preview or a
         click — so nothing keeps playing once you have looked away. Bound even
         under reduced motion, where there is no preview but a click still runs. */
      if (canHover) {
        tile.addEventListener('pointerleave', function () {
          vid.muted = true;
          park();
          tile.classList.remove('is-playing');
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

    /* switching away from the motion tab must not leave a film playing */
    function stopAll() {
      reels.forEach(function (tile) {
        var v = $('.reel__vid', tile);
        if (v) {
          v.pause(); v.muted = true;
          var st = parseFloat(tile.dataset.still || '0') || 0;
          try { v.currentTime = st; } catch (e) {}
        }
        tile.classList.remove('is-playing');
      });
    }
    $$('[role="tab"]').forEach(function (t) {
      if (t.id !== 'tab-motion') t.addEventListener('click', stopAll);
    });
  })();

  /* ── AI agent demos: message-by-message reveal ────────── */
  (function agentDemos() {
    var pane = $('#pane-agents');
    if (!pane) return;
    var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    var timers = [];

    function clear() {
      timers.forEach(clearTimeout);
      timers = [];
    }
    function at(ms, fn) { timers.push(setTimeout(fn, ms)); }

    function reset() {
      clear();
      var opts = $('.chat__opts', pane);
      if (opts) {
        opts.classList.remove('has-pick');
        $$('button', opts).forEach(function (b) { b.classList.remove('is-pick'); });
      }
      $$('.branch', pane).forEach(function (br) { br.hidden = true; });
      $$('[data-step]', pane).forEach(function (el) { el.classList.remove('is-shown'); });
      $$('.hand__node,.hand__arr,.hand__xfer li,.hand__done', pane).forEach(function (el) {
        el.classList.remove('is-lit');
      });
    }

    function showAll() {
      choose('human', false);
      $$('[data-step]', pane).forEach(function (el) { el.classList.add('is-shown'); });
      $$('.hand__node,.hand__arr,.hand__xfer li,.hand__done', pane).forEach(function (el) {
        el.classList.add('is-lit');
      });
    }

    /* A typing bubble is a pause, not a message: it appears, then is replaced
       by the reply it was standing in for, so the wait reads as thinking. */
    function runChat(chat, startAt) {
      var steps = $$('[data-step]', chat);
      var t = startAt;
      steps.forEach(function (el) {
        var typing = el.classList.contains('chat__type') || el.classList.contains('chat__look');
        at(t, function () { el.classList.add('is-shown'); });
        if (typing) {
          t += 900;
          at(t, function () { el.classList.remove('is-shown'); el.style.display = 'none'; });
          at(t + 20, function () { el.style.display = ''; el.classList.remove('is-shown'); });
        } else if (el.classList.contains('chat__opts')) {
          /* the offered resolutions land, then the default one is taken —
             a visitor can click any of them afterwards to see that path */
          t += 700;
          at(t, function () {
            var pick = $('[data-chosen]', el);
            if (pick) choose(pick.dataset.branch, true);
          });
          t += 520;
        } else {
          t += 620;
        }
      });
      return t;
    }

    function runHandover(hand, startAt) {
      var t = startAt;
      at(t, function () { hand.classList.add('is-shown'); });
      t += 300;
      $$('.hand__node,.hand__arr', hand).forEach(function (el) {
        at(t, function () { el.classList.add('is-lit'); });
        t += 220;
      });
      t += 150;
      $$('.hand__xfer li', hand).forEach(function (el) {
        at(t, function () { el.classList.add('is-lit'); });
        t += 260;
      });
      at(t + 120, function () { $('.hand__done', hand).classList.add('is-lit'); });
    }

    /* Each option leads somewhere different: a replacement the agent settles
       alone, a refund it prepares but a colleague releases, or a handover.
       Clicking a chip switches branch and replays it. */
    function choose(name, animate) {
      var opts = $('.chat__opts', pane);
      if (!opts) return;
      opts.classList.add('has-pick');
      $$('button', opts).forEach(function (btn) {
        btn.classList.toggle('is-pick', btn.dataset.branch === name);
        btn.setAttribute('aria-pressed', btn.dataset.branch === name);
      });
      $$('.branch', pane).forEach(function (br) {
        var on = br.dataset.branch === name;
        br.hidden = !on;
        if (!on) {
          $$('[data-step]', br).forEach(function (el) { el.classList.remove('is-shown'); });
          $$('.hand__node,.hand__arr,.hand__xfer li,.hand__done', br).forEach(function (el) {
            el.classList.remove('is-lit');
          });
        }
      });
      var branch = $('.branch[data-branch="' + name + '"]', pane);
      if (!branch) return;
      if (reduce || !animate) {
        $$('[data-step]', branch).forEach(function (el) { el.classList.add('is-shown'); });
        $$('.hand__node,.hand__arr,.hand__xfer li,.hand__done', branch).forEach(function (el) {
          el.classList.add('is-lit');
        });
        return;
      }
      var end = runChat($('.chat', branch), 120);
      var out = $('.outcome', branch);
      if (out) at(end + 120, function () { out.classList.add('is-shown'); });
      var hand = $('.hand', branch);
      if (hand) runHandover(hand, end);
    }

    $$('.chat__opts button', pane).forEach(function (btn) {
      btn.addEventListener('click', function () {
        clear();                       /* drop any sequence still running */
        choose(btn.dataset.branch, true);
      });
    });

    function play() {
      reset();
      if (reduce) { showAll(); return; }
      var chats = $$('.chat[data-seq]', pane);
      var end = 0;
      chats.forEach(function (chat) {
        /* both demos start together so the pair reads as one comparison */
        var t = runChat(chat, 260);
        if (t > end) end = t;
      });
      var hand = $('.hand', pane);
      if (hand) runHandover(hand, end - 900);
    }

    var tab = $('#tab-agents');
    if (tab) tab.addEventListener('click', function () { setTimeout(play, 60); });

    /* the demos live on the page now, so start them when they are reached
       rather than when a dialog opens */
    if ('IntersectionObserver' in window) {
      var seen = false;
      new IntersectionObserver(function (entries, obs) {
        entries.forEach(function (en) {
          if (!en.isIntersecting || seen) return;
          seen = true;
          obs.disconnect();
          play();
        });
      }, { threshold: 0.25 }).observe(pane);
    } else {
      play();
    }
  })();

  /* ── Year ─────────────────────────────────────────────── */
  var year = $('#year');
  if (year) year.textContent = String(new Date().getFullYear());
})();
