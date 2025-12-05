"use client";
import { supabase } from "@/libs/supabaseClient";
import { useEffect, useState } from "react";

function MagicLinkHandler() {
  const [message, setMessage] = useState("Verifying your Magic link...");

  useEffect(() => {
    let attempts = 0;

    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session) {
        // ✅ Session ready, clean URL & reload
        const url = new URL(window.location.href);
        url.searchParams.delete("code");
        url.searchParams.delete("access_token");
        url.searchParams.delete("token_hash");
        window.history.replaceState({}, "", url.toString());
        window.location.reload();
      } else if (attempts < 10) {
        // ⏳ Retry for up to ~5 seconds
        attempts++;
        setTimeout(checkSession, 500);
      } else {
        // ❌ Session still not ready after retries
        setMessage("Login verification failed. Please try again.");
      }
    };

    checkSession();
  }, [supabase]);

  return (
    <div className="flex items-center justify-center h-screen">
      <p className="text-gray-500 text-lg animate-pulse">{message}</p>
    </div>
  );
}

export default MagicLinkHandler;
