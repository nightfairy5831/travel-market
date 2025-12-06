'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/libs/supabaseClient';

export default function AdminCompanionsPage() {
  const [companions, setCompanions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('pending');

  useEffect(() => { fetchCompanions(); }, [filter]);

  async function fetchCompanions() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch(`/api/admin/companions?status=${filter}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    setCompanions(data.companions || []);
    setLoading(false);
  }

  async function handleAction(action, companionId, reason = '') {
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/admin/companions', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, companionId, reason }),
    });
    fetchCompanions();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Companion Management</h1>
      <div className="mb-4 flex gap-2">
        {['pending', 'approved', 'suspended', 'rejected'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>
      {loading ? <p>Loading...</p> : (
        <table className="w-full border-collapse border">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Name</th>
              <th className="border p-2 text-left">Email</th>
              <th className="border p-2 text-left">Phone</th>
              <th className="border p-2 text-left">Stripe</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {companions.map(c => (
              <tr key={c.id}>
                <td className="border p-2">{c.full_name}</td>
                <td className="border p-2">{c.email}</td>
                <td className="border p-2">{c.phone}</td>
                <td className="border p-2">{c.stripe_onboarding_status || 'N/A'}</td>
                <td className="border p-2 flex gap-2">
                  {filter === 'pending' && (
                    <>
                      <button onClick={() => handleAction('approve', c.id)} className="px-3 py-1 bg-green-600 text-white rounded text-sm">Approve</button>
                      <button onClick={() => { const r = prompt('Reason:'); if (r) handleAction('reject', c.id, r); }} className="px-3 py-1 bg-red-600 text-white rounded text-sm">Reject</button>
                    </>
                  )}
                  {filter === 'approved' && (
                    <button onClick={() => { const r = prompt('Reason:'); if (r) handleAction('suspend', c.id, r); }} className="px-3 py-1 bg-orange-600 text-white rounded text-sm">Suspend</button>
                  )}
                  {filter === 'suspended' && (
                    <button onClick={() => handleAction('reactivate', c.id)} className="px-3 py-1 bg-blue-600 text-white rounded text-sm">Reactivate</button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
