"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function OnboardingSuccess() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-green-600 mb-4">
          Stripe Onboarding Completed!
        </h1>
        <p>You have successfully completed the Stripe onboarding process.</p>
      </div>
    </div>
  );
}