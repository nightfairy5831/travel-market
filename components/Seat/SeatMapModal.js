// components/Seat/SeatMapModal.js
"use client";
import { useState } from "react";

export default function SeatMapModal({
  showSeatmap,
  setShowSeatmap,
  loadingSeatmap,
  seatmapData,
  selectedSeat,
  setSelectedSeat,
  companions,
  selectedCompanion,
  onSeatSelect,
  onCompanionSelect,
  onConfirmSeat,
  onClose,
}) {
  const [activeTab, setActiveTab] = useState("seatmap");
  const [filter, setFilter] = useState("all");

  if (!showSeatmap) return null;

  const handleClose = () => {
    if (onClose) {
      onClose();
    } else {
      setShowSeatmap(false);
      setSelectedSeat(null);
    }
  };

  const handleSeatSelect = (seat) => {
    onSeatSelect(seat);
  };

  const handleCompanionSelect = (companion) => {
    onCompanionSelect(companion);
  };

  // Filter companions based on seat availability
  const filteredCompanions = companions.filter((companion) => {
    if (filter === "all") return true;
    if (filter === "adjacent") return companion.has_adjacent_vacant;
    if (filter === "same-row") return companion.seatAvailability?.sameRow;
    return true;
  });

  // Sort companions by availability
  const sortedCompanions = [...filteredCompanions].sort((a, b) => {
    const aScore =
      (a.has_adjacent_vacant ? 3 : 0) + (a.seatAvailability?.sameRow ? 2 : 0);
    const bScore =
      (b.has_adjacent_vacant ? 3 : 0) + (b.seatAvailability?.sameRow ? 2 : 0);
    return bScore - aScore;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">
              Select Your Seat & Find Companions
            </h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              X
            </button>
          </div>

          {/* Tab Navigation */}
          <div className="flex border-b mb-6">
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "seatmap"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("seatmap")}
            >
              Seat Map
            </button>
            <button
              className={`px-4 py-2 font-medium ${
                activeTab === "companions"
                  ? "border-b-2 border-blue-500 text-blue-600"
                  : "text-gray-500"
              }`}
              onClick={() => setActiveTab("companions")}
            >
              Travel Companions ({companions.length})
            </button>
          </div>

          {loadingSeatmap ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2">Loading seatmap and finding companions...</p>
            </div>
          ) : (
            <>
              {/* Seat Map Tab */}
              {activeTab === "seatmap" && (
                <div>
                  <SeatMap
                    seatmapData={seatmapData}
                    selectedSeat={selectedSeat}
                    onSeatSelect={handleSeatSelect}
                    companions={companions}
                  />

                  <div className="mt-6 flex justify-between items-center">
                    <div>
                      {selectedSeat && (
                        <div className="bg-blue-50 p-3 rounded">
                          <h4 className="font-semibold">
                            Selected Seat: {selectedSeat.designator || selectedSeat.number}
                          </h4>
                          {selectedSeat.travelerPricing?.[0]?.price && (
                            <p>
                              Fee: {selectedSeat.travelerPricing[0].price.currency}{" "}
                              {selectedSeat.travelerPricing[0].price.total}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={handleClose}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={onConfirmSeat}
                        disabled={!selectedSeat}
                        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                      >
                        Confirm Seat
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Companions Tab */}
              {activeTab === "companions" && (
                <div>
                  {/* Filter Controls */}
                  <div className="flex gap-2 mb-4">
                    <button
                      className={`px-3 py-1 rounded-full text-sm ${
                        filter === "all"
                          ? "bg-blue-100 text-blue-600 border border-blue-200"
                          : "bg-gray-100 text-gray-600"
                      }`}
                      onClick={() => setFilter("all")}
                    >
                      All Companions
                    </button>
                    <button
                      className={`px-3 py-1 rounded-full text-sm ${
                        filter === "adjacent"
                          ? "bg-green-100 text-green-600 border border-green-200"
                          : "bg-gray-100 text-gray-600"
                      }`}
                      onClick={() => setFilter("adjacent")}
                    >
                      Adjacent Seats
                    </button>
                    <button
                      className={`px-3 py-1 rounded-full text-sm ${
                        filter === "same-row"
                          ? "bg-purple-100 text-purple-600 border border-purple-200"
                          : "bg-gray-100 text-gray-600"
                      }`}
                      onClick={() => setFilter("same-row")}
                    >
                      Same Row
                    </button>
                  </div>

                  {/* Companions List */}
                  <div className="space-y-3">
                    {sortedCompanions.length === 0 ? (
                      <div className="text-center py-8 text-gray-500">
                        No companions found for this flight.
                      </div>
                    ) : (
                      sortedCompanions.map((companion) => (
                        <CompanionCard
                          key={companion.id}
                          companion={companion}
                          isSelected={selectedCompanion?.id === companion.id}
                          onSelect={handleCompanionSelect}
                        />
                      ))
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div className="mt-6 flex justify-between items-center">
                    <div>
                      {selectedCompanion && (
                        <div className="bg-green-50 p-3 rounded">
                          <h4 className="font-semibold text-green-700">
                            Selected: {selectedCompanion.full_name}
                          </h4>
                          <p className="text-sm text-green-600">
                            Current Seat: {selectedCompanion.current_seat}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => setActiveTab("seatmap")}
                        className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                      >
                        Back to Seat Map
                      </button>
                      {selectedCompanion && (
                        <button
                          onClick={() => setActiveTab("seatmap")}
                          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
                        >
                          Select Seat for Pairing
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// Companion Card Component
function CompanionCard({ companion, isSelected, onSelect }) {
  const getAvailabilityBadge = (companion) => {
    if (companion.has_adjacent_vacant) {
      return { text: "Adjacent Seats", color: "bg-green-100 text-green-800" };
    }
    if (companion.seatAvailability?.sameRow) {
      return { text: "Same Row", color: "bg-purple-100 text-purple-800" };
    }
    return { text: "Nearby", color: "bg-blue-100 text-blue-800" };
  };

  const availability = getAvailabilityBadge(companion);

  return (
    <div
      className={`border rounded-lg p-4 cursor-pointer transition-all ${
        isSelected
          ? "border-blue-500 bg-blue-50 shadow-md"
          : "border-gray-200 hover:border-blue-300 hover:shadow-sm"
      }`}
      onClick={() => onSelect(companion)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
            {companion.full_name?.charAt(0) || "U"}
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">
              {companion.full_name}
            </h3>
            <p className="text-sm text-gray-600">
              Seat: {companion.current_seat} - Flight:{" "}
              {companion.bookings?.flight_number}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <span
            className={`px-3 py-1 rounded-full text-xs font-medium ${availability.color}`}
          >
            {availability.text}
          </span>
          {isSelected && <span className="text-blue-500 text-xl">Y</span>}
        </div>
      </div>
    </div>
  );
}

// SeatMap Component for Amadeus format
function SeatMap({ seatmapData, selectedSeat, onSeatSelect, companions }) {
  // Create a map of companion seats for quick lookup
  const companionSeatsMap = {};
  companions.forEach((companion) => {
    if (companion.current_seat) {
      companionSeatsMap[companion.current_seat] = companion;
    }
  });

  // Handle both Amadeus and mock seatmap formats
  if (!seatmapData || !seatmapData.data || seatmapData.data.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        No seatmap data available
      </div>
    );
  }

  const seatmapInfo = seatmapData.data[0];
  const decks = seatmapInfo.decks || [];

  // For mock/Amadeus format - extract seats from decks
  const allSeats = [];
  decks.forEach((deck) => {
    if (deck.seats) {
      allSeats.push(...deck.seats);
    }
  });

  // Group seats by row
  const seatsByRow = {};
  allSeats.forEach((seat) => {
    const match = seat.number?.match(/(\d+)([A-Z])/);
    if (match) {
      const row = match[1];
      if (!seatsByRow[row]) {
        seatsByRow[row] = [];
      }
      seatsByRow[row].push(seat);
    }
  });

  // Sort rows numerically
  const sortedRows = Object.keys(seatsByRow).sort(
    (a, b) => parseInt(a) - parseInt(b)
  );

  const renderSeat = (seat) => {
    const isSelected = selectedSeat?.number === seat.number;
    const pricing = seat.travelerPricing?.[0];
    const isAvailable = pricing?.seatAvailabilityStatus === "AVAILABLE";
    const isCompanionSeat = companionSeatsMap[seat.number];

    let seatClass =
      "w-10 h-10 rounded border-2 flex items-center justify-center text-xs font-bold cursor-pointer transition-all ";

    if (isSelected) {
      seatClass += "bg-blue-500 text-white border-blue-700";
    } else if (isCompanionSeat) {
      seatClass += "bg-purple-200 border-purple-500 cursor-default";
    } else if (isAvailable) {
      seatClass += "bg-green-100 border-green-500 hover:bg-green-200";
    } else {
      seatClass += "bg-gray-200 border-gray-400 cursor-not-allowed text-gray-400";
    }

    return (
      <div
        key={seat.number}
        className={seatClass}
        onClick={() => isAvailable && !isCompanionSeat && onSeatSelect(seat)}
        title={
          isCompanionSeat
            ? `Companion: ${isCompanionSeat.full_name}`
            : isAvailable
            ? `Seat ${seat.number} - ${pricing?.price?.currency || ""} ${pricing?.price?.total || "Free"}`
            : "Unavailable"
        }
      >
        {isCompanionSeat ? "C" : seat.number?.replace(/^\d+/, "")}
      </div>
    );
  };

  return (
    <div className="seatmap-container">
      {/* Seat Legend */}
      <div className="seat-legend mb-4 p-3 bg-gray-50 rounded-lg">
        <h4 className="font-semibold mb-2">Seat Legend</h4>
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs">
              A
            </div>
            <span>Your Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-200 rounded flex items-center justify-center text-xs border-2 border-purple-500">
              C
            </div>
            <span>Companion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-green-100 rounded flex items-center justify-center text-xs border-2 border-green-500">
              A
            </div>
            <span>Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs border-2 border-gray-400">
              X
            </div>
            <span>Unavailable</span>
          </div>
        </div>
      </div>

      {/* Aircraft Info */}
      <div className="aircraft-info mb-4 p-3 bg-gray-50 rounded">
        <strong className="block">
          {seatmapInfo.aircraft?.name || seatmapInfo.aircraft?.code || "Aircraft"}
        </strong>
        <span className="text-sm text-gray-600">
          {seatmapInfo.departure?.iataCode} - {seatmapInfo.arrival?.iataCode}
        </span>
      </div>

      {/* Seat Grid */}
      <div className="seats-container bg-gray-100 p-4 rounded-lg">
        {/* Column Headers */}
        <div className="flex justify-center gap-2 mb-2">
          <div className="w-10 text-center font-bold">A</div>
          <div className="w-10 text-center font-bold">B</div>
          <div className="w-10 text-center font-bold">C</div>
          <div className="w-4"></div>
          <div className="w-10 text-center font-bold">D</div>
          <div className="w-10 text-center font-bold">E</div>
          <div className="w-10 text-center font-bold">F</div>
        </div>

        {/* Rows */}
        {sortedRows.map((rowNum) => {
          const rowSeats = seatsByRow[rowNum].sort((a, b) => {
            const aLetter = a.number?.replace(/\d+/, "") || "";
            const bLetter = b.number?.replace(/\d+/, "") || "";
            return aLetter.localeCompare(bLetter);
          });

          return (
            <div key={rowNum} className="flex justify-center gap-2 mb-2 items-center">
              {/* Left side seats (A, B, C) */}
              {["A", "B", "C"].map((col) => {
                const seat = rowSeats.find(
                  (s) => s.number === `${rowNum}${col}`
                );
                return seat ? (
                  renderSeat(seat)
                ) : (
                  <div key={`${rowNum}${col}`} className="w-10 h-10"></div>
                );
              })}

              {/* Aisle with row number */}
              <div className="w-8 text-center text-gray-500 font-medium">
                {rowNum}
              </div>

              {/* Right side seats (D, E, F) */}
              {["D", "E", "F"].map((col) => {
                const seat = rowSeats.find(
                  (s) => s.number === `${rowNum}${col}`
                );
                return seat ? (
                  renderSeat(seat)
                ) : (
                  <div key={`${rowNum}${col}`} className="w-10 h-10"></div>
                );
              })}
            </div>
          );
        })}
      </div>
    </div>
  );
}
