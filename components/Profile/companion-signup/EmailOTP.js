"use client";

import { useState } from "react";
import { supabase } from "@/libs/supabaseClient";

export default function EmailVerification({ email, error, onVerified, profile }) {
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const [codeSent, setCodeSent] = useState(false);

  const handleSendCode = async () => {
    if (!email) {
      setMessage("Email is required");
      return;
    }
    setSending(true);
    setMessage("");
    try {
      if (!profile) {
        console.error("No profile available");
        setMessage("Please sign in to send OTP on email.");
        return;
      }
      console.log("Current profile:", profile);
      console.log("Invoking edge function...");
      // Better session handling
      let session;
      try {
        const sessionResponse = await supabase.auth.getSession();
        session = sessionResponse.data.session;
        console.log("Session retrieved:", session ? "exists" : "null");
      } catch (sessionError) {
        console.error("Session retrieval failed:", sessionError);
        setMessage("Authentication error. Please sign in again.");
        return;
      }
      // If no session, try to refresh
      if (!session) {
        console.log("No session found, attempting refresh...");
        const refreshResponse = await supabase.auth.refreshSession();
        session = refreshResponse.data.session;
        console.log("After refresh session:", session ? "exists" : "null");
      }

      if (!session?.access_token) {
        console.error("No access token available");
        setMessage("Please sign in to send OTP on email.");
        return;
      }

      console.log("Session token exists, proceeding with edge function...");

      const { data, error } = await supabase.functions.invoke(
        "send-email-verification-to-companion",
        {
          body: { email },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        console.error("Supabase function error:", error);
        setMessage(error.message || "Failed to send verification code");
        return;
      }

      if (data?.success) {
        setCodeSent(true);
        setMessage("Verification code sent to your email");
        onVerified(false);
      } else {
        setMessage(data?.error || "Failed to send verification code");
      }
    } catch (err) {
      console.error("Edge function call failed:", err);
      setMessage("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyCode = async () => {
    if (!code || code.length !== 6) {
      setMessage("Please enter a valid 6-digit code");
      return;
    }

    setVerifying(true);
    setMessage("");

    try {
      // ✅ Use profile from props to check authentication
      if (!profile) {
        setMessage("Please sign in to verify code.");
        return;
      }
      // Get fresh access token from profile
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        setMessage("Please sign in to verify code.");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "verify-email-verification-to-companion",
        {
          body: { email, code },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        setMessage(error.message || "Failed to verify code");
        return;
      }

      if (data.success) {
        setMessage("✅ Email verified successfully!");
        onVerified(true);
      } else {
        setMessage(data.error || "Invalid verification code");
        onVerified(false);
      }
    } catch (err) {
      setMessage("Network error. Please try again.");
      onVerified(false);
    } finally {
      setVerifying(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Email Address
          {profile?.is_email_verified && profile?.is_email_verified === true && (
            <>
              <span className="ml-2">
                ✅
              </span>
            </>
          )}
        </label>
        <div className="flex items-center gap-2">
          <input
            type="email"
            value={email}
            readOnly
            className="flex-1 px-4 py-3 rounded-md ring-1 ring-slate-200 bg-slate-100 text-slate-600 cursor-not-allowed"
          />
          
          <button
            type="button"
            onClick={handleSendCode}
            disabled={
              profile?.is_email_verified && profile?.is_email_verified === true || sending || !email || !profile
            }
            className="px-4 py-3 bg-[#ff7a00] text-white rounded-md hover:bg-[#e66a00] transition disabled:opacity-50"
          >
            {sending
              ? "Sending..."
              : profile?.is_email_verified && profile?.is_email_verified === true
              ? "Email Verified"
              : "Verify Email"}
          </button>
        </div>
      </div>

      {codeSent && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">
            Verification Code
          </label>
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) =>
                setCode(e.target.value.replace(/\D/g, "").slice(0, 6))
              }
              placeholder="Enter 6-digit code"
              maxLength={6}
              className="flex-1 px-4 py-3 rounded-md ring-1 ring-slate-200 focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white text-slate-900"
            />
            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={verifying || code.length !== 6 || !profile}
              className="px-4 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50"
            >
              {verifying ? "Verifying..." : "Verify"}
            </button>
          </div>
        </div>
      )}

      {message && (
        <p
          className={`text-sm ${
            message.includes("✅") ? "text-green-600" : "text-rose-600"
          }`}
        >
          {message}
        </p>
      )}

      {error && !message && <p className="text-rose-600 text-sm">{error}</p>}
    </div>
  );
}
