# Harbour Row Hotel Reservation System

> **Project #8 — MERN Stack | Modern Travel Marketplace Hotel Reservation System**

A production-grade hotel reservation and property management platform built on the MERN stack with role-based access (Admin, Receptionist, Customer), atomic overlap-prevention booking, server-authoritative pricing engine with GST slabs and coupon validation, dual-month range picker, multi-room booking (1-3 rooms), and a 3-step checkout wizard.

---

## Key Capabilities & User Journeys

### Travel Marketplace Guest Experience (Public & Customer)
- **Deep Maroon Hero & 4-Cell Search Bar**:
  - Accommodation Category selector
  - Dual-Month `DateRangePicker` with dark continuous range band (`#2E2E2E`), red weekends (`#D63941`), and live nights counter
  - `GuestSelector` popover with 1-3 room steppers, adult counts, and individual child age selectors
  - Red pill "Search rooms" CTA
- **Editorial Boutique Hero & Verified Tariffs**:
  - Direct, honest booking rates without hidden fees or fake coupon traps
- **Faceted Search Results (`/search`)**:
  - Sticky compact SearchBar
  - Left Filter Sidebar (price range dual slider, bed type checkboxes, meal plans, amenities, free cancellation toggle)
  - Sorting: Recommended, Price (Low to High / High to Low), Capacity
  - Real inventory indicators: Honest "Only N left!" when available rooms $\le 3$
- **Room Category Detail Page (`/rooms/:id`)**:
  - 5-Photo Mosaic Gallery with full-screen Lightbox modal
  - Sticky Tab Bar with scroll-spy (`Overview`, `Rate Plans`, `Facilities`, `Policies`, `Location`)
  - Rate Plans: "Room Only" vs "With Gourmet Breakfast"
  - Sticky live server quote sidebar
- **3-Step Checkout Wizard (`/book`)**:
  - Step 1: Stay Details Review & Inclusions
  - Step 2: Traveller Information (Myself/Someone else, +91 phone, arrival window, special requests)
  - Step 3: Payment & Settlement (UPI QR, Credit/Debit card demo, Netbanking, Pay at Hotel, or 25% Deposit)
  - Back confirmation modal (`BackConfirmModal`) preventing accidental cart exits
  - Persistent booking draft stored via `BookingContext` (`sessionStorage`)
- **Post-Booking Experience**:
  - Success screen at `/booking/:id/success` with one-click `.ics` Calendar Download
  - Customer bookings management (`/my/bookings`) with Upcoming, Past, and Cancelled tabs
  - Printable Folio Statement & Tax Invoice (`/my/bookings/:id`)
  - 48-Hour Free Cancellation guarantee with automatic refund recording

### Operations & Staff Portals (Receptionist & Admin)
- **Interactive Tape Chart (`/staff/chart`)**:
  - 14-day visual room matrix
  - Multi-room reservations draw an occupancy bar across each assigned room's row
  - Click any empty cell to book; click any reserved bar to inspect the folio
- **Front Desk Dashboard (`/staff/dashboard`)**:
  - Today's arrivals, departures, occupied rooms, and pending payments
- **Guest Ledger (`/staff/guests`) & Folio Payments (`/staff/payments`)**:
  - Record desk payments (Cash, Card, UPI), process authorized refunds, and track balances
- **Admin Management (`/admin/*`)**:
  - Rooms, Room Types, Users management, and Revenue / Occupancy analytics aggregations

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite + react-router-dom v6 |
| State | React Context API (AuthContext, ToastContext) |
| HTTP client | Axios with request/response interceptors |
| Backend | Node.js + Express |
| Database | MongoDB + Mongoose (hosted on Atlas) |
| Auth | JWT + bcryptjs (bcryptjs used to avoid native build issues on Render) |
| Validation | Zod (backend) + custom controlled forms (frontend) |
| Security | helmet, cors, express-rate-limit, express-mongo-sanitize |
| Deployment | Render (backend) + Netlify (frontend) |

---

## Folder Structure

