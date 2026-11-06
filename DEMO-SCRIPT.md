# Harbour Row Hotel — 3-Minute Video Demo Script

This script provides an exact click-by-click flow and voiceover transcript for recording the mandatory 2-to-3 minute project demonstration video required by the evaluation rubric.

---

## Video Outline & Time Allocation (Total: 3 minutes)

| Timestamp | Segment | Key Feature / Rubric Row Covered | Screen / URL |
|---|---|---|---|
| **0:00 – 0:25** | Intro & Architecture | Tech stack (React, Node, Express, MongoDB Atlas), responsive layout | Homepage `http://localhost:5173/` |
| **0:25 – 0:55** | Search & Discovery | Dual-month calendar, guest selector, faceted filters, live inventory | `/search` & `/rooms/:id` |
| **0:55 – 1:30** | Checkout & Payment | 3-step wizard, server quote, GST calculation, demo payment, .ICS | `/book` & `/booking/:id/success` |
| **1:30 – 1:55** | Customer Account | My Bookings, printable tax invoice folio, profile settings | `/my/bookings` & `/my/profile` |
| **1:55 – 2:30** | Staff Operations | Separate `/admin` portal, Front Desk Dashboard, 14-day Tape Chart | `/admin` & `/staff/dashboard` |
| **2:30 – 2:50** | Admin & Reports | Role RBAC, User management, Revenue & Occupancy reports | `/admin/reports` & `/admin/users` |
| **2:50 – 3:00** | Code & Submission | GitHub repo, test suite (40/40), Postman collection (27/27) | VS Code / Terminal |

---

## Detailed Click-Path & Voiceover Script

### Segment 1: Introduction & Architecture (0:00 – 0:25)
- **Visual**: Start at the Harbour Row Hotel homepage (`http://localhost:5173/`).
- **Voiceover**:
  > *"Welcome to the demonstration of Harbour Row Hotel, a full-stack MERN hotel reservation and property management system. Built with React and Vite on the frontend, Node.js and Express on the backend, and MongoDB with Mongoose on the database layer. State management is powered exclusively by the React Context API with zero banned libraries, and all form inputs are strictly controlled with client and server-side validation."*

---

### Segment 2: Search, Room Types & Availability (0:25 – 0:55)
- **Visual**:
  1. Click the check-in / check-out date field in the search bar to reveal the dual-month calendar. Select dates.
  2. Open the Guest Selector popover, adjust Adults to 2 and Room to 1.
  3. Click **Search Rooms** to navigate to `/search`.
  4. In the left filter sidebar, filter by Bed Type (`King Bed`) and price. Notice the real-time inventory badges showing verified room counts from the database.
  5. Click **View Details** on *Deluxe King* to open `/rooms/:id`.
  6. Scroll down through the single high-resolution chamber photo, rate plans (`Room Only` vs `With Breakfast`), amenities, and policies.
- **Voiceover**:
  > *"Guests can search real-time availability across dates and guest capacities. The search results page supports live faceted filtering by price, bed type, and amenities, reflecting real available rooms. Room details present room photography, verified GST tax slabs, and rate plan options."*

---

### Segment 3: 3-Step Checkout & Simulated Payment (0:55 – 1:30)
- **Visual**:
  1. Click **Continue to Book →** to enter `/book`.
  2. Step 1 (Details): Confirm stay dates and breakfast rate plan. Click **Proceed to Guest Details**.
  3. Step 2 (Traveller Info): Fill in Full Name, Email, and Phone. Client validation flags any invalid inputs. Click **Continue to Payment**.
  4. Step 3 (Payment): View server-authoritative GST breakdown. Select **Pay 25% Deposit Now**, select **UPI QR Code** or **Card**, and click **Confirm Booking & Settle**.
  5. The booking success page appears with the unique reservation code (`HRH-XXXXXX`).
  6. Click **Add to Calendar (.ics)** to show the dynamic RFC-5545 calendar export.
- **Voiceover**:
  > *"Our 3-step checkout wizard computes a server-authoritative quote, preventing client-side price tampering. We collect guest details with strict validation, allow payment schedule selection (full, 25% deposit, or at hotel), and simulate instant checkout. Upon completion, guests receive an immediate confirmation and can export the reservation directly to their calendar via .ICS."*

---

### Segment 4: Guest Portal & Printable Folio (1:30 – 1:55)
- **Visual**:
  1. Click **My Bookings** in the top navigation.
  2. Show the reservation listed under the **Upcoming** tab.
  3. Click **View Invoice** to open the printable itemized stay folio showing room tariff, GST, deposit paid, and outstanding balance.
  4. Click **Profile & Settings** on the left account sidebar to demonstrate profile update and password change forms.
- **Voiceover**:
  > *"In the customer portal, guests can manage active and past reservations, review itemized charges with official GST slabs, and view their tax folio. All customer routes are protected with strict IDOR access control, ensuring patrons only access their own records."*

---

### Segment 5: Staff Operations & Tape Chart (1:55 – 2:30)
- **Visual**:
  1. Log out. Open `http://localhost:5173/admin` (dedicated staff portal).
  2. Notice that form fields load completely blank with aggressive autofill protection.
  3. Sign in as Receptionist: `priya@harbourrow.com` / `Staff@1234`.
  4. Show Front Desk Dashboard with today's arrivals, departures, in-house guests, and quick check-in actions.
  5. Navigate to **Room Tape Chart** (`/staff/chart`) to display the 14-day interactive matrix showing room occupancies across floors with color-coded reservation blocks.
- **Voiceover**:
  > *"Hotel staff access a separate administrative portal with strict role-based access control. Front desk receptionists can review daily arrivals, process guest check-ins and check-outs with zero-balance validation, and inspect the 14-day visual tape chart for room allocation across all 40 rooms."*

---

### Segment 6: Admin Analytics & Reports (2:30 – 2:50)
- **Visual**:
  1. Switch to Admin: `admin@harbourrow.com` / `Admin@1234`.
  2. Navigate to **Reports** (`/admin/reports`).
  3. Show the Revenue aggregation chart, chamber occupancy breakdown, and average daily rates.
  4. Navigate to **Users** (`/admin/users`) to demonstrate role management.
- **Voiceover**:
  > *"Administrators have full access to management reports, including revenue aggregations, chamber occupancy metrics, and user role administration. Sensitive operations like user deletion, role updates, and refund processing are strictly restricted to the admin role."*

---

### Segment 7: Code Quality, Verification & Wrap-Up (2:50 – 3:00)
- **Visual**:
  1. Show terminal running `npm test --prefix backend` with all 40/40 tests green.
  2. Show newman running the Postman collection with all 27/27 requests passing.
  3. Display the clean project directory structure with separated `frontend/` and `backend/`.
- **Voiceover**:
  > *"The project achieves 100% test coverage across 40 backend unit and integration tests and passes all 27 Postman automated API tests. All code is committed cleanly to GitHub ready for evaluation. Thank you!"*
