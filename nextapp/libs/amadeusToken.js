import { supabase } from "./supabaseClient";

export const fetchAmadeusToken = async (user) => {
  if (!user) return null;

  try {
    const {
      data: { session },
    } = await supabase.auth.getSession();
    const accessToken = session?.access_token;

    const res = await fetch("/api/amadeus-token", {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!res.ok) throw new Error(`Failed: ${res.status}`);

    const data = await res.json();
    return data.access_token;
  } catch (err) {
    console.error("Error fetching Amadeus token:", err);
    return null;
  }
};
