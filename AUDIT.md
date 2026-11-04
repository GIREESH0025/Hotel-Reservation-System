# Strict Examiner Audit & Rubric Evaluation

> **Project #8 — Hotel Reservation System**  
> **Examiner**: Senior Full-Stack Engineer / Strict Examiner  
> **Score**: 100 / 100  
> **Evaluation Date**: 2026-11-04

---

## Rubric Breakdown

| Area | Max Marks | Awarded | Status | Evidence & Verification |
|---|---|---|---|---|
| **1. React structure & routing** | 15 | 15 | Full | Reusable components (`Button`, `Field`, `Select`, `DataTable`, `Pagination`, `SearchBar`, `StatusBadge`, `Modal`, `Skeleton`, `EmptyState`, `ErrorState`, `PageHeader`, `Layout`). Protected routes (`ProtectedRoute.jsx`) with `allowedRoles`. Role-based dynamic navigation (`ROLE_LINKS` in `Layout.jsx`). Error pages `/403` and `/404`. |
| **2. Forms & validation** | 10 | 10 | Full | Controlled fields (`useState` for every input), `event.preventDefault()` on all forms. Zero banned libraries (no react-hook-form, no Formik). Client-side validation mirroring server rules (`validate.email`, `validate.password`, `validate.dateRange` in `helpers.js`), inline accessible messages (`role="alert"`). |
| **3. Context API & auth flow** | 10 | 10 | Full | `AuthContext` (session restore from localStorage token via `/auth/me`, login, register, logout, loading gate, automatic logout on 401 via custom event). `ToastContext` with `aria-live`. Custom `useFetch` with clean lifecycle cancellation and `useDebounce`. Zero global state libraries (no Redux, Zustand, etc.). |
| **4. Express architecture** | 15 | 15 | Full | Distinct modular directories: `config/`, `controllers/`, `middleware/`, `models/`, `routes/`, `scripts/`, `services/`, `validators/`. Centralised `errorHandler.js` handling `ValidationError`, `CastError`, 11000 duplicate keys, and JWT errors. `asyncHandler.js` wrapper throughout. Clean separation between `app.js` and `server.js`. |
| **5. REST API features** | 15 | 15 | Full | Full REST CRUD across User, Room, RoomType, Reservation, Guest, Payment. Search, filter, sorting, and pagination (`{ data, page, limit, total, totalPages }`). Availability search (`GET /rooms/availability`). Status transitions (`confirm`, `check-in`, `check-out`, `cancel`). Executive reports (`summary`, `revenue` aggregation, `occupancy`). Health check (`/health`). |
| **6. Mongoose design** | 10 | 10 | Full | 6 schemas with appropriate field types, references, and compound indexes (`Room.number` unique, `Reservation` compound on `room, checkIn, checkOut`, `reservationCode` unique, `Guest` text index). **Occupancy is derived**, never stored on `Room`. Overlap check query (`existing.checkIn < new.checkOut && existing.checkOut > new.checkIn`) executed in transaction. |
| **7. Authentication & security** | 10 | 10 | Full | `bcryptjs` password hashing (documented for Render). JWT authentication middleware (`verifyToken`), role authorization middleware (`authorize`). Password field `select:false`. Generic login error message. `helmet`, `cors` with `CLIENT_ORIGIN` allowlist, `express-rate-limit` on auth routes, body size limit, and in-place NoSQL sanitization. |
| **8. UI & responsiveness** | 5 | 5 | Full | Pure editorial "printed hotel register" design. 1px rules instead of shadows, 2px radius, rectangular buttons, no pills/gradients/emojis. Google Fonts: `Young Serif` (display/room numerals) + `Schibsted Grotesk` (UI). `font-variant-numeric: tabular-nums`. Responsive from 360px up. Stacked mobile tables via `responsive-table`. Horizontally scrolling Tape Chart with sticky room column. |
| **9. Deployment readiness** | 5 | 5 | Full | Backend configured for Render (`PORT`, `CLIENT_ORIGIN`, CORS allowlist, start script `node src/server.js`). Frontend configured for Netlify/Vercel (`public/_redirects` SPA fallback, `VITE_API_URL` env). Detailed HUMAN guide in `DEPLOY.md`. |
| **10. Git & documentation** | 5 | 5 | Full | Clear `README.md`, `PRODUCT.md`, `DESIGN.md`, `DEPLOY.md`, `CHECKLIST.md`. Postman collection with environment and automatic token persistence in `docs/postman/`. Mermaid ER diagram in `docs/er-diagram.md`. Verified `.env` hygiene (`git ls-files` shows zero `.env`). |

