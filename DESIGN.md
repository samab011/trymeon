# SparkUP AI — Design System

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

Scale is fluid via `clamp()`. The hero headline now shares its row with the 3D
stage, so it is sized from its column rather than the viewport —
`clamp(28px, 4.3vw, 60px)` at `1` line-height, four lines that never wrap inside
a ~620px column. Section headings are `clamp(38px, 6.4vw, 84px)` at `.98`, and
the two full-bleed statements (final CTA, dialog title) run larger. Body is
17px / 1.55.

Italic accent words are chosen for meaning, one per heading: *grow*, *systems*,
*possible*, *live*, *Pakistan*, *partner*, *modern*, *next*.

## Brand mark

A four-pointed spark in `--acid` on an `--ink` rounded square, paired with the
wordmark set in Inter Tight — "SparkUP" in `--fg`, "AI" in `--acid`. The footer
signature repeats the wordmark as an outlined `-webkit-text-stroke` display
line, sized to hold on one line from 390px up.

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
- Depth is one system, not a per-section effect: a `perspective` on the
  container, `transform-style: preserve-3d` on the moving layer, and translation
  on Z. The hero stage, the problem flip, the industry wall and the tunnel all
  work this way, so they share a vanishing point in the reader's head.
- The hero orbit is trigonometric, not keyframed: three panels 120° apart on a
  ring whose radius is measured from the panel width, so the far side never
  leaves the stage on a narrow screen. Depth sets scale, opacity and z-index.
- Continuous scenes share one `requestAnimationFrame` loop and stop when their
  section leaves the viewport.
- Scroll-linked sections write a `0..1` progress value to `--p` and let CSS do
  the rest — the journey line's width, the tunnel's glow, the item states.
- Pointer effects are desktop-only: the cursor halo, magnetic buttons, card
  tilt and wall lean are all gated on a fine pointer.
- Every animation is disabled under `prefers-reduced-motion: reduce`. The orbit
  freezes at a readable position, both faces of each problem panel stack rather
  than flipping (a flip would hide half the content), the transcript shows in
  full, and the particle field renders one static frame.

## Components

- **Pill nav** — fixed, blurred, hides on scroll-down past 420px, unless the
  mobile menu is open.
- **Service card** — a two-column block that alternates side by side; the art
  column holds one live object (tilting browser, playing transcript, floating
  frames) rather than a screenshot.
- **Journey rail** — horizontal scroll-snap with `scroll-padding-inline` matched
  to the gutter, so the first card lines up with the headline above it. The
  progress line fills from the rail's own `scrollLeft`.
- **Industry tile** — the name holds the floor of the tile at all times and the
  three use cases fade into the space above it, so nothing the visitor was
  reading disappears on hover. Fixed height, so a hover never reflows the wall.
  On touch every use case is simply shown.
- **Booking dialog** — native `<dialog>`, backdrop-dismissed, focus returned to
  the control that opened it. It replaces the contact section entirely.

## Accessibility

Every decorative layer — the particle canvases, the hero stage, the grid floor,
the cursor halo — is `aria-hidden` and `pointer-events:none`; none of them
carries content.

Industry tiles are focusable, and the same rules drive `:hover` and
`:focus-within`, so the use cases are reachable from the keyboard. Skip link,
visible `:focus-visible` ring in `--acid`, `role="status"` on form feedback, a
labelled scrollable region for the journey rail, and a `<dialog>` that returns
focus to whichever control opened it.
