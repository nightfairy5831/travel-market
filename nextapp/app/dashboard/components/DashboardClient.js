"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import CompanionSignUpPage from "@/components/Profile/companion-signup/CompanionSignUpPage";
import ErrorState from "@/components/Profile/ErrorState";
import LoadingState from "@/components/Profile/LoadingState";
import UserInfoCard from "@/components/Profile/UserInfoCard";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import MainCard from "@/components/common/Dashboard/MainCard";

export default function DashboardClient({ user, profile }) {
  const [companionProfile, setCompanionProfile] = useState(null);
  const [profileComplete, setProfileComplete] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();

  // ✅ Keep your full useEffect functionality — made active and feasible
  useEffect(() => {
    const checkAuthErrors = () => {
      const error = searchParams.get("error");
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");

      const hasQueryError =
        error === "access_denied" ||
        errorCode === "otp_expired" ||
        errorDescription?.includes("expired") ||
        errorDescription?.includes("invalid");

      let hasHashError = false;
      if (typeof window !== "undefined") {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        hasHashError =
          hashParams.get("error") === "access_denied" ||
          hashParams.get("error_code") === "otp_expired" ||
          hashParams.get("error_description")?.includes("expired");
      }

      if (hasQueryError || hasHashError) {
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, "", cleanUrl);

        router.push("/auth/login?error=otp_expired");
        return true;
      }

      return false;
    };

    if (profile && user) {
      setProfileComplete(profile.status === "active");
    }

    const hasAuthError = checkAuthErrors();

    if (!hasAuthError) {
      const timer = setTimeout(() => setIsLoading(false), 300);
      return () => clearTimeout(timer);
    }
  }, [profile, user, router, searchParams]);

  // ✅ Keep your loader and error flow
  if (isLoading) return <LoadingState />;
  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-6xl space-y-4 mx-auto">
          {profile === null && user === null && (
            <MainCard profile={profile} user={user} />
          )}
          {profile?.status === "active" &&
            profile?.is_phone_verified === false &&
            router.push("/dashboard/profile")}

          {profile?.status === "active" && profile?.type === "traveller" ? (
            <>
              <MainCard />
            </>
          ) : null}

          {profile && profile?.role === "companion" && !profileComplete && (
            <CompanionSignUpPage
              profile={profile}
              email={profile?.email}
              userId={user.id}
              onComplete={(data) => {
                setCompanionProfile(data);
                setProfileComplete(true);
              }}
            />
          )}
        </div>
      </div>
    </>
  );
}
