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
  const status = searchParams.get('status');

  let query = supabase.from('companions').select('*');
  if (status) query = query.eq('approval_status', status);

  const { data, error } = await query.order('created_at', { ascending: false });
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ companions: data }), { status: 200 });
}

export async function POST(req) {
  const admin = await verifyAdmin(req);
  if (!admin) return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401 });

  const { action, companionId, reason } = await req.json();

  let updateData = { updated_at: new Date().toISOString() };

  switch (action) {
    case 'approve':
      updateData.approval_status = 'approved';
      updateData.approved_by = admin.id;
      updateData.approved_at = new Date().toISOString();
      break;
    case 'reject':
      updateData.approval_status = 'rejected';
      updateData.rejection_reason = reason;
      break;
    case 'suspend':
      updateData.approval_status = 'suspended';
      updateData.suspension_reason = reason;
      updateData.suspended_at = new Date().toISOString();
      break;
    case 'reactivate':
      updateData.approval_status = 'approved';
      updateData.suspension_reason = null;
      updateData.suspended_at = null;
      break;
    default:
      return new Response(JSON.stringify({ error: 'Invalid action' }), { status: 400 });
  }

  const { data, error } = await supabase.from('companions').update(updateData).eq('id', companionId).select().single();
  if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500 });

  return new Response(JSON.stringify({ success: true, companion: data }), { status: 200 });
}
