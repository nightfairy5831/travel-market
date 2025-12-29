// supabase/functions/amadeus-seatmaps/index.ts
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

// Generate mock seatmap (fallback when API fails or for demo)
const generateMockSeatmap = (flightOfferId: string) => ({
  data: [
    {
      id: `seatmap_${flightOfferId}`,
      type: "seatmap",
      departure: {
        iataCode: "JFK",
        terminal: "1",
      },
      arrival: {
        iataCode: "LAX",
        terminal: "B",
      },
      aircraft: {
        code: "320",
        name: "Airbus A320",
      },
      decks: [
        {
          deckType: "MAIN",
          deckConfiguration: {
            width: 6,
            length: 30,
            startseatRow: 1,
            endSeatRow: 30,
            exitRowsX: [10, 25],
          },
          seats: generateSeats(),
        },
      ],
    },
  ],
});

function generateSeats() {
  const seats: any[] = [];
  const columns = ["A", "B", "C", "D", "E", "F"];

  for (let row = 1; row <= 30; row++) {
    for (const col of columns) {
      const isExit = row === 10 || row === 25;
      const isWindow = col === "A" || col === "F";
      const isAisle = col === "C" || col === "D";
      const isOccupied = Math.random() > 0.7; // 30% occupied

      seats.push({
        number: `${row}${col}`,
        designator: `${row}${col}`,
        cabin: "ECONOMY",
        characteristicsCodes: [
          isWindow ? "W" : isAisle ? "A" : "M",
          ...(isExit ? ["E"] : []),
        ],
        travelerPricing: [
          {
            seatAvailabilityStatus: isOccupied ? "BLOCKED" : "AVAILABLE",
            price: {
              currency: "USD",
              total: isExit ? "45.00" : isWindow ? "25.00" : "15.00",
            },
          },
        ],
        coordinates: {
          x: columns.indexOf(col),
          y: row,
        },
      });
    }
  }
  return seats;
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Get authorization header
    const authHeader = req.headers.get("authorization");

    let user = null;
    let isAnonymous = true;

    // Try to verify JWT token if provided
    if (authHeader && authHeader.startsWith("Bearer ")) {
      const supabaseAdmin = createClient(
        Deno.env.get("SUPABASE_URL") ?? "",
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
      );

      try {
        const {
          data: { user: authenticatedUser },
          error,
        } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));

        if (!error && authenticatedUser) {
          user = authenticatedUser;
          isAnonymous = false;
        }
      } catch (authError) {
        console.log("Authentication failed, treating as anonymous user");
      }
    }

    const { flight_offer_id, flight_order_id } = await req.json();

    if (!flight_offer_id && !flight_order_id) {
      return new Response(
        JSON.stringify({ error: "Missing flight_offer_id or flight_order_id" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if Amadeus credentials exist
    if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
      console.log("Amadeus credentials not found, using mock seatmap");
      const mockData = generateMockSeatmap(flight_offer_id || flight_order_id);
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    try {
      const token = await getAmadeusToken();

      // Amadeus Seatmap Display API
      // POST /v1/shopping/seatmaps with flight-offer in body
      const seatmapRes = await fetch(`${BASE_URL}/v1/shopping/seatmaps`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          data: [flight_offer_id],
        }),
      });

      if (!seatmapRes.ok) {
        const err = await seatmapRes.text();
        console.error("Amadeus seatmap API error:", err);
        // Fallback to mock
        const mockData = generateMockSeatmap(flight_offer_id || flight_order_id);
        return new Response(JSON.stringify(mockData), {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const seatmapData = await seatmapRes.json();

      return new Response(JSON.stringify(seatmapData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } catch (apiError) {
      console.error("Amadeus API call failed:", apiError);
      // Fallback to mock
      const mockData = generateMockSeatmap(flight_offer_id || flight_order_id);
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Edge function error:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error", details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
