'use client';
import FlightDetailsForm from "../../components/Booked-Flight/FlightDetailsForm";

export default function SearchByFlightNo({ userFlight, handleSubmit, submitting }) {
  const handleFlightSubmit = (data) => {
    console.log("Final submission data:", data);
    // 🔹 You can integrate this with your `handleSubmit` prop or API call
    handleSubmit?.(data);
  };

  return (
    <div>
      <FlightDetailsForm onSubmit={handleFlightSubmit} />
    </div>
  );
}
