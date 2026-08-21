# Meon — AI support studio website

Marketing site for **Meon**, an AI support studio that plans websites, ships
design systems, produces motion video, and runs always-on AI support for the
teams behind them.

Built as a dark editorial agency site: oversized display typography, a single
acid accent, film grain, scroll-revealed sections, and an interactive plan
builder that upsells add-ons on top of a base retainer.

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
assets/js/main.js       reveals, counters, nav, rail, plan builder, form
DESIGN.md               the design system: colour, type, spacing, motion
```

## Sections

| # | Section | What it does |
|---|---|---|
| — | Hero | Masked line-by-line headline, animated stat counters |
| 01 | Services | Bento grid, six disciplines, one inverted accent card |
| 02 | Process | Four-week timeline with per-step deliverables |
| 03 | Work | Horizontal scroll-snap case rail, colour-coded per case |
| 04 | Build a plan | Base plan + add-on upsells + billing toggle, live total |
| 05 | FAQ | Native `<details>` accordion |
| 06 | Contact | Client-validated form, pre-filled with the built plan |

## The plan builder

The pricing section is the site's conversion mechanic, and it's data-driven:

- Base plans carry `data-price` (Sprint 3,200 / Partner 6,400 / Embedded 11,500).
- Add-ons carry `data-addon` and `data-price`, and toggle via `aria-pressed`.
- Quarterly billing applies a 15% discount to `(base + add-ons) × 3` and shows
  the saved amount.
- The running total, the plan summary line, and the read-only **Selected plan**
  field in the contact form all render from one function, so what a visitor
  builds is exactly what the form submits.

Changing a price means editing one `data-price` attribute — nothing in the JS
hardcodes an amount.

## Notes

- Fonts load from Google Fonts (Inter Tight, Instrument Serif, JetBrains Mono),
  each with a system fallback stack.
- The contact form is client-side only — validation and success state, no
  network call. Wire the `submit` handler in `assets/js/main.js` to a real
  endpoint before launch.
- Case studies, metrics and testimonials are placeholder content.
- Verified in Chromium at 1440px and 390px: no horizontal overflow, no console
  errors, and full `prefers-reduced-motion` fallbacks.