```
Hotel Reservation System/
├── backend/
│   ├── src/
│   │   ├── config/        db.js, env.js
│   │   ├── controllers/   auth, user, roomType, room, guest, reservation, payment, report
│   │   ├── middleware/     auth.js, authorize.js, validate.js, errorHandler.js, notFound.js, asyncHandler.js
│   │   ├── models/        User, RoomType, Room, Guest, Reservation, Payment
│   │   ├── routes/        auth, user, roomType, room, guest, reservation, payment, report
│   │   ├── scripts/       seed.js
│   │   ├── services/      reservation.service.js (overlap detection, check-in/out)
│   │   ├── utils/         rateLimiter.js
│   │   ├── validators/    Zod schemas for all resources
│   │   ├── app.js         Express app (middleware + routes)
│   │   └── server.js      HTTP server entry point
│   ├── tests/             overlap, roles, ownership, validation, checkout tests
│   ├── .env.example
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/           axios instance + one module per resource
│   │   ├── components/ui/ Button, Field, Select, DataTable, Pagination, SearchBar,
│   │   │                  StatusBadge, Modal, Skeleton, EmptyState, ErrorState,
│   │   │                  PageHeader, Layout
│   │   ├── context/       AuthContext.jsx, ToastContext.jsx
│   │   ├── hooks/         useFetch.js, useDebounce.js
│   │   ├── pages/         All 20+ screens
│   │   ├── routes/        ProtectedRoute.jsx
│   │   ├── utils/         helpers.js (formatINR, formatDate, validate, statusColor)
│   │   ├── App.jsx        Router + all routes
│   │   ├── index.css      Design tokens + global styles
│   │   └── main.jsx       Entry point
│   ├── public/_redirects  Netlify SPA fallback
│   ├── .env.example
│   └── package.json
├── docs/
│   ├── postman/           Postman collection + environment
│   ├── er-diagram.md      ER diagram (Mermaid)
│   └── design-review.md   Impeccable design review output
├── CHECKLIST.md
├── PRODUCT.md
├── DESIGN.md
├── DEPLOY.md
├── AUDIT.md
└── README.md
```

---

## Setup — Local Development

### Prerequisites
- Node.js 18+ 
- A MongoDB Atlas account (free tier works)

### Backend

```bash
cd backend
cp .env.example .env
# Fill in MONGODB_URI, JWT_SECRET, CLIENT_ORIGIN
npm install
npm run dev        # starts on http://localhost:5000
```

### Seed the database

```bash
cd backend
node src/scripts/seed.js
```

### Frontend

```bash
cd frontend
cp .env.example .env
# Set VITE_API_URL=http://localhost:5000/api/v1
npm install
npm run dev        # starts on http://localhost:5173
```

---

## Environment Variables

### backend/.env

| Variable | Description | Example |
|---|---|---|
| `MONGODB_URI` | MongoDB Atlas connection string | `mongodb+srv://user:pass@cluster.mongodb.net/hotel_reservation` |
| `JWT_SECRET` | JWT signing secret (min 64 chars) | `a_very_long_random_secret_string` |
| `JWT_EXPIRES_IN` | JWT expiry | `7d` |
| `PORT` | Server port | `5000` |
| `NODE_ENV` | Environment | `development` |
| `CLIENT_ORIGIN` | Frontend URL for CORS allowlist | `http://localhost:5173` |
| `AUTH_RATE_LIMIT` | Max auth requests per 15 min per IP | `20` |

### frontend/.env

| Variable | Description | Example |
|---|---|---|
| `VITE_API_URL` | Backend API base URL | `http://localhost:5000/api/v1` |
| `VITE_BRAND_NAME` | Hotel name text wordmark | `Harbour Row Hotel` |

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@harbourrow.com | Admin@1234 |
| Receptionist | priya@harbourrow.com | Staff@1234 |
| Customer | rahul@example.com | Guest@1234 |

---

## Available Scripts

### Backend

```bash
npm run dev         # Development with nodemon
npm start           # Production start
npm test            # Run automated test suite (40/40 passing)
npm run seed        # Seed database with rich sample data (90 reservations)
npm run seed:reset  # Idempotently reset and recreate sample data
npm run fix:link-bookings # Idempotent guest-customer link repair (--apply to persist)
```

### Frontend

```bash
npm run dev      # Development Vite server (port 5173)
npm run build    # Production build (optimized Vite bundle)
npm run preview  # Preview production build locally
```

---

## API Summary

**Base URL**: `/api/v1`

