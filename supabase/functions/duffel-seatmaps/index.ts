// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
// };

// // 🧩 Mock seatmap generator (same as your Next.js API)
// const generateMockSeatmap = (offerId: string) => ({
//   data: [
//     {
//       id: `seat_map_${offerId}`,
//       slice_id: `slice_${offerId}`,
//       segment_id: `segment_${offerId}`,
//       cabin_class: "economy",
//       deck: "lower",
//       aircraft: {
//         name: "Airbus A320",
//         iata_code: "320",
//         id: "arc_00009VMF4AhXSSRnQuCk31",
//       },
//       cabins: [
//         {
//           name: "Economy",
//           cabin_class: "economy",
//           starting_row: 1,
//           ending_row: 10,
//           aisles: 1,
//           wings: {
//             start_row: 6,
//             end_row: 8,
//           },
//           seats: [
//             {
//               id: "seat_1A",
//               designator: "1A",
//               name: "1A",
//               disclosures: ["exit_row"],
//               amenities: ["extra_legroom"],
//               available_services: ["seat"],
//               proffer_point_id: "point_1",
//               fee: { amount: "25.00", currency: "USD" },
//             },
//             {
//               id: "seat_1B",
//               designator: "1B",
//               name: "1B",
//               disclosures: ["exit_row"],
//               amenities: ["extra_legroom"],
//               available_services: ["seat"],
//               proffer_point_id: "point_2",
//             },
//             {
//               id: "seat_1C",
//               designator: "1C",
//               name: "1C",
//               disclosures: ["exit_row"],
//               amenities: ["extra_legroom"],
//               available_services: ["seat"],
//               proffer_point_id: "point_3",
//               fee: { amount: "25.00", currency: "USD" },
//             },
//             {
//               id: "seat_2A",
//               designator: "2A",
//               name: "2A",
//               available_services: ["seat"],
//               proffer_point_id: "point_4",
//             },
//             {
//               id: "seat_2B",
//               designator: "2B",
//               name: "2B",
//               available_services: ["seat"],
//               proffer_point_id: "point_5",
//             },
//             {
//               id: "seat_2C",
//               designator: "2C",
//               name: "2C",
//               available_services: ["seat"],
//               proffer_point_id: "point_6",
//             },
//           ],
//         },
//       ],
//     },
//   ],
// });

// serve(async (req) => {
//   // Handle CORS preflight
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const authHeader = req.headers.get("authorization");
//     if (!authHeader || !authHeader.startsWith("Bearer ")) {
//       return new Response(
//         JSON.stringify({ error: "Unauthorized - No token provided" }),
//         { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     const { offer_id } = await req.json();

//     if (!offer_id) {
//       return new Response(
//         JSON.stringify({ error: "Missing offer_id" }),
//         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
//       );
//     }

//     const DUFFEL_API_URL = `https://api.duffel.com/air/seat_maps?offer_id=${offer_id}`;
//     const DUFFEL_TOKEN = Deno.env.get("DUFFEL_SANDBOX_TOKEN");

//     if (!DUFFEL_TOKEN) {
//       console.error("Duffel token not found in environment");
//       const mockData = generateMockSeatmap(offer_id);
//       return new Response(JSON.stringify(mockData), {
//         status: 200,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     const response = await fetch(DUFFEL_API_URL, {
//       method: "GET",
//       headers: {
//         "Authorization": `Bearer ${DUFFEL_TOKEN}`,
//         "Accept": "application/json",
//         "Duffel-Version": "v2",
//       },
//     });

//     const data = await response.json();

//     // ❌ If Duffel API fails or returns empty, use mock
//     if (!response.ok || !data?.data?.length) {
//       console.log("❌ Duffel API failed or returned no data. Using mock data.");
//       const mockData = generateMockSeatmap(offer_id);
//       return new Response(JSON.stringify(mockData), {
//         status: 200,
//         headers: { ...corsHeaders, "Content-Type": "application/json" },
//       });
//     }

//     // ✅ Success
//     return new Response(JSON.stringify(data), {
//       status: 200,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });

