"use client";

export const dynamic = "force-dynamic";
export const revalidate = 0;
import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import PathSelector from "@/components/Flight/PathSelector";
import RouteForm from "@/components/Flight/RouteForm";
import FlightList from "@/components/Flight/FlightList";
import ConfirmModal from "@/components/Flight/ConfirmModal";
import DuffelFlightList from "@/components/Flight/DuffelFlightList";
import SeatMapModalDuffel from "@/components/Seat/SeatMapModalDuffel";
import BackButton from "@/components/common/BackButton";
import LoadingState from "@/components/Profile/LoadingState";
import SearchByFlightNo from "@/components/Flight/BookedFlightInfo";
import Loader from "@/components/common/Loader";
import { useUser } from "@/context/ClientProvider";
import AuthLogin from "@/components/common/AuthModal";
import CompanionProfileModal from "@/components/Seat/PublicProfileCompanion";
import Sentry from "@/sentry.client.config";

export default function FlightChecker() {
  const userContext = useUser();
const { user, profile } = userContext || { user: null, profile: null };
  const [selectedPath, setSelectedPath] = useState(null);
  const [flightData, setFlightData] = useState({
    departure_airport: "",
    destination_airport: "",
    preferred_date: "",
  });
  const [response, setResponse] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [userFlight, setUserFlight] = useState(null);
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const flightsPerPage = 10;
  // Seatmap and companion states
  const [seatmapData, setSeatmapData] = useState(null);
  const [loadingSeatmap, setLoadingSeatmap] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [showSeatmap, setShowSeatmap] = useState(false);
  const [companions, setCompanions] = useState([]);
  const [selectedCompanion, setSelectedCompanion] = useState(null);
  const [pairingId, setPairingId] = useState(null);
  // For Public Users To See Companions
  const [showCompanionAuthModal, setShowCompanionAuthModal] = useState(false);
  const [companionDataAuth, setCompanionDataAuth] = useState([]);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
if (!userContext) {
  return <LoadingState />;
}
  // ! Flight Search Handler When Not Booked
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      selectedPath === 2 &&
      (!profile || // No profile exists
        profile.type === "traveller") // Or profile exists and is a traveller
    ) {
      setSubmitting(true);
      try {
        const travelDate = new Date(
          flightData.preferred_date || flightData.departure_date
        )
          .toISOString()
          .split("T")[0];

        if (!travelDate) {
          console.warn("⚠️ Missing departure date in flightData");
          setSubmitting(false);
          return;
        }

        // ✅ Fetch companions with their flight data
        const { data: companions, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("departure_iata", flightData.departure_airport)
          .eq("destination_iata", flightData.destination_airport)
          .eq("departure_date", travelDate);

        if (error) {
          console.log("❌ Error fetching companions:", error);
          setSubmitting(false);
          return;
        }

        if (!companions || companions.length === 0) {
          console.log("⚠️ No matching companions found");
          setSubmitting(false);
          return;
        }

        // ✅ ONLY query companions table (remove the users table query entirely)
        const companionsWithProfiles = await Promise.all(
          companions.map(async (companion) => {
            // ✅ Use user_id instead of id to match the relationship
            const { data: companionProfile, error: companionError } =
              await supabase
                .from("companions")
                .select(
                  "full_name, email, phone, profile_photo_url, gender, languages, short_bio"
                )
                .eq("user_id", companion.traveler_id) // Changed from 'id' to 'user_id'
                .single();

            if (companionError) {
              console.log(
                `❌ Error fetching companion profile for ${companion.traveler_id}:`,
                companionError
              );
              return {
                ...companion,
                profile: {
                  full_name: "Unknown Traveler",
                  profile_photo_url: null,
                  email: null,
                  phone: null,
                },
              };
            }

            // Successfully found the companion profile
            return {
              ...companion,
              profile: companionProfile,
            };
          })
        );
        if (companionsWithProfiles?.length > 0) {
          setSubmitting(false);
          setCompanionDataAuth(companionsWithProfiles);
          setShowCompanionAuthModal(true);

          return;
        }
      } catch (err) {
        console.log("Unexpected error fetching companions:", err);
        setSubmitting(false);
        return;
      }
    }
    setSubmitting(true);
    // ! For Duffel Flight Search
    try {
      let supabaseToken;

      // Try to get logged-in user's token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Logged-in user - use their access token
        supabaseToken = session.access_token;
      } else {
        // Anonymous user - use anon key
        supabaseToken = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }

      const searchData = {
        data: {
          slices: [
            {
              origin: flightData.departure_airport,
              destination: flightData.destination_airport,
              departure_date: flightData.preferred_date,
            },
          ],
          passengers: [{ type: "adult" }],
          cabin_class: "economy",
        },
      };

      // Call supabase edge function
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/duffel-flights`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseToken}`,
          },
          body: JSON.stringify(searchData),
        }
      );

      const data = await res.json();

      // Handle errors or success
      if (!res.ok) {
        setResponse({
          success: false,
          message:
            data.error?.message ||
            data.error ||
            data.errors?.[0]?.message ||
            "Duffel API error",
        });
      } else {
        // Check if user is anonymous
        if (data.metadata?.isAnonymous) {
          console.log("Anonymous user search");
          // Optional: Show login prompt
        }

        setResponse(data.data || null);
      }
    } catch (err) {
      console.error("Duffel flight search error:", err);
      setResponse({
        success: false,
        message: "Error fetching Duffel flights",
      });
    } finally {
      setSubmitting(false);
    }
    // ! For Amadeus Flight Search
    // try {
    //   const token = await fetchAmadeusToken(user);
    //   if (!token) {
    //     setResponse({ success: false, message: "Failed to get access token" });
    //     setSubmitting(false);
    //     return;
    //   }

    //   const payload =
    //     selectedPath === 1
    //       ? { path: 1, flight_number: userFlight?.flight_number || "" }
    //       : {
    //           path: 2,
    //           departure_airport: flightData.departure_airport,
    //           destination_airport: flightData.destination_airport,
    //           preferred_date: flightData.preferred_date || null,
    //         };

    //   const {
    //     data: { session },
    //   } = await supabase.auth.getSession();
    //   if (!session) await supabase.auth.refreshSession();
    //   const supabaseToken = session?.access_token;

    //   const res = await fetch("/api/amadeus-flights", {
    //     method: "POST",
    //     headers: {
    //       "Content-Type": "application/json",
    //       Authorization: `Bearer ${supabaseToken}`,
    //     },
    //     body: JSON.stringify(payload),
    //   });

    //   const data = await res.json();
    //   setResponse(data?.data || null);
    // } catch (err) {
    //   console.error("Error calling API:", err);
    //   setResponse({ success: false, message: "Error calling API" });
    // }
    setSubmitting(false);
  };
  // Flight Selection Handler And Seatmap + Companion Search When Not Booked
  const handleSelectFlight = async (flight) => {
    setSubmitting(true);
    setSelectedFlight(flight);
    try {
      let supabaseToken;

      // Try to get logged-in user's token
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // Logged-in user - use their access token
        supabaseToken = session.access_token;
      } else {
        // Anonymous user - use anon key
        supabaseToken = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }

      setLoadingSeatmap(true);

      // ! 1. Fetch seatmaps for selected flight
      const seatmapRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/duffel-seatmaps`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseToken}`,
          },
          body: JSON.stringify({ offer_id: flight.id }),
        }
      );

      const seatmapData = await seatmapRes.json();

      if (!seatmapRes.ok) {
        setSubmitting(false);
        alert(
          `Seatmap fetch failed: ${
            seatmapData.error?.message ||
            seatmapData.error ||
            seatmapData.errors?.[0]?.message ||
            "Unknown error"
          }`
        );
        return;
      }
      // 2. Extract flight details (both need this)
      const firstSlice = flight.slices?.[0];
      const firstSegment = firstSlice?.segments?.[0];

      let flightNumber = "Unknown";
      let flightDate = flightData.preferred_date;
      let airlineCode = "Unknown";

      if (firstSegment) {
        flightNumber =
          firstSegment.marketing_carrier_flight_number ||
          firstSegment.number ||
          flight.id;
        flightDate = firstSegment.departing_at?.split("T")[0] || flightDate;
        airlineCode =
          firstSegment.marketing_carrier?.iata_code ||
          flight.owner?.iata_code ||
          "Unknown";
      }

      let companionsData = [];

      // 3. ONLY search for companions if user is a traveler
      if (profile === null || profile?.type === "traveller") {
        const flightDetails = {
          flight_number: flightNumber,
          date: flightDate,
          airline: airlineCode,
        };

        // Call our API route to search for companions
        const companionsRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/search-companions-duffel`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${supabaseToken}`,
            },
            body: JSON.stringify(flightDetails),
          }
        );

        // Handle non-JSON responses
        const contentType = companionsRes.headers.get("content-type");
        if (!contentType || !contentType.includes("application/json")) {
          setSubmitting(false);
          const textResponse = await companionsRes.text();
          console.error(
            "❌ Non-JSON response:",
            textResponse.substring(0, 200)
          );
          throw new Error("Server returned non-JSON response");
        }

        const companionsResult = await companionsRes.json();

        if (companionsRes.ok && companionsResult.success) {
          setSubmitting(false);
          companionsData = companionsResult.companions || [];
          console.log(
            `✅ Found ${companionsData.length} companions for traveler`
          );
        } else {
          setSubmitting(false);
          console.error("❌ Companion search failed:", companionsResult);
          // Show user-friendly error
          const errorMessage =
            companionsResult.details ||
            companionsResult.error ||
            "Companion search failed";
          alert(`Companion search error: ${errorMessage}`);
        }
      } else {
        setSubmitting(false);
        console.log(`👤 User is ${profile?.type}, skipping companion search`);
      }
      setSubmitting(false);
      setSeatmapData(seatmapData);
      setCompanions(companionsData);
      setShowSeatmap(true);
    } catch (err) {
      console.error("❌ Error fetching data:", err);
      alert("Error fetching flight data. Please try again.");
    } finally {
      setSubmitting(false);
      setLoadingSeatmap(false);
    }
  };
  const handleSeatSelect = (seat) => {
    if (profile === null) {
      setIsAuthModalOpen(true);
      return;
    }

    setSelectedSeat(seat);
  };
  // Show Modal After Companion Selection And Seat Confirmation When Not Booked
  const handleCompanionSelect = async (companion) => {
    setSelectedCompanion(companion);

    if (profile?.role === "companion") {
      alert(
        "Companions cannot book other companions. You are already a helper!"
      );
      setSelectedCompanion(null);
      return;
    }
    alert(
      `✅ Selected ${companion.full_name}! Now select an adjacent seat to complete pairing.`
    );
  };
  // Confirm Seat And Create Pairing If Companion Selected When Not Booked
  const handleConfirmSeat = async () => {
    if (profile === null) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedSeat) {
      alert("Please select a seat first");
      return;
    }
    try {
      if (selectedCompanion) {
        console.log("Selected Companion ID:", selectedCompanion.id);

        // Try different search approaches to find the companion
        let companionRecord = null;

        // First try: Search by user_id (most likely)
        const { data: companionByUserId, error: error1 } = await supabase
          .from("companions")
          .select("id, user_id, full_name")
          .eq("user_id", selectedCompanion.id)
          .single();

        if (companionByUserId) {
          companionRecord = companionByUserId;
          console.log("Found companion by user_id:", companionRecord);
        } else {
          // Second try: Search by id (if selectedCompanion.id is actually the companion id)
          const { data: companionById, error: error2 } = await supabase
            .from("companions")
            .select("id, user_id, full_name")
            .eq("id", selectedCompanion.id)
            .single();

          if (companionById) {
            companionRecord = companionById;
            console.log("Found companion by id:", companionRecord);
          } else {
            // Third try: Show all companions to debug
            const { data: allCompanions } = await supabase
              .from("companions")
              .select("id, user_id, full_name")
              .limit(10);

            console.log("All companions in database:", allCompanions);
            console.log(
              "Selected companion ID to search:",
              selectedCompanion.id
            );
            alert("Companion not found. Check console for details.");
            return;
          }
        }

        // Use the found companion's ID
        const companionIdToUse = companionRecord.id;

        const firstSlice = selectedFlight.slices?.[0];
        const firstSegment = firstSlice?.segments?.[0];

        if (!firstSegment) {
          alert("Cannot create pairing: Invalid flight data");
          return;
        }

        const pairingData = {
          traveler_id: user.id,
          companion_id: companionIdToUse,
          airline_name: selectedFlight.owner?.iata_code || "Unknown",
          flight_number:
            firstSegment.marketing_carrier_flight_number ||
            firstSegment.number ||
            "Unknown",
          flight_date:
            firstSegment.departing_at?.split("T")[0] ||
            flightData.preferred_date,
          seat_number: selectedSeat?.name || "TBD",
          status: "pending_payment",
        };

        console.log("Final pairing data:", pairingData);

        const { data: pairingResult, error } = await supabase
          .from("pairings")
          .insert([pairingData])
          .select()
          .single();

        if (error) {
          console.error("Pairing error:", error);
          alert(`Pairing failed: ${error.message}`);
          return;
        }

        if (pairingResult) {
          setPairingId(pairingResult.id);
          alert(
            `✅ Paired with ${selectedCompanion.full_name}! Proceed to payment.`
          );
        }
      }
      setShowSeatmap(false);
      setShowModal(true);
    } catch (error) {
      console.error("Pairing error:", error);
      alert("Error creating pairing.");
    }
  };
  // Confirm Booking Handler When Not Booked
  const confirmBooking = async () => {
    if (profile === null) {
      setIsAuthModalOpen(true);
      return;
    }
    if (!selectedFlight) return;
    setSubmitting(true);
    const firstSlice = selectedFlight.slices?.[0];
    const segments = firstSlice?.segments || [];

    let stopDescription = "Nonstop";

    if (segments.length > 1) {
      const connectionCount = segments.length - 1;
      // Get all connection (layover) airports between origin and final destination
      const connectionAirports = segments
        .slice(0, -1)
        .map(
          (segment) =>
            segment.destination?.name ||
            segment.destination?.iata_code ||
            "Unknown Airport"
        );

      stopDescription = `${connectionCount} connection${
        connectionCount > 1 ? "s" : ""
      } via ${connectionAirports.join(", ")}`;
    }
    // if (profile?.role !== "traveller") {
    //   setSubmitting(false);
    //   alert("Only travellers can book flights.");
    //   return;
    // }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) await supabase.auth.refreshSession();
      const supabaseToken = session?.access_token;

      // 🧠 Save booking context to localStorage before redirect
      localStorage.setItem(
        "pendingBooking",
        JSON.stringify({
          selectedFlight,
          profile,
          selectedSeat,
          selectedCompanion,
          pairingId,
          stopDescription,
        })
      );

      // 🔹 1. Create Stripe Checkout session
      const stripeRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/duffel-confirm-booking-using-stripe`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseToken}`,
          },
          body: JSON.stringify({
            selectedFlight,
            profile,
          }),
        }
      );

      const stripeData = await stripeRes.json();

      if (!stripeRes.ok) {
        console.error("Stripe session creation failed:", stripeData);
        alert(stripeData.error || "Failed to create Stripe Checkout session");
        setSubmitting(false);
        return;
      }

      // ✅ Redirect to Stripe checkout
      if (stripeData.url) {
        window.location.href = stripeData.url;
        return;
      }

      setSubmitting(false);
    } catch (err) {
      console.error("Booking error:", err);
      alert("Error processing booking. Please try again.");
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    // Reset all states when closing modal
    setShowSeatmap(false);
    setSelectedSeat(null);
    setSelectedCompanion(null);
    setPairingId(null);
    setCompanions([]);
    setSeatmapData(null);
  };
  // if (loading) return <LoadingState />;
  // if (!profile) return <p>You must be logged in to check flights.</p>;
  return (
    <>
      {submitting && <Loader />}
      <BackButton text="Back" className="text-black" />
      <div
        className={`max-w-xl mx-auto rounded  ${
          !selectedPath
            ? "h-screen flex flex-col justify-center"
            : " h-screen flex flex-col justify-center mt-10"
        } ${
          selectedPath === 1
            ? " "
            : "h-screen flex flex-col justify-center !shadow-none"
        }`}
      >
        <h1 className="text-2xl font-bold mb-6 text-center">Flight Checker</h1>
        {!selectedPath && <PathSelector setSelectedPath={setSelectedPath} />}
        {selectedPath === 1 && (
          <>
            <BackButton
              text="Back"
              path={"/dashboard/FlightChecker"}
              selected={selectedPath === 1}
              setSelectedPath={setSelectedPath}
              className="text-black"
            />
            <SearchByFlightNo
              userFlight={userFlight}
              handleSubmit={handleSubmit}
              submitting={submitting}
            />
          </>
        )}
        {selectedPath === 2 && (
          <>
            <BackButton
              text="Back"
              path={"/dashboard/FlightChecker"}
              selected={selectedPath === 2}
              setSelectedPath={setSelectedPath}
              className="text-black"
            />
            <RouteForm
              userRole={profile?.type}
              flightData={flightData}
              setFlightData={setFlightData}
              handleSubmit={handleSubmit}
              submitting={submitting}
              setSelectedPath={setSelectedPath}
            />
          </>
        )}
        {/* {response && response.length > 0 && (
        <FlightList
          response={response}
          currentPage={1}
          setCurrentPage={() => {}}
          flightsPerPage={10}
          handleSelectFlight={handleSelectFlight}
        />
      )} */}
        {response && response.offers && response.offers.length > 0 && (
          <DuffelFlightList
            offers={response}
            handleSelectFlight={handleSelectFlight}
          />
        )}
        <SeatMapModalDuffel
          showSeatmap={showSeatmap}
          setShowSeatmap={setShowSeatmap}
          loadingSeatmap={loadingSeatmap}
          seatmapData={seatmapData}
          selectedSeat={selectedSeat}
          setSelectedSeat={setSelectedSeat}
          companions={companions}
          selectedCompanion={selectedCompanion}
          onSeatSelect={handleSeatSelect}
          onCompanionSelect={handleCompanionSelect}
          onConfirmSeat={handleConfirmSeat}
          onClose={handleClose}
        />
        {showModal && (
          <ConfirmModal
            confirmBooking={confirmBooking}
            cancel={() => setShowModal(false)}
            selectedSeat={selectedSeat}
            selectedCompanion={selectedCompanion}
          />
        )}
        <AuthLogin
          isOpen={isAuthModalOpen}
          onClose={() => setIsAuthModalOpen(false)}
        />
        {companionDataAuth && companionDataAuth?.length > 0 && (
          <>
            <CompanionProfileModal
              profile={profile}
              companion={companionDataAuth}
              isOpen={showCompanionAuthModal}
              onClose={() => setShowCompanionAuthModal(false)}
              setIsAuthModalOpen={setIsAuthModalOpen}
            />
          </>
        )}
      </div>
    </>
  );
}
