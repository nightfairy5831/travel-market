"use client";
import { useState } from "react";
import Button from "../common/Button";
import Card from "../common/Card";
import InputField from "../common/InputField";

export default function FlightDetailsForm({ onSubmit }) {
  const [knowsSeat, setKnowsSeat] = useState(null);
  const [formData, setFormData] = useState({
    airlineName: "",
    flightNumber: "",
    flightDate: "",
    seatNumber: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({ knowsSeat, ...formData });
  };

  return (
    <div>
      {/* Step 1: Yes/No Question */}
      <Card className="mb-3">
        <p className="text-xl">Do you know your seat number on the flight?</p>
        <div className="flex justify-end gap-3 mt-3">
          <Button
            type="button"
            className="!bg-[#ff002b] hover:brightness-110 text-white"
            onClick={() => setKnowsSeat(false)}
          >
            No
          </Button>
          <Button
            type="button"
            className="bg-[#ff7a00] hover:brightness-110 text-white"
            onClick={() => setKnowsSeat(true)}
          >
            Yes
          </Button>
        </div>
      </Card>

      {/* Step 2: Conditional Form */}
      {knowsSeat !== null && (
        <Card className="p-4 mt-4">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3">
            <InputField
              label="Airline Name"
              name="airlineName"
              value={formData.airlineName}
              onChange={handleChange}
              placeholder="Enter Airline Name"
              required
            />

            <InputField
              label="Flight Number"
              name="flightNumber"
              value={formData.flightNumber}
              onChange={handleChange}
              placeholder="Enter Flight Number"
              required
            />

            <InputField
              label="Flight Date"
              name="flightDate"
              type="date"
              value={formData.flightDate}
              onChange={handleChange}
              required
            />

            {knowsSeat && (
              <InputField
                label="Seat Number"
                name="seatNumber"
                value={formData.seatNumber}
                onChange={handleChange}
                placeholder="Enter Seat Number"
                required
              />
            )}
            <Button
              type="submit"
              className="bg-[#ff7a00] hover:brightness-110 text-white mt-2"
            >
              Submit
            </Button>
          </form>
        </Card>
      )}
    </div>
  );
}
