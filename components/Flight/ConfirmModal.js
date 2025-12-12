// components/Flight/ConfirmModal.jsx
export default function ConfirmModal({ confirmBooking, cancel, selectedSeat }) {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-md w-full">
        <h2 className="text-xl font-bold mb-4">Confirm Booking</h2>
        <p className="mb-4">Are you sure you want to book this flight?</p>
        
        {selectedSeat && (
          <div className="mb-4 p-3 bg-blue-50 rounded">
            <p className="font-semibold">Selected Seat: {selectedSeat.name}</p>
            {selectedSeat.fee && (
              <p>Seat Fee: ${selectedSeat.fee.amount} {selectedSeat.fee.currency}</p>
            )}
          </div>
        )}
        
        <div className="flex justify-end gap-2">
          <button
            onClick={cancel}
            className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            onClick={confirmBooking}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            Confirm Booking
          </button>
        </div>
      </div>
    </div>
  );
}