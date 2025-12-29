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
Aidhandy/
├── app/                # Next.js App Router
│   ├── admin/          # Admin dashboard pages
│   ├── api/            # API routes
│   ├── auth/           # Authentication pages
│   ├── dashboard/      # User dashboard pages
│   ├── providers/      # React context providers
│   ├── stripe/         # Stripe integration pages
│   └── verify-email/   # Email verification
├── components/         # React components
│   ├── Booked-Flight/  # Booked flight components
│   ├── common/         # Shared/reusable components
│   ├── Error/          # Error handling components
│   ├── Flight/         # Flight search/display components
│   ├── layout/         # Layout components
│   ├── Paypal/         # PayPal integration components
│   ├── Profile/        # User profile components
│   └── Seat/           # Seat selection components
├── context/            # React context definitions
├── hooks/              # Custom React hooks
├── libs/               # Utility libraries
├── prisma/             # Database schema
├── public/             # Static assets
├── supabase/           # Supabase configuration
│   └── functions/      # Edge functions
└── utils/              # Helper utilities
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
