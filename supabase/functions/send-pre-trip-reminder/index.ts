// supabase/functions/send-pre-trip-reminder/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Parse request body - can be called with specific booking or to process all upcoming
    const body = await req.json().catch(() => ({}));
    const { booking_id, reminder_days = 1 } = body;

    const postmarkToken = Deno.env.get("POSTMARK_SERVER_TOKEN") ?? "";
    const fromEmail = Deno.env.get("POSTMARK_FROM_EMAIL") ?? "support@aidhandy.com";
    const baseUrl = Deno.env.get("NEXTAUTH_URL") || "https://aidhandy.com";

    let bookingsToNotify = [];

    if (booking_id) {
      // Single booking reminder
      const { data: booking, error } = await supabase
        .from("bookings")
        .select(`
          *,
          traveler:users!traveler_id (
            id,
            email,
            full_name
          )
        `)
        .eq("id", booking_id)
        .eq("status", "confirmed")
        .single();

      if (error || !booking) {
        return new Response(
          JSON.stringify({ success: false, error: "Booking not found or not confirmed" }),
          { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      bookingsToNotify = [booking];
    } else {
      // Batch processing: Find all confirmed bookings departing in X days
      const targetDate = new Date();
      targetDate.setDate(targetDate.getDate() + reminder_days);
      const targetDateStr = targetDate.toISOString().split("T")[0];

      const { data: bookings, error } = await supabase
        .from("bookings")
        .select(`
          *,
          traveler:users!traveler_id (
            id,
            email,
            full_name
          )
        `)
        .eq("status", "confirmed")
        .eq("departure_date", targetDateStr);

      if (error) {
        console.error("Error fetching bookings:", error);
        return new Response(
          JSON.stringify({ success: false, error: "Failed to fetch bookings" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      bookingsToNotify = bookings || [];
    }

    if (bookingsToNotify.length === 0) {
      return new Response(
        JSON.stringify({ success: true, message: "No bookings to remind", count: 0 }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const results = [];

    for (const booking of bookingsToNotify) {
      const travelerEmail = booking.traveler?.email;
      const travelerName = booking.traveler?.full_name || "Traveler";

      if (!travelerEmail) {
        results.push({ booking_id: booking.id, success: false, error: "No traveler email" });
        continue;
      }

      // Format departure date
      const departureDate = new Date(booking.departure_date);
      const formattedDate = departureDate.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      });

      // Calculate days until departure
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      departureDate.setHours(0, 0, 0, 0);
      const daysUntil = Math.ceil((departureDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      const urgencyText = daysUntil === 0 ? "TODAY" : daysUntil === 1 ? "TOMORROW" : `in ${daysUntil} days`;

      const emailResponse = await fetch("https://api.postmarkapp.com/email", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Postmark-Server-Token": postmarkToken,
        },
        body: JSON.stringify({
          From: fromEmail,
          To: travelerEmail,
          Subject: `Trip Reminder: Your flight is ${urgencyText} - AidHandy`,
          HtmlBody: `
            <!DOCTYPE html>
            <html>
            <head>
              <style>
                body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0; }
                .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
                .header { text-align: center; margin-bottom: 30px; }
                .header h1 { color: #ff7a00; margin: 0; }
                .reminder-icon { font-size: 48px; margin-bottom: 10px; }
                .countdown { background: linear-gradient(135deg, #ff7a00 0%, #ff9500 100%); color: white; padding: 25px; border-radius: 8px; margin: 20px 0; text-align: center; }
                .countdown .days { font-size: 48px; font-weight: bold; }
                .countdown .label { font-size: 16px; opacity: 0.9; }
                .flight-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
                .flight-details h2 { color: #333; margin-top: 0; font-size: 18px; }
                .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
                .detail-row:last-child { border-bottom: none; }
                .detail-label { color: #666; font-weight: 500; }
                .detail-value { color: #333; font-weight: 600; }
                .checklist { background-color: #fff3e0; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #ff7a00; }
                .checklist h3 { color: #333; margin-top: 0; }
                .checklist ul { margin: 0; padding-left: 20px; }
                .checklist li { padding: 5px 0; color: #555; }
                .btn { display: inline-block; padding: 12px 30px; background-color: #ff7a00; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
                .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
                .footer a { color: #ff7a00; text-decoration: none; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <div class="reminder-icon">&#9200;</div>
                  <h1>Trip Reminder</h1>
                  <p style="color: #666;">Your flight is coming up!</p>
                </div>

                <p>Hi ${travelerName},</p>
                <p>This is a friendly reminder about your upcoming flight with AidHandy.</p>

                <div class="countdown">
                  <div class="days">${urgencyText.toUpperCase()}</div>
                  <div class="label">Your trip departs</div>
                </div>

                <div class="flight-details">
                  <h2>Flight Information</h2>
                  <div class="detail-row">
                    <span class="detail-label">Flight</span>
                    <span class="detail-value">${booking.airline_name || ""} ${booking.flight_number || "N/A"}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">From</span>
                    <span class="detail-value">${booking.departure_airport || booking.departure_iata || "N/A"}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">To</span>
                    <span class="detail-value">${booking.destination_airport || booking.destination_iata || "N/A"}</span>
                  </div>
                  <div class="detail-row">
                    <span class="detail-label">Date</span>
                    <span class="detail-value">${formattedDate}</span>
                  </div>
                  ${booking.seat_number ? `
                  <div class="detail-row">
                    <span class="detail-label">Seat</span>
                    <span class="detail-value">${booking.seat_number}</span>
                  </div>
                  ` : ""}
                  ${booking.pnr ? `
                  <div class="detail-row">
                    <span class="detail-label">Booking Ref</span>
                    <span class="detail-value">${booking.pnr}</span>
                  </div>
                  ` : ""}
                </div>

                <div class="checklist">
                  <h3>Pre-Trip Checklist</h3>
                  <ul>
                    <li>Check your passport/ID is valid</li>
                    <li>Arrive at the airport at least 2 hours before departure</li>
                    <li>Have your booking confirmation ready</li>
                    <li>Review baggage allowance for your ticket</li>
                    <li>Check for any travel advisories</li>
                  </ul>
                </div>

                <div style="text-align: center;">
                  <a href="${baseUrl}/dashboard/Booked-Flights" class="btn">View Booking Details</a>
                </div>

                <div class="footer">
                  <p>If you have any questions, please contact us at <a href="mailto:support@aidhandy.com">support@aidhandy.com</a></p>
                  <p>&copy; ${new Date().getFullYear()} AidHandy. All rights reserved.</p>
                </div>
              </div>
            </body>
            </html>
          `,
          TextBody: `
Trip Reminder - Your flight is ${urgencyText}!

Hi ${travelerName},

This is a friendly reminder about your upcoming flight with AidHandy.

Flight Information:
- Flight: ${booking.airline_name || ""} ${booking.flight_number || "N/A"}
- From: ${booking.departure_airport || booking.departure_iata || "N/A"}
- To: ${booking.destination_airport || booking.destination_iata || "N/A"}
- Date: ${formattedDate}
${booking.seat_number ? `- Seat: ${booking.seat_number}` : ""}
${booking.pnr ? `- Booking Ref: ${booking.pnr}` : ""}

Pre-Trip Checklist:
- Check your passport/ID is valid
- Arrive at the airport at least 2 hours before departure
- Have your booking confirmation ready
- Review baggage allowance for your ticket
- Check for any travel advisories

View your booking at: ${baseUrl}/dashboard/Booked-Flights

If you have any questions, please contact us at support@aidhandy.com

AidHandy Team
          `,
          MessageStream: "outbound",
        }),
      });

      const success = emailResponse.ok;
      if (!success) {
        console.error(`Failed to send reminder for booking ${booking.id}:`, await emailResponse.text());
      } else {
        console.log(`Pre-trip reminder sent to ${travelerEmail} for booking ${booking.id}`);
      }

      results.push({ booking_id: booking.id, success, email: travelerEmail });
    }

    const successCount = results.filter((r) => r.success).length;

    return new Response(
      JSON.stringify({
        success: true,
        message: `Sent ${successCount}/${results.length} reminders`,
        count: successCount,
        total: results.length,
        results,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending pre-trip reminders:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
