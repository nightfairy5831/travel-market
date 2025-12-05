"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import TravellerSignUpPage from "@/components/Profile/traveller-signup/TravellerSignUpPage";
import { useUser } from "@/context/ClientProvider";
import LoadingState from "@/components/Profile/LoadingState";

export default function ProfilePage() {
  const userContext = useUser();
  const { user, profile } = userContext || { user: null, profile: null };

  if (!userContext) {
    return <LoadingState />;
  }

  return (
    <>
      {profile && profile?.type === "traveller" ? (
        <TravellerSignUpPage
          profile={profile}
          user={user}
          email={profile?.email}
        />
      ) : profile && profile?.type === "companion" ? (
        <></>
      ) : (
        ""
      )}
    </>
  );
}