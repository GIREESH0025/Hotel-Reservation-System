/**
 * Hotel Configuration & Editorial Content
 * Aligned with DESIGN.md "printed hotel register" ethos.
 */

export const HOTEL_CONFIG = {
  name: 'Harbour Row Hotel',
  tagline: 'Historic Waterfront Lodgings & Fine Chambers',
  established: 1928,
  address: {
    street: '14 Apollo Bunder Road, Fort',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
  },
  contact: {
    concierge: '+91 22 4910 8800',
    reservations: 'reservations@harbourrow.com',
    deskHours: '24 hours daily',
  },
  timings: {
    checkIn: '14:00 IST',
    checkOut: '11:00 IST',
    breakfast: '07:00 – 10:30 IST',
    quietHours: '22:00 – 07:00 IST',
  },
  policies: [
    {
      title: 'Arrival & Departure',
      desc: 'Guest registration commences at 14:00. Rooms must be vacated by 11:00 on the day of departure. Late departures may be requested at the front desk subject to chamber occupancy.',
    },
    {
      title: 'Cancellation & Release',
      desc: 'Reservations may be cancelled without penalty up to 24 hours prior to scheduled check-in. Cancellations within 24 hours or failure to arrive are subject to a one-night charge.',
    },
    {
      title: 'Settlement of Folios',
      desc: 'All outstanding chamber balances and incidental charges must be settled prior to check-out. We accept UPI, Visa, Mastercard, American Express, and cash.',
    },
    {
      title: 'Identification Proof',
      desc: 'Per local regulations, all adult occupants must present a valid government-issued photographic ID (Aadhaar, Passport, Voter Card, or Driving Licence) upon check-in.',
    },
  ],
  amenities: [
    { name: 'Heritage Architecture', desc: '1920s maritime stone facade with restored Burmese teak appointments.' },
    { name: 'Complimentary Wi-Fi', desc: 'Enterprise gigabit connectivity throughout all guest chambers and common salons.' },
    { name: '24-Hour Concierge', desc: 'Round-the-clock front desk reception, luggage storage, and port transfer assistance.' },
    { name: 'Chamber Dining', desc: 'Carefully curated seasonal coastal menu served directly to your chamber.' },
    { name: 'Daily Housekeeping', desc: 'Morning chamber refreshment and evening turndown service.' },
    { name: 'Chauffeur & Valet', desc: 'Secure covered vehicle parking with complimentary valet on Apollo Bunder.' },
  ],
  faqs: [
    {
      q: 'Can I check in earlier than 14:00?',
      a: 'Early registration depends entirely on chamber readiness on your arrival day. While we cannot guarantee immediate chamber access before 14:00, our concierge will gladly secure your luggage while you relax in our salon or explore Fort.',
    },
    {
      q: 'How does payment work for customer reservations?',
      a: 'Customer bookings made through the guest portal are held in pending status until reviewed or confirmed. Payment is recorded directly at the front desk cashier upon arrival or departure via Card, UPI, or Cash.',
    },
    {
      q: 'What is the maximum stay duration permitted?',
      a: 'Per hotel operational guidelines, single bookings can span from 1 to 30 consecutive nights. For prolonged seasonal residencies, please contact our reservations desk directly.',
    },
    {
      q: 'Is same-day room turnover permitted?',
      a: 'Yes. One patron may depart on the same calendar date that an arriving patron checks in. Our housekeeping staff refreshes and inspects every chamber between 11:00 and 14:00.',
    },
    {
      q: 'Do you permit children and pets?',
      a: 'Children under 10 years stay complimentary when sharing existing chamber bedding. Due to the delicate historical woodwork and textile furnishings, pets are not accommodated, with the exception of certified service animals.',
    },
  ],
  // Curated room photographs from reliable public image sources with typography fallbacks
  roomImages: {
    'Standard': 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=700&q=80',
    'Deluxe King': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=700&q=80',
    'Twin Deluxe': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=700&q=80',
    'Executive Suite': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=700&q=80',
    'Penthouse Suite': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=700&q=80',
    'Accessible Queen': 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=700&q=80',
  },
}
