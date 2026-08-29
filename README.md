# SparkUP AI — website

Marketing site for **SparkUP AI**, a Karachi- and Lahore-based AI studio
working with businesses across Pakistan on three things:

1. **High-converting websites** — to attract more customers and increase revenue.
2. **Custom AI agents** — taking day-to-day work off the team: enquiries,
   bookings, follow-ups and support at any hour.
3. **Motion video** — for products, properties, services, launches; whatever
   the business sells.

The site is written for businesses of every kind. Real estate appears as one
worked example among several — a property walkthrough is one thing motion video
is good for — and is deliberately not the framing of any section.

Built as a dark editorial agency site: oversized display typography, a single
acid accent, film grain, scroll-revealed sections, and an interactive plan
builder that upsells add-ons on top of a base retainer. All pricing is in
Pakistani rupees.

## Run it

No build step, no dependencies — it's static.

```bash
python3 -m http.server 8000
# → http://localhost:8000
```

Deploy by serving the directory as-is (Netlify, Vercel, Pages, S3, nginx).

## Structure

```
index.html              markup — nav, hero, services, process, work,
                        plan builder, testimonials, FAQ, contact, footer
assets/css/styles.css   design tokens + all styling
assets/css/templates.css  the six miniature websites + preview/viewer chrome
assets/js/main.js       reveals, counters, nav, rail, plan builder, form
DESIGN.md               the design system: colour, type, spacing, motion
```

## Sections

| # | Section | What it does |
|---|---|---|
| — | Hero | Masked line-by-line headline, animated stat counters |
| 01 | Services | The three pillars, one inverted accent card |
| 02 | Process | Four-week timeline with per-step deliverables |
| 03 | Work | Horizontal scroll-snap case rail, colour-coded per case |
| — | Showcase | "See the work" opens a modal with three tabs — design directions, an agent transcript, motion tiles |
| 04 | Pricing | Service package + add-on upsells + billing toggle, live PKR total |
| 05 | FAQ | Native `<details>` accordion |
| 06 | Contact | Client-validated form, pre-filled with the built plan |

## The plan builder

The three packages in the builder are the three pillars sold directly — Agent,
Website and Property Films — not good/better/best tiers of one thing. Add-ons
are two per pillar, so whichever package a visitor picks there is something
relevant to stack on it.

The pricing section is the site's conversion mechanic, and it's data-driven:

- Packages carry `data-price` in PKR (Agent 185,000 / Website 245,000 /
  Property Films 165,000 per month).
- Add-ons carry `data-addon` and `data-price`, and toggle via `aria-pressed`:
  a second agent and CRM sync for Agent, landing pages and a design system for
  Website, a product motion pack and drone footage for Property Films.
- Quarterly billing applies a 15% discount to `(base + add-ons) × 3` and shows
  the saved amount.
- The running total, the plan summary line, and the read-only **Selected plan**
  field in the contact form all render from one function, so what a visitor
  builds is exactly what the form submits.

Changing a price means editing one `data-price` attribute — nothing in the JS
hardcodes an amount.

Amounts are formatted with `Intl` under the `en-PK` locale, which groups in
plain thousands (`145,000`, not `1,45,000`) and pairs with the `Rs` symbol used
throughout. Rates are set for the Pakistani market rather than converted from a
dollar rate — a straight USD conversion would put the entry tier near
Rs 900,000/month and out of reach of the businesses this site is written for.

## Localisation for Pakistan

The content is written for the Pakistani market, not translated into it:

- **Channels** — AI agents answer on the website and on WhatsApp, where
  Pakistani customers already are.
- **Billing** — PKR invoicing by bank transfer, with filer/non-filer
  withholding noted in the pricing fine print.
- **Language** — Urdu, Roman Urdu and English support, with a bilingual design
  system (Latin and Nastaliq, LTR and RTL) sold as an add-on. The footer line
  is set in Noto Nastaliq Urdu with `lang="ur" dir="rtl"`.
- **Reach** — page-weight budgets stated in terms of 4G outside the major
  cities; city datalist and `+92` phone field on the contact form; Mon–Sat,
  9am–9pm PKT stated as working hours.

## The hero fractal tree

`assets/js/main.js` draws a recursive fractal tree on a canvas behind the hero.
It's a port of the "Fractal Bloom" React component into this project's vanilla
stack, since the site has no React, Tailwind or build step. What changed in the
port, beyond the palette:

- **Time-based growth.** The original advanced a counter per frame, so it grew
  twice as fast on a 120Hz display. Growth is now driven by elapsed time and
  completes in 2.6s regardless of refresh rate.
- **Batched strokes.** Segments are collected into one `Path2D` per depth
  level, so a frame costs ~10 stroke calls instead of ~1000.
- **Draws only when something changed.** It animates while growing, then stops;
  after that it redraws only on pointer movement. The original ran a permanent
  60fps loop.
- **Paused off-screen** via `IntersectionObserver`, with elapsed grow time
  adjusted so a tree paused mid-growth resumes rather than jumping.
- **DPR-aware**, sized to the hero element rather than `window`, so it stays
  sharp on retina and correct if the hero is not full-viewport.
- **Touch as well as mouse** for the branch-angle influence.
- **`prefers-reduced-motion`** renders one static, fully grown tree and
  registers no listeners at all.
- Depth drops from 9 to 7 below 700px (255 segments instead of 1023), and the
  root sits right of centre on wide screens so the trunk doesn't run through
  the left-aligned headline.

The canvas is masked with a CSS gradient — horizontally on desktop so it's
faintest behind the copy, vertically on narrow screens where the copy is full
width.

## The work showcase

The hero's "See the work" button opens a `<dialog>` with three tabbed panels
instead of jumping down the page: design directions, an AI agent transcript,
and motion tiles.

The "Website designs" tab holds **six complete miniature websites** for
fictional Pakistani businesses — FORM / Studio (architecture, Lahore),
NOOR & CO. (brand strategy, Karachi), MAHRO (fashion), THE GLOW ROOM (skin
clinic, Islamabad), DAR HOUSE (property, Karachi) and FLOWN (AI automation).
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
- Keep container `max-width` in px, not `ch`. A `ch` value on a hero wrapper
  resolves against *that element's* font-size, not the display heading inside
  it — `30ch` on a wrapper read as ~255px rather than ~900px and shredded two
  headlines into five lines each.

Keyboard: Escape closes, left/right arrows move between tabs, focus returns to
the button on close, and with JavaScript off the button still navigates to the
case-study section.

## Notes

- Fonts load from Google Fonts (Inter Tight, Instrument Serif, JetBrains Mono,
  Noto Nastaliq Urdu), each with a system fallback stack.
- The contact form is client-side only — validation and success state, no
  network call. Wire the `submit` handler in `assets/js/main.js` to a real
  endpoint before launch.
- Case studies, metrics and testimonials are illustrative placeholder content.
  The business names are invented and the work section says so on the page —
  replace them with real engagements before launch.
- Verified in Chromium at 1600/1440/1280/1024/768/390px: no horizontal
  overflow, no console errors, no hero line wrapping at any width, and full
  `prefers-reduced-motion` fallbacks.
