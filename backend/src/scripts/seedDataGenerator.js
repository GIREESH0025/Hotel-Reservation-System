'use strict';
/**
 * seedDataGenerator.js
 * Generates rich, realistic, relative-date sample data for Harbour Row Hotel.
 * Safe for use both in MongoDB seed scripts and in-memory test/demo mock environments.
 */

function daysFromNow(n) {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() + n);
  d.setUTCHours(0, 0, 0, 0);
  return d;
}

function formatDateCode(d, seq) {
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `RES-${year}${month}${day}-${String(seq).padStart(4, '0')}`;
}

const USERS_DATA = [
  // 1 Admin
  { name: 'Aditya Mehta', email: 'admin@harbourrow.com', password: 'Admin@1234', role: 'admin', phone: '+91 98200 11001' },
  // 2 Receptionists
  { name: 'Priya Sharma', email: 'priya@harbourrow.com', password: 'Staff@1234', role: 'receptionist', phone: '+91 98200 11002' },
  { name: 'Karan Joshi', email: 'karan@harbourrow.com', password: 'Staff@1234', role: 'receptionist', phone: '+91 98200 11003' },
  // 6 Customers (Rahul Verma is the primary demo user)
  { name: 'Rahul Verma', email: 'rahul@example.com', password: 'Guest@1234', role: 'customer', phone: '+91 98111 22334' },
  { name: 'Ananya Deshmukh', email: 'ananya@example.com', password: 'Guest@1234', role: 'customer', phone: '+91 98222 33445' },
  { name: 'Vikram Malhotra', email: 'vikram@example.com', password: 'Guest@1234', role: 'customer', phone: '+91 98333 44556' },
  { name: 'Sunita Rao', email: 'sunita@example.com', password: 'Guest@1234', role: 'customer', phone: '+91 98444 55667' },
  { name: 'David Miller', email: 'david@example.com', password: 'Guest@1234', role: 'customer', phone: '+44 7700 900123' },
  { name: 'Meera Nambiar', email: 'meera@example.com', password: 'Guest@1234', role: 'customer', phone: '+91 98555 66778' },
];

const ROOM_TYPES_DATA = [
  {
    name: 'Standard',
    description: 'Refined standard chamber overlooking the quiet courtyard. Featuring queen bedding and historic appointments.',
    baseRate: 2800,
    capacity: 2,
    maxOccupancy: 2,
    size: 28,
    bedType: 'Queen Bed',
    amenities: ['Wi-Fi', 'Air Conditioning', 'En-suite Shower', 'Tea/Coffee Maker', 'In-room Safe', 'Work Desk'],
    highlights: ['Courtyard View', 'Ergonomic Desk', 'Rain Shower', 'Complimentary High-speed Wi-Fi'],
    breakfastPricePerAdult: 450,
    freeCancellation: true,
    image: 'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1618773928121-c32242e63f39?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595526114035-0d45ed16cfbf?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    name: 'Deluxe King',
    description: 'Generous chamber with king bedding, private veranda, and antique writing bureau.',
    baseRate: 4800,
    capacity: 3,
    maxOccupancy: 3,
    size: 42,
    bedType: 'King Bed',
    amenities: ['Wi-Fi', 'Air Conditioning', 'King Bed', 'City View Balcony', 'Mini Bar', 'Bathtub'],
    highlights: ['Private Balcony', 'Deep Soaking Tub', 'Pillow Menu', 'Bespoke Teak Furnishings'],
    breakfastPricePerAdult: 450,
    freeCancellation: true,
    image: 'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1590490360182-c33d57733427?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1578683010236-d716f9a3f461?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1507652313519-d4e9174996dd?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    name: 'Twin Deluxe',
    description: 'Twin mahogany single beds with generous sitting space, tailored for traveling companions or colleagues.',
    baseRate: 4500,
    capacity: 2,
    maxOccupancy: 2,
    size: 38,
    bedType: 'Twin Beds',
    amenities: ['Wi-Fi', 'Air Conditioning', 'Twin Beds', 'Work Desk', 'Mini Bar', 'Walk-in Closet'],
    highlights: ['Twin Plush Beds', 'Dual Vanities', 'Quiet Wing', 'Soundproof Windows'],
    breakfastPricePerAdult: 450,
    freeCancellation: true,
    image: 'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1566665797739-1674de7a421a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1595571024048-45a59177f538?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584622781564-1d987f7333c1?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512918728675-ed5a9ecdebfd?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    name: 'Executive Suite',
    description: 'Expansive two-room suite featuring harbour water views, separate salon, and dedicated butler reception.',
    baseRate: 8500,
    capacity: 4,
    maxOccupancy: 4,
    size: 65,
    bedType: 'King Bed',
    amenities: ['Wi-Fi', 'Air Conditioning', 'Ocean View', 'Living Salon', 'Smart TV', 'Jacuzzi', 'Butler Service'],
    highlights: ['Panoramic Sea Vista', 'Separate Living Salon', 'Jacuzzi Bath', 'Complimentary Evening Cocktails'],
    breakfastPricePerAdult: 450,
    freeCancellation: true,
    image: 'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    name: 'Penthouse Suite',
    description: 'Our premier rooftop residency with private plunge pool, panoramic terrace, and private dining salon.',
    baseRate: 18000,
    capacity: 6,
    maxOccupancy: 6,
    size: 95,
    bedType: 'Grand King Bed',
    amenities: ['Wi-Fi', 'Air Conditioning', 'Panoramic Terrace', 'Private Plunge Pool', 'Full Kitchen', 'Dedicated Valet', 'Dining Hall'],
    highlights: ['Private Rooftop Plunge Pool', 'Dedicated Valet Service', 'Chef Kitchenette', 'Wrap-around Sunset Terrace'],
    breakfastPricePerAdult: 450,
    freeCancellation: true,
    image: 'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1631049307264-da0ec9d70304?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1512915922686-57c11dde9b6b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1552321554-5fefe8c9ef14?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1540518614846-7ede433c4ef3?auto=format&fit=crop&w=1200&q=80',
    ],
  },
  {
    name: 'Accessible Queen',
    description: 'Barrier-free ground chamber with wide doorways, roll-in rain shower, support rails, and emergency assistance.',
    baseRate: 3600,
    capacity: 2,
    maxOccupancy: 2,
    size: 34,
    bedType: 'Queen Bed',
    amenities: ['Wi-Fi', 'Air Conditioning', 'Step-Free Access', 'Roll-in Shower', 'Grab Bars', 'Wide Clearance'],
    highlights: ['Zero-Threshold Access', 'Roll-in Rain Shower', 'Support Grab Bars', 'Audible & Visual Emergency Alarms'],
    breakfastPricePerAdult: 450,
    freeCancellation: true,
    image: 'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
    images: [
      'https://images.unsplash.com/photo-1591088398332-8a7791972843?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1590490359683-658d3d23f972?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1620626011761-996317b8d101?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1505693314120-0d443867891c?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1582719508461-905c673771fd?auto=format&fit=crop&w=1200&q=80',
    ],
  },
];

