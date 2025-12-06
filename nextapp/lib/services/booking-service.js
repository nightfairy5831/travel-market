import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY
);

export async function createBooking(data) {
  const { data: booking, error } = await supabase.from('bookings').insert({
    traveler_id: data.travelerId,
    companion_id: data.companionId || null,
    flight_number: data.flightNumber,
    airline_name: data.airlineName,
    departure_iata: data.departureIata,
    destination_iata: data.destinationIata,
    departure_date: data.departureDate,
    seat_number: data.seatNumber || null,
    status: 'pending',
    payment_status: 'pending',
    total_amount: data.totalAmount,
    currency: data.currency || 'USD',
  }).select().single();

  if (error) throw error;
  return booking;
}

export async function updateBookingStatus(bookingId, status) {
  const { data, error } = await supabase.from('bookings')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function assignCompanion(bookingId, companionId) {
  const { data, error } = await supabase.from('bookings')
    .update({
      companion_id: companionId,
      status: 'assigned',
      updated_at: new Date().toISOString(),
    })
    .eq('id', bookingId)
    .select()
    .single();

  if (error) throw error;
  return data;
}

export async function getBookingById(bookingId) {
  const { data, error } = await supabase.from('bookings')
    .select(`*, traveler:travellers(*), companion:companions(*)`)
    .eq('id', bookingId)
    .single();

  if (error) throw error;
  return data;
}
