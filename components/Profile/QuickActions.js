"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function QuickActions({ onSignOut, onAdminRedirect, profile }) {
  const pathname = usePathname();

  return (
    <header className="bg-white shadow-lg border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left side - Navigation Links */}
          <div className="flex items-center space-x-4">
            <Link
              href="/dashboard"
              className={`px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                pathname === "/dashboard"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Dashboard
            </Link>
            
            {profile?.role === "traveller" && (
              <Link
                href="/dashboard/Booked-Flights"
                className={`px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                  pathname === "/dashboard/Booked-Flights"
                    ? "bg-red-100 text-red-700"
                    : "text-gray-700 hover:bg-gray-100"
                }`}
              >
                Booked Flights
              </Link>
            )}

            <Link
              href="/dashboard/FlightChecker"
              className={`px-3 py-2 rounded-md text-sm font-medium transition duration-200 ${
                pathname === "/dashboard/FlightChecker"
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-gray-700 hover:bg-gray-100"
              }`}
            >
              Flight Checker
            </Link>
          </div>

          {/* Right side - User Actions */}
          <div className="flex items-center space-x-3">
            {/* User Info */}
            <div className="hidden md:flex items-center space-x-2 mr-4">
              <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                <span className="text-indigo-600 text-sm font-semibold">
                  {profile?.email?.charAt(0).toUpperCase()}
                </span>
              </div>
              <div className="text-sm">
                <p className="font-medium text-gray-800">{profile?.email}</p>
                <p className="text-gray-500 capitalize">{profile?.role}</p>
              </div>
            </div>

            {/* Admin Dashboard Button */}
            {profile?.role === "admin" && (
              <button
                onClick={onAdminRedirect}
                className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center text-sm"
              >
                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Admin
              </button>
            )}

            {/* Sign Out Button */}
            <button
              onClick={onSignOut}
              className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 flex items-center justify-center text-sm"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Sign Out
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}