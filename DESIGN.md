# Meon — Design System

Dark editorial agency style: oversized display type, a single acid accent,
mono utility text, film grain, and motion that reveals rather than decorates.

## Colour

| Token | Value | Use |
|---|---|---|
| `--ink` | `#0B0B0C` | Page ground |
| `--ink-2` | `#121214` | Cards, panels |
| `--ink-3` | `#191A1D` | Card hover, selected |
| `--paper` | `#F2EFE7` | Inverted blocks (quote bar, CTA case) |
| `--acid` | `#CCFF2E` | Primary accent — one per viewport, never body text |
| `--acid-deep` | `#A9DB12` | Accent on paper backgrounds (contrast) |
| `--clay` | `#FF6B4A` | Secondary flag, error state |
| `--sky` | `#8FB8FF` | Case-study coding only |
| `--fg` / `--fg-mute` / `--fg-faint` | `#F4F3F1` / 58% / 34% | Text hierarchy |
| `--line` / `--line-soft` | white 11% / 6% | Borders, rules |

Case studies carry their own `--case` colour, set inline per card.

## Typography

Three families, strictly separated by job:

- **Inter Tight** — all headings and UI. Tight tracking (`-.035em` to `-.05em`)
  at display sizes; that negative tracking is what makes it read as display type.
  Hero lines are written short enough to never wrap — a wrapped line breaks the
  mask-and-rise reveal and pushes the payoff below the fold.
- **Instrument Serif italic** — one accented word per heading, in `--acid`.
  Never a full sentence.
- **JetBrains Mono** — eyebrows, kickers, metrics labels, prices, tags.
  Uppercase, `.1em`–`.14em` letter-spacing, 11–13px.
- **Noto Nastaliq Urdu** — the Urdu line in the footer only, at `line-height: 2.2`.
  Nastaliq needs roughly double the leading of Latin type; anything tighter
  clips the descenders of the script.

Currency is set as `Rs` at half the numeral size, superscript-aligned, with
`font-variant-numeric: tabular-nums` on every price and metric so rupee amounts
line up in columns.

Scale is fluid via `clamp()`. Hero `clamp(50px, 10.4vw, 142px)` at `.9` line-height;
section headings `clamp(38px, 6.4vw, 84px)` at `.98`. Body is 17px / 1.55.
The intended contrast ratio is roughly 8:1 between hero and body.

## Spacing

- `--gut` — page gutter, `clamp(20px, 4.4vw, 64px)`
- `--sec` — section rhythm, `clamp(88px, 12vw, 180px)`
- `--max` — content width, `1320px`
- `--r` — corner radius, `18px` (12px for nested controls, `99px` for pills)

Card gaps stay at a flat `14px` at every breakpoint — the grid changes, the gap doesn't.

## Motion

- `--ease` `cubic-bezier(.22,.68,.24,1)` on everything. No linear, no bounce.
- `--fast` `.28s` for hover/state, `--slow` `.72s` for entrances.
- Reveal: `IntersectionObserver` adds `.in`; siblings stagger 70ms, capped at 6.
- Hero lines mask-and-rise from `translateY(105%)` inside `overflow:hidden`.
- Marquee is a duplicated track translated `-50%` over 34s.
- Grain animates `background-position` (not `transform`) so it can't inflate
  document width.
- Every animation is disabled under `prefers-reduced-motion: reduce`.

## Components

- **Pill nav** — fixed, blurred, hides on scroll-down past 420px, unless the
  mobile menu is open.
- **Service grid** — 3 → 2 → 1 columns; at two columns the last card spans the
  row so no breakpoint leaves a hole. Cards are equal-height with headings on a
  shared baseline and the tag row pinned to the card floor via `margin-top:auto`.
  One card is inverted to `--acid`.
- **Rail** — horizontal scroll-snap with `scroll-padding-inline` matched to the
  content gutter, so the first card aligns to the headline above it.
- **Plan builder** — one radio-style base plan, multi-select add-ons, and a
  billing toggle. All totals derive from `data-price` attributes; the quote bar
  and the contact form's plan field are both rendered from one `render()` pass.
- **Accordion** — native `<details>`, custom `+`/`×` marker rotated 135°.

## Accessibility

Urdu is marked `lang="ur" dir="rtl"` on the text itself rather than its
container, so the block stays on the footer's left grid while the script still
shapes and orders right-to-left.

Skip link, visible `:focus-visible` ring in `--acid`, `aria-pressed` on add-ons,
`role="radiogroup"` on plans, `role="status"` on form feedback, and a labelled
scrollable region for the case rail.
