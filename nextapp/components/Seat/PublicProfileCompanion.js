"use client";
import { Icon } from "@iconify/react";
import Button from "../common/Button";
import Card from "../common/Card";
import { useRouter } from "next/navigation";

const CompanionProfileModal = ({
  profile,
  companion,
  isOpen,
  onClose,
  setIsAuthModalOpen,
}) => {
  const router = useRouter();
  if (!isOpen || !companion) return null;

  const companionsArray = Array.isArray(companion) ? companion : [companion];

  const handleAuthFunction = () => {
    router.push("/auth/login?role=traveller&type=signup");
  };

  const isBlurred = !profile;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-2xl font-bold text-gray-800">
            {companionsArray.length > 1 ? "Companions" : "Companions Profile"}
          </h2>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            x
          </button>
        </div>

        {/* Companions List */}
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {companionsArray.map((companion, index) => (
            <Card
              key={companion.id || index}
              className="!p-3 shadow hover:shadow-lg cursor-pointer transition"
              onClick={() => setIsAuthModalOpen(true)}
            >
              <div className="flex flex-col items-center text-center gap-2">
                {/* Profile Photo */}
                <img
                  src={
                    companion.profile?.profile_photo_url ||
                    "/default-avatar.png"
                  }
                  alt={companion.profile?.full_name || "Unknown Traveler"}
                  className={`w-24 h-24 rounded-full object-cover border-2 border-blue-100 mb-4 ${
                    isBlurred ? "blur" : ""
                  }`}
                />

                {/* Full Name */}
                <h3 className="text-lg font-semibold">
                  {isBlurred
                    ? companion.profile?.full_name
                        ?.split(" ")
                        .map((word) => word[0] + "*".repeat(word.length - 1))
                        .join(" ") || "*****"
                    : companion.profile?.full_name || "Unknown Traveler"}
                </h3>

                {/* Languages */}
                <p className="text-black font-medium">
                  Speaks {companion.profile?.languages?.join(", ") || "N/A"}
                </p>

                <div className="w-full bg-gray-200 h-[1px]"></div>
                <p className="text-black font-medium">Seat Available Nearby</p>
                {profile === null && (
                  <p className="text-black font-medium text-start">
                    Companions Details are hidden for privacy. Create your
                    AidHandy account to view full profiles and seat
                    availability.
                  </p>
                )}
                {profile === null ? (
                  <Button
                    onClick={handleAuthFunction}
                    className="bg-[#ff7a00] text-white inline-flex whitespace-nowrap mt-2 text-sm items-center gap-2"
                  >
                    Sign Up to View Profile
                    <Icon icon="mdi:lock" className="w-3 h-3 inline-flex" />
                  </Button>
                ) : (
                  ""
                )}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CompanionProfileModal;
