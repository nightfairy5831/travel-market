"use client";
import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const router = useRouter()
  const searchParams = useSearchParams();
  const [token, setToken] = useState(null);
  const [status, setStatus] = useState("Verifying your email...");

  useEffect(() => {
    const t = searchParams.get("token");
    if (t) setToken(t);
  }, [searchParams]);

  useEffect(() => {
    if (!token) return;

    const verifyEmail = async () => {
      try {
        const functionUrl = `${process.env.NEXT_PUBLIC_SUPABASE_URL}/functions/v1/verify-traveller-email`;
        
        const response = await fetch(functionUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
          },
          body: JSON.stringify({ token }),
        });

        const result = await response.json();


        if (!response.ok) {
          throw new Error(result.error || "Verification failed");
        }

        if (result.success) { 
          setStatus(`✅ Email verified successfully! Welcome ${result.email}`);
          router.push('/dashboard/profile')
           router.refresh();

        } else {
          setStatus(result.error || "Verification failed");
        }

      } catch (err) {
        console.error("❌ Verification error:", err);
        
        if (err.message.includes("Failed to fetch")) {
          setStatus("Network error. Please check your internet connection and try again.");

        } else if (err.message.includes("Invalid or expired")) {
          setStatus("Invalid or expired verification link. Please request a new verification email.");

        } else {
          setStatus(`Verification failed: ${err.message}`);

        }
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="flex flex-col items-center justify-center h-screen text-center">
      <h1 className="text-2xl font-semibold mb-4">Email Verification. Please be patience</h1>
      <p className="text-lg mb-4">{status}</p>
    </div>
  );
}