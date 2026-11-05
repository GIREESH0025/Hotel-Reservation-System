'use strict';

module.exports = {
  brandName: 'Harbour Row Hotel',
  hotelName: 'Harbour Row Hotel',
  area: 'Colaba, Mumbai',
  address: 'Near Gateway of India, Colaba, Mumbai 400001, Maharashtra, India',
  phone: '+91 22 2202 0000',
  email: 'reservations@harbourrow.com',
  currency: 'INR',
  checkInTime: '14:00',
  checkOutTime: '11:00',
  depositPercent: 25,
  cancellationFreeHours: 48,
  childPolicy: 'Children aged 0-17 stay complimentary when sharing existing bedding. Breakfast is complimentary for accompanying children.',
  // GST Tax Slabs (demo values, verify before real use)
  taxSlabs: [
    { maxRate: 1000, rate: 0.00, label: '0% (up to ₹1,000)' },
    { maxRate: 7500, rate: 0.12, label: '12% (₹1,001 to ₹7,500)' },
    { maxRate: Infinity, rate: 0.18, label: '18% (above ₹7,500)' },
  ],
  // Active promotional offers
  offers: [
    {
      code: 'WELCOME10',
      type: 'percent',
      value: 10,
      maxDiscount: 1500,
      minAmount: 2000,
      validTo: '2026-12-31',
      active: true,
      title: '10% Welcome Discount',
      description: 'Get 10% instant discount up to ₹1,500 on stays above ₹2,000.',
    },
    {
      code: 'STAY500',
      type: 'flat',
      value: 500,
      maxDiscount: 500,
      minAmount: 3000,
      validTo: '2026-12-31',
      active: true,
      title: 'Flat ₹500 Off',
      description: 'Flat ₹500 off on stays totaling ₹3,000 or more.',
    },
    {
      code: 'HARBOUR20',
      type: 'percent',
      value: 20,
      maxDiscount: 3000,
      minAmount: 8000,
      validTo: '2026-12-31',
      active: true,
      title: '20% Extended Stays',
      description: 'Save 20% up to ₹3,000 for reservations of ₹8,000 or more.',
    },
  ],
};

