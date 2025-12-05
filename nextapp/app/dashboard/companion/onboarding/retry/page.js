"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function OnboardingRetry() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-yellow-600 mb-4">
          Onboarding Incomplete
        </h1>
        <p>Please try the onboarding process again.</p>
      </div>
    </div>
  );
}