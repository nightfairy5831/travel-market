'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/libs/supabaseClient';

export default function AdminBookingsPage() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => { fetchBookings(); }, [filter]);

  async function fetchBookings() {
    setLoading(true);
    const { data: { session } } = await supabase.auth.getSession();
    const params = filter ? `?status=${filter}` : '';
    const res = await fetch(`/api/admin/bookings${params}`, {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const data = await res.json();
    setBookings(data.bookings || []);
    setLoading(false);
  }

  async function handleAction(action, bookingId) {
    const reason = prompt(`${action} reason:`);
    if (!reason) return;
    const { data: { session } } = await supabase.auth.getSession();
    await fetch('/api/admin/bookings', {
      method: 'POST',
      headers: { Authorization: `Bearer ${session?.access_token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, bookingId, reason }),
    });
    fetchBookings();
  }

  async function exportCSV() {
    const { data: { session } } = await supabase.auth.getSession();
    const res = await fetch('/api/admin/export?type=bookings', {
      headers: { Authorization: `Bearer ${session?.access_token}` },
    });
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `bookings-${Date.now()}.csv`;
    a.click();
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Booking Management</h1>
        <button onClick={exportCSV} className="px-4 py-2 bg-gray-800 text-white rounded">Export CSV</button>
      </div>
      <div className="mb-4 flex gap-2">
        {['', 'pending', 'confirmed', 'cancelled', 'refunded'].map(s => (
          <button key={s} onClick={() => setFilter(s)}
            className={`px-4 py-2 rounded ${filter === s ? 'bg-blue-600 text-white' : 'bg-gray-200'}`}>
            {s || 'All'}
          </button>
        ))}
      </div>
      {loading ? <p>Loading...</p> : (
        <table className="w-full border-collapse border text-sm">
          <thead>
            <tr className="bg-gray-100">
              <th className="border p-2 text-left">Flight</th>
              <th className="border p-2 text-left">Route</th>
              <th className="border p-2 text-left">Date</th>
              <th className="border p-2 text-left">Traveler</th>
              <th className="border p-2 text-left">Companion</th>
              <th className="border p-2 text-left">Status</th>
              <th className="border p-2 text-left">Payment</th>
              <th className="border p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {bookings.map(b => (
              <tr key={b.id}>
                <td className="border p-2">{b.flight_number}</td>
                <td className="border p-2">{b.departure_iata} → {b.destination_iata}</td>
                <td className="border p-2">{b.departure_date ? new Date(b.departure_date).toLocaleDateString() : '-'}</td>
                <td className="border p-2">{b.traveler?.first_name} {b.traveler?.last_name}</td>
                <td className="border p-2">{b.companion?.full_name || '-'}</td>
                <td className="border p-2"><span className={`px-2 py-1 rounded text-xs ${b.status === 'confirmed' ? 'bg-green-100' : b.status === 'cancelled' ? 'bg-red-100' : 'bg-gray-100'}`}>{b.status}</span></td>
                <td className="border p-2">{b.payment_status}</td>
                <td className="border p-2 flex gap-1">
                  {b.status === 'confirmed' && (
                    <>
                      <button onClick={() => handleAction('cancel', b.id)} className="px-2 py-1 bg-orange-600 text-white rounded text-xs">Cancel</button>
                      <button onClick={() => handleAction('refund', b.id)} className="px-2 py-1 bg-red-600 text-white rounded text-xs">Refund</button>
                    </>
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
