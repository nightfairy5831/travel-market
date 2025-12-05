// import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
// import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// const corsHeaders = {
//   "Access-Control-Allow-Origin": "*",
//   "Access-Control-Allow-Headers":
//     "authorization, x-client-info, apikey, content-type",
// };

// serve(async (req) => {
//   if (req.method === "OPTIONS") {
//     return new Response("ok", { headers: corsHeaders });
//   }

//   try {
//     const { flight_number, date, airline } = await req.json();
//     console.log("🔍 Received search request:", { flight_number, date, airline });

//     if (!date) {
//       return new Response(
//         JSON.stringify({
//           success: false,
//           error: "Missing date parameter",
//           details: "Date is required for companion search",
//         }),
//         { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
//       );
//     }

//     // ✅ Supabase client (Service Role)
//     const supabase = createClient(
//       Deno.env.get("SUPABASE_URL") ?? "",
//       Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
//     );

//     let companions: any[] = [];
//     let edgeFunctionUsed = true;

//     try {
//       console.log("🔍 Running main query via Edge Function...");

//       const { data, error } = await supabase
//         .from("bookings")
//         .select(`
//           *,
//           profiles:traveler_id (
//             id,
//             full_name,
//             age,
//             interests,
//             bio,
//             languages,
//             skills,
//             role
//           )
//         `)
//         .eq("departure_date", date)
//         .eq("status", "confirmed")
//         .limit(50);

//       if (error) throw error;

//       console.log("✅ Found bookings:", data?.length || 0);

//       companions = (data || []).filter(
//         (b) => b.profiles?.role === "companion",
//       ).map((b) => ({
//         id: b.profiles?.id || b.traveler_id,
//         full_name: b.profiles?.full_name || "Travel Companion",
//         age: b.profiles?.age,
//         interests: b.profiles?.interests || [],
//         bio: b.profiles?.bio,
//         languages: b.profiles?.languages || [],
//         skills: b.profiles?.skills || [],
//         current_seat: b.seat_number,
//         bookings: {
//           flight_number: b.flight_number,
//           departure_date: b.departure_date,
//           seat_number: b.seat_number,
//           airline_name: b.airline_name,
//         },
//       }));

//       console.log(`👥 Companions found: ${companions.length}`);
//     } catch (err) {
//       console.error("🔄 Edge function query failed:", err);
//       edgeFunctionUsed = false;
//     }

//     if (!companions || companions.length === 0) {
//       console.log("❌ No companions found");
//       return new Response(
//         JSON.stringify({
//           success: true,
//           companions: [],
//           total_count: 0,
//           message: "No companions found for this flight",
//           source: edgeFunctionUsed ? "edge_function" : "direct_query",
//         }),
//         { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
//       );
//     }

//     // ✅ Enhanced data like /api
//     const enhancedCompanions = companions.map((c) => {
//       const enhanced = {
//         ...c,
//         id: c.id || `comp-${Math.random().toString(36).substring(2, 9)}`,
//         current_seat: c.current_seat || c.bookings?.seat_number,
//         has_adjacent_vacant: checkAdjacentVacant(c, companions),
//         match_score: calculateMatchScore(c),
//         seatAvailability: {
//           adjacent: checkAdjacentVacant(c, companions),
//           sameRow: checkSameRowVacant(c, companions),
//           seats: getAvailableAdjacentSeats(c, companions),
//           note: generateSeatNote(c, companions),
//         },
//       };
//       return enhanced;
//     });

//     // Sort by match score
//     enhancedCompanions.sort((a, b) => b.match_score - a.match_score);

//     return new Response(
//       JSON.stringify({
//         success: true,
//         companions: enhancedCompanions,
//         total_count: enhancedCompanions.length,
//         source: edgeFunctionUsed ? "edge_function" : "direct_query",
//         timestamp: new Date().toISOString(),
//       }),
//       { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
//     );
//   } catch (error) {
//     console.error("💥 Companion search Edge Function error:", error);
//     return new Response(
//       JSON.stringify({
//         success: false,
//         error: "Internal server error",
//         details: error.message,
//         timestamp: new Date().toISOString(),
//       }),
//       { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
//     );
//   }
// });

// /* -------------------------------------------------------------------------- */
// /* ✅ Helper Functions (same as your /api route) */
// /* -------------------------------------------------------------------------- */

// function checkAdjacentVacant(companion: any, all: any[]) {
//   try {
//     const seat = companion.current_seat || companion.bookings?.seat_number;
//     if (!seat || seat === "TBD") return false;

//     const match = seat.match(/(\d+)([A-Z])/);
//     if (!match) return false;
//     const row = parseInt(match[1]);
//     const letter = match[2];
//     const adjLetters = getAdjacentLetters(letter);

//     return adjLetters.some((adj) => {
//       const adjSeat = `${row}${adj}`;
//       const occupied = all.some((c) =>
//         (c.current_seat || c.bookings?.seat_number) === adjSeat &&
//         c.id !== companion.id
//       );
//       return !occupied;
//     });
//   } catch {
//     return false;
//   }
// }

