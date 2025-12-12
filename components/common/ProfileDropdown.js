"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";

export default function ProfileDropdown({ email, role, onLogout }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicked outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Profile Avatar */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center space-x-2 focus:outline-none"
      >
        <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
          <span className="text-indigo-600 text-sm font-semibold">
            {email?.charAt(0)?.toUpperCase()}
          </span>
        </div>
        <div className="hidden sm:block text-left">
          <p className="text-sm font-medium text-white">{email}</p>
          <p className="text-xs text-white capitalize">{role}</p>
        </div>
        <svg
          className={`w-4 h-4 transform transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white border border-gray-200 rounded-md shadow-lg z-50">
          <Link
            href="/dashboard/profile"
            className="block px-4 py-2 text-gray-800 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          <button
            onClick={() => {
              setIsOpen(false);
              onLogout();
            }}
            className="w-full text-left block px-4 py-2 text-red-600 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
}
