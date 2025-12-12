"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/libs/supabaseClient";
import LoadingState from "@/components/Profile/LoadingState";
import ErrorState from "@/components/Profile/ErrorState";
import { userBookedFlights } from "@/hooks/userBookedFlights";
import FlightFilters from "@/components/Booked-Flight/FlightFilters";
import FlightCard from "@/components/Booked-Flight/FlightCard";
import BackButton from "@/components/common/BackButton";
import { useUser } from "@/context/ClientProvider";

export default function BookedFlightsPage() {
  const [user, setUser] = useState(null);
  const [filters, setFilters] = useState({
    status: "all",
    date: "all",
  });

  useEffect(() => {
    const getUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      setUser(session?.user || null);
    };

    getUser();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user || null);
    });

    return () => subscription.unsubscribe();
  }, []);
  const {
    data: flights,
    isLoading,
    error,
    refetch,
    isFetching,
  } = userBookedFlights(user?.id);

  // Filter flights based on selected filters
  const filteredFlights = flights?.filter((flight) => {
    if (filters.status !== "all" && flight.status !== filters.status) {
      return false;
    }
    if (filters.date !== "all") {
      const flightDate = new Date(flight.departure_date);
      const today = new Date();

      if (filters.date === "upcoming" && flightDate < today) return false;
      if (filters.date === "past" && flightDate >= today) return false;
    }
    return true;
  });

  if (isLoading) return <LoadingState />;

  if (error) {
    return (
      <ErrorState message="Failed to load booked flights" onRetry={refetch} />
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <BackButton text="Back" className="text-black" />
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Booked Flights</h1>
          <p className="text-gray-600 mt-2">
            Manage and view all your flight bookings
          </p>
        </div>

        {/* Filters */}
        <FlightFilters
          filters={filters}
          onFiltersChange={setFilters}
          flightCount={filteredFlights?.length || 0}
          totalCount={flights?.length || 0}
        />

        {/* Loading indicator for refetch */}
        {isFetching && !isLoading && (
          <div className="flex justify-center mb-4">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
          </div>
        )}

        {/* Flights List */}
        <div className="space-y-6">
          {filteredFlights?.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 text-6xl mb-4">✈️</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                No flights found
              </h3>
              <p className="text-gray-500">
                {flights?.length === 0
                  ? "You haven't booked any flights yet."
                  : "No flights match your current filters."}
              </p>
            </div>
          ) : (
            filteredFlights?.map((flight) => (
              <FlightCard key={flight.id} flight={flight} onUpdate={refetch} />
            ))
          )}
        </div>
      </div>
    </div>
  );
}
