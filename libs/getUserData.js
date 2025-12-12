// // lib/supabaseServer.js
// import { cookies } from "next/headers";
// import { createServerClient } from "@supabase/ssr";

// export async function getSupabaseServerClient() {
//   const cookieStore = await cookies();

//   return createServerClient(
//     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//     {
//       cookies: {
//         get(name) {
//           return cookieStore.get(name)?.value;
//         },
//       },
//     }
//   );
// }

// export async function getUserAndProfile() {
//   const supabase = await getSupabaseServerClient();

//   const {
//     data: { user },
//     error: userError,
//   } = await supabase.auth.getUser();

//   if (userError || !user) {
//     return { user: null, profile: null };
//   }

//  // 🧠 Modified section: check both travellers and companions tables and append user.status
// let profile = null;

// // First, try to find in travellers
// const { data: traveller, error: travellerError } = await supabase
//   .from("travellers")
//   .select("*")
//   .eq("user_id", user.id)
//   .single();

// if (traveller && !travellerError) {
//   console.log("Traveller profile found:", traveller);
//   profile = { ...traveller, type: "traveller" };
// } else {
//   // If not found, try companions
//   const { data: companion, error: companionError } = await supabase
//     .from("companions")
//     .select("*")
//     .eq("user_id", user.id)
//     .single();

//   if (companion && !companionError) {
//     console.log("Companion profile found:", companion);
//     profile = { ...companion, type: "companion" };
//   }
// }

// // 🧩 Now get status from users table and append it
// const { data: userRecord, error: userRecordError } = await supabase
//   .from("users")
//   .select("status")
//   .eq("id", user.id)
//   .single();

// if (userRecord && !userRecordError) {
//    console.log("User status found:", userRecord , profile);
//   profile = { ...profile, status: userRecord.status };
// }

// return { user, profile };
// }

import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

export async function getSupabaseServerClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        get(name) {
          return cookieStore.get(name)?.value;
        },
      },
    }
  );
}

export async function getUserAndProfile() {
  const supabase = await getSupabaseServerClient();

  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return { user: null, profile: null };
  }

  let profile = null;

  // 🧠 First, try to find in travellers
  const { data: traveller, error: travellerError } = await supabase
    .from("travellers")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (traveller && !travellerError) {
    profile = { ...traveller, type: "traveller" };
  } else {
    // 🧠 If not found, try companions
    const { data: companion, error: companionError } = await supabase
      .from("companions")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle(); // <- this avoids throwing error if not found

    if (companion && !companionError) {
      profile = { ...companion, type: "companion" };
    }
  }

  // 🧩 Always fetch user status from users table
  const { data: userRecord, error: userRecordError } = await supabase
    .from("users")
    .select("status, email, role") // add more fields if needed
    .eq("id", user.id)
    .single();

  // 🧠 If no traveller/companion profile found yet, still build a fallback profile from user record
  if (!profile && userRecord) {
    profile = {
      ...userRecord,
      type: "user", // generic type when companion/traveller not yet created
    };
  } else if (profile && userRecord) {
    // merge user status into profile
    profile = { ...profile, status: userRecord.status };
  }

  return { user, profile };
}

