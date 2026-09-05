# SparkUP AI — website

Marketing site for **SparkUP AI**, an AI and digital agency working with
businesses across Pakistan on three things:

1. **High-converting business websites** — built to turn attention into enquiries.
2. **AI agents** — automating customer service, lead handling, bookings and the
   repetitive work that eats a team's day.
3. **Motion videos** — product, property and campaign films cut for social media.

One page, ten sections, no build step. Dark editorial ground, a single electric
lime accent, large display type with a serif-italic accent word, and depth:
a 3D hero ecosystem, panels that flip from problem to solution, an industry
wall that leans toward the pointer, and a scroll-driven transformation tunnel.
Everything is decoration on top of markup that reads without it, and every
scene has a static resting state under `prefers-reduced-motion`.

## Run it

No build step, no dependencies — it's static.

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Deploy by serving the directory as-is (Netlify, Vercel, Pages, S3, nginx).

## Structure

```
index.html              markup — nav, the ten sections, the six mini-site
                        <template>s, the site viewer and the booking dialog
assets/css/styles.css   design tokens, nav, buttons, type, work tabs, agent demos
assets/css/scene.css    the sections built for this page: hero stage, problem
                        flip, service cards, journey rail, industry wall,
                        tunnel, final CTA, footer, booking dialog
assets/css/templates.css  the six miniature websites + preview/viewer chrome
assets/js/main.js       reveals, counters, nav, tabs, mini-site viewer,
                        agent demos, showreel films, contact form
assets/js/scene.js      cursor, magnetic buttons, particle field, hero orbit,
                        problem flip, mouse tilt, chat loop, wall tilt,
                        scroll progress, booking dialog
DESIGN.md               the design system: colour, type, spacing, motion
```

## Sections

| # | Section | What it does |
|---|---|---|
| 01 | Hero | Masked line-by-line headline; a glowing core with three service panels orbiting it in 3D, leaning toward the pointer and settling as the page scrolls |
| 02 | The gap | Three panels that flip on X as they enter the viewport — outdated website → modern site, slow replies → AI agent, static posts → motion |
| 03 | Services | Three immersive cards: a browser that tilts to the pointer, a WhatsApp transcript that plays and escalates to a human, and a fan of social frames |
| 04 | Explore what's possible | Three tabs — six full miniature websites that open in a viewer, two live AI agent demos plus the four agent types, and motion films with their categories |
| 05 | Four-week journey | A horizontal timeline rail whose progress line fills as it is scrolled, and the "never left in the dark" panel |
| 06 | Industries | Twelve sectors on a wall that leans toward the pointer; each tile opens its website / AI agent / motion use case on hover or focus |
| 07 | Why SparkUP AI | Four value statements |
| 08 | From manual to modern | Scroll progress pulls each manual habit out of the left column and lights up its modern counterpart on the right, through a glowing tunnel |
| 09 | Final CTA | Near-full-screen, over a particle field, with the consultation form in a dialog |
| 10 | Footer | Minimal: wordmark, the three-word line, navigation, social |

## Motion and performance

- **One rAF loop.** Every continuous scene registers a callback with a single
  frame loop in `scene.js`, so the page never runs more than one animation
  frame callback at a time.
- **Nothing animates off-screen.** The hero orbit, the particle fields, the
  chat loop and the wall tilt all park themselves via `IntersectionObserver`.
- **Scroll work is throttled** through `requestAnimationFrame` and writes CSS
  custom properties (`--p`) rather than laying out on every event.
- **Particle count scales with area** and is capped, so a large display doesn't
  get ten times the work of a laptop; the canvas is DPR-aware to a factor of 2.
- **Films are `preload="none"`** with poster frames, and only the tab in view
  can play one.
- **Tablet drops the heavy 3D** (the wall stops tilting, the hero grid calms
  down) and **mobile drops it entirely** — no cursor, no tilt, no magnetism —
  while keeping the depth that costs nothing.
- **`prefers-reduced-motion`** stops the orbit at a fixed position, stacks both
  faces of every problem panel instead of flipping, shows the full transcript
  at once, and renders the particle field as one static frame.

## The booking dialog

There is no contact section: "Book a Free Consultation" — in the nav, the hero,
the work section and the final CTA — opens a `<dialog>` with the enquiry form.
The form is client-side only (validation and success state, no network call);
wire the `submit` handler in `assets/js/main.js` to a real endpoint before
launch. Escape closes it, a backdrop click closes it, and focus returns to the
control that opened it.

## Localisation for Pakistan

The content is written for the Pakistani market, not translated into it:

