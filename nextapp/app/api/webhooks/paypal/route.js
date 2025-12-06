import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  const body = await req.json();
  const eventType = body.event_type;

  switch (eventType) {
    case 'CHECKOUT.ORDER.APPROVED':
      await handleOrderApproved(body.resource);
      break;
    case 'PAYMENT.CAPTURE.COMPLETED':
      await handleCaptureCompleted(body.resource);
      break;
    case 'PAYMENT.CAPTURE.DENIED':
      await handleCaptureDenied(body.resource);
      break;
    case 'PAYMENT.CAPTURE.REFUNDED':
      await handleRefunded(body.resource);
      break;
  }

  return new Response(JSON.stringify({ received: true }), { status: 200 });
}

async function handleOrderApproved(resource) {
  const bookingId = resource.purchase_units?.[0]?.custom_id;
  if (!bookingId) return;

  await supabase.from('bookings').update({
    paypal_order_id: resource.id,
    updated_at: new Date().toISOString()
  }).eq('id', bookingId);
}

async function handleCaptureCompleted(resource) {
  const bookingId = resource.custom_id;
  if (!bookingId) return;

  await supabase.from('bookings').update({
    status: 'confirmed',
    payment_status: 'paid',
    paypal_capture_id: resource.id,
    updated_at: new Date().toISOString()
  }).eq('id', bookingId);
}

async function handleCaptureDenied(resource) {
  const bookingId = resource.custom_id;
  if (!bookingId) return;

  await supabase.from('bookings').update({
    payment_status: 'failed',
    updated_at: new Date().toISOString()
  }).eq('id', bookingId);
}

async function handleRefunded(resource) {
  const bookingId = resource.custom_id;
  if (!bookingId) return;

  await supabase.from('bookings').update({
    status: 'refunded',
    payment_status: 'refunded',
    updated_at: new Date().toISOString()
  }).eq('id', bookingId);
}
