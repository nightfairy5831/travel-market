"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "../libs/supabaseClient";

const Dashboard = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [user, setUser] = useState(null);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [bookings, setBookings] = useState([]);
  const [users, setUsers] = useState([]);
  const [companions, setCompanions] = useState([]);
  const [activeTab, setActiveTab] = useState("bookings");
  const [actionLoading, setActionLoading] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [refundModal, setRefundModal] = useState({ open: false, booking: null });
  const [refundReason, setRefundReason] = useState("");

  useEffect(() => {
    const tabParam = searchParams.get("tab");
    if (tabParam === "bookings" || tabParam === "companions") {
      setActiveTab(tabParam);
    }
    checkUserSession();
  }, [searchParams]);

  const checkUserSession = async () => {
    try {
      const { data: { session }, error } = await supabase.auth.getSession();
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
      const [bookingsRes, usersRes, companionsRes] = await Promise.all([
        supabase.from("bookings").select("*").order("created_at", { ascending: false }),
        supabase.from("users").select("*").order("created_at", { ascending: false }),
        supabase.from("companions").select("*").order("created_at", { ascending: false }),
      ]);
      setBookings(bookingsRes.data || []);
      setUsers(usersRes.data || []);
      setCompanions(companionsRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
    }
  };

  const handleApproveCompanion = async (companionId) => {
    if (!confirm("Approve this companion?")) return;
    setActionLoading(companionId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/companion/approve", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ companionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to approve companion");
      }

      await fetchAllData();
      alert("Companion approved successfully!");
    } catch (error) {
      console.error("Error approving companion:", error);
      alert("Failed to approve companion: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectCompanion = async (companionId) => {
    if (!confirm("Reject/suspend this companion?")) return;
    setActionLoading(companionId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch("/api/admin/companion/reject", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ companionId }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to reject companion");
      }

      await fetchAllData();
    } catch (error) {
      console.error("Error rejecting companion:", error);
      alert("Failed to reject companion: " + error.message);
    } finally {
      setActionLoading(null);
    }
  };

  const handleUpdateBookingStatus = async (bookingId, newStatus) => {
    if (!confirm(`Change status to "${newStatus}"?`)) return;
    setActionLoading(bookingId);
    try {
      const { error } = await supabase
        .from("bookings")
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq("id", bookingId);
      if (error) throw error;
      await fetchAllData();
    } catch (error) {
      console.error("Error updating booking status:", error);
      alert("Failed to update booking status.");
    } finally {
      setActionLoading(null);
    }
  };

  const handleRefund = async (bookingId) => {
    setActionLoading(bookingId);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Not authenticated");

      const response = await fetch("/api/admin/refund", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          bookingId,
          reason: refundReason || "Admin initiated refund",
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Refund failed");
      }

      alert("Refund processed successfully");
      setRefundModal({ open: false, booking: null });
      setRefundReason("");
      await fetchAllData();
    } catch (error) {
      console.error("Error processing refund:", error);
      alert(`Refund failed: ${error.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const exportToCSV = () => {
    if (bookings.length === 0) return alert("No data to export");
    const headers = ["ID", "Flight", "From", "To", "Date", "Status", "Created"];
    const rows = bookings.map((b) => [
      b.id,
      b.flight_number || "",
      b.departure_airport || "",
      b.destination_airport || "",
      b.departure_date || "",
      b.status || "",
      new Date(b.created_at).toLocaleDateString(),
    ]);
    const csv = [headers.join(","), ...rows.map((r) => r.join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "bookings.csv";
    link.click();
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-8 w-8 border-2 border-gray-900 border-t-transparent"></div>
      </div>
    );
  }

  if (userRole !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <p className="text-gray-600">Access Denied</p>
      </div>
    );
  }

  const pendingCompanions = companions.filter((c) => !c.is_kyc_approved);
  const approvedCompanions = companions.filter((c) => c.is_kyc_approved);

  const filteredBookings = bookings.filter(
    (b) =>
      !searchTerm ||
      b.flight_number?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.departure_airport?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.status?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 py-6">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Users</p>
            <p className="text-2xl font-semibold text-gray-900">{users.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Bookings</p>
            <p className="text-2xl font-semibold text-gray-900">{bookings.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Companions</p>
            <p className="text-2xl font-semibold text-gray-900">{companions.length}</p>
          </div>
          <div className="bg-white p-4 rounded-lg border border-gray-200">
            <p className="text-sm text-gray-500">Pending Approval</p>
            <p className="text-2xl font-semibold text-amber-600">{pendingCompanions.length}</p>
          </div>
        </div>


        {/* Bookings Tab */}
        {activeTab === "bookings" && (
          <div className="bg-white rounded-lg border border-gray-200">
            <div className="p-4 border-b border-gray-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h2 className="text-lg font-semibold text-gray-900">All Bookings</h2>
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="Search..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                />
                <button
                  onClick={exportToCSV}
                  className="px-3 py-1.5 text-sm bg-gray-900 text-white rounded-md hover:bg-gray-800"
                >
                  Export
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Flight</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Route</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredBookings.length > 0 ? (
                    filteredBookings.map((booking) => (
                      <tr key={booking.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900">{booking.flight_number || "-"}</td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {booking.departure_airport || "-"} → {booking.destination_airport || "-"}
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-600">
                          {booking.departure_date ? new Date(booking.departure_date).toLocaleDateString() : "-"}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                              booking.status === "confirmed"
                                ? "bg-green-100 text-green-700"
                                : booking.status === "pending"
                                ? "bg-amber-100 text-amber-700"
                                : booking.status === "cancelled"
                                ? "bg-red-100 text-red-700"
                                : "bg-gray-100 text-gray-700"
                            }`}
                          >
                            {booking.status || "unknown"}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {booking.status === "pending" && (
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, "confirmed")}
                                disabled={actionLoading === booking.id}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
                              >
                                Confirm
                              </button>
                            )}
                            {booking.status !== "cancelled" && booking.status !== "refunded" && (
                              <button
                                onClick={() => handleUpdateBookingStatus(booking.id, "cancelled")}
                                disabled={actionLoading === booking.id}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Cancel
                              </button>
                            )}
                            {booking.status === "confirmed" && (
                              <button
                                onClick={() => setRefundModal({ open: true, booking })}
                                disabled={actionLoading === booking.id}
                                className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                              >
                                Refund
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="px-4 py-8 text-center text-sm text-gray-500">
                        No bookings found
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Refund Modal */}
        {refundModal.open && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Process Refund</h3>
              <p className="text-sm text-gray-600 mb-4">
                Are you sure you want to refund booking for flight{" "}
                <strong>{refundModal.booking?.flight_number}</strong>?
              </p>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Reason (optional)
                </label>
                <textarea
                  value={refundReason}
                  onChange={(e) => setRefundReason(e.target.value)}
                  placeholder="Enter refund reason..."
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-gray-400"
                  rows={3}
                />
              </div>
              <div className="flex gap-2 justify-end">
                <button
                  onClick={() => {
                    setRefundModal({ open: false, booking: null });
                    setRefundReason("");
                  }}
                  className="px-4 py-2 text-sm text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleRefund(refundModal.booking?.id)}
                  disabled={actionLoading === refundModal.booking?.id}
                  className="px-4 py-2 text-sm bg-amber-600 text-white rounded-md hover:bg-amber-700 disabled:opacity-50"
                >
                  {actionLoading === refundModal.booking?.id ? "Processing..." : "Confirm Refund"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Companions Tab */}
        {activeTab === "companions" && (
          <div className="space-y-6">
            {/* Pending */}
            {pendingCompanions.length > 0 && (
              <div className="bg-white rounded-lg border border-gray-200">
                <div className="p-4 border-b border-gray-200">
                  <h2 className="text-lg font-semibold text-gray-900">Pending Approval</h2>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stripe</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {pendingCompanions.map((companion) => (
                        <tr key={companion.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {companion.first_name} {companion.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {companion.email || "-"}
                            {companion.is_email_verified && (
                              <span className="ml-1 text-green-600 text-xs">✓</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {companion.phone || "-"}
                            {companion.is_phone_verified && (
                              <span className="ml-1 text-green-600 text-xs">✓</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-col gap-1">
                              <span
                                className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                                  companion.stripe_charges_enabled
                                    ? "bg-green-100 text-green-700"
                                    : companion.stripe_account_id
                                    ? "bg-blue-100 text-blue-700"
                                    : "bg-gray-100 text-gray-700"
                                }`}
                              >
                                {companion.stripe_charges_enabled ? "Active" : companion.stripe_account_id ? "Connected" : "Not Started"}
                              </span>
                              {companion.stripe_account_id && (
                                <span className="text-xs text-gray-500 font-mono truncate max-w-[120px]" title={companion.stripe_account_id}>
                                  {companion.stripe_account_id}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleApproveCompanion(companion.id)}
                                disabled={actionLoading === companion.id || !companion.stripe_account_id}
                                title={!companion.stripe_account_id ? "Stripe account not created yet" : ""}
                                className="px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleRejectCompanion(companion.id)}
                                disabled={actionLoading === companion.id}
                                className="px-2 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
                              >
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Approved */}
            <div className="bg-white rounded-lg border border-gray-200">
              <div className="p-4 border-b border-gray-200">
                <h2 className="text-lg font-semibold text-gray-900">Approved Companions</h2>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stripe</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Services</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {approvedCompanions.length > 0 ? (
                      approvedCompanions.map((companion) => (
                        <tr key={companion.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm text-gray-900">
                            {companion.first_name} {companion.last_name}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">{companion.email || "-"}</td>
                          <td className="px-4 py-3 text-sm text-gray-600">{companion.phone || "-"}</td>
                          <td className="px-4 py-3">
                            <span
                              className={`inline-flex px-2 py-0.5 text-xs font-medium rounded ${
                                companion.stripe_charges_enabled
                                  ? "bg-green-100 text-green-700"
                                  : "bg-amber-100 text-amber-700"
                              }`}
                            >
                              {companion.stripe_charges_enabled ? "Active" : "Pending"}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600">
                            {companion.service_types?.join(", ") || "-"}
                          </td>
                          <td className="px-4 py-3">
                            <button
                              onClick={() => handleRejectCompanion(companion.id)}
                              disabled={actionLoading === companion.id}
                              className="px-2 py-1 text-xs bg-amber-600 text-white rounded hover:bg-amber-700 disabled:opacity-50"
                            >
                              Suspend
                            </button>
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="6" className="px-4 py-8 text-center text-sm text-gray-500">
                          No approved companions yet
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;
