# Hero motion sequence

`assets/video/hero-sequence.mp4` — 18s, 1920×1080, 30fps, H.264/yuv420p, ~2.7 MB.
Poster frame alongside it as `hero-sequence.jpg`.

The sequence is the site's own hero — the same wording, the same Inter Tight and
Instrument Serif, the same `#CCFF2E` — animated inside a perspective-projected
point network and captured a frame at a time.

It is built this way rather than generated because the two hardest requirements
work against generative video: the headline has to read back verbatim, and the
closing frame has to match the live hero closely enough to cut straight into the
page. Rendering the real markup gives both by construction.

## Running it

```
pip install playwright imageio-ffmpeg
python3 tools/hero-sequence/render.py
python3 tools/hero-sequence/render.py --stills   # a few frames, to check timing
```

`render.py` inlines the two woff2 faces in `fonts/` as data URIs, so nothing is
fetched at render time — a fallback face would silently change every glyph.
The script refuses to render if Inter Tight has not loaded.

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
| 0.0–2.6s | near-black; the web begins to build |
| 3.2–4.7s | "Helping Pakistani" rises out of its clip box |
| 4.5–6.0s | "Businesses Grow" |
| 6.0–7.0s | "with" in grey serif italic |
| 7.0–8.4s | "Websites" lands; its node cluster lights |
| 8.4–9.8s | "AI Agents" |
| 9.8–11.4s | "& Motion Videos." completes the headline |
| 11.2–14.4s | the network settles; lime pulses run the edges |
| 13.2–15.5s | the CTA rises, then one light sweep crosses it |
| 15.5–18.0s | glows decay to flat; holds on the site's own composition |

The glow decay at the end is deliberate: the last second or so carries no halo on
the lime type and almost none on the button, so the final frame sits on the live
hero's flat colour and the cut to the page is invisible.

## Changing it

Timings live in the `seg(t, from, to)` calls in `scene.html` — `LINE_IN` for the
headline lines, `sIn` for the three service words, `groupLit` for the clusters
that light behind them. `camZ` is the camera. `DUR` at the top sets the length and
is read by `render.py`.

Re-render after any edit; the committed mp4 is a build artifact, not a source.
