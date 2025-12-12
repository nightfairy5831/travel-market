"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../libs/supabaseClient";
import BackButton from "./common/BackButton";

const Dashboard = () => {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);

  const [filters, setFilters] = useState({
    search: "",
    sortBy: "created_at",
    sortOrder: "desc",
  });

  // Background image URL
  const backgroundImageUrl =
    "https://images.unsplash.com/photo-1557682250-33bd709cbe85?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2069&q=80";

  useEffect(() => {
    checkUserSession();
  }, []);

  const checkUserSession = async () => {
    try {
      const {
        data: { session },
        error,
      } = await supabase.auth.getSession();

      if (error) throw error;

      if (session) {
        setUser(session.user);
        await fetchUserRole(session.user.id);
      } else {
        router.push("/auth/login");
      }
    } catch (error) {
      console.error("Error checking session:", error);
      router.push("/auth/login");
    } finally {
      setLoading(false);
    }
  };

  const fetchUserRole = async (userId) => {
    try {
      const { data, error } = await supabase
        .from("users")
        .select("role")
        .eq("id", userId)
        .single();

      if (error) throw error;

      setUserRole(data.role);
      if (data.role === "admin") {
        await fetchAllData();
      } else {
        router.push("/unauthorized");
      }
    } catch (error) {
      console.error("Error fetching user role:", error);
      router.push("/unauthorized");
    }
  };

  const fetchAllData = async () => {
  try {
    console.log("Fetching bookings...");
    
    // Fetch all bookings
    const { data: bookingsData, error: bookingsError } = await supabase
      .from("bookings")
      .select("*")
      .order("created_at", { ascending: false });

    console.log("Bookings data:", bookingsData);
    console.log("Bookings error:", bookingsError);

    if (bookingsError) throw bookingsError;

    console.log("Fetching users...");
    
    // Fetch all users
    const { data: usersData, error: usersError } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });
    
    console.log("Users data:", usersData);
    console.log("Users error:", usersError);

    if (usersError) throw usersError;

    setBookings(bookingsData || []);
    setUsers(usersData || []);
    
    console.log("Final bookings state:", bookingsData || []);
    console.log("Final users state:", usersData || []);
    
  } catch (error) {
    console.error("Error fetching data:", error);
  }
};

  const handleFilterChange = (key, value) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value,
    }));
  };

  const applyFiltersAndSorting = () => {
  let filteredData = [...bookings];

  // Apply search filter
  if (filters.search) {
    filteredData = filteredData.filter(
      (booking) =>
        booking.flight_number?.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.departure_airport?.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.arrival_airport?.toLowerCase().includes(filters.search.toLowerCase()) ||
        booking.status?.toLowerCase().includes(filters.search.toLowerCase())
    );
  }

  // Apply sorting
  filteredData.sort((a, b) => {
    let aValue = a[filters.sortBy];
    let bValue = b[filters.sortBy];

    if (filters.sortOrder === "asc") {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0;
    } else {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0;
    }
  });

  return filteredData;
};

  const exportToCSV = () => {
    const filteredData = applyFiltersAndSorting();

    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    // Create CSV content
   const headers = [
  "Booking ID",
  "Traveller ID",
  "Companion ID",
  "Flight Number",
  "Departure Airport",
  "Arrival Airport",
  "Departure Date",
  "Status",
  "Created At"
].join(",");

    const rows = filteredData.map((booking) =>
      [
        booking.id,
        `"${booking.traveller?.name || "N/A"}"`,
        `"${booking.traveller?.email || "N/A"}"`,
        `"${booking.companion?.name || "N/A"}"`,
        `"${booking.companion?.email || "N/A"}"`,
        `"${booking.flight_number || "N/A"}"`,
        `"${booking.departure_airport || "N/A"}"`,
        `"${booking.arrival_airport || "N/A"}"`,
        `"${booking.departure_date || "N/A"}"`,
        `"${booking.status || "N/A"}"`,
        `"${new Date(booking.created_at).toLocaleDateString()}"`,
      ].join(",")
    );

    const csvContent = [headers, ...rows].join("\n");

    // Create and download file
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bookings-export.csv";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  const exportToJSON = () => {
    const filteredData = applyFiltersAndSorting();

    if (filteredData.length === 0) {
      alert("No data to export");
      return;
    }

    const jsonString = JSON.stringify(filteredData, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = "bookings-export.json";
    link.click();
    window.URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600">Access Denied</h1>
          <p className="text-gray-600">
            You don't have permission to access this page.
          </p>
        </div>
      </div>
    );
  }

  const filteredBookings = applyFiltersAndSorting();

  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <img
        src={backgroundImageUrl}
        alt="Dashboard Background"
        className="object-cover absolute inset-0 w-full h-full z-0"
      />

      <div className="min-h-screen relative flex flex-col items-center justify-center z-10 bg-[rgba(0,0,0,0.13)]">
        <div className="flex w-full items-center justify-start lg:px-32 md:px-16 sm:px-8 px-4 pt-4">
          <BackButton text="Back" className="text-white" />
        </div>
        <div className="py-8 w-full lg:px-32 md:px-16 sm:px-8 px-4">
          {/* Header */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="flex justify-between items-center">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">
                  Admin Dashboard
                </h1>
                <p className="text-gray-600">Welcome, {user?.email}</p>
                <p className="text-sm text-green-600 font-semibold">
                  Role: {userRole}
                </p>
              </div>
              <button
                onClick={async () => {
                  await supabase.auth.signOut();
                    localStorage.removeItem("seenProfileAlert");
                  router.push("/auth/login");
                }}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition duration-200"
              >
                Sign Out
              </button>
            </div>
          </div>

          {/* Filters and Controls */}
          <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Search */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search
                </label>
                <input
                  type="text"
                  value={filters.search}
                  onChange={(e) => handleFilterChange("search", e.target.value)}
                  placeholder="Search bookings..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              {/* Sort By */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort By
                </label>
                <select
                  value={filters.sortBy}
                  onChange={(e) => handleFilterChange("sortBy", e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="created_at">Date Created</option>
                  <option value="traveller_name">Traveller Name</option>
                  <option value="companion_name">Companion Name</option>
                  <option value="flight_number">Flight Number</option>
                  <option value="departure_airport">Departure Airport</option>
                  <option value="arrival_airport">Arrival Airport</option>
                  <option value="status">Status</option>
                </select>
              </div>

              {/* Sort Order */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Sort Order
                </label>
                <select
                  value={filters.sortOrder}
                  onChange={(e) =>
                    handleFilterChange("sortOrder", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="desc">Newest First</option>
                  <option value="asc">Oldest First</option>
                </select>
              </div>

              {/* Export Buttons */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Export Data
                </label>
                <div className="flex space-x-2">
                  <button
                    onClick={exportToCSV}
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-md text-sm transition duration-200"
                  >
                    CSV
                  </button>
                  <button
                    onClick={exportToJSON}
                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white px-3 py-2 rounded-md text-sm transition duration-200"
                  >
                    JSON
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Bookings Table */}
          <div className="bg-white rounded-lg shadow-lg overflow-hidden mb-6">
            <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-800">
                All Bookings
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Traveller
                    </th>
                    {/* <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Companion
                    </th> */}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Flight Details
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.traveler_id || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Traveller ID
                          </div>
                        </td>
                        {/* <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {booking.companion_id || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            Companion ID
                          </div>
                        </td> */}
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900">
                            <strong>Flight:</strong>{" "}
                            {booking.flight_number || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            <strong>From:</strong>{" "}
                            {booking.departure_airport || "N/A"}
                          </div>
                          <div className="text-sm text-gray-500">
                            <strong>To:</strong>{" "}
                            {booking.arrival_airport || "N/A"}
                          </div>
                          {booking.departure_date && (
                            <div className="text-sm text-gray-500">
                              <strong>Date:</strong>{" "}
                              {new Date(
                                booking.departure_date
                              ).toLocaleDateString()}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-800"
                                : booking.status === "pending"
                                ? "bg-yellow-100 text-yellow-800"
                                : booking.status === "cancelled"
                                ? "bg-red-100 text-red-800"
                                : "bg-gray-100 text-gray-800"
                            }`}
                          >
                            {booking.status || "Unknown"}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {new Date(booking.created_at).toLocaleDateString()}
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td
                        colSpan="5"
                        className="px-6 py-4 text-center text-sm text-gray-500"
                      >
                        No bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Total Users
              </h3>
              <p className="text-3xl font-bold text-blue-600">{users.length}</p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Total Bookings
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {bookings.length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Confirmed Bookings
              </h3>
              <p className="text-3xl font-bold text-green-600">
                {bookings.filter((b) => b.status === "confirmed").length}
              </p>
            </div>
            <div className="bg-white rounded-lg shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-800">
                Filtered Results
              </h3>
              <p className="text-3xl font-bold text-purple-600">
                {filteredBookings.length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
