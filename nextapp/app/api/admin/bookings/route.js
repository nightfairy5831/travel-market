import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

async function verifyAdmin(req) {
  const authHeader = req.headers.get('authorization');
  if (!authHeader) return null;

  const { data: { user } } = await supabase.auth.getUser(authHeader.replace('Bearer ', ''));
  if (!user) return null;

  const { data: profile } = await supabase.from('users').select('role').eq('id', user.id).single();
  return profile?.role === 'admin' ? user : null;
}

export async function GET(req) {
  const admin = await verifyAdmin(req);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { searchParams } = new URL(req.url);
  const status = searchParams.get('status');

  let query = supabase.from('bookings').select(`
    *,
    traveler:travellers(id, first_name, last_name, email),
    companion:companions(id, full_name, email)
  `);

  if (status) query = query.eq('status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ bookings: data }), { status: 200 });
}

export async function POST(req) {
  const admin = await verifyAdmin(req);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { action, bookingId, reason } = await req.json();

  const { data: booking } = await supabase.from('bookings').select('*').eq('id', bookingId).single();
  if (!booking) return new Response(JSON.stringify({ error: 'Booking not found' }), { status: 404 });

  let updateData = { updated_at: new Date().toISOString() };

  switch (action) {
    case 'cancel':
      updateData.status = 'cancelled';
      updateData.cancellation_reason = reason;
      updateData.cancelled_at = new Date().toISOString();
      break;
    case 'refund':
      if (booking.stripe_session_id && booking.payment_status === 'paid') {
        const session = await stripe.checkout.sessions.retrieve(booking.stripe_session_id);
        if (session.payment_intent) {
          await stripe.refunds.create({ payment_intent: session.payment_intent });
        }
      }
      updateData.status = 'refunded';
      updateData.payment_status = 'refunded';
      updateData.refund_reason = reason;
      updateData.refunded_at = new Date().toISOString();
      break;
    default:
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  }

  const { data, error } = await supabase.from('bookings').update(updateData).eq('id', bookingId).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ success: true, booking: data }), { status: 200 });
}
