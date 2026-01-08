// supabase/functions/paypal-create-order/index.ts
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
const SUPABASE_URL = Deno.env.get("SUPABASE_URL") || "";

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
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify authorization
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // Verify user token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: "Invalid or expired token" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();
    const { amount, currency = "USD", flightDetails, companionId } = body;

    if (!amount) {
      return new Response(
        JSON.stringify({ error: "Amount is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const accessToken = await getAccessToken();

    if (!accessToken) {
      console.error("Failed to get PayPal access token");
      return new Response(
        JSON.stringify({ error: "Failed to get PayPal access token" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build return/cancel URLs using the edge function for capture
    const captureUrl = `${SUPABASE_URL}/functions/v1/paypal-capture`;

    // Create PayPal order
    const orderResponse = await fetch(`${PAYPAL_API_URL}/v2/checkout/orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        intent: "CAPTURE",
        purchase_units: [
          {
            amount: {
              currency_code: currency,
              value: amount.toFixed(2),
            },
            description: flightDetails?.description || "Flight Booking - AidHandy",
            custom_id: JSON.stringify({
              user_id: user.id,
              companion_id: companionId || null,
              flight_number: flightDetails?.flightNumber || "",
              departure: flightDetails?.departure || "",
              arrival: flightDetails?.arrival || "",
              flight_date: flightDetails?.flightDate || "",
            }),
          },
        ],
        application_context: {
          brand_name: "AidHandy",
          landing_page: "NO_PREFERENCE",
          user_action: "PAY_NOW",
          return_url: captureUrl,
          cancel_url: `${SITE_URL}/stripe/flight-cancelled`,
        },
      }),
    });

    const orderData = await orderResponse.json();

    if (!orderResponse.ok) {
      console.error("PayPal order creation failed:", orderData);
      return new Response(
        JSON.stringify({ error: orderData.message || "Failed to create PayPal order" }),
        { status: orderResponse.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Find approval URL
    const approvalUrl = orderData.links?.find(
      (link: { rel: string; href: string }) => link.rel === "approve"
    )?.href;

    return new Response(
      JSON.stringify({
        orderId: orderData.id,
        approvalUrl,
        status: orderData.status,
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("PayPal create order error:", error);
    return new Response(
      JSON.stringify({ error: error?.message || "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
