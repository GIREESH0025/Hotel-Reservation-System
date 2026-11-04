/**
 * Hotel Configuration & Content
 * Honest, authentic copy with no invented stats, awards, or fake histories.
 */

export const HOTEL_CONFIG = {
  name: 'Harbour Row Hotel',
  area: 'Colaba, Mumbai',
  address: {
    street: 'Near Gateway of India, Colaba',
    city: 'Mumbai',
    state: 'Maharashtra',
    postalCode: '400001',
    country: 'India',
  },
  contact: {
    reception: '+91 22 2202 0000',
    reservations: 'reservations@harbourrow.com',
    deskHours: '24 hours daily',
  },
  timings: {
    checkIn: '14:00 IST',
    checkOut: '11:00 IST',
    breakfast: '07:00 – 10:30 IST',
  },
  policies: [
    {
      title: 'Arrival & Departure',
      desc: 'Guest check-in begins at 14:00. Check-out is by 11:00 on the day of departure. Late departures may be requested at the reception desk subject to room availability.',
    },
    {
      title: 'Cancellation Policy',
      desc: 'Reservations may be cancelled without fee up to 48 hours prior to arrival. Pre-paid deposits are automatically refunded to your payment method for cancellations made 48+ hours in advance.',
    },
    {
      title: 'Settlement of Folios',
      desc: 'All outstanding room charges must be settled prior to check-out. We accept UPI, Visa, Mastercard, and cash payments at the reception desk.',
    },
    {
      title: 'Identification Required',
      desc: 'All adult guests must present a valid government-issued photographic ID (Aadhaar, Passport, Voter Card, or Driving Licence) upon arrival.',
    },
  ],
  amenities: [
    { name: 'Prime Location', desc: 'Situated in historic Colaba, steps away from the waterfront and cultural sights.' },
    { name: 'High-Speed Wi-Fi', desc: 'Complimentary high-speed internet available in all rooms and public spaces.' },
    { name: '24-Hour Reception Desk', desc: 'Round-the-clock staff assistance, luggage storage, and local guidance.' },
    { name: 'Daily Housekeeping', desc: 'Fresh linens, daily room cleaning, and evening turn-down service.' },
    { name: 'On-Site Dining', desc: 'Freshly prepared breakfast and coastal dishes served daily.' },
    { name: 'Climate Control', desc: 'Individual room temperature control and silent air conditioning.' },
  ],
  faqs: [
    {
      q: 'What are the check-in and check-out times?',
      a: 'Check-in begins at 14:00 IST and check-out is by 11:00 IST. If you arrive early or wish to explore the city after departure, we offer complimentary secure luggage storage.',
    },
    {
      q: 'How does the deposit payment work?',
      a: 'You can guarantee your reservation by paying a 25% deposit online. The remaining balance is payable upon arrival or departure. Alternatively, you may choose to pay at the hotel on arrival.',
    },
    {
      q: 'What is your cancellation and refund policy?',
      a: 'Cancellations made 48 hours or more before your scheduled check-in receive an immediate full refund of any deposit paid. Cancellations within 48 hours are subject to standard policies.',
    },
    {
      q: 'Is this an actual operational hotel?',
      a: 'No. Harbour Row Hotel is a fully functional demonstration project built to showcase production-grade hotel booking and management software. No real payments are processed.',
    },
  ],
  // Curated room photographs representing each distinct room category
  roomImages: {
    'Standard': 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=700&q=80',
    'Deluxe King': 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=700&q=80',
    'Twin Deluxe': 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=700&q=80',
    'Executive Suite': 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=700&q=80',
    'Penthouse Suite': 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=700&q=80',
    'Accessible Queen': 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=700&q=80',
  },
}
