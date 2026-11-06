# Harbour Row Hotel — Full-Stack Hotel Reservation & Property Management System

[![Node.js](https://img.shields.io/badge/Node.js-18%2B-339933?logo=node.js&logoColor=white)](https://nodejs.org/)
[![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=black)](https://react.dev/)
[![Express](https://img.shields.io/badge/Express-5-000000?logo=express&logoColor=white)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-Atlas-47A248?logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Tests](https://img.shields.io/badge/Tests-40%2F40%20Passing-brightgreen)](backend/tests/)
[![Newman API](https://img.shields.io/badge/Postman-27%2F27%20Passing-orange?logo=postman&logoColor=white)](docs/postman/)

> **Project #8 — MERN Full Stack Hotel Reservation System**  
> A production-ready hotel reservation and property management platform built on the MERN stack. Designed with role-based access control (Admin, Receptionist, Customer), atomic overlap-prevention booking transactions, server-authoritative GST pricing calculation, dual-month calendar search, 14-day operations tape chart, and a 3-step checkout wizard.

---

## 🔗 Live Deployment URLs

| Service | Environment | Status | URL |
|---|---|:---:|---|
| **Frontend Web App** | Netlify | Production | [https://harbourhotel.netlify.app](https://harbourhotel.netlify.app) |
| **Backend REST API** | Render | Production | [https://hotel-reservation-system-qamu.onrender.com/api/v1](https://hotel-reservation-system-qamu.onrender.com/api/v1) |
| **API Health Check** | Render | Production | [https://hotel-reservation-system-qamu.onrender.com/api/health](https://hotel-reservation-system-qamu.onrender.com/api/health) |

---

## 🔑 Demo Credentials

| Role | Email Address | Password | Permissions & Available Portals |
|---|---|---|---|
| **Administrator** | `admin@harbourrow.com` | `Admin@1234` | Full access: User management, Room & Type CRUD, Revenue & Occupancy reports, Refunds, Front desk dashboard, Tape chart. Access via `/admin`. |
| **Front Desk Staff** | `priya@harbourrow.com` | `Staff@1234` | Operations access: 14-day Room Tape Chart, Front desk arrivals/departures, Check-in/Check-out, Walk-in reservations, Desk payments. Access via `/admin`. |
| **Registered Customer** | `rahul@example.com` | `Guest@1234` | Customer access: Availability search, Multi-room booking, 3-step checkout, My Bookings, Printable tax invoice folios, Profile updates. Access via `/login`. |

---

## ✨ Key System Capabilities & Architecture

- **Role-Based Access Control**: Tailored workflows and navigation guards for **Admin**, **Receptionist**, and **Customer** roles, with automated redirects and forbidden (`403`) view boundaries.
- **Controlled React State**: 100% controlled form elements (`e.preventDefault()`, controlled inputs) with zero third-party global state libraries—shared exclusively via the native **React Context API** (`AuthContext`, `ToastContext`, `RefreshContext`, `BookingContext`).
- **Atomic Booking Engine**: Server-authoritative overlap prevention supporting single and multi-room reservations, same-day check-in/turnovers, and status transitions (`pending`, `confirmed`, `checked_in`, `checked_out`, `cancelled`, `no_show`).
- **Billing, Invoicing & Folios**: Authoritative quote engine calculating Indian GST slabs (12% / 18%), breakfast tariffs, and coupon codes; itemized folio tax invoices; checkout balance validation preventing checkout with unpaid charges.
- **Robust Mongoose Architecture**: 6 strictly typed Mongoose models (`User`, `RoomType`, `Room`, `Guest`, `Reservation`, `Payment`) with compound indexes, timestamps, and active status tracking connected to **MongoDB Atlas**.
- **Production Security Hygiene**: Bcrypt password hashing (cost factor 12), JWT authentication with environment secret, password exclusion (`select:false`), Helmet HTTP security headers, CORS allowlist, and rate limiting on authentication routes.

---

## 🗄️ Database Architecture & Entity Relationship Diagram

```mermaid
erDiagram
    User {
        ObjectId _id PK
        string name
        string email UK
        string password "select:false, bcrypt cost 12"
        string role "admin | receptionist | customer"
        string phone
        Date createdAt
        Date updatedAt
    }

    RoomType {
        ObjectId _id PK
        string name UK
        string description
        number baseRate
        number capacity
        number maxOccupancy
        number size "sq m"
        string bedType
        string[] amenities
        string[] highlights
        number breakfastPricePerAdult
        boolean freeCancellation
        string image
        Date createdAt
        Date updatedAt
    }

    Room {
        ObjectId _id PK
        string number UK
        number floor
        ObjectId roomType FK
        number rateOverride "optional"
        string status "active | maintenance"
        Date createdAt
        Date updatedAt
    }

    Guest {
        ObjectId _id PK
        string fullName
        string phone
        string email
        string idProof "optional"
        ObjectId user FK "optional — links Customer account"
        Date createdAt
        Date updatedAt
    }

    Reservation {
        ObjectId _id PK
        string reservationCode UK
        ObjectId guest FK
        ObjectId[] rooms "array of Room refs (1-3 rooms)"
        ObjectId room "legacy compatibility ref"
        ObjectId roomType FK
        ObjectId createdBy FK
        Date checkIn
        Date checkOut
        number adults
        object[] children "array of { age }"
        string ratePlan "room_only | with_breakfast"
        number ratePerNight "snapshot at booking"
        number nights
        number baseFare
        number breakfastAmount
        number taxAmount
        number discountAmount
        number totalAmount
        string status "pending | confirmed | checked_in | checked_out | cancelled | no_show"
        string notes
        object guestSnapshot
        string specialRequests
        string arrivalTime
        Date createdAt
        Date updatedAt
    }

    Payment {
        ObjectId _id PK
        ObjectId reservation FK
        number amount
        string method "cash | card | upi | demo_online"
        string type "deposit | balance | full | refund"
        string status "paid | refunded | failed"
        string reference "UK"
        string idempotencyKey "UK, optional"
        string note "optional"
        ObjectId receivedBy FK "optional"
        Date paidAt
        Date createdAt
        Date updatedAt
    }

    User ||--o| Guest : "links customer profile"
    Guest ||--o{ Reservation : "has reservations"
    RoomType ||--o{ Room : "categorizes"
    Room ||--o{ Reservation : "assigned to"
    Reservation ||--o{ Payment : "has transactions"
    User ||--o{ Reservation : "created by"
    User ||--o{ Payment : "processed by"
```

---

## 🛠️ REST API Specification

**Base URL**: `/api/v1`

| Method | Endpoint | Auth Required | Allowed Roles | Description |
|---|---|:---:|---|---|
| `GET` | `/health` | No | Public | System uptime, timestamp, and service status |
| `POST` | `/auth/register` | No | Public | Register new guest account (strictly creates `customer` role) |
| `POST` | `/auth/login` | No | Public | Authenticate user and receive JWT token |
| `POST` | `/auth/logout` | No | Public | Invalidate client session token |
| `GET` | `/auth/me` | Yes | All roles | Return profile of currently authenticated user |
| `GET` | `/room-types` | No | Public | List all room categories with base tariffs and amenities |
| `GET` | `/room-types/:id` | No | Public | Retrieve room category specifications and photography |
| `POST` | `/room-types` | Yes | `admin` | Create new room category |
| `PATCH` | `/room-types/:id` | Yes | `admin` | Update room category tariffs or details |
| `DELETE` | `/room-types/:id` | Yes | `admin` | Delete room category |
| `GET` | `/rooms/availability` | No | Public | Real-time date availability search with multi-room inventory |
| `GET` | `/rooms` | Yes | `admin`, `receptionist` | List all 40 hotel rooms across 4 floors |
| `GET` | `/rooms/:id` | Yes | `admin`, `receptionist` | Retrieve room details and occupancy status |
| `POST` | `/rooms` | Yes | `admin` | Add new room to inventory |
| `PATCH` | `/rooms/:id` | Yes | `admin`, `receptionist` | Toggle active or maintenance status |
| `DELETE` | `/rooms/:id` | Yes | `admin` | Delete room record |
| `GET` | `/guests` | Yes | All roles | List guests (customers scoped to own profile) |
| `GET` | `/guests/:id` | Yes | All roles | Guest profile by ID (scoped for customers) |
| `POST` | `/guests` | Yes | `admin`, `receptionist` | Register walk-in guest at front desk |
| `PATCH` | `/guests/:id` | Yes | `admin`, `receptionist` | Update guest phone or identity records |
| `DELETE` | `/guests/:id` | Yes | `admin` | Delete guest profile |
| `POST` | `/reservations/quote` | No | Public | Server-authoritative quote calculation (GST slabs, breakfast, dates) |
| `GET` | `/reservations` | Yes | All roles | List reservations (customers scoped to own records) |
| `GET` | `/reservations/:id` | Yes | All roles | Retrieve reservation with computed live folio balance |
| `GET` | `/reservations/:id/invoice` | Yes | All roles | Generate itemized tax invoice and folio breakdown |
| `POST` | `/reservations` | Yes | All roles | Create atomic reservation with overlap prevention |
| `POST` | `/reservations/:id/pay` | Yes | All roles | Process online booking payment (deposit, balance, or full) |
| `PATCH` | `/reservations/:id` | Yes | `admin`, `receptionist` | Modify stay dates, assigned rooms, or notes |
| `DELETE` | `/reservations/:id` | Yes | `admin` | Remove reservation record |
| `PATCH` | `/reservations/:id/confirm` | Yes | `admin`, `receptionist` | Confirm pending reservation |
| `PATCH` | `/reservations/:id/check-in` | Yes | `admin`, `receptionist` | Check in guest upon arrival |
| `PATCH` | `/reservations/:id/check-out` | Yes | `admin`, `receptionist` | Check out guest (strictly blocked if balance > 0) |
| `PATCH` | `/reservations/:id/cancel` | Yes | All roles | Cancel reservation (auto-generates refund if $\ge$ 48h before check-in) |
| `GET` | `/payments` | Yes | All roles | List payment transactions (customers scoped to own) |
| `GET` | `/payments/:id` | Yes | All roles | Retrieve payment receipt record |
| `POST` | `/payments` | Yes | `admin`, `receptionist` | Record desk payment (Cash, Card, UPI) against folio |
| `PATCH` | `/payments/:id/refund` | Yes | `admin` | Process audited refund transaction |
| `GET` | `/reports/summary` | Yes | `admin`, `receptionist` | Daily operations summary (arrivals, departures, in-house) |
| `GET` | `/reports/revenue` | Yes | `admin` | Revenue aggregation by date period |
| `GET` | `/reports/occupancy` | Yes | `admin` | Room category occupancy percentages |
| `GET` | `/users` | Yes | `admin` | List system user accounts |
| `GET` | `/users/:id` | Yes | All roles | Retrieve user profile (customers scoped to own) |
| `PATCH` | `/users/:id` | Yes | All roles | Update profile (role modification restricted to admin) |
| `DELETE` | `/users/:id` | Yes | `admin` | Delete user account |
| `PATCH` | `/users/change-password` | Yes | All roles | Change password with current password verification |

---

## 📁 Repository Structure

```
Hotel Reservation System/
├── backend/
│   ├── src/
│   │   ├── config/          Database connection (db.js), environment validator (env.js), hotel settings
│   │   ├── controllers/     8 modular controllers (auth, user, roomType, room, guest, reservation, payment, report)
│   │   ├── middleware/      verifyToken, authorize, validate, errorHandler, notFound, asyncHandler
│   │   ├── models/          6 Mongoose models (User, RoomType, Room, Guest, Reservation, Payment)
│   │   ├── routes/          8 modular Express route definitions
│   │   ├── scripts/         Idempotent seed script (seed.js) & dataset generator
│   │   ├── services/        reservation.service.js (overlap checks, folio), pricingService.js (GST quote engine)
│   │   ├── utils/           rateLimiter.js
│   │   ├── validators/      Zod request schemas for write operations
│   │   ├── app.js           Express application configuration & security middleware
│   │   └── server.js        HTTP server listener
│   ├── tests/               40 automated unit and integration tests
│   ├── .env.example         Backend environment variables template
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── api/             Axios client with interceptors + resource API modules
│   │   ├── components/      Reusable UI components (Button, Field, Select, DataTable, Modal, Skeleton, SearchBar)
│   │   ├── context/         AuthContext, ToastContext, RefreshContext, BookingContext
│   │   ├── hooks/           useFetch, useDebounce, useTitle
│   │   ├── pages/           20+ responsive screens (Guest, Staff, Admin)
│   │   ├── routes/          ProtectedRoute component with role access control
│   │   ├── utils/           helpers.js (currency, dates, validation)
│   │   ├── App.jsx          Client-side routing tree
│   │   ├── index.css        Design tokens & responsive CSS
│   │   └── main.jsx         React application root
│   ├── public/              Static assets and Netlify SPA _redirects
│   ├── .env.example         Frontend environment variables template
│   └── package.json
├── docs/
│   ├── postman/             Postman collection & environment JSON
│   ├── screenshots/         UI screenshot documentation
│   └── er-diagram.md        Standalone Entity-Relationship documentation
├── DEPLOY.md                Step-by-step production deployment guide for Render, Netlify, and Atlas
├── .gitignore               Git ignore configuration (protects node_modules, .env, dist, logs)
└── README.md                Master project documentation
```

---

## 🚀 Local Development Setup

### 1. Prerequisites
- Node.js 18+ installed
- MongoDB installed locally or a free MongoDB Atlas connection URI

### 2. Backend Setup
```bash
cd backend
cp .env.example .env
# Fill in your MONGODB_URI and JWT_SECRET in .env
npm install
npm run seed       # Seeds 40 rooms, 6 room types, 30 guests, and 30 reservations
npm run dev        # Starts backend API on http://localhost:5000
```

### 3. Frontend Setup
```bash
cd frontend
cp .env.example .env
# Ensure VITE_API_URL=http://localhost:5000/api/v1
npm install
npm run dev        # Starts Vite dev server on http://localhost:5173
```

---

## 🧪 Testing & Verification

### Run Backend Unit & Integration Tests (40/40 Passing)
```bash
npm test --prefix backend
```
*Covers check-out balance blocks, overlap prevention, same-day turnovers, IDOR security, role authorization matrix, password hashing, Zod validation, and quote calculations.*

### Run Postman API Collection with Newman CLI (27/27 Passing)
```bash
npx newman run docs/postman/HotelReservation.postman_collection.json -e docs/postman/HotelReservation.postman_environment.json
```
*Executes health checks, multi-role authentication, room availability searches, stay quotes, CRUD actions, folio invoices, reports, and token management.*

### Run Frontend Production Build (Zero Errors)
```bash
npm run build --prefix frontend
```
*Compiles optimized Vite client bundle into `frontend/dist/` in under 2 seconds.*

---

## 🚢 Deployment Guide

Detailed, step-by-step instructions for deploying to **MongoDB Atlas**, **Render** (backend), and **Netlify** (frontend) are provided in [`DEPLOY.md`](DEPLOY.md).

---

## 🎥 Video Demonstration Guide

For the required 2-3 minute demonstration video, follow this recommended walkthrough flow:
1. **Public & Customer Flow**:
   - Browse room types on the homepage and view high-resolution specifications.
   - Run a live availability search using the dual-month calendar.
   - Log in as Customer (`rahul@example.com` / `Guest@1234`), complete a 3-step booking with a deposit payment, and view the generated booking in **My Bookings**.
   - Open and print the itemized Folio Tax Invoice.
2. **Operations & Front Desk Flow**:
   - Log in as Front Desk (`priya@harbourrow.com` / `Staff@1234`).
   - Navigate to the **Tape Chart** to demonstrate the 14-day visual room occupancy matrix.
   - Process an arrival check-in and demonstrate that check-out is blocked if an outstanding balance exists.
3. **Administration & Analytics Flow**:
   - Log in as Administrator (`admin@harbourrow.com` / `Admin@1234`).
   - Review the **Summary Dashboard**, **Revenue Period Aggregation**, and **Chamber Occupancy** analytics.
   - Demonstrate user management and room inventory controls.