- **Channels** — AI agents answer on the website and on WhatsApp, where
  Pakistani customers already are.
- **Language** — Urdu, Roman Urdu and English support. The booking agent demo
  runs in Roman Urdu because that is how the conversation actually happens.
- **Reach** — city datalist and a `+92` phone field on the booking form; the
  page ships no photographs of its own and no third-party embeds, so it stays
  light on 4G outside the major cities.

## Template photography

The six mini-site heroes use real photographs, listed in
`assets/img/SOURCES.md`. They are not committed — fetch them once with
`bash assets/img/fetch.sh`.

Each `.ph--*` surface stacks three background layers: the local photo, a CDN
copy of it, then the graded CSS gradient. A layer that fails to load is simply
not painted, so the page falls back on its own and never shows a broken image.

Two things that bite here:

- `url()` inside a stylesheet resolves relative to **the stylesheet**, not the
  page, so these are `../img/x.png` and not `assets/img/x.png`.
- Adding image layers shifts every `background-size` / `background-position`
  list out of alignment with the layers they describe. The `.ph--*` rules
  therefore declare no size of their own and inherit `cover` from `.ph`.

## The work showcase

The "Explore what's possible" section holds three tabs on the page itself.

The "Website designs" tab holds **six complete miniature websites**, one per
kind of business a client might be:

| Card | Site | Sector |
|---|---|---|
| Quiet | **Saffron** | Restaurant, Lahore — dark, warm, serif |
| Editorial | **UrbanNest** | Real estate — dark editorial, property search |
| Storefront | **ZAHRA** | Fashion — cream, high-contrast serif, ecommerce |
| Booking-first | **StayNest** | Boutique hotel — warm sand, booking widget |
| Listings | **DriveHub** | Automotive marketplace — light, high-trust, filters |
| Fitness studio | **PEAK FITNESS** | Gym — charcoal and lime, membership-driven |

Each has its own typography, palette, layout logic and UI, with real business
copy, PKR pricing and Pakistani locations.

They live in `assets/css/templates.css` plus one `<template>` per site in
`index.html`. Each site is authored at a **fixed 1080px design width** and
scaled to fit its container, which is why a layout can never break at any
viewport: the design width never changes, only the scale factor. The same
markup is cloned twice — into the card preview at ~0.3 scale, and into the
full-screen viewer at whatever scale fits. One source, two sizes.

Everything is markup and CSS: no images, iframes or third-party embeds. Photo
areas are layered CSS compositions under `.ph--*` — swap one `background-image`
for a real photograph and nothing else changes. They are deliberately **not**
other people's templates: showing a third-party gallery here would present
someone else's work as the studio's own to the exact prospects it is meant
to win.

Two things worth knowing if you touch it:

- The project's `*{margin:0}` reset overrides the UA stylesheet's `margin:auto`
  on `dialog`, which is what centres a modal. `.showcase` restores it — without
  that the panel pins to the top-left corner.
- Backdrop dismissal compares the click against the dialog's bounding box
  rather than testing `e.target === dialog`, because the inner wrapper covers
  the dialog's own box and would otherwise swallow every click.
- `.dz` carries `min-width:0`. Grid items default to `min-width:auto`, so the
  1080px preview inside blows every column out to 1080px without it.
- The viewer is capped at the 1080px design width plus borders. Wider and the
  stage shows a gutter beside the site, which reads as a white band next to the
  dark templates.
- `templates.css` opens with a boundary reset. The page's own stylesheet
  defines generic `.hero`, `.stats`, `.form` and `.plans`, and the mini-sites
  use those same class names — so page layout cascades straight into them. The
  parent `.hero` alone was injecting 220px/110px of padding and a radial glow
  into two templates. Anything generic added to `styles.css` needs checking
  against that list.
- Keep container `max-width` in px, not `ch`. A `ch` value on a hero wrapper
  resolves against *that element's* font-size, not the display heading inside
  it — `30ch` on a wrapper read as ~255px rather than ~900px and shredded two
  headlines into five lines each.

Keyboard: left/right arrows move between the tabs, the viewer closes on Escape,
and focus returns to the card that opened it.

## Notes

- Fonts load from Google Fonts (Inter Tight, Instrument Serif, JetBrains Mono,
  Noto Nastaliq Urdu), each with a system fallback stack.
- Metrics, business names and case content are illustrative placeholder
  content — replace them with real engagements before launch.
- Verified in Chromium at 1440/1280/820/390px: no horizontal overflow, no
  console errors, and full `prefers-reduced-motion` fallbacks.
