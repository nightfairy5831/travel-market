// supabase/functions/send-companion-assignment-notification/index.ts
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
    const { pairing_id, traveler_email, companion_email, flight_details, companion_name, traveler_name } = body;

    if (!traveler_email || !companion_email || !flight_details) {
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
      airline_name,
      seat_number,
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

    const postmarkToken = Deno.env.get("POSTMARK_SERVER_TOKEN") ?? "";
    const fromEmail = Deno.env.get("POSTMARK_FROM_EMAIL") ?? "support@aidhandy.com";
    const baseUrl = Deno.env.get("NEXTAUTH_URL") || "https://aidhandy.com";

    // Send email to Traveler
    const travelerEmailResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkToken,
      },
      body: JSON.stringify({
        From: fromEmail,
        To: traveler_email,
        Subject: "Companion Assigned to Your Trip - AidHandy",
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
              .companion-card { background: linear-gradient(135deg, #ff7a00 0%, #ff9500 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .companion-card h2 { margin: 0 0 5px 0; font-size: 24px; }
              .companion-card p { margin: 0; opacity: 0.9; }
              .flight-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .flight-details h2 { color: #333; margin-top: 0; font-size: 18px; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { color: #666; font-weight: 500; }
              .detail-value { color: #333; font-weight: 600; }
              .btn { display: inline-block; padding: 12px 30px; background-color: #ff7a00; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
              .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
              .footer a { color: #ff7a00; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">&#129309;</div>
                <h1>Companion Assigned!</h1>
                <p style="color: #666;">Great news for your upcoming trip</p>
              </div>

              <p>Hi ${traveler_name || "there"},</p>
              <p>A travel companion has been assigned to assist you on your upcoming flight!</p>

              <div class="companion-card">
                <h2>${companion_name || "Your Companion"}</h2>
                <p>Will be traveling with you</p>
              </div>

              <div class="flight-details">
                <h2>Flight Information</h2>
                <div class="detail-row">
                  <span class="detail-label">Flight</span>
                  <span class="detail-value">${airline_name || ""} ${flight_number || "N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Route</span>
                  <span class="detail-value">${departure_airport || "N/A"} → ${destination_airport || "N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                ${seat_number ? `
                <div class="detail-row">
                  <span class="detail-label">Seat</span>
                  <span class="detail-value">${seat_number}</span>
                </div>
                ` : ""}
              </div>

              <div style="text-align: center;">
                <a href="${baseUrl}/dashboard/Booked-Flights" class="btn">View Trip Details</a>
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
Companion Assigned!

Hi ${traveler_name || "there"},

A travel companion has been assigned to assist you on your upcoming flight!

Companion: ${companion_name || "Your Companion"}

Flight Information:
- Flight: ${airline_name || ""} ${flight_number || "N/A"}
- Route: ${departure_airport || "N/A"} → ${destination_airport || "N/A"}
- Date: ${formattedDate}
${seat_number ? `- Seat: ${seat_number}` : ""}

View your trip at: ${baseUrl}/dashboard/Booked-Flights

If you have any questions, please contact us at support@aidhandy.com

AidHandy Team
        `,
        MessageStream: "outbound",
      }),
    });

    // Send email to Companion
    const companionEmailResponse = await fetch("https://api.postmarkapp.com/email", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Postmark-Server-Token": postmarkToken,
      },
      body: JSON.stringify({
        From: fromEmail,
        To: companion_email,
        Subject: "New Trip Assignment - AidHandy",
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
              .traveler-card { background: linear-gradient(135deg, #2563eb 0%, #3b82f6 100%); color: white; padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center; }
              .traveler-card h2 { margin: 0 0 5px 0; font-size: 24px; }
              .traveler-card p { margin: 0; opacity: 0.9; }
              .flight-details { background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0; }
              .flight-details h2 { color: #333; margin-top: 0; font-size: 18px; }
              .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #eee; }
              .detail-row:last-child { border-bottom: none; }
              .detail-label { color: #666; font-weight: 500; }
              .detail-value { color: #333; font-weight: 600; }
              .btn { display: inline-block; padding: 12px 30px; background-color: #ff7a00; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; margin-top: 20px; }
              .footer { margin-top: 30px; text-align: center; color: #999; font-size: 12px; }
              .footer a { color: #ff7a00; text-decoration: none; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <div class="success-icon">&#9992;</div>
                <h1>New Trip Assignment!</h1>
                <p style="color: #666;">You've been assigned to assist a traveler</p>
              </div>

              <p>Hi ${companion_name || "there"},</p>
              <p>You have been assigned to accompany a traveler on an upcoming flight. Please review the details below.</p>

              <div class="traveler-card">
                <h2>${traveler_name || "Your Traveler"}</h2>
                <p>Needs your assistance</p>
              </div>

              <div class="flight-details">
                <h2>Flight Information</h2>
                <div class="detail-row">
                  <span class="detail-label">Flight</span>
                  <span class="detail-value">${airline_name || ""} ${flight_number || "N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Route</span>
                  <span class="detail-value">${departure_airport || "N/A"} → ${destination_airport || "N/A"}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date</span>
                  <span class="detail-value">${formattedDate}</span>
                </div>
                ${seat_number ? `
                <div class="detail-row">
                  <span class="detail-label">Seat</span>
                  <span class="detail-value">${seat_number}</span>
                </div>
                ` : ""}
              </div>

              <div style="text-align: center;">
                <a href="${baseUrl}/dashboard" class="btn">View Assignment</a>
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
New Trip Assignment!

Hi ${companion_name || "there"},

You have been assigned to accompany a traveler on an upcoming flight.

Traveler: ${traveler_name || "Your Traveler"}

Flight Information:
- Flight: ${airline_name || ""} ${flight_number || "N/A"}
- Route: ${departure_airport || "N/A"} → ${destination_airport || "N/A"}
- Date: ${formattedDate}
${seat_number ? `- Seat: ${seat_number}` : ""}

View your assignment at: ${baseUrl}/dashboard

If you have any questions, please contact us at support@aidhandy.com

AidHandy Team
        `,
        MessageStream: "outbound",
      }),
    });

    const travelerSuccess = travelerEmailResponse.ok;
    const companionSuccess = companionEmailResponse.ok;

    if (!travelerSuccess) {
      console.error("Failed to send traveler email:", await travelerEmailResponse.text());
    }
    if (!companionSuccess) {
      console.error("Failed to send companion email:", await companionEmailResponse.text());
    }

    console.log("Companion assignment notifications sent:", { traveler_email, companion_email, pairing_id });

    return new Response(
      JSON.stringify({
        success: travelerSuccess && companionSuccess,
        traveler_notified: travelerSuccess,
        companion_notified: companionSuccess,
        message: "Assignment notifications processed",
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );

  } catch (error) {
    console.error("Error sending assignment notification:", error);
    return new Response(
      JSON.stringify({ success: false, error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