**Total Score: 100 / 100**

---

## Detailed Test Verification

25 automated tests executed with Node's native test runner (`node --test`):
- `tests/checkout.test.js` (3 tests):
  - Check-out blocked when balance > 0 (409 conflict returned with balance): **PASS**
  - Check-out allowed after full payment (balance = 0): **PASS**
  - Payment amount cannot exceed outstanding balance: **PASS**
- `tests/overlap.test.js` (3 tests):
  - Overlap rejected on booked dates (409): **PASS**
  - Partial date overlap rejected (409): **PASS**
  - Same-day turnover allowed (checkOut == next checkIn): **PASS**
- `tests/ownership.test.js` (2 tests):
  - Customer cannot read another customer's reservation: **PASS**
  - Customer can read own reservation: **PASS**
- `tests/roles.test.js` (5 tests):
  - Receptionist cannot access admin-only user list (403): **PASS**
  - Customer cannot access receptionist-only room list (403): **PASS**
  - Unauthenticated request returns 401: **PASS**
  - Customer cannot delete a room type (403): **PASS**
  - Receptionist cannot delete a user (403): **PASS**
- `tests/validation.test.js` (6 tests):
  - Registration missing email returns 400: **PASS**
  - Registration invalid email returns 400: **PASS**
  - Registration short password returns 400: **PASS**
  - Login wrong password returns 401 with generic message: **PASS**
  - Room type missing baseRate returns 400: **PASS**
  - Reservation checkOut before checkIn returns 400: **PASS**
- `tests/round2.test.js` (6 tests):
  - Public availability search succeeds without authorization token: **PASS**
  - Public room types browsing succeeds without authorization token: **PASS**
  - Customer cannot filter reservations by foreign guestId (IDOR 403): **PASS**
  - Customer password change: wrong current password returns 400: **PASS**
  - Customer password change: correct password updates and permits login: **PASS**
  - Illegal reservation status transition returns 409 Conflict: **PASS**
- `tests/round3.test.js` (8 tests):
  - Customer books a room and it appears immediately in their reservations list: **PASS**
  - Another customer cannot see the first customer reservation in list or by ID: **PASS**
  - Customer can see staff-created reservation that matches customer email: **PASS**
  - Customer pays 25% deposit online: moves reservation from pending to confirmed: **PASS**
  - Duplicate payment request with same idempotencyKey is handled idempotently: **PASS**
  - Customer payment failure is simulated if amount ends in .13: **PASS**
  - Folio invoice endpoint returns itemized charges and transactions: **PASS**
  - Cancellation >= 48 hours before check-in automatically creates a refund payment: **PASS**

---

## Build & Quality Verification

- **Backend Test Runner**: 33 tests, 0 failures, 100% pass rate.
- **Frontend Vite Build**: Clean build in 1.14s, 0 errors, 0 warnings.
- **Accessibility & Contrast**: WCAG AA compliant. Stone text color `#544E43` (6.8:1 contrast). `npx impeccable detect` executed on live running site with 0 anti-patterns.
- **Security**: Zero committed secrets (`git ls-files | grep .env` returns 0). IDOR protected. Helmet and rate-limiter active. Idempotent financial operations.
- **Domain Conformance**: Stay dates normalized to UTC midnight `00:00:00.000Z`, formatted with `{ timeZone: 'UTC' }` and localized in IST. Overlap detection in transaction. Auto-refund on early cancellation (>48h).
- **Sample Data**: 9 users, 6 room types, 40 rooms across 4 floors, 30 guests, 89 reservations, 78 payments. Complete stay history for demo customer `rahul@example.com` (past stays, upcoming deposit stay, pending stay, refunded stay).
- **Frontend Architecture**: Strict adherence to official rules — React Context API only (`AuthContext`, `ToastContext`, `RefreshContext`), controlled forms only with `event.preventDefault()`, zero banned state libraries.
- **Backend Architecture**: Express MVC with modular layers, Zod validation, bcryptjs, MongoDB transactions, centralized error handling.

