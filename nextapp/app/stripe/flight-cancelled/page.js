"use client";
export const dynamic = "force-dynamic";
export const revalidate = 0;
export default function FlightCancelled() {
  return (
    <div className="p-8 text-center">
      <h2 className="text-2xl font-bold text-red-500">
        ❌ Payment cancelled
      </h2>
      <p className="mt-2">Your flight booking was not completed.</p>
    </div>
  );
}
