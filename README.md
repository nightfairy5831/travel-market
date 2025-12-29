# AidHandy - Project Summary

## Project Purpose

AidHandy is a **travel assistance marketplace platform** that connects travelers who need assistance during flights with companions who can provide that assistance. The platform facilitates the entire journey from booking to payment, enabling a seamless experience for both travelers seeking help and companions offering their services.

## Core Features

### User Roles
- **Travelers**: Book flights and request assistance from companions
- **Companions**: Receive bookings, provide assistance, and receive payouts
- **Admin**: Manage platform operations, approve companions, handle refunds

### Booking System
- **Path 1**: Traveler books a seat first, then selects a companion
- **Path 2**: Traveler joins an existing companion's available seat
- Flight search with airline, route, and date validation
- Booking status management (pending, confirmed, cancelled, refunded)

### Payment Integration
- **Stripe Connect Express**: Companion payouts with 10% platform fee
- **Stripe Checkout**: Secure traveler payments
- **PayPal**: Alternative payment option
- Webhook handling for payment events
- Refund processing capability

### Companion Management
- Registration and onboarding flow
- Stripe Connect KYC verification
- Admin approval workflow
- Suspension capability for non-compliant companions
- Payout management

### Authentication & Security
- Supabase Auth (magic link, OTP)
- Email verification
- Row Level Security (RLS) policies
- Session handling

### Notifications
- **Email**: Postmark transactional emails (booking confirmations, assignments)
- **SMS**: Twilio messaging for time-sensitive notifications
- Pre-trip reminders

### Admin Dashboard
- Companion approvals and suspensions
- Booking management with search and filters
- Refund processing
- CSV export functionality

## Tech Stack
- **Frontend**: Next.js (App Router), React, Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, RLS)
- **Payments**: Stripe Connect, PayPal
- **Notifications**: Postmark (email), Twilio (SMS)
- **Deployment**: Vercel (app), Netlify (marketing site)

## Project Structure
```
travel-market/
├── Aidhandy/          # Main Next.js application
│   ├── app/           # App Router pages
│   ├── components/    # React components
│   ├── libs/          # Utility libraries
│   ├── supabase/      # Supabase configuration & edge functions
│   └── prisma/        # Database schema
├── GUIDE.md           # Testing guide
├── phase1.txt         # Phase 1 technical summary
├── phase2.txt         # Phase 2 contract scope
└── expectphase1.txt   # Expected Phase 1 behaviors
```

## Development Phases

### Phase 1 (Completed)
- Authentication system
- Companion and traveler onboarding
- Basic booking structure
- Stripe Connect Express integration
- Email and SMS notifications setup

### Phase 2 (In Progress)
- Full booking engine (Path 1 & 2)
- Complete payment flows with webhooks
- Admin dashboard
- Identity verification
- Seat map integration
- Mobile app foundations (React Native + Expo)
- UI/UX polish
