import MagicLinkHandler from "@/components/MagicLinkHandler";
import DashboardClient from "./components/DashboardClient";
import { getUserAndProfile } from "@/libs/getUserData";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
// import RefreshButton from "@/components/RefreshButton";
import { redirect } from "next/navigation";

export default async function Page(props) {
  const searchParams = await props.searchParams;
  const role = searchParams?.role || null;
  const firstName = searchParams?.firstName || null;
  const lastName = searchParams?.lastName || null;
  const email = searchParams?.email || null;
  const cookieStore = await cookies();

  // 🕒 Detect if Supabase is still handling the magic link
  const hasMagicLinkParams =
    searchParams?.code ||
    searchParams?.access_token ||
    searchParams?.token_hash;

  if (hasMagicLinkParams) {
    return <MagicLinkHandler />;
  }

  // ✅ Step 1: Create Supabase client
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

  // ✅ Step 2: Fetch user & profile
  const { user, profile: existingProfile } = await getUserAndProfile();

  // ✅ Step 3: Handle completely public visitors (no role, no magic link)
  if (!role && !searchParams?.value && !user) {
    return <DashboardClient user={null} profile={null} role={null} />;
  }

  // ✅ Step 4: If magic link / query params are present → continue existing flow
  if (role) {
    let profile = existingProfile;
    // ✅ Create profile if not exists
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

      if (insertError) {
        console.error("Error inserting user:", insertError);
      } else {
        profile = newProfile;
        if (profile && profile.role === "companion") {
          redirect("/dashboard");
        }
      }
    }

    // ✅ Traveller-specific logic (keep your existing code intact)
    if (profile?.role === "traveller" && firstName && lastName && email) {
      const { data: existingTraveller } = await supabase
        .from("travellers")
        .select("id")
        .eq("user_id", user.id)
        .single();

      if (!existingTraveller) {
        const { error: travellerInsertError } = await supabase
          .from("travellers")
          .insert([
            {
              user_id: user.id,
              first_name: firstName,
              last_name: lastName,
              email: email,
              is_email_verified: true,
            },
          ]);

        if (travellerInsertError) {
          console.error("Error inserting traveller:", travellerInsertError);
        } else {
          // Force redirect on server side
         redirect(`/dashboard/profile?refresh=${Date.now()}`);
          // const {
          //   data: { session },
          // } = await supabase.auth.getSession();

          // await supabase.functions.invoke("send-traveller-verification-email", {
          //   body: { user_id: user.id, email: user.email },
          //   headers: {
          //     Authorization: `Bearer ${session.access_token}`,
          //   },
          // });

          // // Return the refresh message component
          // return (
          //   <div className="h-screen flex-col flex items-center justify-center gap-4">
          //     <p className="text-gray-600">
          //       Please verify your email first and then refresh the page to
          //       continue.
          //     </p>
          //     <RefreshButton />
          //   </div>
          // );
        }
      }
    }

    // ✅ Traveller flow — show verification screen if pending
    if (profile?.status === "pending" || role === "traveller") {
      <div className="h-screen flex-col flex items-center justify-center">
        <p>Please verify your email first and then refresh the page</p>;
      </div>;
      return;
    }

    // ✅ Default return (active profile, companion, or traveller)
    return <DashboardClient user={user} profile={profile} role={role} />;
  }
  // ✅ Step 5: Fallback for public visitor (safe)
  return <DashboardClient user={user} profile={existingProfile} role={role} />;
}