// function checkSameRowVacant(companion: any, all: any[]) {
//   try {
//     const seat = companion.current_seat || companion.bookings?.seat_number;
//     if (!seat || seat === "TBD") return false;

//     const match = seat.match(/(\d+)([A-Z])/);
//     if (!match) return false;
//     const row = parseInt(match[1]);
//     const current = match[2];
//     const letters = ["A", "B", "C", "D", "E", "F"];

//     return letters.some((l) => {
//       if (l === current) return false;
//       const testSeat = `${row}${l}`;
//       const occupied = all.some(
//         (c) => (c.current_seat || c.bookings?.seat_number) === testSeat,
//       );
//       return !occupied;
//     });
//   } catch {
//     return false;
//   }
// }

// function getAvailableAdjacentSeats(companion: any, all: any[]) {
//   try {
//     const seat = companion.current_seat || companion.bookings?.seat_number;
//     if (!seat || seat === "TBD") return [];

//     const match = seat.match(/(\d+)([A-Z])/);
//     if (!match) return [];
//     const row = parseInt(match[1]);
//     const letter = match[2];
//     const adjLetters = getAdjacentLetters(letter);

//     const available = adjLetters.filter((adj) => {
//       const adjSeat = `${row}${adj}`;
//       const occupied = all.some(
//         (c) =>
//           (c.current_seat || c.bookings?.seat_number) === adjSeat &&
//           c.id !== companion.id,
//       );
//       return !occupied;
//     });

//     return available.slice(0, 3);
//   } catch {
//     return [];
//   }
// }

// function generateSeatNote(companion: any, all: any[]) {
//   const adj = checkAdjacentVacant(companion, all);
//   const sameRow = checkSameRowVacant(companion, all);
//   const available = getAvailableAdjacentSeats(companion, all);
//   if (adj && available.length > 0)
//     return `${available.length} adjacent seat${available.length > 1 ? "s" : ""} available`;
//   if (sameRow) return "Seats available in same row";
//   return "Limited seat availability";
// }

// function calculateMatchScore(c: any) {
//   let score = 0;
//   if (c.has_adjacent_vacant) score += 30;
//   else if (c.seatAvailability?.sameRow) score += 15;
//   if (c.bio) score += 10;
//   if (c.interests?.length) score += c.interests.length * 2;
//   if (c.languages?.length) score += c.languages.length * 3;
//   if (c.skills?.length) score += c.skills.length * 2;
//   return score;
// }

