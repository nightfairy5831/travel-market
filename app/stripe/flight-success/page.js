"use client";
import { useEffect, useState } from "react";
import { useSearchParams , useRouter } from "next/navigation";
import { supabase } from "@/libs/supabaseClient";

export default function FlightSuccess() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const session_id = searchParams.get("session_id");
  const [status, setStatus] = useState("Processing your booking...");

  useEffect(() => {
    const finalizeBooking = async () => {
      try {
        // 🔹 1. Verify Supabase session
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          await supabase.auth.refreshSession();
        }
        const supabaseToken = session?.access_token;
        if (!supabaseToken) {
          setStatus("⚠️ Please log in again to finalize booking.");
          return;
        }

        // 🔹 2. Fetch pending booking from localStorage
        const pendingBooking = JSON.parse(
          localStorage.getItem("pendingBooking")
        );
        if (
          !pendingBooking ||
          !pendingBooking.selectedFlight ||
          !pendingBooking.profile
        ) {
          setStatus("❌ Missing flight or user information.");
          return;
        }

        // Extract all values
        const {
          selectedFlight,
          profile,
          flightData,
          user,
          selectedSeat,
          pairingId,
          selectedCompanion,
          stopDescription,
        } = pendingBooking;

        // 🔹 3. Create Duffel order (after Stripe success)
        const createOrderRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/duffel-create-booking`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseToken}`,
            },
            body: JSON.stringify({
              data: {
                selected_offers: [selectedFlight.id],
                payments: [
                  {
                    type: "balance", // ⚡ Duffel only accepts "balance" here
                    amount: selectedFlight.total_amount,
                    currency: selectedFlight.total_currency,
                  },
                ],
                passengers: [
                  {
                    id: selectedFlight.passengers?.[0]?.id || "pas_placeholder", // ⚡ Use actual passenger id from offer if available
                    type: "adult",
                    title: "mr",
                    gender: "m",
                    born_on: "1990-01-01",
                    phone_number: profile.phone_number || "+12025550123", // ⚡ Provide a valid E.164 number
                    email: profile.email,
                    given_name: profile.full_name?.split(" ")[0] || "Traveller",
                    family_name: profile.full_name?.split(" ")[1] || "User",
                  },
                ],
              },
            }),
          }
        );

        const orderResponse = await createOrderRes.json();
        if (!createOrderRes.ok) {
          console.error("Duffel order creation failed:", orderResponse);
          setStatus("❌ Failed to create Duffel booking.");
          alert(orderResponse.error?.message || "Duffel order failed");
          return;
        }

        const order = orderResponse.data;
        console.log("Duffel order:", order);

        const duffelStatus = order.status || "pending";
        setStatus(`✅ Duffel order created (${duffelStatus})`);

        // 🔹 4. Extract segment details safely
        const firstSlice = order.slices?.[0] || selectedFlight.slices?.[0];
        const segments = firstSlice?.segments || [];
        const firstSegment = segments[0];
        const lastSegment = segments[segments.length - 1];

        const booking = {
          traveler_id: profile?.user_id,
          duffel_order_id: order.id,
          flight_number:
            firstSegment?.marketing_carrier_flight_number ||
            firstSegment?.number ||
            "Unknown",
          airline_name:
            firstSegment?.marketing_carrier?.iata_code ||
            order.owner?.iata_code ||
            "Unknown",
          departure_airport:
            `${firstSegment?.origin?.iata_code || ""} - ${
              firstSegment?.origin?.name || ""
            }`.trim() || "Unknown",
          destination_airport:
            `${lastSegment?.destination?.iata_code || ""} - ${
              lastSegment?.destination?.name || ""
            }`.trim() || "Unknown",
          departure_date:
            firstSegment?.departing_at?.split("T")[0] ||
            flightData?.preferred_date,
          arrival_date:
            lastSegment?.arriving_at?.split("T")[0] ||
            flightData?.preferred_date,
          seat_number: selectedSeat?.name || "TBD",
          status: duffelStatus,
          departure_iata: firstSegment?.origin?.iata_code || "Unknown", // ✅ added
          destination_iata: lastSegment?.destination?.iata_code || "Unknown", // ✅ added
          price: order.total_amount || selectedFlight.total_amount || 0, // ✅ add price here
          stop_description: stopDescription,
          created_at: new Date().toISOString(),
        };

        // 🔹 5. Store in Supabase
        const { data: bookingData, error: bookingError } = await supabase
          .from("bookings")
          .insert([booking])
          .select();

        if (bookingError) throw bookingError;

        // 🔹 6. Update pairing if applicable
        if (pairingId) {
          await supabase
            .from("pairings")
            .update({
              status: duffelStatus,
              seat_number: selectedSeat?.name || "TBD",
            })
            .eq("id", pairingId);
        }

        // ✅ Done!
        alert(
          `✅ Flight booking ${duffelStatus}!` +
            (selectedCompanion
              ? ` Paired with ${selectedCompanion.full_name}!`
              : "")
        );
        setStatus("🎉 Booking completed successfully!");
        router.push("/dashboard/Booked-Flights");

        // 🧹 Optional cleanup
        localStorage.removeItem("pendingBooking");
      } catch (err) {
        console.error("Booking finalization error:", err);
        setStatus("❌ Error processing booking. Please try again.");
      }
    };

    if (session_id) finalizeBooking();
  }, [session_id]);

  return (
    <div className="flex flex-col items-center justify-center h-[80vh]">
      <h1 className="text-3xl font-semibold text-green-600">
        🎉 Payment Successful!
      </h1>
      <p className="text-gray-600 mt-4">{status}</p>
    </div>
  );
}
