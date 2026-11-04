# ER Diagram — Harbour Row Hotel Reservation System

```mermaid
erDiagram
    User {
        ObjectId _id PK
        string name
        string email UK
        string password "select:false"
        string role "admin|receptionist|customer"
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
        string[] amenities
        Date createdAt
        Date updatedAt
    }

    Room {
        ObjectId _id PK
        string number UK
        number floor
        ObjectId roomType FK
        number rateOverride "optional"
        string status "active|maintenance"
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
        ObjectId room FK
        ObjectId createdBy FK
        Date checkIn
        Date checkOut
        number adults
        number ratePerNight "snapshot at booking"
        number nights
        number totalAmount
        string status "pending|confirmed|checked_in|checked_out|cancelled|no_show"
        string notes
        Date createdAt
        Date updatedAt
    }

    Payment {
        ObjectId _id PK
        ObjectId reservation FK
        number amount
        string method "cash|card|upi|demo_online"
        string type "deposit|balance|full|refund"
        string status "paid|refunded|failed"
        string reference "unique UK"
        string idempotencyKey "unique UK optional"
        string note "optional"
        ObjectId receivedBy FK "optional"
        Date paidAt
        Date createdAt
        Date updatedAt
    }

    %% Relationships
    User ||--o{ Guest : "linked account (optional)"
    User ||--o{ Reservation : "createdBy"
    User ||--o{ Payment : "receivedBy"
    RoomType ||--|{ Room : "type"
    Guest ||--|{ Reservation : "guest"
    Room ||--|{ Reservation : "room"
    Reservation ||--|{ Payment : "reservation"
```

## Key Design Decisions

- **Occupancy is DERIVED**: Room.status only tracks maintenance. Whether a room is occupied is computed from active Reservation records (pending/confirmed/checked_in) — never stored on Room.
- **Rate snapshot**: `ratePerNight` is captured at booking time from the room's `rateOverride` or `roomType.baseRate`. Future rate changes do not affect existing reservations.
- **Balance computation**: `balance = totalAmount - sum(paid payments) + sum(refunded payments)` — computed server-side, never stored.
- **Overlap detection**: Runs inside a Mongoose transaction to prevent race conditions.
- **Indexes**: Room.number (unique), Reservation compound (room, checkIn, checkOut), Guest text index (fullName, email), User.email (unique).

