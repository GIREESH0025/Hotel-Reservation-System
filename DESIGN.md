# DESIGN.md — Harbour Row Hotel Design System (Modern Travel Marketplace)

## 1. Visual Direction & Identity

This design direction replaces the previous printed register aesthetic with a **modern travel marketplace design system**, modeled after premier hotel booking platforms while remaining authentic to our single-property identity:
- **Audience**: Discerning travelers booking on mobile and desktop, plus front-desk staff operating high-velocity operational desks.
- **Tone**: Clear, trustworthy, fast. Direct without being cold, never high-pressure or gimmicky.
- **Honesty First**: Never invent fake urgency (no countdown timers, no "X people viewing"), no fabricated reviews or ratings, no invented awards. Our brand is the configured hotel name and authentic room categories.

---

## 2. Design Tokens (CSS Custom Properties)

```css
:root {
  /* Brand & Action Palette */
  --color-primary:      #D63941;  /* vibrant red primary CTA */
  --color-primary-dark: #B92D35;  /* hover/active state */
  --color-primary-tint: #FBE4E6;  /* subtle badge / stepper tint */
  --color-hero-start:   #6E1426;  /* maroon gradient start */
  --color-hero-end:     #B3263A;  /* maroon gradient end */

  /* Neutral Surfaces & Ink */
  --color-canvas:       #F3F3F8;  /* page background / canvas */
  --color-surface:      #FFFFFF;  /* cards, modals, sheets */
  --color-ink:          #1F1F1F;  /* primary typography */
  --color-muted:        #6B6B75;  /* secondary / helper text */
  --color-line:         #E3E3EA;  /* borders, dividers */
  --color-range-dark:   #2E2E2E;  /* selected calendar range band */

  /* Semantic Feedback */
  --color-success:      #1A7F37;  /* discounts, confirmed, paid */
  --color-warning:      #B7791F;  /* pending actions, notices */
  --color-error:        #C62828;  /* validation errors, declines */

  /* Typography */
  --font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, sans-serif;
  --font-numeric: 'Inter', system-ui, sans-serif;
  font-variant-numeric: tabular-nums;

  /* Type Scale */
  --text-xs:   0.75rem;     /* 12px */
  --text-sm:   0.875rem;    /* 14px */
  --text-base: 1rem;        /* 16px */
  --text-lg:   1.25rem;     /* 20px */
  --text-xl:   1.5rem;      /* 24px */
  --text-2xl:  2rem;        /* 32px */

  /* Border Radii */
  --radius-sm:   4px;
  --radius-md:   8px;
  --radius-lg:   12px;
  --radius-pill: 9999px;

  /* Shadows */
  --shadow-sm:   0 1px 3px rgba(0, 0, 0, 0.05);
  --shadow-card: 0 2px 12px rgba(0, 0, 0, 0.08);
  --shadow-popover: 0 8px 30px rgba(0, 0, 0, 0.12);

  /* Touch & Hit Targets */
  --touch-target: 44px;

  /* Motion */
  --transition: 150ms cubic-bezier(0.16, 1, 0.3, 1);
}
```

---

## 3. Core Component Patterns

### 3.1 Search Bar (Hero & Sticky Compact)
- **Hero Search Bar**: Elevated pill/rounded container overlapping the maroon hero band. 4 structured cells:
  1. Room Type Selector (search icon + "All room types" or category name)
  2. Date Range ("Check in" date > live nights count > "Check out" date)
  3. Occupancy ("No. of rooms & guests" · "1 Room · 2 Adults")
  4. Red pill CTA button ("Search hotels")
- **Sticky Results Search Bar**: Compact horizontal bar anchored to the top of `/search` and `/rooms/:id` with quick-edit popovers.

### 3.2 DateRangePicker Popover
- Dual-month side-by-side desktop calendar (single month on mobile).
- Mon to Sun layout; past dates disabled and muted.
- Weekend dates (Sat, Sun) highlighted in red (`#D63941`).
- Selected range rendered as a continuous dark charcoal band (`#2E2E2E`) with rounded caps on check-in and check-out.
- Live "N Nights" counter between cells. Max 30 nights window.
- Fully keyboard-accessible (arrows navigate days, Enter selects, Esc dismisses).

### 3.3 GuestSelector Popover
- "Select no. of rooms & guests".
- Rooms stepper: 1 to 3 rooms.
- Adults stepper: minimum 1 per room.
- Children stepper: 0 to 17 years with "+ Add" button dynamically inserting an age selector per child and a remove button.
- Live occupancy validation against room type capacity; Done button closes popover.

### 3.4 3-Step Checkout Stepper Pill
- Step pill floating centered at the top of the header during `/book`:
  - `(1) Details`
  - `(2) Traveller Info`
  - `(3) Pay`
- Completed steps display a green circle with checkmark and are clickable to navigate backward.
- Active step highlighted with dark pill and white text.

### 3.5 Sticky Fare Breakup & Summary Card
- Right-column desktop card anchoring checkout and room detail pages.
- Includes room photography, hotel name, check-in/out times, night count, rate plan, and live server-calculated fare breakdown:
  - Base Fare
  - Breakfast (if selected)
  - Taxes & Fees
  - Total Discount (in green)
  - **Total Payable** (prominent)
- Free cancellation deadline reminder.
- Coupon accordion with real-time validation via the quote endpoint.

### 3.6 Back Confirmation Modal
- Dialog confirming exit when navigating away from checkout:
  - "You are about to book your stay, do you really want to go back?"
  - Secondary button: "Go back"
  - Primary red button: "Stay"

---

## 4. Accessibility & Layout
- Mobile-first responsive grids tested across 360px, 768px, and 1440px.
- Minimum touch target: 44px on all interactive controls.
- Contrast compliant with WCAG AA on all text and states.
- Respects `prefers-reduced-motion: reduce`.
