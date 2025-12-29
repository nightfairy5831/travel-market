"use client";
import { useEffect, useState } from "react";
import { supabase } from "@/libs/supabaseClient";
import PathSelector from "@/components/Flight/PathSelector";
import RouteForm from "@/components/Flight/RouteForm";
import FlightList from "@/components/Flight/FlightList";
import ConfirmModal from "@/components/Flight/ConfirmModal";
import AmadeusFlightList from "@/components/Flight/AmadeusFlightList";
import SeatMapModal from "@/components/Seat/SeatMapModal";
import BackButton from "@/components/common/BackButton";
import LoadingState from "@/components/Profile/LoadingState";
import SearchByFlightNo from "@/components/Flight/BookedFlightInfo";
import Loader from "@/components/common/Loader";
import { useUser } from "@/context/ClientProvider";
import AuthLogin from "@/components/common/AuthModal";
import CompanionProfileModal from "@/components/Seat/PublicProfileCompanion";
import Sentry from "@/sentry.client.config";
import { useError } from "../../../context/ErrorContext";
import ErrorMessage from "../../../components/Error/ErrorMessage";
import ErrorModal from "@/components/common/ErrorModal";

export default function FlightChecker() {
  const { showError } = useError();
  const { user, profile } = useUser();
  const [selectedPath, setSelectedPath] = useState(null);
  // Error Modal For No Companion List
    const [errorOpen, setErrorOpen] = useState(false);
  const [isCompanionListError, setIsCompanionListError] = useState(false);
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

  // ! Direct Flight Search Handler (Skip companion search) - Uses Amadeus API
  const handleSearchFlights = async (e) => {
    e?.preventDefault();
    setSubmitting(true);
    // Clear any previous companion error state
    setErrorOpen(false);
    setIsCompanionListError(false);
    try {
      let supabaseToken;
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        supabaseToken = session.access_token;
      } else {
        supabaseToken = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
      }

      const searchData = {
        departure_airport: flightData.departure_airport,
        destination_airport: flightData.destination_airport,
        preferred_date: flightData.preferred_date,
      };

      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/amadeus-flights`,
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

      if (!res.ok || !data.success) {
        setResponse({
          success: false,
          message: data.message || data.error || "Amadeus API error",
        });
      } else {
        setResponse(data.data || null);
      }
    } catch (err) {
      console.error("Amadeus flight search error:", err);
      setResponse({
        success: false,
        message: "Error fetching flights",
      });
    } finally {
      setSubmitting(false);
    }
  };

  // ! Flight Search Handler When Not Booked (Find Companions first)
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (selectedPath === 2 && (!profile || profile.type === "traveller")) {
      setSubmitting(true);
      try {
        const travelDate = new Date(
          flightData.preferred_date || flightData.departure_date
        )
          .toISOString()
          .split("T")[0];
        if (!travelDate) {
          showError("Missing departure date in flightData");
          setSubmitting(false);
          return;
        }
        // ✅ Fetch companions with their flight data
        const { data: companions, error } = await supabase
          .from("bookings")
          .select("*")
          .eq("departure_iata", flightData.departure_airport)
          // .eq("destination_iata", flightData.destination_airport)
          .eq("departure_date", travelDate);

        if (error) {
          showError("❌ Error fetching companions:", error);
          setSubmitting(false);
          return;
        }

        if (!companions || companions.length === 0) {
           setSubmitting(false);
          setErrorOpen(true);
          setIsCompanionListError(true);
          // showError("No matching companions found");
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
                  "first_name, last_name, email, phone, profile_photo_url, gender, languages, short_bio"
                )
                .eq("user_id", companion.traveler_id)
                .single();

            if (companionError) {
              showError(
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
        showError("Unexpected error fetching companions:", err);
        setSubmitting(false);
        return;
      }
    }
    // Also search flights using Amadeus after companion search
    await handleSearchFlights();
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

      // 1. Fetch seatmaps for selected flight using Amadeus
      const seatmapRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/amadeus-seatmaps`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${supabaseToken}`,
          },
          body: JSON.stringify({ flight_offer_id: flight.id }),
        }
      );

      const seatmapData = await seatmapRes.json();

      if (!seatmapRes.ok) {
        setSubmitting(false);
        alert(
          `Seatmap fetch failed: ${
            seatmapData.error?.message ||
            seatmapData.error ||
            "Unknown error"
          }`
        );
        return;
      }

      // 2. Extract flight details from Amadeus format
      const itinerary = flight.itineraries?.[0];
      const firstSegment = itinerary?.segments?.[0];

      let flightNumber = "Unknown";
      let flightDate = flightData.preferred_date;
      let airlineCode = "Unknown";

      if (firstSegment) {
        flightNumber = firstSegment.number || flight.id;
        flightDate = firstSegment.departure?.at?.split("T")[0] || flightDate;
        airlineCode = firstSegment.carrierCode || "Unknown";
      }

      let companionsData = [];

      // 3. Search for companions if user is a traveler
      if (profile === null || profile?.type === "traveller") {
        const flightDetails = {
          flight_number: flightNumber,
          date: flightDate,
          airline: airlineCode,
        };

        // Call search-companions endpoint
        const companionsRes = await fetch(
          `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/search-companions`,
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
          console.error("Non-JSON response:", textResponse.substring(0, 200));
          throw new Error("Server returned non-JSON response");
        }

        const companionsResult = await companionsRes.json();

        if (companionsRes.ok && companionsResult.success) {
          setSubmitting(false);
          companionsData = companionsResult.companions || [];
          console.log(`Found ${companionsData.length} companions for traveler`);
        } else {
          setSubmitting(false);
          console.error("Companion search failed:", companionsResult);
          const errorMessage =
            companionsResult.details ||
            companionsResult.error ||
            "Companion search failed";
          alert(`Companion search error: ${errorMessage}`);
        }
      } else {
        setSubmitting(false);
        console.log(`User is ${profile?.type}, skipping companion search`);
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

        // Extract flight details from Amadeus format
        const itinerary = selectedFlight.itineraries?.[0];
        const firstSegment = itinerary?.segments?.[0];

        if (!firstSegment) {
          alert("Cannot create pairing: Invalid flight data");
          return;
        }

        const pairingData = {
          traveler_id: user.id,
          companion_id: companionIdToUse,
          airline_name: firstSegment.carrierCode || "Unknown",
          flight_number: firstSegment.number || "Unknown",
          flight_date:
            firstSegment.departure?.at?.split("T")[0] ||
            flightData.preferred_date,
          seat_number: selectedSeat?.designator || selectedSeat?.number || "TBD",
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

    // Extract from Amadeus format
    const itinerary = selectedFlight.itineraries?.[0];
    const segments = itinerary?.segments || [];

    let stopDescription = "Nonstop";

    if (segments.length > 1) {
      const connectionCount = segments.length - 1;
      const connectionAirports = segments
        .slice(0, -1)
        .map(
          (segment) =>
            segment.arrival?.iataCode || "Unknown Airport"
        );

      stopDescription = `${connectionCount} connection${
        connectionCount > 1 ? "s" : ""
      } via ${connectionAirports.join(", ")}`;
    }

    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) await supabase.auth.refreshSession();
      const supabaseToken = session?.access_token;

      // Save booking context to localStorage before redirect
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

      // Create Stripe Checkout session using Amadeus endpoint
      const stripeRes = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/amadeus-confirm-booking-using-stripe`,
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

      // Redirect to Stripe checkout
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

  const hasFlightResults = response && response.data && response.data.length > 0;

  return (
    <>
      {submitting && <Loader />}
      <BackButton text="Back" className="text-black" />
      <div className="w-full px-4 py-6">
        <div className="max-w-7xl mx-auto">
        <h1 className="text-2xl font-bold mb-6">Flight Checker</h1>
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
            {!hasFlightResults && (
              <BackButton
                text="Back"
                path={"/dashboard/FlightChecker"}
                selected={selectedPath === 2}
                setSelectedPath={setSelectedPath}
                className="text-black"
              />
            )}
            <RouteForm
              userRole={profile?.type}
              flightData={flightData}
              setFlightData={setFlightData}
              handleSubmit={handleSubmit}
              handleSearchFlights={handleSearchFlights}
              submitting={submitting}
              setSelectedPath={setSelectedPath}
              hasResults={hasFlightResults}
              onModifySearch={() => setResponse(null)}
            />
          </>
        )}
        {/* Amadeus Flight List */}
        {hasFlightResults && (
          <AmadeusFlightList
            offers={response.data}
            dictionaries={response.dictionaries}
            handleSelectFlight={handleSelectFlight}
          />
        )}
        <SeatMapModal
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

        {isCompanionListError && (
          <ErrorModal
            open={errorOpen}
            message="No Companions found for this date. Try some other dates"
            onClose={() => setErrorOpen(false)}
          />
        )}
        </div>
      </div>
    </>
  );
}
