import { createClient } from '@supabase/supabase-js';

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
  const type = searchParams.get('type');

  let csv = '';

  if (type === 'bookings') {
    const { data } = await supabase.from('bookings').select(`
      id, status, payment_status, total_amount, currency, flight_number,
      departure_iata, destination_iata, departure_date, created_at,
      traveler:travellers(first_name, last_name, email),
      companion:companions(full_name, email)
    `).order('created_at', { ascending: false });

    csv = 'ID,Status,Payment,Amount,Currency,Flight,From,To,Date,Traveler,Email,Companion,Created\n';
    data?.forEach(b => {
      csv += `${b.id},${b.status},${b.payment_status},${b.total_amount || ''},${b.currency || ''},`;
      csv += `${b.flight_number || ''},${b.departure_iata},${b.destination_iata},${b.departure_date},`;
      csv += `${b.traveler?.first_name} ${b.traveler?.last_name},${b.traveler?.email},`;
      csv += `${b.companion?.full_name || ''},${b.created_at}\n`;
    });
  } else if (type === 'companions') {
    const { data } = await supabase.from('companions').select('*').order('created_at', { ascending: false });

    csv = 'ID,Name,Email,Phone,Status,Stripe,Created\n';
    data?.forEach(c => {
      csv += `${c.id},${c.full_name},${c.email},${c.phone},${c.approval_status || 'pending'},${c.stripe_onboarding_status || ''},${c.created_at}\n`;
    });
  } else {
    return new Response(JSON.stringify({ error: 'Invalid type' }), { status: 400 });
  }

  return new Response(csv, {
    headers: {
      'Content-Type': 'text/csv',
      'Content-Disposition': `attachment; filename="${type}-${Date.now()}.csv"`,
    },
  });
}
