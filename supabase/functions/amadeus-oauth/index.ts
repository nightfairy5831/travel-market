// supabase/functions/amadeus-oauth/index.ts

// Read credentials from Supabase secrets
const AMADEUS_CLIENT_ID = Deno.env.get("AMADEUS_CLIENT_ID");
const AMADEUS_CLIENT_SECRET = Deno.env.get("AMADEUS_CLIENT_SECRET");
const AMADEUS_AUTH_URL = "https://test.api.amadeus.com/v1/security/oauth2/token";

// Simple in-memory cache for token
let cachedToken: string | null = null;
let tokenExpiry: number = 0;

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  const now = Date.now();

  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    console.error("❌ Amadeus credentials not set");
    return new Response(
      JSON.stringify({ error: "Amadeus credentials not configured" }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Return cached token if valid
  if (cachedToken && now < tokenExpiry) {
    console.log("✅ Returning cached token");
    return new Response(
      JSON.stringify({ access_token: cachedToken, cached: true }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  // Fetch new token
  const body = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: AMADEUS_CLIENT_ID,
    client_secret: AMADEUS_CLIENT_SECRET,
  });

  try {
    console.log("🔑 Fetching new Amadeus token...");
    
    const res = await fetch(AMADEUS_AUTH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: body.toString(),
    });

    if (!res.ok) {
      const errorText = await res.text();
      console.error("❌ Amadeus API error:", errorText);
      return new Response(
        JSON.stringify({ error: errorText }), 
        {
          status: res.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const data = await res.json();

    // Cache token (subtract 60 seconds as buffer)
    cachedToken = data.access_token;
    tokenExpiry = now + (data.expires_in - 60) * 1000;

    console.log("✅ New Amadeus token retrieved successfully");

    return new Response(
      JSON.stringify({ 
        access_token: cachedToken, 
        cached: false,
        expires_in: data.expires_in 
      }), 
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (err) {
    console.error("💥 Error:", err);
    return new Response(
      JSON.stringify({ error: err.message }), 
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});