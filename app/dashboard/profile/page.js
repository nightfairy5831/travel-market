"use client";
import CompanionProfilePage from "@/components/Profile/CompanionProfile/CompanionProfile";
import TravellerSignUpPage from "@/components/Profile/traveller-signup/TravellerSignUpPage";
import { useUser } from "@/context/ClientProvider";

export const dynamic = "force-dynamic";

export default function ProfilePage() {
  const { user, profile } = useUser();
  return (
    <>
      {profile && profile?.type === "traveller" ? (
        <TravellerSignUpPage
          profile={profile}
          user={user}
          email={profile?.email}
        />
      ) : profile && profile?.type === "companion" ? (
        <>
          <CompanionProfilePage
            profile={profile}
            user={user}
            email={profile?.email}
          />
        </>
      ) : (
        ""
      )}
    </>
  );
}
