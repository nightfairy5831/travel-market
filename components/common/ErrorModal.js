import React from "react";

export default function ErrorModal({ open, message, onClose }) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-5 w-96 text-center">
        <h2 className="text-lg font-bold text-red-600 mb-2">Error</h2>
        <p className="text-gray-800 mb-4 ">{message}</p>
        
          <button
            onClick={onClose}
            className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          >
            Close
          </button>
       
      </div>
    </div>
  );
}
