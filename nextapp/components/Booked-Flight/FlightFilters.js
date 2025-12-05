// components/Flights/FlightFilters.jsx
const FlightFilters = ({ filters, onFiltersChange, flightCount, totalCount }) => {
  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div className="flex items-center space-x-4">
          <select
            value={filters.status}
            onChange={(e) => onFiltersChange({ ...filters, status: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="confirmed">Confirmed</option>
            <option value="pending">Pending</option>
            <option value="cancelled">Cancelled</option>
          </select>

          <select
            value={filters.date}
            onChange={(e) => onFiltersChange({ ...filters, date: e.target.value })}
            className="border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="all">All Dates</option>
            <option value="upcoming">Upcoming</option>
            <option value="past">Past Flights</option>
          </select>
        </div>

        <div className="text-sm text-gray-600">
          Showing {flightCount} of {totalCount} flights
        </div>
      </div>
    </div>
  );
};

export default FlightFilters;