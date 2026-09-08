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

The hero's "See the work" button opens a `<dialog>` with three tabbed panels
instead of jumping down the page: design directions, an AI agent transcript,
and motion tiles.

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

Keyboard: Escape closes, left/right arrows move between tabs, focus returns to
the button on close, and with JavaScript off the button still navigates to the
case-study section.

## The enquiry form

The form in the contact section POSTs the enquiry as JSON to
`api/enquiry.js`, which emails it to `sparkup.ai@consultant.com` through
Resend. It never leaves the page and never opens the visitor's mail client.

The Resend key lives in a server-side environment variable. The browser only
ever talks to our own endpoint, so no credential is present in, or sent from,
`index.html` or `assets/js/`.

### Where it can run

`api/enquiry.js` is a serverless function. **GitHub Pages cannot run it** — Pages
serves files and executes nothing, so the form will fail there. Deploy to a host
that runs functions; Vercel needs no configuration beyond `vercel.json`, which is
already in the repo (import the repo at vercel.com, no build command, output
directory `.`).

Netlify or Cloudflare Pages work too — the handler is a plain
`(req, res)` function with no dependencies, so only the export wrapper changes.

If the site must stay on GitHub Pages, the alternative is a form-relay service
(Web3Forms, Formspree): point `data-form-endpoint` on the form at the relay and
add its public access key. That needs no server, but the email template below
comes from the relay rather than from this repository.

### What you need to provide

| # | | |
|---|---|---|
| 1 | **Service** | [Resend](https://resend.com) — free tier covers 3,000 emails/month |
| 2 | **Variable** | `RESEND_API_KEY` |
| 3 | **Where** | Vercel → Project → Settings → Environment Variables. Tick **Production**, **Preview** and **Development** — a variable set only on Production leaves preview deploys failing. |
| 4 | **Value** | An API key from <https://resend.com/api-keys>, starting `re_`. "Sending access" is enough. |
| 5 | **Domain** | See below — yes, before going live. |

Two optional variables, both with working defaults:

| Variable | Default | Set it when |
|---|---|---|
| `ENQUIRY_TO` | `sparkup.ai@consultant.com` | the enquiries should go elsewhere |
| `ENQUIRY_FROM` | `SparkUP AI <onboarding@resend.dev>` | you have verified a domain — see below |
| `ALLOWED_ORIGIN` | *(none)* | the site and the function are on different origins |

### The sending domain

This matters, and it is the most common reason a first send appears to work but
nothing arrives.

Out of the box the function sends from `onboarding@resend.dev`, Resend's shared
testing sender. **It only delivers to the email address that owns the Resend
account.** If `sparkup.ai@consultant.com` is not that address, nothing will
arrive until you verify a domain.

To go live: add your domain at <https://resend.com/domains>, add the DNS records
Resend gives you, wait for verification, then set `ENQUIRY_FROM` to an address on
it — for example `SparkUP AI <enquiries@yourdomain.com>`. The recipient stays
`sparkup.ai@consultant.com` either way.

### The email that arrives

Subject: **New Project Quote Request — [Customer Name]**

```
New Quote Request

You have received a new project enquiry through the SparkUP AI website.

CUSTOMER DETAILS
Name:                          Ayesha Tariq
Email:                         ayesha@chowkretail.pk
WhatsApp Number:               +92 300 1234567
City:                          Lahore

PROJECT DETAILS
Selected Plan:                 Website — Second AI agent — Rs 310,000/month
Selected Add-ons:              Second AI agent
Billing:                       Monthly
Total:                         Rs 310,000/month
What are they trying to fix?:  Our site gets traffic but nobody enquires…

This enquiry was submitted through the SparkUP AI website quote form.

SparkUP AI
Web Design · AI Agents · Motion Videos
sparkup.ai@consultant.com
+44 7984 826727
```

Sent as HTML with a plain-text alternative. Headings and order live in `ROWS` in
`api/enquiry.js` — the function owns the wording, so a malformed or hostile
request cannot reshape the message. Reply-to is the customer's address, so
replying to the alert answers them directly. A blank optional field reads
"Not provided".

### Responses the endpoint returns

| Status | Body | Meaning |
|---|---|---|
| 200 | `{"success":true}` | sent |
| 422 | `{"success":false,"fields":[…]}` | failed server-side validation |
| 405 | `{"success":false}` | not a POST |
| 500 | `{"success":false}` | `RESEND_API_KEY` missing — logged server-side |
| 502 | `{"success":false}` | Resend rejected it or was unreachable — logged with its reason |

Failure bodies never describe how the server is wired; the detail goes to the
server log. The page logs the status and message it received to the console, so
a failure can be diagnosed without reading anything back to the visitor.

### Behaviour on the page

- Name, email, WhatsApp number and the message are required; email and phone are
  format-checked in the browser *and* re-checked in the function, since a request
  can reach it without going through the page.
- Success: "Thank you! Your project request has been received. Our team will be
  in touch shortly." — the form clears and the plan summary is restored.
- Failure: "Something went wrong. Please try again or contact us directly at
  sparkup.ai@consultant.com." — in the warning colour, with what the visitor
  typed left in place.
- The submit button disables while a request is in flight, so extra clicks cannot
  queue a duplicate. Verified: three clicks during a request produce one email.
- An off-screen honeypot field is answered 200 without sending, so bots do not
  retry.

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
