// components/Flight/SeatMap.jsx
const SeatMap = ({ seatmapData, selectedSeat, onSeatSelect, companions = [] }) => {
  if (!seatmapData || !seatmapData.data || seatmapData.data.length === 0) {
    return <div className="text-center py-8 text-gray-500">No seatmap data available</div>;
  }

  // Create a map of companion seats for quick lookup - use current_seat from companion data
  const companionSeatsMap = {};
  companions.forEach(companion => {
    if (companion.current_seat) {
      companionSeatsMap[companion.current_seat] = companion;
    }
  });

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
};

export default SeatMap;