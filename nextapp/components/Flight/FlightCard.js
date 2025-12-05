export default function FlightCard({ flight, handleSelectFlight }) {
  const firstItinerary = flight.itineraries?.[0];
  const segments = firstItinerary?.segments || [];
  const firstSegment = segments[0];
  const lastSegment = segments[segments.length - 1];

  return (
    <div className="mb-4 p-4 border rounded-lg bg-white shadow-sm">
      <div className="flex justify-between items-center mb-2">
        <h4 className="text-lg font-semibold text-blue-600">
          Airline: {flight.validatingAirlineCodes?.[0] || "N/A"}
        </h4>
        <p className="text-gray-700 font-medium">
          Price: {flight.price?.grandTotal} {flight.price?.currency}
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <p><strong>From:</strong> {firstSegment?.departure?.iataCode} ({new Date(firstSegment?.departure?.at).toLocaleString()})</p>
          <p><strong>To:</strong> {lastSegment?.arrival?.iataCode} ({new Date(lastSegment?.arrival?.at).toLocaleString()})</p>
        </div>
        <div>
          <p><strong>Duration:</strong> {firstItinerary?.duration}</p>
          <p><strong>Seats Left:</strong> {flight.numberOfBookableSeats || "N/A"}</p>
        </div>
      </div>

      <div className="mt-2 text-sm text-gray-600">
        <p><strong>Ticket Type:</strong> {flight.travelerPricings?.[0]?.fareOption || "STANDARD"}</p>
        <p><strong>Bags:</strong> {flight.price?.additionalServices?.[0]?.amount ? `${flight.price.additionalServices[0].amount} ${flight.price.currency}` : "Included"}</p>
      </div>

      <div className="mt-3 border-t pt-2">
        <p className="font-medium text-gray-800 mb-1">Flight Segments:</p>
        {segments.map((seg, idx) => (
          <div key={idx} className="text-sm border-l-4 border-blue-500 pl-2 mb-2">
            <p>✈️ {seg.carrierCode} {seg.number} — {seg.aircraft?.code}</p>
            <p>{seg.departure?.iataCode} → {seg.arrival?.iataCode}</p>
            <p>Depart: {new Date(seg.departure?.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
            <p>Arrive: {new Date(seg.arrival?.at).toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" })}</p>
            <p>Duration: {seg.duration}</p>
          </div>
        ))}
      </div>

      <div className="mt-4 text-right">
        <button onClick={() => handleSelectFlight(flight)} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">
          Select This Flight
        </button>
      </div>
    </div>
  );
}
