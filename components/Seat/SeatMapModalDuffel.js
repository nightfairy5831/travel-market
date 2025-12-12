// components/Seat/SeatMapModalDuffel.jsx
"use client";
import { useState } from "react";

export default function SeatMapModalDuffel({
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
}) {
  const [activeTab, setActiveTab] = useState("seatmap"); // "seatmap" or "companions"
  const [filter, setFilter] = useState("all"); // "all", "adjacent", "same-row"

  if (!showSeatmap) return null;

  const handleClose = () => {
    setShowSeatmap(false);
    setSelectedSeat(null);
  };

  const handleSeatSelect = (seat) => {
    onSeatSelect(seat);
  };

  const handleCompanionSelect = (companion) => {
    onCompanionSelect(companion);
  };

  // Filter companions based on seat availability
  const filteredCompanions = companions.filter(companion => {
    if (filter === "all") return true;
    if (filter === "adjacent") return companion.has_adjacent_vacant;
    if (filter === "same-row") return companion.seatAvailability?.sameRow;
    return true;
  });

  // Sort companions by availability (adjacent first, then same row, then others)
  const sortedCompanions = [...filteredCompanions].sort((a, b) => {
    const aScore = (a.has_adjacent_vacant ? 3 : 0) + (a.seatAvailability?.sameRow ? 2 : 0);
    const bScore = (b.has_adjacent_vacant ? 3 : 0) + (b.seatAvailability?.sameRow ? 2 : 0);
    return bScore - aScore;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-6xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-bold">Select Your Seat & Find Companions</h2>
            <button
              onClick={handleClose}
              className="text-gray-500 hover:text-gray-700 text-2xl"
            >
              ✕
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
                  <SeatMapDuffel 
                    seatmapData={seatmapData}
                    selectedSeat={selectedSeat}
                    onSeatSelect={handleSeatSelect}
                    companions={companions}
                  />
                  
                  <div className="mt-6 flex justify-between items-center">
                    <div>
                      {selectedSeat && (
                        <div className="bg-blue-50 p-3 rounded">
                          <h4 className="font-semibold">Selected Seat: {selectedSeat.name}</h4>
                          {selectedSeat.fee && (
                            <p>Additional fee: ${selectedSeat.fee.amount} {selectedSeat.fee.currency}</p>
                          )}
                          {selectedSeat.amenities?.includes('extra_legroom') && (
                            <p className="text-green-600">✅ Extra legroom</p>
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
      return { text: "Adjacent Seats", color: "bg-green-100 text-green-800", badge: "💺💺" };
    }
    if (companion.seatAvailability?.sameRow) {
      return { text: "Same Row", color: "bg-purple-100 text-purple-800", badge: "💺" };
    }
    return { text: "Nearby", color: "bg-blue-100 text-blue-800", badge: "📍" };
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
            <h3 className="font-semibold text-gray-900">{companion.full_name}</h3>
            <p className="text-sm text-gray-600">
              Seat: {companion.current_seat} • Flight: {companion.bookings?.flight_number}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <span 
            className={`px-3 py-1 rounded-full text-xs font-medium ${availability.color}`}
          >
            <span className="mr-1">{availability.badge}</span>
            {availability.text}
          </span>
          {isSelected && (
            <span className="text-blue-500 text-xl">✓</span>
          )}
        </div>
      </div>
    </div>
  );
}

// Enhanced SeatMapDuffel Component with companion highlighting
function SeatMapDuffel({ seatmapData, selectedSeat, onSeatSelect, companions }) {
  // Create a map of companion seats for quick lookup - use current_seat from companion data
  const companionSeatsMap = {};
  companions.forEach(companion => {
    if (companion.current_seat) {
      companionSeatsMap[companion.current_seat] = companion;
    }
  });

  // Your existing seatmap implementation with companion awareness
  if (!seatmapData || !seatmapData.data || seatmapData.data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No seatmap data available</div>;
  }

  const renderSeat = (seat) => {
    const isSelected = selectedSeat?.id === seat.id;
    const isAvailable = seat.available_services.includes('seat');
    const hasFee = seat.fee;
    
    // Match companion seat by designator using current_seat field
    const isCompanionSeat = companionSeatsMap[seat.designator];
    
    // Determine seat type and styling
    let seatType = 'empty';
    let seatClass = '';
    let tooltipContent = '';

    if (isSelected) {
      seatType = 'traveler';
      seatClass = 'traveler-seat';
      tooltipContent = 'This is your seat';
    } else if (isCompanionSeat) {
      seatType = 'companion';
      seatClass = 'companion-seat';
      tooltipContent = `${isCompanionSeat.full_name}\nSeat: ${seat.designator}\nFlight: ${isCompanionSeat.bookings?.flight_number}\nAirline: ${isCompanionSeat.bookings?.airline_name}`;
    } else if (isAvailable) {
      seatType = 'empty';
      seatClass = 'empty-seat';
      tooltipContent = `Available seat: ${seat.designator}`;
    } else {
      seatType = 'unavailable';
      seatClass = 'unavailable-seat';
      tooltipContent = 'Unavailable seat';
    }

    // Check for adjacent badge (higher match potential)
    const hasAdjacentBadge = isAvailable && !isSelected && !isCompanionSeat && isCompanionSeat?.has_adjacent_vacant;

    return (
      <div
        key={seat.id}
        className={`seat ${seatClass} ${isSelected ? 'selected' : ''} ${
          isAvailable ? 'available' : 'unavailable'
        } ${hasFee ? 'premium' : ''} tooltip-container`}
        onClick={() => isAvailable && !isCompanionSeat && onSeatSelect(seat)}
        title={tooltipContent}
      >
        {seatType === 'companion' ? (
          <div className="companion-icon">
            <span className="profile-icon">👤</span>
          </div>
        ) : (
          seat.designator
        )}
        {hasAdjacentBadge && (
          <div className="adjacent-badge">💺</div>
        )}
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
            <div className="w-6 h-6 bg-blue-500 rounded flex items-center justify-center text-white text-xs">A</div>
            <span>Your Seat</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-purple-100 rounded flex items-center justify-center text-xs">👤</div>
            <span>Companion</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-200 rounded flex items-center justify-center text-xs">💺</div>
            <span>Adjacent Available</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 bg-gray-300 rounded flex items-center justify-center text-xs">A</div>
            <span>Empty Seat</span>
          </div>
        </div>
      </div>

      {seatmapData.data.map((seatMap, index) => (
        <div key={seatMap.id || index} className="aircraft-seatmap">
          <div className="aircraft-info mb-4 p-3 bg-gray-50 rounded">
            <strong className="block">{seatMap.aircraft?.name}</strong>
            <span className="text-sm text-gray-600">Class: {seatMap.cabins?.[0]?.cabin_class}</span>
          </div>
          
          <div className="cabins-container">
            {seatMap.cabins?.map((cabin, cabinIndex) => (
              <div key={cabinIndex} className="cabin mb-6">
                <div className="cabin-header mb-3">
                  <h4 className="font-semibold text-lg">{cabin.name}</h4>
                  {cabin.wings && (
                    <div className="text-sm text-gray-500">
                      Wings: Rows {cabin.wings.start_row}-{cabin.wings.end_row}
                    </div>
                  )}
                </div>
                
                <div className="seats-grid">
                  {cabin.seats?.map(renderSeat)}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
      
      <style jsx>{`
        .seats-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: 8px;
          padding: 20px;
          background: #f9f9f9;
          border-radius: 8px;
        }
        .seat {
          width: 40px;
          height: 40px;
          border: 2px solid #ccc;
          border-radius: 4px;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          font-size: 0.8em;
          font-weight: bold;
          transition: all 0.2s;
          position: relative;
        }
        .seat.available {
          background: #e8f5e8;
          border-color: #4caf50;
        }
        .seat.available:hover {
          background: #c8e6c9;
          transform: scale(1.1);
        }
        .seat.selected {
          background: #2196f3;
          color: white;
          border-color: #1976d2;
        }
        .seat.premium {
          background: #fff3e0;
          border-color: #ff9800;
        }
        .seat.unavailable {
          background: #f5f5f5;
          border-color: #ccc;
          color: #999;
          cursor: not-allowed;
        }
        
        /* New seat type styles */
        .traveler-seat {
          background: #2196f3 !important;
          color: white !important;
          border-color: #1976d2 !important;
        }
        .companion-seat {
          background: #e1bee7 !important;
          border-color: #8e24aa !important;
          cursor: default;
        }
        .empty-seat {
          background: #bdbdbd !important;
          border-color: #757575 !important;
        }
        
        .companion-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 100%;
          height: 100%;
        }
        .profile-icon {
          font-size: 1.2em;
        }
        .adjacent-badge {
          position: absolute;
          top: -5px;
          right: -5px;
          background: #4caf50;
          color: white;
          border-radius: 50%;
          width: 16px;
          height: 16px;
          font-size: 0.6em;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        
        /* Tooltip styles */
        .tooltip-container {
          position: relative;
        }
        .tooltip-container:hover::after {
          content: attr(title);
          position: absolute;
          bottom: 100%;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(0, 0, 0, 0.8);
          color: white;
          padding: 8px;
          border-radius: 4px;
          font-size: 0.8em;
          white-space: pre-line;
          z-index: 1000;
          min-width: 200px;
          text-align: center;
        }
      `}</style>
    </div>
  );
}