# DESIGN.md — Harbour Row Hotel Design System

## 1. Generic defaults I am deliberately avoiding

Before writing any UI code, I listed the defaults I would reach for by habit — and rejected each:

| Default I would normally reach for | Why it is wrong here |
|---|---|
| Inter font everywhere | Generic; every SaaS uses it; loses the editorial register |
| Purple/blue gradient headers | Looks like a fintech dashboard, not a hotel register |
| Cards inside cards (nested box shadows) | Adds visual noise; a hotel ledger uses ruled lines |
| Gray text on colored backgrounds (low-contrast badges) | Accessibility risk; opaque, not specific |
| Centered hero with two buttons + icon tiles | The home page IS the search; no marketing content needed |
| Font Awesome icon tiles above section headings | Decoration without function; banned |
| Rounded corners everywhere (8-12px radius) | Looks soft and consumer; we want precise and editorial |
| Box shadows for depth | Use 1px rules instead |
| Modal overlays with blur/glass effects | Distracting; use bordered panels |

## 2. Confirmed design direction

The visual world is a **printed hotel register**: black ink on cream paper, ruled horizontal lines, serif numerals for room numbers, grotesk type for all operational UI. Think a well-maintained guestbook, not a booking app.

## 3. Design rationale

**Why this world:** A hotel reservation system is fundamentally a ledger. The visual language of printed registers — ruled lines, tabular numerals, strong type hierarchy, no decoration — reinforces reliability and precision, which is exactly what hotel staff and guests need. It is also genuinely distinctive against every SaaS competitor.

**Why Young Serif + Schibsted Grotesk:** Young Serif has the warmth and legibility of a classic hotel's letterhead without the pretension of display-only luxury serifs. Schibsted Grotesk is a humanist sans with strong legibility at small sizes, appropriate for dense operational tables. The combination reads as "established but accessible."

**Why laterite as the action colour:** Laterite (#A4442A, a warm brick red) is functional, specific, and rare enough to signal action without competing with status colours. It is used only for primary interactive elements — never for decoration.

## 4. Design tokens (CSS custom properties)

```css
/* Defined in frontend/src/index.css */
:root {
  /* Palette */
  --color-paper:    #F3EEE4;  /* page background */
  --color-ink:      #1C1B18;  /* primary text */
  --color-rule:     #D9D1C0;  /* borders, separators */
  --color-laterite: #A4442A;  /* primary action only */
  --color-moss:     #3F5E4A;  /* confirmed status */
  --color-ochre:    #B0822A;  /* pending status */
  --color-slate:    #2F4858;  /* checked-in status */
  --color-stone:    #8A8173;  /* cancelled / no-show / muted text */
  --color-error:    #B42318;  /* errors */

  /* Typography */
  --font-display: 'Young Serif', Georgia, serif;
  --font-ui:      'Schibsted Grotesk', system-ui, sans-serif;
  --font-mono:    'Courier New', monospace;

  /* Numeric rendering */
  --font-numeric: 'Schibsted Grotesk', system-ui, sans-serif;
  font-variant-numeric: tabular-nums;

  /* Spacing scale (8px base) */
  --space-1:  4px;
  --space-2:  8px;
  --space-3: 12px;
  --space-4: 16px;
  --space-5: 20px;
  --space-6: 24px;
  --space-8: 32px;
  --space-10: 40px;
  --space-12: 48px;
  --space-16: 64px;

  /* Layout */
  --max-width: 1200px;
  --sidebar-width: 220px;

  /* Border */
  --border: 1px solid var(--color-rule);
  --radius: 2px;
  --radius-sm: 1px;

  /* Motion (honour prefers-reduced-motion) */
  --transition: 150ms ease;
}

@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    transition-duration: 0ms !important;
    animation-duration: 0ms !important;
  }
}
```

## 5. Status colour map

| Status | Token | Hex | Usage |
|---|---|---|---|
| confirmed | moss | #3F5E4A | Background tint + text |
| pending | ochre | #B0822A | Background tint + text |
| checked_in | slate | #2F4858 | Background tint + text |
| checked_out | ink | #1C1B18 | Muted |
| cancelled | stone | #8A8173 | Muted |
| no_show | stone | #8A8173 | Muted |

## 6. Component rules

- **Buttons:** rectangular (border-radius: 2px), no pills. Primary = laterite background + paper text. Secondary = paper background + ink border. Ghost = no border, ink text. Danger = error background.
- **Inputs:** 1px rule bottom only on focus (not full border box). Clear visible label above, never placeholder-only.
- **Tables:** 1px horizontal rules between rows; no vertical lines. Header in Schibsted Grotesk caps tracking. Numbers right-aligned with tabular-nums.
- **Badges:** small inline element, 2px radius, slightly tinted background + same-hue text.
- **Room numbers:** large Young Serif numerals (2.5rem+) in place of photos.

## 7. Memorable elements

### Tape Chart
A horizontal scrolling grid: rooms on the Y axis, the next 14 days on the X axis. Each reservation is a coloured bar spanning its nights (colour = status). Click a bar to open the reservation. Click an empty cell to start a new booking. The room name column is sticky. Uses CSS Grid with explicit column widths.

### Folio View
A reservation's financial detail view resembling a printed bill: each charge/payment on its own line, label left-aligned, amount right-aligned, connected by a dotted leader. A solid rule separates items from the total. Balance shown prominently — zero means ready to check out.

## 8. Responsive strategy

- Mobile-first CSS; breakpoints at 640px (sm), 768px (md), 1024px (lg), 1280px (xl)
- Staff tables collapse to stacked rows at < 768px (each row becomes a mini-card using data-label attributes)
- Tape chart: horizontal scroll with sticky first column; touch-scroll enabled
- Navigation: hamburger menu below 768px
- Target: fully usable at 360px viewport width

## 9. Copy principles

- Write what happened: "Booking RES-20240115-X9K2 not found" not "Something went wrong"
- Write what to do: "Check the reservation code and try again" not "Please try again later"
- No marketing words: seamless, powerful, effortless, unlock, elevate, transform
- No emoji in UI copy (icons are functional only)
- Currency: always INR, always formatted with Intl.NumberFormat en-IN

