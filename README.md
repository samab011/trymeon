# SparkUP AI — AI support studio website

Marketing site for **SparkUP AI**, a Karachi- and Lahore-based AI support studio that
plans websites, ships bilingual design systems, produces motion video, and runs
a WhatsApp AI support desk for businesses across Pakistan.

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
assets/js/main.js       reveals, counters, nav, rail, plan builder, form
DESIGN.md               the design system: colour, type, spacing, motion
```

## Sections

| # | Section | What it does |
|---|---|---|
| — | Hero | Masked line-by-line headline, animated stat counters |
| 01 | Services | Three core disciplines, one inverted accent card |
| 02 | Process | Four-week timeline with per-step deliverables |
| 03 | Work | Horizontal scroll-snap case rail, colour-coded per case |
| 04 | Pricing | Base plan + add-on upsells + billing toggle, live PKR total |
| 05 | FAQ | Native `<details>` accordion |
| 06 | Contact | Client-validated form, pre-filled with the built plan |

## The plan builder

The services section covers the three core disciplines; the motion pack, the
WhatsApp AI desk and the design system are sold as add-ons on top.

The pricing section is the site's conversion mechanic, and it's data-driven:

- Base plans carry `data-price` in PKR (Sprint 145,000 / Partner 320,000 /
  Embedded 675,000 per month).
- Add-ons carry `data-addon` and `data-price`, and toggle via `aria-pressed`.
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

- **Channels** — WhatsApp as the primary support and order-confirmation
  channel; Instagram and TikTok as discovery.
- **Billing** — PKR invoicing by bank transfer, with filer/non-filer
  withholding noted in the pricing fine print.
- **Language** — Urdu, Roman Urdu and English support, with a bilingual design
  system (Latin and Nastaliq, LTR and RTL) sold as an add-on. The footer line
  is set in Noto Nastaliq Urdu with `lang="ur" dir="rtl"`.
- **Reach** — page-weight budgets stated in terms of 4G outside the major
  cities; city datalist and `+92` phone field on the contact form; Mon–Sat,
  9am–9pm PKT stated as working hours.

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
