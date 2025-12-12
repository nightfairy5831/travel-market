"use client";

import Link from "next/link";

export default function AuthModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-[999]">
      <div className="bg-white rounded-2xl w-96 p-6 relative shadow-xl">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800"
        >
          X
        </button>

        {/* Modal Title */}
        <h2 className="text-2xl font-bold text-center text-blue-900 mb-6">
          You have to login first for access this feature 
        </h2>

        {/* Login Form */}
          <div className="w-full grid grid-cols-2 gap-4">
          <Link
            href="/auth/login"
            className="bg-blue-900 text-white font-semibold text-center py-2 px-5 rounded-lg hover:bg-blue-800 transition"
            style={{minWidth:'100%'}}
          >
            Login
          </Link>
        
          <Link
            href="/auth/login"
            className="bg-blue-900 text-white font-semibold text-center py-2 px-5 rounded-lg hover:bg-blue-800 transition"
            style={{minWidth:'100%'}}
          >
            Signup
          </Link>
          </div>
       </div>
    </div>
  );
}
