// Follow this setup guide to integrate the Deno language server with your editor:
// https://deno.land/manual/getting_started/setup_your_environment
// This enables autocomplete, go to definition, etc.

// Setup type definitions for built-in Supabase Runtime APIs
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const AMADEUS_CLIENT_ID = Deno.env.get("AMADEUS_CLIENT_ID");
const AMADEUS_CLIENT_SECRET = Deno.env.get("AMADEUS_CLIENT_SECRET");
const BASE_URL = "https://test.api.amadeus.com";

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
  tokenExpiry = now + tokenData.expires_in * 1000 - 60_000; // subtract 1 min buffer
  return cachedToken;
}

serve(async (req) => {
  if (req.method !== "POST")
    return new Response("Method Not Allowed", { status: 405 });

  try {
    const body = await req.json();
    let url: string;

    // Detect mode automatically
    if (body.flight_number) {
      // 🛫 Case 1: Search by flight number
      url = `${BASE_URL}/v2/shopping/flight-offers?flightNumber=${body.flight_number}`;
    } else {
      // 🛫 Case 2: Route search (departure + destination)
      const { departure_airport, destination_airport, preferred_date } = body;

      if (!departure_airport || !destination_airport) {
        return new Response(
          JSON.stringify({
            success: false,
            message:
              "Missing required fields: departure_airport or destination_airport",
          }),
          { status: 400, headers: { "Content-Type": "application/json" } }
        );
      }

      const params = new URLSearchParams({
        originLocationCode: departure_airport,
        destinationLocationCode: destination_airport,
        adults: "1",
      });

      if (preferred_date) params.set("departureDate", preferred_date);
      url = `${BASE_URL}/v2/shopping/flight-offers?${params.toString()}`;
    }

    const token = await getAmadeusToken();

    const amadeusRes = await fetch(url, {
      method: "GET",
      headers: {
        Authorization: `Bearer ${token}`,
        Accept: "application/json",
      },
    });

    if (!amadeusRes.ok) {
      const err = await amadeusRes.text();
      console.error("Amadeus flights API error:", err);
      return new Response(
        JSON.stringify({ success: false, message: "Amadeus API error", error: err }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    const data = await amadeusRes.json();
    return new Response(JSON.stringify({ success: true, data }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("Edge function error:", err);
    return new Response(
      JSON.stringify({ success: false, message: err.message }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});




/* To invoke locally:

  1. Run `supabase start` (see: https://supabase.com/docs/reference/cli/supabase-start)
  2. Make an HTTP request:

  curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/amadeus-flights' \
    --header 'Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0' \
    --header 'Content-Type: application/json' \
    --data '{"name":"Functions"}'

*/