| Method | Route | Description | Roles |
|---|---|---|---|
| POST | /auth/register | Register (creates Customer + Guest record) | Public |
| POST | /auth/login | Login (returns JWT) | Public |
| POST | /auth/logout | Logout (stateless client clearance) | Public |
| GET | /auth/me | Current user profile | Auth |
| GET | /users | List users (paginated, role filter) | Admin |
| GET | /users/:id | User detail | Admin, Receptionist, Customer (own) |
| PATCH | /users/:id | Update user details / role | Admin, Customer (own) |
| PATCH | /users/change-password | Change authenticated user password | Auth (Self) |
| DELETE | /users/:id | Delete user | Admin |
| GET | /room-types | List room types (public gallery) | Public |
| GET | /room-types/:id | Room type detail | Public |
| POST | /room-types | Create room type | Admin |
| PATCH | /room-types/:id | Update room type | Admin |
| DELETE | /room-types/:id | Delete room type | Admin |
| GET | /rooms/availability | Search available chambers | Public |
| GET | /rooms | List rooms | Admin, Receptionist |
| POST | /rooms | Create room | Admin |
| PATCH | /rooms/:id | Update room (maintenance toggle) | Admin, Receptionist |
| DELETE | /rooms/:id | Delete room | Admin |
| GET | /guests | List guests | Admin, Receptionist, Customer (own) |
| GET | /guests/:id | Guest detail | Admin, Receptionist, Customer (own) |
| POST | /guests | Create guest | Admin, Receptionist |
| PATCH | /guests/:id | Update guest | Admin, Receptionist |
| DELETE | /guests/:id | Delete guest | Admin |
| GET | /reservations | List reservations (paginated, filters) | All (Customer: own only) |
| GET | /reservations/:id | Reservation detail + computed folio balance | All (Customer: own only) |
| GET | /reservations/:id/invoice | Printable tax folio invoice (itemized charges & balance) | All (Customer: own only) |
| POST | /reservations | Create reservation (overlap guarded in tx) | All |
| POST | /reservations/:id/pay | Online booking payment (deposit, balance, full) | All (Customer: own only) |
| PATCH | /reservations/:id | Modify reservation chamber / dates | Admin, Receptionist |
| PATCH | /reservations/:id/confirm | Confirm pending reservation | Admin, Receptionist |
| PATCH | /reservations/:id/check-in | Check guest in | Admin, Receptionist |
| PATCH | /reservations/:id/check-out | Check guest out (blocked if balance > 0) | Admin, Receptionist |
| PATCH | /reservations/:id/cancel | Cancel reservation (releases dates, auto-refunds if >48h) | All (Customer: own pending/confirmed) |
| DELETE | /reservations/:id | Delete reservation record | Admin |
| GET | /payments | List payments (paginated, filters) | Admin, Receptionist, Customer (own) |
| GET | /payments/:id | Payment receipt detail | Admin, Receptionist, Customer (own) |
| POST | /payments | Record guest payment (card, upi, cash, demo_online) | Admin, Receptionist |
| POST / PATCH | /payments/:id/refund | Refund payment (admin audited) | Admin |
| GET | /reports/summary | Today operational register summary | Admin, Receptionist |
| GET | /reports/revenue | Revenue ledger by period | Admin |
| GET | /reports/occupancy | Occupancy percentages by chamber type | Admin |
| GET | /health | Health check | Public |

**List endpoints** support: `page`, `limit`, `sort`, `search`, and resource-specific filters.  
**Response format**: `{ success, data, page, limit, total, totalPages }` for lists; `{ success, data }` for singles; `{ success, message, errors[] }` for errors.

---

## ER Diagram

See [docs/er-diagram.md](docs/er-diagram.md) for the full Mermaid diagram.

```
User ──(1:1)── Guest (optional link for customer accounts)
Guest ──(1:N)── Reservation
Room ──(1:N)── Reservation  
RoomType ──(1:N)── Room
Reservation ──(1:N)── Payment
User ──(createdBy 1:N)── Reservation
User ──(receivedBy 1:N)── Payment
```

---

## Deployment

See [DEPLOY.md](DEPLOY.md) for step-by-step instructions.

- **Backend**: Render (root dir: `backend`, build: `npm install`, start: `node src/server.js`)
- **Frontend**: Netlify (base: `frontend`, build: `npm run build`, publish: `dist`, SPA redirect via `public/_redirects`)

> **bcryptjs note**: This project uses `bcryptjs` (pure JavaScript) instead of `bcrypt` (native C++ bindings) to avoid compilation issues on Render's free tier build environment.

---

## Known Limitations

- Render free tier services sleep after 15 minutes of inactivity (first request may take 30-60 seconds)
- Atlas free tier (M0) has no session support — Mongoose transactions require a replica set, which Atlas provides even on free tier
- No email notifications for booking confirmation
- No file upload for idProof (stored as text string)
- Currency is INR only
- No multi-currency support

---

## Design

See [DESIGN.md](DESIGN.md) for the full design system documentation.  
Direction: Modern travel marketplace — clean Inter typography, bold red CTAs (`#D63941`), structured search bar, responsive layout, and dedicated account navigation.

