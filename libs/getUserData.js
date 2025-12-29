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

  // Get user info from users table first (source of truth for role, status, email)
  const { data: userRecord } = await supabase
    .from("users")
    .select("status, email, role")
    .eq("id", user.id)
    .single();

  if (!userRecord) {
    return { user, profile: null };
  }

  // Base profile from users table
  let profile = {
    status: userRecord.status,
    email: userRecord.email,
    role: userRecord.role,
    type: "user",
  };

  // For non-admin users, get additional profile data from travellers/companions
  if (userRecord.role !== "admin") {
    const { data: traveller } = await supabase
      .from("travellers")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (traveller) {
      profile = { ...profile, ...traveller, type: "traveller" };
    } else {
      const { data: companion } = await supabase
        .from("companions")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      if (companion) {
        profile = { ...profile, ...companion, type: "companion" };
      }
    }
  }

  return { user, profile };
}
