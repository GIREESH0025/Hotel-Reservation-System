# PRODUCT.md — Harbour Row Hotel Reservation System (Travel Marketplace Experience)

## 1. Audience

**Primary:** Hotel guests booking rooms on smartphones and desktop computers. They expect the visual speed, clarity, and familiarity of top-tier travel platforms — interactive date range pickers, room/guest popovers, faceted filters, room detail tabs, 3-step checkout, and clear fare breakdowns. Trust, transparent pricing, and effortless checkout drive conversion.

**Secondary:** Front-desk receptionists and management staff working quickly on shared desktop terminals. They require instant visibility over tape charts, check-in/out status, desk payments, and room availability without cognitive friction under pressure.

---

## 2. Purpose & Principles

A high-performance, single-property hotel reservation platform combining the polished user experience of modern booking marketplaces with strict transactional integrity:
- **Zero Double-Bookings**: Atomic MongoDB transactions enforce date overlap prevention across every assigned room in a reservation.
- **Server-Authoritative Pricing**: Total amounts, taxes, discounts, breakfast surcharges, and deposit requirements are calculated exclusively on the server (`POST /api/v1/reservations/quote`). Client totals are never trusted.
- **Authentic & Honest**: No artificial urgency counters, fake view counts, or fabricated user reviews. The brand is the configured hotel property and its real room inventory.
- **Multi-Room Booking**: Guests can reserve 1 to 3 rooms of a room category in a single transaction with per-room adult and child occupancy tracking.

---

## 3. Tone of Voice

**Clear. Trustworthy. Fast.**
- Concise, polite, and direct copy.
- No jargon, no high-pressure sales rhetoric.
- Error messages explicitly explain what happened and offer an immediate resolution path.
- Transparent communication: "Booking details are saved in My bookings" (no false promises of automated transactional emails).

---

## 4. Key Workflows

### 4.1 Discovery & Search
- **Home**: Deep maroon hero header featuring an overlapping 4-cell search bar (Room category selector | Check-in / Check-out dual-calendar | Rooms & Guests selector with child ages | Red search CTA).
- **Offers**: Curated real coupons configured in `hotel.config.js` with instant one-click copy.
- **Rooms Showcase**: Real-time room type cards with authentic photography and starting rates.

### 4.2 Search Results & Filtering (`/search`)
- Sticky compact search bar with quick-edit popovers.
- Left-hand faceted filter sidebar (desktop) and mobile bottom sheet:
  - Price range slider with numeric inputs
  - Room type checkboxes
  - Bed type filter
  - Meal plan (Room only / With breakfast)
  - Free cancellation toggle
  - Pay at hotel toggle
  - Amenities checklist
- Dynamic sorting: Recommended, Price (low to high), Price (high to low), Capacity.
- Real-time remaining room indicators ("Only 2 left") shown strictly when inventory is $\le 3$.

### 4.3 Room Type Details (`/rooms/:id`)
- 5-photo grid (1 primary + 4 thumbnail gallery) with full-screen Lightbox.
- Quick facts row (room size in sq m, bed configuration, maximum occupancy).
- Sticky tab navigation with scroll-spy: Overview, Rooms, Facilities, Policies, Location.
- Rate plan comparison: "Room only" vs "With breakfast" with clear cancellation terms.
- Sticky fare card with live quote preview and alternative date recommendations if unavailable.

### 4.4 3-Step Checkout Journey (`/book`)
- **Step 1: Details**: Review selected stay parameters, rate plans, and cancellation terms.
- **Step 2: Traveller Info**: Guest details ("Myself" vs "Someone else"), phone verification, special requests counter, arrival window, and optional companion names.
- **Step 3: Pay**:
  - Payment choices: Pay full now, Pay 25% deposit, or Pay at hotel.
  - Demo payment options: UPI (QR code simulation), Credit/Debit Card, Netbanking.
  - Transparent "Demo mode: no real money charged" security banner.
  - Atomic transaction: availability re-check, room assignment, quote recalculation, payment recording.
- **Back Exit Confirmation**: Intercepts accidental exits with a reassuring modal.

### 4.5 Post-Booking & Management
- **Success Page**: Reservation code, stay summary, .ics calendar export, printable tax folio invoice.
- **My Bookings (`/my/bookings`)**: Instant display of new reservations across Upcoming, Past, and Cancelled tabs.
- **Folio & Online Balance Settlement**: Detailed charge ledger and ability to settle balances online.
- **Staff Tape Chart & Operations**: Full multi-room visual representation across the 14-day tape chart and front desk register.
