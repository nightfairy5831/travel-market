import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

const PAYPAL_API = process.env.PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';

async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.PAYPAL_CLIENT_ID}:${process.env.PAYPAL_CLIENT_SECRET}`
  ).toString('base64');

  const res = await fetch(`${PAYPAL_API}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });

  const data = await res.json();
  return data.access_token;
}

export async function POST(req) {
  try {
    const { bookingId, amount, currency = 'USD', description } = await req.json();

    if (!bookingId || !amount) {
      return new Response(JSON.stringify({ error: 'Missing bookingId or amount' }), { status: 400 });
    }

    const accessToken = await getAccessToken();

    const res = await fetch(`${PAYPAL_API}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          custom_id: bookingId,
          description: description || 'AidHandy Booking',
          amount: { currency_code: currency, value: amount.toFixed(2) },
        }],
        application_context: {
          return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
          cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancelled`,
        },
      }),
    });

    const order = await res.json();
    if (!res.ok) {
      return new Response(JSON.stringify({ error: order }), { status: 400 });
    }

    await supabase.from('bookings').update({
      paypal_order_id: order.id,
      updated_at: new Date().toISOString()
    }).eq('id', bookingId);

    const approvalUrl = order.links.find(l => l.rel === 'approve')?.href;

    return new Response(JSON.stringify({ orderId: order.id, approvalUrl }), { status: 200 });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), { status: 500 });
  }
}
