// supabase/functions/paypal-capture/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const PAYPAL_API_URL = Deno.env.get("PAYPAL_API_URL") || "https://api-m.sandbox.paypal.com";
const CLIENT_ID = Deno.env.get("PAYPAL_CLIENT_ID");
const CLIENT_SECRET = Deno.env.get("PAYPAL_CLIENT_SECRET");
const SITE_URL = Deno.env.get("NEXTAUTH_URL") || "http://localhost:8080";

// Get PayPal access token
async function getAccessToken(): Promise<string | null> {
  const auth = btoa(`${CLIENT_ID}:${CLIENT_SECRET}`);

  const response = await fetch(`${PAYPAL_API_URL}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  return data.access_token || null;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL") ?? "",
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
  );

  // Handle GET request (PayPal redirect after approval)
  if (req.method === "GET") {
    try {
      const url = new URL(req.url);
      const token = url.searchParams.get("token");
      const payerId = url.searchParams.get("PayerID");

      if (!token) {
        return Response.redirect(
          `${SITE_URL}/stripe/flight-cancelled?error=missing_token`,
          302
        );
      }

      const accessToken = await getAccessToken();

      if (!accessToken) {
        return Response.redirect(
          `${SITE_URL}/stripe/flight-cancelled?error=auth_failed`,
          302
        );
      }

      // Capture the PayPal order
      const captureResponse = await fetch(
        `${PAYPAL_API_URL}/v2/checkout/orders/${token}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const captureData = await captureResponse.json();

      if (!captureResponse.ok || captureData.status !== "COMPLETED") {
        console.error("PayPal capture failed:", captureData);
        return Response.redirect(
          `${SITE_URL}/stripe/flight-cancelled?error=capture_failed`,
          302
        );
      }

      // Extract custom data from the order
      const purchaseUnit = captureData.purchase_units?.[0];
      let customData: Record<string, string | null> = {};
      try {
        customData = JSON.parse(
          purchaseUnit?.payments?.captures?.[0]?.custom_id ||
          purchaseUnit?.custom_id ||
          "{}"
        );
      } catch {
        customData = {};
      }

      // Update booking status if we have user_id
      if (customData.user_id) {
        // Find the most recent pending booking for this user
        const { data: bookings, error: fetchError } = await supabase
          .from("bookings")
          .select("id")
          .eq("traveler_id", customData.user_id)
          .eq("status", "pending")
          .order("created_at", { ascending: false })
          .limit(1);

        if (!fetchError && bookings && bookings.length > 0) {
          const bookingId = bookings[0].id;

          // Update booking to confirmed
          await supabase
            .from("bookings")
            .update({
              status: "confirmed",
              updated_at: new Date().toISOString(),
            })
            .eq("id", bookingId);

          console.log("Booking confirmed:", bookingId);

          // Create payout record if companion is assigned
          if (customData.companion_id) {
            const capturedAmount = parseFloat(
              purchaseUnit?.payments?.captures?.[0]?.amount?.value || "0"
            );
            const platformFee = capturedAmount * 0.1; // 10% platform fee
            const companionAmount = capturedAmount - platformFee;

            await supabase.from("payouts").insert({
              booking_id: bookingId,
              amount: companionAmount,
              currency: purchaseUnit?.payments?.captures?.[0]?.amount?.currency_code || "USD",
              payment_status: "pending",
              payment_method: "paypal",
            });

            console.log("Payout record created for booking:", bookingId);
          }
        }
      }

      // Redirect to success page
      return Response.redirect(
        `${SITE_URL}/stripe/flight-success?paypal_order_id=${token}&status=completed`,
        302
      );
    } catch (error) {
      console.error("PayPal capture error:", error);
      return Response.redirect(
        `${SITE_URL}/stripe/flight-cancelled?error=server_error`,
        302
      );
    }
  }

  // Handle POST request (programmatic capture)
  if (req.method === "POST") {
    try {
      const body = await req.json();
      const { orderId } = body;

      if (!orderId) {
        return new Response(
          JSON.stringify({ error: "Order ID is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const accessToken = await getAccessToken();

      if (!accessToken) {
        return new Response(
          JSON.stringify({ error: "Failed to get PayPal access token" }),
          { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Capture the PayPal order
      const captureResponse = await fetch(
        `${PAYPAL_API_URL}/v2/checkout/orders/${orderId}/capture`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${accessToken}`,
            "Content-Type": "application/json",
          },
        }
      );

      const captureData = await captureResponse.json();

      if (!captureResponse.ok) {
        console.error("PayPal capture failed:", captureData);
        return new Response(
          JSON.stringify({ error: captureData.message || "Failed to capture payment" }),
          { status: captureResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Extract capture details
      const capture = captureData.purchase_units?.[0]?.payments?.captures?.[0];

      return new Response(
        JSON.stringify({
          status: captureData.status,
          captureId: capture?.id,
          amount: capture?.amount,
          orderId: captureData.id,
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      console.error("PayPal capture error:", error);
      return new Response(
        JSON.stringify({ error: error?.message || "Internal server error" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
  }

  return new Response(
    JSON.stringify({ error: "Method not allowed" }),
    { status: 405, headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
});
