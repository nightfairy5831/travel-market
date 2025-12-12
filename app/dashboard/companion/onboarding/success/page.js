"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OnboardingSuccess() {
  const router = useRouter();

  useEffect(() => {
    const timer = setTimeout(() => {
      router.push("/dashboard/profile");
    }, 3000); // 3 seconds

    return () => clearTimeout(timer);
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Stripe Onboarding Completed!
        </h1>
        <p>You have successfully completed the Stripe onboarding process.</p>
        <p className="mt-2 text-gray-500 text-sm">
          Redirecting to your profile...
        </p>
      </div>
    </div>
  );
}
