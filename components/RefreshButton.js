"use client";

import { useRouter } from 'next/navigation';

export default function RefreshButton() {
  const router = useRouter();

  const handleRefresh = () => {
    window.location.href = '/dashboard/profile';
  };

  return (
    <button
      onClick={handleRefresh}
      className="bg-blue-500 text-white px-6 py-3 rounded-lg hover:bg-blue-600 transition-colors"
    >
      Refresh & Continue to Profile
    </button>
  );
}