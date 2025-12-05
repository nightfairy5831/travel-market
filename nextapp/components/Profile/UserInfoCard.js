"use client";

import { createClientComponentClient } from "@supabase/auth-helpers-nextjs";
import Card from "../common/Card";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function UserInfoCard({ profile }) {
  const supabase = createClientComponentClient();
  const router = useRouter();

  useEffect(() => {
    const hasSeenAlert = localStorage.getItem("seenProfileAlert");

    if (
      !hasSeenAlert &&
      profile &&
      profile.role === "traveller" &&
      profile.status !== "active"
    ) {
      alert("Please complete your profile to access all features.");
      localStorage.setItem("seenProfileAlert", "true");
    }
  }, [profile]);

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      localStorage.removeItem("seenProfileAlert");
      router.push("/auth/login");
    } catch (error) {
      console.error("Error signing out:", error.message);
    }
  };

  if (!profile) {
    return (
      <div className="p-6 bg-white rounded-2xl shadow text-center text-gray-500">
        Loading user info...
      </div>
    );
  }

  const getRoleBadgeClass = (role) => {
    switch (role) {
      case "traveller":
        return "bg-blue-100 text-blue-800";
      case "companion":
        return "bg-green-100 text-green-800";
      case "admin":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <Card className="relative">
      {profile === null ? "" : <> <div className="flex justify-between items-center mb-4">
        <h2 className="text-xl font-semibold text-gray-800">
          User Information
        </h2>
        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-sm font-medium ${getRoleBadgeClass(
              profile.type
            )}`}
          >
            {profile?.type?.charAt(0).toUpperCase() + profile?.type?.slice(1)}
          </div>
          <button
            onClick={handleSignOut}
            className="ml-3 px-3 py-1 text-sm bg-red-500 text-white rounded-full hover:bg-red-600 transition"
          >
            Sign Out
          </button>
        </div>
      </div>

      <p className="text-gray-600">
        <strong>Email:</strong> {profile.email}
      </p>
      <p className="text-gray-600">
        <strong>Status:</strong>{" "}
        <span
          className={`${
            profile.status === "active" ? "text-green-600" : "text-yellow-600"
          } font-medium`}
        >
          {profile.status}
        </span>
      </p></>}
     
    </Card>
  );
}
