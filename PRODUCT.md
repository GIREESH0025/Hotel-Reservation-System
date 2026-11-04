# PRODUCT.md — Harbour Row Hotel Reservation System

## Audience

**Primary:** Hotel front-desk staff (Receptionist, Admin) working fast on shared desktop computers with moderate technical literacy. They need to check guests in and out, record payments, and manage room availability without making errors under pressure. Speed and reliability beat style.

**Secondary:** Hotel guests (Customers) booking rooms online, often on mobile. They need to find available rooms, confirm a booking, and check their reservation status. Trust and clarity beat cleverness.

## Purpose

A reliable, production-grade hotel reservation system that eliminates double-bookings through enforced overlap detection, keeps an accurate financial ledger per reservation (folio), and gives each role exactly the tools they need — nothing more.

## Tone

Calm. Precise. Editorial. The system speaks like a well-trained hotel concierge: direct without being cold, never cheerful or salesy. Error messages say what happened and what to do. No jargon, no filler words ("seamless", "elevate", "unlock", "powerful"), no exclamation marks outside extreme success moments.

## Anti-references

- Generic SaaS landing pages (centered hero, two CTA buttons, icon tiles)
- Travel-aggregator clutter (star ratings, "Only 2 left!", urgency banners)
- Luxury-hotel clichés (cursive fonts, gold tones, marble textures, lifestyle photos)
- Material Design defaults (card-on-card, purple/teal, floating action buttons)

## Success criteria

- A receptionist can check a guest in under 60 seconds with no training
- A customer can find available rooms, book, and receive confirmation in under 3 minutes
- Zero double-bookings: enforced at the API level with transactions
- Every financial transaction is traceable: reservation → payments → folio balance

## Platform

Web application. Frontend: responsive from 360px to 1440px. Desktop-first for staff screens (data-dense tables, tape chart). Mobile-friendly for customer-facing screens (search, booking, my reservations).

## Brand

Text wordmark: **Harbour Row Hotel** (from BRAND_NAME constant; no logo, no icon).  
Footer: "Demo project, not a real hotel."  
Currency: INR via `Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR' })`.