//   } catch (error) {
//     console.error("Edge function error:", error);
//     // fallback to mock data
//     let offer_id = "unknown";
//     try {
//       const body = await req.json();
//       offer_id = body.offer_id || "unknown";
//     } catch (_) {}
//     const mockData = generateMockSeatmap(offer_id);
//     return new Response(JSON.stringify(mockData), {
//       status: 200,
//       headers: { ...corsHeaders, "Content-Type": "application/json" },
//     });
//   }
// });


// supabase/functions/duffel-seatmaps/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// 🧩 Mock seatmap generator (same as your Next.js API)
const generateMockSeatmap = (offerId: string) => ({
  data: [
    {
      id: `seat_map_${offerId}`,
      slice_id: `slice_${offerId}`,
      segment_id: `segment_${offerId}`,
      cabin_class: "economy",
      deck: "lower",
      aircraft: {
        name: "Airbus A320",
        iata_code: "320",
        id: "arc_00009VMF4AhXSSRnQuCk31",
      },
      cabins: [
        {
          name: "Economy",
          cabin_class: "economy",
          starting_row: 1,
          ending_row: 10,
          aisles: 1,
          wings: {
            start_row: 6,
            end_row: 8,
          },
          seats: [
            {
              id: "seat_1A",
              designator: "1A",
              name: "1A",
              disclosures: ["exit_row"],
              amenities: ["extra_legroom"],
              available_services: ["seat"],
              proffer_point_id: "point_1",
              fee: { amount: "25.00", currency: "USD" },
            },
            {
              id: "seat_1B",
              designator: "1B",
              name: "1B",
              disclosures: ["exit_row"],
              amenities: ["extra_legroom"],
              available_services: ["seat"],
              proffer_point_id: "point_2",
            },
            {
              id: "seat_1C",
              designator: "1C",
              name: "1C",
              disclosures: ["exit_row"],
              amenities: ["extra_legroom"],
              available_services: ["seat"],
              proffer_point_id: "point_3",
              fee: { amount: "25.00", currency: "USD" },
            },
            {
              id: "seat_2A",
              designator: "2A",
              name: "2A",
              available_services: ["seat"],
              proffer_point_id: "point_4",
            },
            {
              id: "seat_2B",
              designator: "2B",
              name: "2B",
              available_services: ["seat"],
              proffer_point_id: "point_5",
            },
            {
              id: "seat_2C",
              designator: "2C",
              name: "2C",
              available_services: ["seat"],
              proffer_point_id: "point_6",
            },
          ],
        },
      ],
    },
  ],
});

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
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      try {
        const { data: { user: authenticatedUser }, error } = await supabaseAdmin.auth.getUser(
          authHeader.replace('Bearer ', '')
        );

        if (!error && authenticatedUser) {
          user = authenticatedUser;
          isAnonymous = false;
        }
      } catch (authError) {
        // If authentication fails, continue as anonymous user
        console.log('Authentication failed, treating as anonymous user');
      }
    }

    // Proceed with seatmap fetch (works for both logged-in and anonymous users)
    const { offer_id } = await req.json();

    if (!offer_id) {
      return new Response(
        JSON.stringify({ error: "Missing offer_id" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const DUFFEL_API_URL = `https://api.duffel.com/air/seat_maps?offer_id=${offer_id}`;
    const DUFFEL_TOKEN = Deno.env.get("DUFFEL_SANDBOX_TOKEN");

    if (!DUFFEL_TOKEN) {
      console.error("Duffel token not found in environment");
      const mockData = generateMockSeatmap(offer_id);
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const response = await fetch(DUFFEL_API_URL, {
      method: "GET",
      headers: {
        "Authorization": `Bearer ${DUFFEL_TOKEN}`,
        "Accept": "application/json",
        "Duffel-Version": "v2",
      },
    });

    const data = await response.json();

    // ❌ If Duffel API fails or returns empty, use mock
    if (!response.ok || !data?.data?.length) {
      console.log("❌ Duffel API failed or returned no data. Using mock data.");
      const mockData = generateMockSeatmap(offer_id);
      return new Response(JSON.stringify(mockData), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ✅ Success
    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Edge function error:", error);
    // fallback to mock data
    let offer_id = "unknown";
    try {
      const body = await req.json();
      offer_id = body.offer_id || "unknown";
    } catch (_) {}
    const mockData = generateMockSeatmap(offer_id);
    return new Response(JSON.stringify(mockData), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});