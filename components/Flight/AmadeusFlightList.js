import { useState } from "react";

export default function AmadeusFlightList({ offers, dictionaries, handleSelectFlight }) {
  const [currentPage, setCurrentPage] = useState(1);
  const flightsPerPage = 12;

  // Pagination calculations
  const totalPages = Math.ceil(offers.length / flightsPerPage);
  const startIndex = (currentPage - 1) * flightsPerPage;
  const endIndex = startIndex + flightsPerPage;
  const currentFlights = offers.slice(startIndex, endIndex);

  // Helper to get carrier name from dictionaries
  const getCarrierName = (code) => {
    return dictionaries?.carriers?.[code] || code;
  };

  // Format time only (10:30)
  const formatTime = (dateTimeString) => {
    const date = new Date(dateTimeString);
    return date.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    });
  };

  // Format duration (PT2H30M -> 2h 30m)
  const formatDuration = (duration) => {
    if (!duration) return "";
    const match = duration.match(/PT(\d+H)?(\d+M)?/);
    if (!match) return duration;

    const hours = match[1] ? match[1].replace("H", "h ") : "";
    const minutes = match[2] ? match[2].replace("M", "m") : "";
    return hours + minutes;
  };

  if (!offers || offers.length === 0) {
    return (
      <div className="mt-6 p-4 bg-gray-50 rounded">
        <p className="text-center text-gray-600">No flights found</p>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <h2 className="text-xl font-semibold mb-4">
        Available Flights ({offers.length})
      </h2>

      {/* Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {currentFlights.map((offer) => {
          const itinerary = offer.itineraries[0];
          const segments = itinerary.segments || [];
          const firstSegment = segments[0];
          const lastSegment = segments[segments.length - 1];
          const price = offer.price;
          const carrierCode = firstSegment?.carrierCode;

          return (
            <div
              key={offer.id}
              className="border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-200 bg-white hover:border-blue-300 flex flex-col"
            >
              {/* Header: Airline + Price */}
              <div className="flex justify-between items-center mb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 flex items-center justify-center bg-blue-50 rounded-lg">
                    <span className="text-sm font-bold text-blue-600">
                      {carrierCode}
                    </span>
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900 text-sm">
                      {getCarrierName(carrierCode)}
                    </p>
                    <p className="text-xs text-gray-500">
                      {carrierCode}{firstSegment?.number}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xl font-bold text-blue-600">
                    {price.currency} {price.grandTotal || price.total}
                  </p>
                </div>
              </div>

              {/* Flight Route - Compact */}
              <div className="flex items-center justify-between mb-3 py-2 border-t border-b border-gray-100">
                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {firstSegment.departure.iataCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(firstSegment.departure.at)}
                  </p>
                </div>

                <div className="flex-1 px-3">
                  <div className="text-center">
                    <p className="text-xs text-gray-500 mb-1">
                      {formatDuration(itinerary.duration)}
                    </p>
                    <div className="flex items-center">
                      <div className="h-px bg-gray-300 flex-1"></div>
                      <div className="mx-1">
                        <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                        </svg>
                      </div>
                      <div className="h-px bg-gray-300 flex-1"></div>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {segments.length === 1 ? "Direct" : `${segments.length - 1} stop`}
                    </p>
                  </div>
                </div>

                <div className="text-center">
                  <p className="text-lg font-bold text-gray-900">
                    {lastSegment.arrival.iataCode}
                  </p>
                  <p className="text-sm text-gray-600">
                    {formatTime(lastSegment.arrival.at)}
                  </p>
                </div>
              </div>

              {/* Tags */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <span className="bg-blue-100 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                  {offer.travelerPricings?.[0]?.fareDetailsBySegment?.[0]?.cabin || "Economy"}
                </span>
                {offer.numberOfBookableSeats && (
                  <span className="bg-green-100 text-green-700 px-2 py-1 rounded text-xs font-medium">
                    {offer.numberOfBookableSeats} seats
                  </span>
                )}
              </div>

              {/* Select Button */}
              <button
                onClick={() => handleSelectFlight(offer)}
                className="w-full mt-auto bg-blue-600 text-white py-2.5 px-4 rounded-lg hover:bg-blue-700 transition-colors font-semibold text-sm"
              >
                Select Flight
              </button>
            </div>
          );
        })}
      </div>

      {/* Pagination Controls */}
      {totalPages > 1 && (
        <div className="flex justify-center items-center gap-4 mt-6">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              currentPage === 1
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-50 text-blue-600 border-blue-300"
            }`}
          >
            Previous
          </button>

          <span className="text-sm font-medium text-gray-700">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className={`px-4 py-2 rounded-lg text-sm font-medium border ${
              currentPage === totalPages
                ? "bg-gray-100 text-gray-400 cursor-not-allowed"
                : "bg-white hover:bg-gray-50 text-blue-600 border-blue-300"
            }`}
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
