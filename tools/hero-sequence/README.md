# Hero motion sequence

`assets/video/hero-sequence.mp4` — 18s, 1920×1080, 30fps, H.264/yuv420p, ~2.7 MB.
Poster frame alongside it as `hero-sequence.jpg`.

The sequence is the site's own hero — the same wording, the same Inter Tight,
Instrument Serif and JetBrains Mono, the same `#CCFF2E` — animated inside a
perspective-projected point network and captured a frame at a time.

It is built this way rather than generated because the two hardest requirements
work against generative video: the headline has to read back verbatim, and the
closing frame has to match the live hero closely enough to cut straight into the
page. Rendering the real markup gives both by construction. Measured against the
live hero at 1920×1080, the closing frame's copy column matches at **0.946 ink
IoU, mean difference 4.2/255**.

## Running it

```
pip install playwright imageio-ffmpeg
python3 tools/hero-sequence/render.py
python3 tools/hero-sequence/render.py --stills   # a few frames, to check timing
```

`render.py` inlines the three woff2 faces in `fonts/` as data URIs, so nothing is
fetched at render time, and refuses to render if Inter Tight has not loaded — a
fallback face would silently change every glyph.

## Keeping it in step with the hero

`scene.html` hardcodes the hero's own geometry at 1920×1080 so the last frame
lands on the live composition: copy column at **x=364 y=232 w=592**, kicker
12px with 1.68px tracking, h1 60px/60px with -2.28px tracking, lede 19px/29.45px,
buttons 16px. **Re-measure and update these after any change to the hero.**

Measure with the real faces loaded. Inter Tight is meaningfully narrower than the
Arial fallback, so a measurement taken while Google Fonts is unreachable gives
different numbers — and the third headline line wraps to two rows either way, but
everything below it shifts. Getting this wrong once cost a 3px vertical offset
that dropped the match from 0.95 to 0.66 IoU.

The sequence renders the copy column only. The hero's 3D stage occupies the right
of the page; the video leaves that side to the network and hands it over, so the
stage arrives when the page itself loads.

## How it works

`scene.html` is the whole thing: markup, styles and a canvas network, with every
visual expressed as a pure function of `t` in seconds. Nothing reads the clock —
`window.__seek(frame, fps)` draws a given frame — so the capture harness can seek
and get an identical image on every run, and the RNG seeding the network is fixed
for the same reason.

Depth is real, not layered fakery. Nodes carry an `x, y, z` in world space and are
projected through a perspective divide against a camera that dollies forward, so
near nodes sweep outward while far ones barely move; the parallax falls out of the
projection. Two canvases sandwich the typography — `#netFar` behind it, `#netNear`
in front and slightly blurred — which is what puts some of the network between the
viewer and the words.

## Timeline

| Time | Beat |
|---|---|
| 0.0–2.4s | near-black; the web begins to build |
| 2.2–3.3s | the Karachi · Lahore · Islamabad kicker |
| 3.1–4.5s | "Helping Pakistani" rises out of its clip box |
| 4.4–5.8s | "Businesses *Grow*" — the hero's one lime word |
| 5.7–7.1s | "with Websites, AI Agents" |
| 6.4–11.0s | the three network clusters light in turn, one per service |
| 9.4–10.8s | "& Motion Videos." completes the headline |
| 11.0–12.3s | the lede |
| 12.4–14.8s | both CTAs rise; one light sweep crosses the primary |
| 11.4–14.6s | the network settles; lime pulses run the edges |
| 15.0–18.0s | glows decay to flat; holds on the site's own composition |

The services are set in white on this hero, so the lime lands in the network
rather than the type — each cluster ignites as its service line arrives. The glow
decay at the end is deliberate: the last seconds carry no halo on "Grow" and
almost none on the button, so the final frame sits on the live hero's flat colour
and the cut to the page is invisible.

## Changing it

Timings live in the `seg(t, from, to)` calls in `scene.html` — `LINE_IN` for the
headline lines, `groupLit` for the clusters. `camZ` is the camera. `DUR` at the
top sets the length and is read by `render.py`.

Re-render after any edit; the committed mp4 is a build artifact, not a source.