const WALK_IN_GUESTS = [
  { fullName: 'Rajesh Gopinath', phone: '+91 98112 00001', email: 'rajesh.g@tcs-corp.com', idProof: 'PAN: ABCPG1234K' },
  { fullName: 'Shalini Sengupta', phone: '+91 98112 00002', email: 'shalini.s@kolkata.in', idProof: 'Aadhaar: 4421 8890 1234' },
  { fullName: 'Kavita Patel', phone: '+91 98112 00003', email: 'kavita.p@ahmedabad.com', idProof: 'Passport: Z8921443' },
  { fullName: 'Arjun Singhania', phone: '+91 98112 00004', email: 'arjun@singhania.org', idProof: 'Aadhaar: 7721 4455 9901' },
  { fullName: 'Rohan Bhattacharya', phone: '+91 98112 00005', email: 'rohan.b@bengal.ac.in', idProof: 'Voter ID: WB/04/12998' },
  { fullName: 'Deepa Krishnan', phone: '+91 98112 00006', email: 'deepa.k@chennai.net', idProof: 'Aadhaar: 3311 9900 8821' },
  { fullName: 'Farhan Merchant', phone: '+91 98112 00007', email: 'farhan@merchanttrade.in', idProof: 'Passport: S1129984' },
  { fullName: 'Preeti Nair', phone: '+91 98112 00008', email: 'preeti.n@kochi.in', idProof: 'Aadhaar: 8812 3344 5566' },
  { fullName: 'Vivek Oberoi', phone: '+91 98112 00009', email: 'vivek@mumbaifilms.com', idProof: 'Driving Lic: MH01-2019-0091' },
  { fullName: 'Zoya Akhtar', phone: '+91 98112 00010', email: 'zoya@tigerbaby.in', idProof: 'Passport: M4491209' },
  { fullName: 'Robert Sterling', phone: '+1 212 555 0192', email: 'r.sterling@manhattan.com', idProof: 'US Passport: 994821102' },
  { fullName: 'Elena Rostova', phone: '+44 20 7946 0991', email: 'elena@londonart.co.uk', idProof: 'UK Passport: 554901882' },
  { fullName: 'Hiroshi Tanaka', phone: '+81 3 5555 0143', email: 'tanaka@tokyotrade.jp', idProof: 'Japan Passport: TR991204' },
  { fullName: 'Nikhil Kamath', phone: '+91 98112 00014', email: 'nikhil@zerodha.tech', idProof: 'PAN: AAAPN4412K' },
  { fullName: 'Tanvi Shah', phone: '+91 98112 00015', email: 'tanvi.shah@pwc.com', idProof: 'Aadhaar: 1109 4432 9988' },
  { fullName: 'Amitabh Sen', phone: '+91 98112 00016', email: 'amitabh@oxford.edu', idProof: 'Passport: P9081245' },
  { fullName: 'Clara Dupont', phone: '+33 1 42 68 55 00', email: 'clara@parisdesign.fr', idProof: 'EU ID: 882190-FR' },
  { fullName: 'Siddharth Roy', phone: '+91 98112 00018', email: 'sid.roy@utv.com', idProof: 'Aadhaar: 5521 8800 1199' },
  { fullName: 'Maya Angelis', phone: '+30 21 0368 9000', email: 'maya@athens.gr', idProof: 'Greek Passport: GR772109' },
  { fullName: 'Kishore Kumar', phone: '+91 98112 00020', email: 'kishore@soundtracks.in', idProof: 'Voter ID: MH/01/99214' },
  { fullName: 'Tara Sutaria', phone: '+91 98112 00021', email: 'tara@mumbaimodels.in', idProof: 'Passport: K2290118' },
  { fullName: 'Sanjay Dutt', phone: '+91 98112 00022', email: 'sanjay@bandra.in', idProof: 'Aadhaar: 9944 2211 8800' },
  { fullName: 'Amrita Pritam', phone: '+91 98112 00023', email: 'amrita@delhipoets.org', idProof: 'PAN: ABFPP9912Q' },
  { fullName: 'Govind Swaminathan', phone: '+91 98112 00024', email: 'govind@iitb.ac.in', idProof: 'Aadhaar: 6633 1199 4422' },
];

module.exports = {
  daysFromNow,
  formatDateCode,
  USERS_DATA,
  ROOM_TYPES_DATA,
  WALK_IN_GUESTS,
};

