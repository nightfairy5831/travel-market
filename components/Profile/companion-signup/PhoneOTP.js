"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/libs/supabaseClient";
import "react-phone-input-2/lib/style.css";
import PhoneInput from "react-phone-input-2";
import {
  isValidPhoneNumber,
  parsePhoneNumberFromString,
} from "libphonenumber-js";
import { useError } from "@/context/ErrorContext";

export default function PhoneInput2({
  value,
  onChange,
  error,
  onVerified,
  profile,
  className = "",
  checkVerify,
}) {
  const { showError, showSuccess } = useError();
  const [isValid, setIsValid] = useState(false);
  const [country, setCountry] = useState(null);
  const [sending, setSending] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpValue, setOtpValue] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [verified, setVerified] = useState(false);
  const [serverMsg, setServerMsg] = useState("");
  // Rate limiting states
  const [resendCooldown, setResendCooldown] = useState(0);
  const [attemptsLeft, setAttemptsLeft] = useState(3);
  const [cooldownUntil, setCooldownUntil] = useState(null);
  const phoneRegex = /^\+?[0-9\s-]{7,20}$/;
  // Countdown timer for resend cooldown
  useEffect(() => {
    let interval;
    if (resendCooldown > 0) {
      interval = setInterval(() => {
        setResendCooldown((prev) => {
          if (prev <= 1) {
            clearInterval(interval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [resendCooldown]);

  // Check if profile is in cooldown period
  useEffect(() => {
    if (cooldownUntil) {
      const now = Date.now();
      const remaining = cooldownUntil - now;
      if (remaining > 0) {
        const minutes = Math.ceil(remaining / (1000 * 60));
        showError(`Too many attempts. Try again in ${minutes} minutes.`);
      } else {
        setCooldownUntil(null);
        setAttemptsLeft(3);
        // setServerMsg("");
      }
    }
  }, [cooldownUntil]);

  const cleanPhone = (value) => {
    return value.replace(/[^+\d]/g, "");
  };

  const validatePhone = (phone, countryData) => {
    if (!phone) {
      return false;
    }

    const cleaned = cleanPhone(phone);

    if (cleaned.length < 5) {
      return false;
    }

    try {
      let phoneNumber;

      if (countryData && countryData.dialCode) {
        if (cleaned.startsWith(countryData.dialCode)) {
          phoneNumber = parsePhoneNumberFromString(`+${cleaned}`);
        } else {
          phoneNumber = parsePhoneNumberFromString(
            `+${countryData.dialCode}${cleaned}`
          );
        }
      } else {
        phoneNumber = parsePhoneNumberFromString(
          cleaned.startsWith("+") ? cleaned : `+${cleaned}`
        );
      }

      if (!phoneNumber) {
        if (cleaned.length > 9) {
          showError("Invalid phone number format");
        }
        return false;
      }

      const isValid = phoneNumber.isValid();

      if (isValid) {
        showSuccess("Valid phone number");
      } else if (cleaned.length > 9) {
        showError("Please enter a valid phone number");
      }

      return isValid;
    } catch (error) {
      console.error("Validation error:", error);
      if (cleaned.length > 9) {
        showError("Invalid phone number");
      }
      return false;
    }
  };

  const handlePhoneChange = (value, countryData) => {
    onChange(value);
    setCountry(countryData);

    const ok = validatePhone(value, countryData);
    setIsValid(ok);
    if (!ok) {
      setOtpSent(false);
      setVerified(false);
      setServerMsg("");
      if (onVerified) onVerified(false);
    }
  };

  const handleSendOtp = async () => {
    console.log("Sending OTP to:", value, "Country:", country);

    if (!isValid || !country) return;

    // Check rate limits
    if (cooldownUntil) {
      const remaining = Math.ceil((cooldownUntil - Date.now()) / (1000 * 60));
      showError(`Too many attempts. Try again in ${remaining} minutes.`);
      return;
    }

    if (attemptsLeft <= 0) {
      setCooldownUntil(Date.now() + 10 * 60 * 1000);
      return;
    }

    setSending(true);
    setServerMsg("");

    try {
      if (!profile) {
        console.error("No profile available");
        showError("Please sign in to send OTP.");
        return;
      }

      console.log("Current user:", profile);
      console.log("User ID:", profile.id);
      console.log("User email:", profile.email);

      // Try multiple approaches to get the session
      let session = null;
      let accessToken = null;

      // Approach 1: Direct getSession
      const {
        data: { session: directSession },
      } = await supabase.auth.getSession();
      console.log("Direct session:", directSession);

      if (directSession?.access_token) {
        session = directSession;
        accessToken = directSession.access_token;
      } else {
        // Approach 2: Try to refresh the session
        const {
          data: { session: refreshedSession },
          error: refreshError,
        } = await supabase.auth.refreshSession();
        console.log("Refreshed session:", refreshedSession);
        console.log("Refresh error:", refreshError);

        if (refreshedSession?.access_token) {
          session = refreshedSession;
          accessToken = refreshedSession.access_token;
        } else {
          // Approach 3: Try getUser which might have the session
          const {
            data: { user: currentUser },
          } = await supabase.auth.getUser();
          console.log("Current user from getUser:", currentUser);

          // If all else fails, try getSession one more time after a delay
          await new Promise((resolve) => setTimeout(resolve, 1000));
          const {
            data: { session: finalSession },
          } = await supabase.auth.getSession();
          console.log("Final session after delay:", finalSession);

          if (finalSession?.access_token) {
            session = finalSession;
            accessToken = finalSession.access_token;
          }
        }
      }

      if (!accessToken) {
        console.error("No access token found after all attempts");
        showError(
          "Authentication issue. Please refresh the page and try again."
        );
        return;
      }

      console.log("Access token found, length:", accessToken.length);

      // Now call the edge function
      console.log("Calling edge function...");

      const { data, error } = await supabase.functions.invoke(
        "send-phone-otp-to-companion",
        {
          body: {
            phone: value,
            country: country.name,
            user_id: profile.id,
          },
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
        }
      );

      console.log("Edge function response data:", data);
      console.log("Edge function response error:", error);

      if (error) {
        console.error("Edge function error:", error);
        showError(error.message || "Failed to send OTP.");
        return;
      }

      if (data?.success) {
        setOtpSent(true);
        setResendCooldown(60);
        setAttemptsLeft((prev) => prev - 1);
        showSuccess(
          `OTP sent to ${country.name} number. ${
            attemptsLeft - 1
          } attempts left.`
        );

        if (attemptsLeft - 1 <= 0) {
          setCooldownUntil(Date.now() + 10 * 60 * 1000);
        }
      } else {
        showError(data?.error || "Failed to send OTP.");
      }
    } catch (err) {
      console.error("Send OTP error:", err);
      showError("Network error. Please try again.");
    } finally {
      setSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpValue || otpValue.length !== 6) {
      showError("Please enter a valid 6-digit OTP.");
      return;
    }

    setVerifying(true);
    setServerMsg("");

    try {
      // ✅ Use user from props for authentication check
      if (!profile) {
        showError("Please sign in to verify OTP.");
        return;
      }

      // Get fresh session for access token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        showError("Please sign in to verify OTP.");
        return;
      }

      const { data, error } = await supabase.functions.invoke(
        "verify-phone-otp-to-companion",
        {
          body: {
            phone: value,
            otp: otpValue,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (error) {
        console.error("Verify OTP error:", error);
        showError(error.message || "Failed to verify OTP.");
        return;
      }

      if (data?.success) {
        setVerified(true);
        showSuccess("Phone number verified successfully!");
        if (onVerified) onVerified(true);
      } else {
        showError(data?.error || "Invalid OTP. Please try again.");
      }
    } catch (err) {
      console.error("Verify OTP error:", err);
      showError("Network error. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleResendOtp = () => {
    if (resendCooldown > 0) return;
    handleSendOtp();
  };

  return (
    <div className="space-y-3">
      <label
        htmlFor="phone"
        className="block text-sm font-medium text-slate-700 "
      >
        Phone Number{" "}
        {checkVerify && checkVerify === true ? (
          <span className="text-green-500">✅</span>
        ) : (
          <span className="text-rose-500">*</span>
        )}
      </label>
      <div
        className={`border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${className}`}
      >
        <PhoneInput
          country={"pk"}
          value={value}
          onChange={handlePhoneChange}
          disabled={checkVerify === true}
          inputClass="!w-full !h-12 !text-gray-800 !text-base !pl-12 !border-none !bg-transparent !focus:ring-0"
          buttonClass="!border-none !bg-transparent"
          dropdownClass="!bg-white !text-gray-800"
        />
      </div>
      {error && <p className="text-rose-600 text-sm mt-1">{error}</p>}

      {/* Show send button with rate limiting info */}
      {isValid && country && !otpSent && !verified && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={handleSendOtp}
            disabled={sending || cooldownUntil || attemptsLeft <= 0 || !profile}
            className="mt-2 px-4 py-2 bg-[#ff7a00] text-white rounded-md hover:bg-[#ff7a00] transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {sending
              ? "Sending..."
              : `Send OTP (${country.countryCode.toUpperCase()})`}
          </button>
          {attemptsLeft < 3 && (
            <p className="text-sm text-gray-600">
              {attemptsLeft} attempts left (resets in 10 minutes)
            </p>
          )}
        </div>
      )}

      {otpSent && !verified && (
        <div className="mt-3 space-y-2">
          <input
            type="text"
            value={otpValue}
            onChange={(e) => setOtpValue(e.target.value)}
            placeholder="Enter 6-digit OTP"
            maxLength={6}
            className="w-full px-4 py-3 rounded-md ring-1 ring-slate-200 focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white text-slate-900"
          />
          <div className="flex gap-2 items-center">
            <button
              type="button"
              onClick={handleVerifyOtp}
              disabled={verifying || otpValue.length !== 6 || !profile}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {verifying ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={handleResendOtp}
              disabled={resendCooldown > 0 || !profile}
              className="px-3 py-2 text-sm underline text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend"}
            </button>
            {attemptsLeft > 0 && (
              <span className="text-sm text-gray-500">
                {attemptsLeft} attempts left
              </span>
            )}
          </div>
        </div>
      )}

      {verified && <p className="text-green-600">✅ Phone verified.</p>}

      {serverMsg && <p className="text-sm mt-1 text-slate-700">{serverMsg}</p>}
    </div>
  );
}
