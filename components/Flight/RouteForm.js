import Card from "../common/Card";
import InputField from "../common/InputField";

export default function RouteForm({ flightData, setFlightData, handleSubmit, handleSearchFlights, submitting, setSelectedPath, userRole, hasResults, onModifySearch }) {
  const today = new Date().toISOString().split("T")[0];

  // Compact view when results are showing
  if (hasResults) {
    return (
      <div className="mb-4">
        <Card className="!p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2 text-sm">
              <span className="font-bold text-lg">{flightData.departure_airport}</span>
              <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
              <span className="font-bold text-lg">{flightData.destination_airport}</span>
              <span className="text-gray-500 ml-2">|</span>
              <span className="text-gray-600 ml-2">{flightData.preferred_date}</span>
            </div>
            <button
              type="button"
              onClick={onModifySearch}
              className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center gap-1"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              Modify Search
            </button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <form onSubmit={(e) => { e.preventDefault(); handleSearchFlights(e); }} className="w-full">
      <Card className="!p-4">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* From */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">From</label>
            <input
              type="text"
              name="departure_airport"
              value={flightData.departure_airport}
              onChange={(e) =>
                setFlightData({
                  ...flightData,
                  departure_airport: e.target.value.toUpperCase(),
                })
              }
              placeholder="e.g. JFK"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
            />
          </div>

          {/* To */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">To</label>
            <input
              type="text"
              name="destination_airport"
              value={flightData.destination_airport}
              onChange={(e) =>
                setFlightData({
                  ...flightData,
                  destination_airport: e.target.value.toUpperCase(),
                })
              }
              placeholder="e.g. LHR"
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-semibold"
            />
          </div>

          {/* Date */}
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">Departure Date</label>
            <input
              type="date"
              name="preferred_date"
              value={flightData.preferred_date}
              onChange={(e) =>
                setFlightData({ ...flightData, preferred_date: e.target.value })
              }
              min={today}
              required
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 cursor-pointer"
            />
          </div>

          {/* Buttons */}
          <div className="flex gap-2 lg:flex-shrink-0">
            <button
              type="button"
              className="flex-1 lg:flex-none bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-semibold whitespace-nowrap"
              disabled={submitting}
              onClick={handleSearchFlights}
            >
              {submitting ? "Searching..." : "Search Flights"}
            </button>
            {userRole !== "companion" && (
              <button
                type="button"
                onClick={handleSubmit}
                className="flex-1 lg:flex-none bg-green-600 text-white py-3 px-6 rounded-lg hover:bg-green-700 transition-colors font-semibold whitespace-nowrap"
                disabled={submitting}
              >
                {submitting ? "Checking..." : "Find Companions"}
              </button>
            )}
          </div>
        </div>
      </Card>
    </form>
  );
}
