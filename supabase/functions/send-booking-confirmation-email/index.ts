// supabase/functions/send-booking-confirmation-email/index.ts
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

    // Validate JWT Bearer token
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing authorization token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);

    if (userError || !user?.id) {
      return new Response(
        JSON.stringify({ success: false, error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Parse request body
    const body = await req.json().catch(() => ({}));
    const { booking_id, user_email, flight_details } = body;

    if (!user_email || !flight_details) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing required fields" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const {
      flight_number,
      departure_airport,
      destination_airport,
      departure_date,
      price,
      airline_name,
    } = flight_details;

    // Format date
    const formattedDate = departure_date
      ? new Date(departure_date).toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      : "TBD";

    // Format price
    const formattedPrice = price
      ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(price)
      : "N/A";

    // Send email via Postmark
    const postmarkResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": Deno.env.get("POSTMARK_SERVER_TOKEN") ?? "",
      },
      body: JSON.stringify({
        From: Deno.env.get("POSTMARK_FROM_EMAIL") ?? "support@aidhandy.com",
        To: user_email,
        Subject: "Your Booking Confirmation - AidHandy",
        HtmlBody: `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px; margin: 0; }
              .container { max-width: 600px; margin: 0 auto; background: white; padding: 30px; border-radius: 10px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
              .header { text-align: center; margin-bottom: 30px; }
              .header h1 { color: #ff7a00; margin: 0; }
              .success-icon { font-size: 48px; margin-bottom: 10px; }
              .flight-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .flight-details h2 { color: #333; margin-top: 0; font-size: 18px; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { color: #666; font-weight: 500; }
              .detail-value { color: #333; font-weight: 600; }
              .price-section { background-color: #ff7a00; color: white; padding: 15px 20px; border-radius: 8px; text-align: center; margin: 20px 0; }
              .price-section .amount { font-size: 28px; font-weight: bold; }
              .btn { display: inline-block; padding: 12px 30px; background-color: #ff7a00; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
              .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
              .footer a { color: #ff7a00; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">&#10004;</div>
                <h1>Booking Confirmed!</h1>
                <p style="color: #666;">Thank you for booking with AidHandy</p>
              </div>

              <p>Hi there,</p>
              <p>Great news! Your flight booking has been confirmed. Here are your booking details:</p>

              <div class="flight-details">
                <h2>Flight Information</h2>
                <div class="detail-row">
                  <span class="detail-label">Flight Number</span>
                  <span class="detail-value">${airline_name || ""} ${flight_number || "N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Departure</span>
                  <span class="detail-value">${departure_airport || "N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Destination</span>
                  <span class="detail-value">${destination_airport || "N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                ${booking_id ? `
                <div class="detail-row">
                  <span class="detail-label">Booking Reference</span>
                  <span class="detail-value">${booking_id.slice(0, 8).toUpperCase()}</span>
                </div>
                ` : ""}
              </div>

              <div class="price-section">
                <div>Total Paid</div>
                <div class="amount">${formattedPrice}</div>
              </div>

              <div style="text-align: center;">
                <a href="${Deno.env.get("NEXTAUTH_URL") || "https://aidhandy.com"}/dashboard/Booked-Flights" class="btn">View Your Booking</a>
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
Booking Confirmed!

Thank you for booking with AidHandy.

Flight Information:
- Flight Number: ${airline_name || ""} ${flight_number || "N/A"}
- Departure: ${departure_airport || "N/A"}
- Destination: ${destination_airport || "N/A"}
- Date: ${formattedDate}
${booking_id ? `- Booking Reference: ${booking_id.slice(0, 8).toUpperCase()}` : ""}

Total Paid: ${formattedPrice}

View your booking at: ${Deno.env.get("NEXTAUTH_URL") || "https://aidhandy.com"}/dashboard/Booked-Flights

If you have any questions, please contact us at support@aidhandy.com

AidHandy Team
        `,
        MessageStream: "outbound",
      }),
    });

    if (!postmarkResponse.ok) {
      const errorText = await postmarkResponse.text();
      console.error("Postmark error:", postmarkResponse.status, errorText);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to send email" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log("Booking confirmation email sent to:", user_email);

    return new Response(
      JSON.stringify({ success: true, message: "Confirmation email sent successfully" }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending confirmation email:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
