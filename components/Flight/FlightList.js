import FlightCard from "./FlightCard";

export default function FlightList({ response, currentPage, setCurrentPage, flightsPerPage, handleSelectFlight }) {
  const totalFlights = response?.meta?.count || 0;
  const totalPages = Math.ceil(totalFlights / flightsPerPage);
  const startIndex = (currentPage - 1) * flightsPerPage;
  const currentFlights = response?.data?.slice(startIndex, startIndex + flightsPerPage);

  return (
    <div className="mt-6 p-4 bg-gray-100 rounded">
      <h3 className="font-semibold text-lg mb-4 text-center">
        Available Flights ({totalFlights})
      </h3>

      {currentFlights?.length > 0 ? (
        currentFlights.map((flight, i) => (
          <FlightCard key={flight.id || i} flight={flight} handleSelectFlight={handleSelectFlight} />
        ))
      ) : (
        <p className="text-center text-gray-600">No flights found.</p>
      )}

      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
            disabled={currentPage === 1}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Prev
          </button>
          <span className="px-2 font-medium">Page {currentPage} of {totalPages}</span>
          <button
            onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
            disabled={currentPage === totalPages}
            className="px-3 py-1 bg-gray-300 rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
