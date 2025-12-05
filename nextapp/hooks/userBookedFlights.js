import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/libs/supabaseClient";

export const userBookedFlights = (userId) => {
  return useQuery({
    queryKey: ["user-booked-flights", userId],
    queryFn: async () => {
      if (!userId) throw new Error("User ID is required");

      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("traveler_id", userId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data || [];
    },
    enabled: !!userId,
    staleTime: 2 * 60 * 1000,
    retry: 2,
  });
};