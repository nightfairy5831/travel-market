import postmark from 'postmark';

const client = new postmark.ServerClient(process.env.POSTMARK_SERVER_TOKEN);
const FROM = process.env.POSTMARK_FROM_EMAIL || 'support@aidhandy.com';

export async function sendBookingConfirmation(booking, traveler) {
  return client.sendEmail({
    From: FROM,
    To: traveler.email,
    Subject: `Booking Confirmed - ${booking.flight_number}`,
    HtmlBody: `
      <h2>Booking Confirmed</h2>
      <p>Hi ${traveler.first_name},</p>
      <p>Your booking is confirmed.</p>
      <ul>
        <li>Flight: ${booking.flight_number}</li>
        <li>Route: ${booking.departure_iata} → ${booking.destination_iata}</li>
        <li>Date: ${new Date(booking.departure_date).toLocaleDateString()}</li>
      </ul>
    `,
    MessageStream: 'outbound',
  });
}

export async function sendCompanionAssigned(booking, traveler, companion) {
  return client.sendEmail({
    From: FROM,
    To: traveler.email,
    Subject: `Companion Assigned - ${booking.flight_number}`,
    HtmlBody: `
      <h2>Companion Assigned</h2>
      <p>Hi ${traveler.first_name},</p>
      <p>${companion.full_name} will be your travel companion.</p>
      <ul>
        <li>Flight: ${booking.flight_number}</li>
        <li>Date: ${new Date(booking.departure_date).toLocaleDateString()}</li>
      </ul>
    `,
    MessageStream: 'outbound',
  });
}

export async function sendPreTripReminder(booking, traveler) {
  return client.sendEmail({
    From: FROM,
    To: traveler.email,
    Subject: `Trip Reminder - ${booking.flight_number}`,
    HtmlBody: `
      <h2>Your trip is tomorrow!</h2>
      <p>Flight: ${booking.flight_number}</p>
      <p>Route: ${booking.departure_iata} → ${booking.destination_iata}</p>
    `,
    MessageStream: 'outbound',
  });
}

export async function sendCompanionApproved(companion) {
  return client.sendEmail({
    From: FROM,
    To: companion.email,
    Subject: 'Application Approved - AidHandy',
    HtmlBody: `
      <h2>Congratulations ${companion.full_name}!</h2>
      <p>Your companion application has been approved.</p>
    `,
    MessageStream: 'outbound',
  });
}

export async function sendBookingCancelled(booking, traveler, reason) {
  return client.sendEmail({
    From: FROM,
    To: traveler.email,
    Subject: `Booking Cancelled - ${booking.flight_number}`,
    HtmlBody: `
      <h2>Booking Cancelled</h2>
      <p>Hi ${traveler.first_name},</p>
      <p>Your booking has been cancelled.</p>
      ${reason ? `<p>Reason: ${reason}</p>` : ''}
    `,
    MessageStream: 'outbound',
  });
}
