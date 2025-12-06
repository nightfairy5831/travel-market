import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get('stripe-signature');

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return new Response(`Webhook Error: ${err.message}`, { status: 400 });
  }

  const { type, data } = event;

  switch (type) {
    case 'checkout.session.completed':
      await handleCheckoutCompleted(data.object);
      break;
    case 'payment_intent.succeeded':
      await handlePaymentSucceeded(data.object);
      break;
    case 'payment_intent.payment_failed':
      await handlePaymentFailed(data.object);
      break;
    case 'charge.refunded':
      await handleRefund(data.object);
      break;
    case 'account.updated':
      await handleAccountUpdated(data.object);
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

async function handleCheckoutCompleted(session) {
  const { booking_id } = session.metadata || {};
  if (!booking_id) return;

  await supabase.from('bookings').update({
    status: 'confirmed',
    payment_status: 'paid',
    stripe_session_id: session.id,
    updated_at: new Date().toISOString()
  }).eq('id', booking_id);
}

async function handlePaymentSucceeded(paymentIntent) {
  const { booking_id } = paymentIntent.metadata || {};
  if (!booking_id) return;

  await supabase.from('bookings').update({
    payment_status: 'paid',
    updated_at: new Date().toISOString()
  }).eq('id', booking_id);
}

async function handlePaymentFailed(paymentIntent) {
  const { booking_id } = paymentIntent.metadata || {};
  if (!booking_id) return;

  await supabase.from('bookings').update({
    payment_status: 'failed',
    updated_at: new Date().toISOString()
  }).eq('id', booking_id);
}

async function handleRefund(charge) {
  const { booking_id } = charge.metadata || {};
  if (!booking_id) return;

  await supabase.from('bookings').update({
    status: 'refunded',
    payment_status: 'refunded',
    updated_at: new Date().toISOString()
  }).eq('id', booking_id);
}

async function handleAccountUpdated(account) {
  await supabase.from('companions').update({
    stripe_account_status: account.charges_enabled ? 'active' : 'pending',
    stripe_onboarding_status: account.details_submitted ? 'complete' : 'in_progress',
    updated_at: new Date().toISOString()
  }).eq('stripe_account_id', account.id);
}
