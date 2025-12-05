"use client";
import { Icon } from "@iconify/react";
import Card from "../common/Card";

export default function ErrorState() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 px-4">
      <Card className="bg-white  max-w-md w-full text-center">
        <div className="flex justify-center mb-4">
          <div className="bg-red-100 text-red-500 p-4 rounded-full">
            <Icon icon="mdi:alert-circle-outline" className="text-4xl" />
          </div>
        </div>

        <h2 className="text-xl font-semibold text-gray-800 mb-2">
          Access Restricted
        </h2>
        <p className="text-gray-600 mb-6">
          Please log in to access your dashboard and continue using AidHandy.
        </p>

        <button
          onClick={() => (window.location.href = "/auth/login")}
          className="bg-[#1d9fd8] text-white font-medium px-6 py-3 rounded-lg active:scale-95 transition-all duration-150"
        >
          Log In
        </button>
      </Card>
    </div>
  );
}
