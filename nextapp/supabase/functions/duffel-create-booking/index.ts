// supabase/functions/duffel-create-order/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 🔒 Verify JWT token from the request header
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: "No authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 🧠 Create Supabase admin client to validate user
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(
      authHeader.replace("Bearer ", ""),
    );

    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

   // ✅ Parse frontend body directly
    // ✅ Parse frontend body correctly
    const body = await req.json();
    const { data } = body || {};

    if (!data || !data.selected_offers || !data.passengers) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: selected_offers, passengers",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }


    // 🔑 Duffel API details
    const DUFFEL_API_URL = "https://api.duffel.com/air/orders";
    const DUFFEL_TOKEN = Deno.env.get("DUFFEL_SANDBOX_TOKEN");

    if (!DUFFEL_TOKEN) {
      return new Response(
        JSON.stringify({ error: "Duffel token not configured" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 🛫 Call Duffel Orders API
    const response = await fetch(DUFFEL_API_URL, {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${DUFFEL_TOKEN}`,
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Duffel-Version": "v2",
      },
      body: JSON.stringify({ data }),
    });

    const responseData = await response.json();

    if (!response.ok) {
      console.error("Duffel create order error:", responseData);
      return new Response(
        JSON.stringify({
          error: "Duffel API error",
          details: responseData,
        }),
        {
          status: response.status,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // ✈️ Successfully created order
    return new Response(
      JSON.stringify(responseData),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      },
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
      },
    );
  }
});

/*
To invoke locally:

1️⃣ Start your Supabase local dev environment:
   supabase start

2️⃣ Call function locally:
   curl -i --location --request POST 'http://127.0.0.1:54321/functions/v1/duffel-create-order' \
   --header 'Authorization: Bearer <YOUR_SUPABASE_JWT>' \
   --header 'Content-Type: application/json' \
   --data '{
      "data": {
        "selected_offers": ["off_123"],
        "passengers": [{ "id": "pas_123" }]
      }
    }'

3️⃣ Deploy to Supabase:
   supabase functions deploy duffel-create-order
*/
