// components/Flights/FlightCard.jsx
import { useState } from "react";
import { supabase } from "@/libs/supabaseClient";

const FlightCard = ({ flight, onUpdate }) => {
  console.log(flight)
  const [isLoading, setIsLoading] = useState(false);

  const handleCancelFlight = async () => {
    if (!confirm("Are you sure you want to cancel this flight?")) return;
    
    setIsLoading(true);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: "cancelled" })
        .eq("id", flight.id);

      if (error) throw error;
      onUpdate(); // Refetch data
    } catch (error) {
      console.error("Failed to cancel flight:", error);
      alert("Failed to cancel flight. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "confirmed":
        return "bg-green-100 text-green-800";
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "cancelled":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 hover:shadow-lg transition-shadow">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            {flight.airline_name} {flight.flight_number}
          </h3>
          <p className="text-gray-600">{flight.origin} → {flight.destination}</p>
        </div>
        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(flight.status)}`}>
          {flight.status}
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
        <div>
          <p className="text-sm text-gray-500">Departure At</p>
          <p className="font-medium">
            {new Date(flight.departure_date).toLocaleDateString()} {flight.departure_time}
          </p>
        </div>
         <div>
          <p className="text-sm text-gray-500">Arrival At</p>
          <p className="font-medium">
            {new Date(flight.arrival_date).toLocaleDateString()} {flight.arrival_time}
          </p>
        </div>
          <div>
          <p className="text-sm text-gray-500">Departure Airport</p>
          <p className="font-medium">{flight.departure_airport
}</p>
        </div>
         <div>
          <p className="text-sm text-gray-500">Destination Airport</p>
          <p className="font-medium">{flight.destination_airport}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Seat</p>
          <p className="font-medium">{flight.seat_number}</p>
        </div>
        <div>
          <p className="text-sm text-gray-500">Price</p>
          <p className="font-medium">${flight.price}</p>
        </div>
      </div>

      {/* Pairing Information */}
      {flight.pairings && flight.pairings.length > 0 && (
        <div className="border-t pt-4 mt-4">
          <h4 className="text-sm font-medium text-gray-900 mb-2">Travel Companions</h4>
          <div className="space-y-2">
            {flight.pairings.map((pairing) => (
              <div key={pairing.id} className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    {pairing.companion?.full_name?.charAt(0) || "C"}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{pairing.companion?.full_name}</p>
                    <p className="text-xs text-gray-500">
                      {pairing.companion?.age && `${pairing.companion.age} yrs`}
                      {pairing.companion?.interests && ` • ${pairing.companion.interests.join(", ")}`}
                    </p>
                  </div>
                </div>
                <span className={`px-2 py-1 rounded text-xs ${getStatusColor(pairing.status)}`}>
                  {pairing.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end space-x-3 mt-4 pt-4 border-t">
        <button
          onClick={handleCancelFlight}
          disabled={isLoading || flight.status === "cancelled"}
          className="px-4 py-2 text-sm font-medium text-red-600 border border-red-600 rounded-md hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? "Cancelling..." : "Cancel Flight"}
        </button>
        <button className="px-4 py-2 text-sm font-medium text-blue-600 border border-blue-600 rounded-md hover:bg-blue-50">
          View Details
        </button>
      </div>
    </div>
  );
};

export default FlightCard;