// function getAdjacentLetters(letter: string) {
//   const letters = ["A", "B", "C", "D", "E", "F"];
//   const idx = letters.indexOf(letter);
//   const adj: string[] = [];
//   if (idx > 0) adj.push(letters[idx - 1]);
//   if (idx < letters.length - 1) adj.push(letters[idx + 1]);
//   return adj;
// }
// supabase/functions/search-companions-duffel/index.ts
import { serve } from "https://deno.land/std@0.177.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
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
      const supabaseAuth = createClient(
        Deno.env.get('SUPABASE_URL') ?? '',
        Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
      );

      try {
        const { data: { user: authenticatedUser }, error } = await supabaseAuth.auth.getUser(
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

    // Proceed with companion search (works for both logged-in and anonymous users)
    const { flight_number, date, airline } = await req.json();
    console.log("🔍 Received search request:", { flight_number, date, airline });

    if (!date) {
      return new Response(
        JSON.stringify({
          success: false,
          error: "Missing date parameter",
          details: "Date is required for companion search",
        }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ✅ Supabase client (Service Role)
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    let companions: any[] = [];
    let edgeFunctionUsed = true;

    try {
      console.log("🔍 Running main query via Edge Function...");

      const { data, error } = await supabase
        .from("bookings")
        .select(`
          *,
          profiles:traveler_id (
            id,
            full_name,
            age,
            interests,
            bio,
            languages,
            skills,
            role
          )
        `)
        .eq("departure_date", date)
        .eq("status", "confirmed")
        .limit(50);

      if (error) throw error;

      console.log("✅ Found bookings:", data?.length || 0);

      companions = (data || []).filter(
        (b) => b.profiles?.role === "companion",
      ).map((b) => ({
        id: b.profiles?.id || b.traveler_id,
        full_name: b.profiles?.full_name || "Travel Companion",
        age: b.profiles?.age,
        interests: b.profiles?.interests || [],
        bio: b.profiles?.bio,
        languages: b.profiles?.languages || [],
        skills: b.profiles?.skills || [],
        current_seat: b.seat_number,
        bookings: {
          flight_number: b.flight_number,
          departure_date: b.departure_date,
          seat_number: b.seat_number,
          airline_name: b.airline_name,
        },
      }));

      console.log(`👥 Companions found: ${companions.length}`);
    } catch (err) {
      console.error("🔄 Edge function query failed:", err);
      edgeFunctionUsed = false;
    }

    if (!companions || companions.length === 0) {
      console.log("❌ No companions found");
      return new Response(
        JSON.stringify({
          success: true,
          companions: [],
          total_count: 0,
          message: "No companions found for this flight",
          source: edgeFunctionUsed ? "edge_function" : "direct_query",
        }),
        { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    // ✅ Enhanced data like /api
    const enhancedCompanions = companions.map((c) => {
      const enhanced = {
        ...c,
        id: c.id || `comp-${Math.random().toString(36).substring(2, 9)}`,
        current_seat: c.current_seat || c.bookings?.seat_number,
        has_adjacent_vacant: checkAdjacentVacant(c, companions),
        match_score: calculateMatchScore(c),
        seatAvailability: {
          adjacent: checkAdjacentVacant(c, companions),
          sameRow: checkSameRowVacant(c, companions),
          seats: getAvailableAdjacentSeats(c, companions),
          note: generateSeatNote(c, companions),
        },
      };
      return enhanced;
    });

    // Sort by match score
    enhancedCompanions.sort((a, b) => b.match_score - a.match_score);

    return new Response(
      JSON.stringify({
        success: true,
        companions: enhancedCompanions,
        total_count: enhancedCompanions.length,
        source: edgeFunctionUsed ? "edge_function" : "direct_query",
        timestamp: new Date().toISOString(),
      }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (error) {
    console.error("💥 Companion search Edge Function error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: "Internal server error",
        details: error.message,
        timestamp: new Date().toISOString(),
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});

/* -------------------------------------------------------------------------- */
/* ✅ Helper Functions (same as your /api route) */
/* -------------------------------------------------------------------------- */

function checkAdjacentVacant(companion: any, all: any[]) {
  try {
    const seat = companion.current_seat || companion.bookings?.seat_number;
    if (!seat || seat === "TBD") return false;

    const match = seat.match(/(\d+)([A-Z])/);
    if (!match) return false;
    const row = parseInt(match[1]);
    const letter = match[2];
    const adjLetters = getAdjacentLetters(letter);

    return adjLetters.some((adj) => {
      const adjSeat = `${row}${adj}`;
      const occupied = all.some((c) =>
        (c.current_seat || c.bookings?.seat_number) === adjSeat &&
        c.id !== companion.id
      );
      return !occupied;
    });
  } catch {
    return false;
  }
}

function checkSameRowVacant(companion: any, all: any[]) {
  try {
    const seat = companion.current_seat || companion.bookings?.seat_number;
    if (!seat || seat === "TBD") return false;

    const match = seat.match(/(\d+)([A-Z])/);
    if (!match) return false;
    const row = parseInt(match[1]);
    const current = match[2];
    const letters = ["A", "B", "C", "D", "E", "F"];

    return letters.some((l) => {
      if (l === current) return false;
      const testSeat = `${row}${l}`;
      const occupied = all.some(
        (c) => (c.current_seat || c.bookings?.seat_number) === testSeat,
      );
      return !occupied;
    });
  } catch {
    return false;
  }
}

function getAvailableAdjacentSeats(companion: any, all: any[]) {
  try {
    const seat = companion.current_seat || companion.bookings?.seat_number;
    if (!seat || seat === "TBD") return [];

    const match = seat.match(/(\d+)([A-Z])/);
    if (!match) return [];
    const row = parseInt(match[1]);
    const letter = match[2];
    const adjLetters = getAdjacentLetters(letter);

    const available = adjLetters.filter((adj) => {
      const adjSeat = `${row}${adj}`;
      const occupied = all.some(
        (c) =>
          (c.current_seat || c.bookings?.seat_number) === adjSeat &&
          c.id !== companion.id,
      );
      return !occupied;
    });

    return available.slice(0, 3);
  } catch {
    return [];
  }
}

function generateSeatNote(companion: any, all: any[]) {
  const adj = checkAdjacentVacant(companion, all);
  const sameRow = checkSameRowVacant(companion, all);
  const available = getAvailableAdjacentSeats(companion, all);
  if (adj && available.length > 0)
    return `${available.length} adjacent seat${available.length > 1 ? "s" : ""} available`;
  if (sameRow) return "Seats available in same row";
  return "Limited seat availability";
}

function calculateMatchScore(c: any) {
  let score = 0;
  if (c.has_adjacent_vacant) score += 30;
  else if (c.seatAvailability?.sameRow) score += 15;
  if (c.bio) score += 10;
  if (c.interests?.length) score += c.interests.length * 2;
  if (c.languages?.length) score += c.languages.length * 3;
  if (c.skills?.length) score += c.skills.length * 2;
  return score;
}

function getAdjacentLetters(letter: string) {
  const letters = ["A", "B", "C", "D", "E", "F"];
  const idx = letters.indexOf(letter);
  const adj: string[] = [];
  if (idx > 0) adj.push(letters[idx - 1]);
  if (idx < letters.length - 1) adj.push(letters[idx + 1]);
  return adj;
}