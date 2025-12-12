import Card from "../common/Card";
import InputField from "../common/InputField";

export default function RouteForm({ flightData, setFlightData, handleSubmit, submitting, setSelectedPath, userRole }) {

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <h2 className="text-xl font-semibold mb-2">Enter Route Details</h2>
<Card className={'space-y-4'}> 
      <InputField
          label="Departure Airport"
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
        />

        <InputField
          label="Destination Airport"
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
        />

        <InputField
          label="Preferred Date"
          name="preferred_date"
          type="date"
          value={flightData.preferred_date}
          onChange={(e) =>
            setFlightData({ ...flightData, preferred_date: e.target.value })
          }
          className="cursor-pointer"
          required
        />

      <div className="flex gap-3">
        <button
          type="submit"
          className="flex-1 bg-green-600 text-white p-2 rounded hover:bg-green-700"
          disabled={submitting}
        >
          {submitting ? "Checking..." : userRole === (null || undefined) ? "Find Companions" : userRole === "companion" ? "Find Flights" : "Find Companions" }
        </button>
        {/* <button
          type="button"
          className="flex-1 bg-gray-400 text-white p-2 rounded hover:bg-gray-500"
          onClick={() => setSelectedPath(null)}
        >
          Change Path
        </button> */}
      </div>
      </Card>
    </form>
  );
}
