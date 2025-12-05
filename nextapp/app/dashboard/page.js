export const dynamic = "force-dynamic";
export const revalidate = 0;
import MagicLinkHandler from "@/components/MagicLinkHandler";
import DashboardClient from "./components/DashboardClient";
import { getUserAndProfile } from "@/libs/getUserData";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export default async function Page(props) {
  const searchParams = await props.searchParams;
  const role = searchParams?.role || null;
  const firstName = searchParams?.firstName || null;
  const lastName = searchParams?.lastName || null;
  const email = searchParams?.email || null;

  const cookieStore = await cookies();

  // Detect magic link params
  const hasMagicLinkParams =
    searchParams?.code ||
    searchParams?.access_token ||
    searchParams?.token_hash;

  if (hasMagicLinkParams) {
    return <MagicLinkHandler />;
  }

  // Create Supabase client
  const supabase = createServerClient(
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

  // Fetch user & profile (FIXED)
  const { user, profile: existingProfile } = await getUserAndProfile(supabase);

  // Public visitor (not logged in)
  if (!role && !searchParams?.value && !user) {
    return <DashboardClient user={null} profile={null} role={null} />;
  }

  // Onboarding flows
  if (role) {
    let profile = existingProfile;

    // Create profile if it doesn't exist
    if (!profile && role) {
      const { data: newProfile, error: insertError } = await supabase
        .from("users")
        .insert([
          {
            id: user?.id,
            email: user?.email,
            role,
            status:
              role === "companion"
                ? "pending"
                : role === "traveller"
                ? "pending"
                : "active",
          },
        ])
        .select()
        .single();

      if (!insertError) {
        profile = newProfile;
      }
    }

    // Traveller onboarding
    if (profile?.role === "traveller" && firstName && lastName && email) {
      const { data: existingTraveller } = await supabase
        .from("travellers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!existingTraveller) {
        await supabase.from("travellers").insert([
          {
            user_id: user.id,
            first_name: firstName,
            last_name: lastName,
          },
        ]);

        const {
          data: { session },
        } = await supabase.auth.getSession();

        await supabase.functions.invoke("send-traveller-verification-email", {
          body: { user_id: user.id, email: user.email },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        });
      }
    }

    // Pending traveller must verify email
    if (profile?.status === "pending" && role === "traveller") {
      return (
        <div className="h-screen flex flex-col items-center justify-center">
          <p>Please verify your email first and then refresh the page.</p>
        </div>
      );
    }

    // Authenticated dashboard
    return <DashboardClient user={user} profile={profile} role={role} />;
  }

  // Default fallback
  return <DashboardClient user={user} profile={existingProfile} role={role} />;
}
