// supabase/functions/amadeus-create-booking/index.ts
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
    const { flight_offer, travelers, remarks, contacts } = body;

    if (!flight_offer || !travelers || travelers.length === 0) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: flight_offer, travelers",
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

    // Extract traveler IDs from the flight offer's travelerPricings
    // The traveler IDs in our request MUST match those in the flight offer
    const travelerPricings = flight_offer.travelerPricings || [];
    const travelerIds = travelerPricings.map((tp: any) => tp.travelerId);

    console.log("Flight offer traveler IDs:", travelerIds);
    console.log("Number of travelers provided:", travelers.length);

    // Amadeus Flight Orders API
    // POST /v1/booking/flight-orders
    // Simplified payload based on Amadeus documentation - minimal required fields
    const bookingPayload = {
      data: {
        type: "flight-order",
        flightOffers: [flight_offer],
        travelers: travelers.map((t: any, index: number) => {
          // Use the traveler ID from the flight offer if available, otherwise use index+1
          const travelerId = travelerIds[index] || `${index + 1}`;

          // Clean phone number - remove any non-digit characters
          const cleanPhone = (t.phone || "0000000000").replace(/\D/g, "").slice(0, 15) || "0000000000";

          return {
            id: travelerId,
            dateOfBirth: t.date_of_birth || t.dateOfBirth || "1982-01-16",
            name: {
              firstName: (t.first_name || t.firstName || "JORGE").toUpperCase().slice(0, 50),
              lastName: (t.last_name || t.lastName || "GONZALES").toUpperCase().slice(0, 50),
            },
            gender: t.gender?.toUpperCase() || "MALE",
            contact: {
              emailAddress: t.email || "test@example.com",
              phones: [
                {
                  deviceType: "MOBILE",
                  countryCallingCode: (t.country_code || "34").replace(/\D/g, ""),
                  number: cleanPhone,
                },
              ],
            },
            documents: [
              {
                documentType: "PASSPORT",
                birthPlace: "Madrid",
                issuanceLocation: "Madrid",
                issuanceDate: "2020-04-14",
                number: "00000000",
                expiryDate: "2030-04-14",
                issuanceCountry: "ES",
                validityCountry: "ES",
                nationality: "ES",
                holder: true,
              },
            ],
          };
        }),
        remarks: {
          general: [
            {
              subType: "GENERAL_MISCELLANEOUS",
              text: "ONLINE BOOKING VIA AMADEUS SELF SERVICE",
            },
          ],
        },
      },
    };

    console.log("Booking payload:", JSON.stringify(bookingPayload, null, 2));

    const bookingRes = await fetch(`${BASE_URL}/v1/booking/flight-orders`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(bookingPayload),
    });

    const bookingData = await bookingRes.json();

    if (!bookingRes.ok) {
      console.error("Amadeus create booking error:", JSON.stringify(bookingData, null, 2));
      console.error("Amadeus error details:", bookingData?.errors);
      return new Response(
        JSON.stringify({
          error: "Amadeus API error",
          details: bookingData,
          errors: bookingData?.errors,
        }),
        {
          status: bookingRes.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Successfully created booking
    return new Response(
      JSON.stringify({
        success: true,
        data: bookingData.data,
        booking_reference: bookingData.data?.id,
        pnr: bookingData.data?.associatedRecords?.[0]?.reference,
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

/*
To invoke locally:

1. Start your Supabase local dev environment:
   supabase start

2. Call function locally:
   curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/amadeus-create-booking' \
   --header 'Authorization: Bearer <YOUR_SUPABASE_JWT>' \
   --header 'Content-Type: application/json' \
   --data '{
      "flight_offer": { ... },
      "travelers": [{ "first_name": "John", "last_name": "Doe", "email": "john@example.com" }]
    }'

3. Deploy to Supabase:
   supabase functions deploy amadeus-create-booking
*/
