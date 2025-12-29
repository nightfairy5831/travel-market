// supabase/functions/amadeus-price-offer/index.ts
// Re-prices a flight offer to get the latest price and ensure it's still available
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const AMADEUS_CLIENT_ID = Deno.env.get("AMADEUS_CLIENT_ID");
const AMADEUS_CLIENT_SECRET = Deno.env.get("AMADEUS_CLIENT_SECRET");
const BASE_URL = "https://test.api.amadeus.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

let cachedToken: string | null = null;
let tokenExpiry = 0;

async function getAmadeusToken(): Promise<string> {
  const now = Date.now();
  if (cachedToken && now < tokenExpiry) return cachedToken;

  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: AMADEUS_CLIENT_ID!,
    client_secret: AMADEUS_CLIENT_SECRET!,
  });

  const tokenRes = await fetch(`${BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: body.toString(),
  });

  if (!tokenRes.ok) {
    const err = await tokenRes.text();
    console.error("Amadeus token fetch error:", err);
    throw new Error("Failed to get Amadeus token");
  }

  const tokenData = await tokenRes.json();
  cachedToken = tokenData.access_token;
  tokenExpiry = now + tokenData.expires_in * 1000 - 60_000;
  return cachedToken!;
}

serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Verify JWT token
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Create Supabase admin client to validate user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const {
      data: { user },
      error: userError,
    } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { flight_offer } = body;

    if (!flight_offer) {
      return new Response(
        JSON.stringify({
          error: "Missing required field: flight_offer",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check Amadeus credentials
    if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
      return new Response(
        JSON.stringify({ error: "Amadeus credentials not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = await getAmadeusToken();

    // Amadeus Flight Offers Price API
    // POST /v1/shopping/flight-offers/pricing
    const pricingPayload = {
      data: {
        type: "flight-offers-pricing",
        flightOffers: [flight_offer],
      },
    };

    console.log("Calling Amadeus pricing API...");

    const pricingRes = await fetch(
      `${BASE_URL}/v1/shopping/flight-offers/pricing`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(pricingPayload),
      }
    );

    const pricingData = await pricingRes.json();

    if (!pricingRes.ok) {
      console.error("Amadeus pricing error:", pricingData);
      return new Response(
        JSON.stringify({
          error: "Amadeus pricing API error",
          details: pricingData,
        }),
        {
          status: pricingRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Successfully re-priced the flight offer
    // The response contains updated flight offers with current pricing
    const pricedOffer = pricingData.data?.flightOffers?.[0];

    return new Response(
      JSON.stringify({
        success: true,
        data: pricedOffer,
        original_price: flight_offer.price,
        updated_price: pricedOffer?.price,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
