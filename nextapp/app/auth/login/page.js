"use client";
import { useState, useEffect, Suspense } from "react";
import { supabase } from "@/libs/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/common/Card";
import InputField from "@/components/common/InputField";
import Heading from "@/components/common/Heading";
import Button from "@/components/common/Button";

export const dynamic = 'force-dynamic';

function LoginContent() {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("traveller");
  const [type, setType] = useState("login");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  
  const [travellerFields, setTravellerFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    const roleFromParams = searchParams.get("role");
    const typeFromParams = searchParams.get("type");

    if (roleFromParams) setRole(roleFromParams);
    if (typeFromParams) setType(typeFromParams);

    const checkAuthErrors = () => {
      const error = searchParams.get("error");
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");

      const hasQueryError =
        error === "access_denied" ||
        errorCode === "otp_expired" ||
        errorDescription?.includes("expired") ||
        errorDescription?.includes("invalid");

      let hasHashError = false;
      if (typeof window !== "undefined") {
        const hashParams = new URLSearchParams(
          window.location.hash.substring(1)
        );
        hasHashError =
          hashParams.get("error") === "access_denied" ||
          hashParams.get("error_code") === "otp_expired" ||
          hashParams.get("error_description")?.includes("expired");
      }

      if (hasQueryError || hasHashError) {
        setMessage("Your magic link has expired. Please request a new one.");
        const cleanUrl = window.location.pathname;
        window.history.replaceState(null, "", cleanUrl);
      }
    };

    const checkSession = async () => {
      checkAuthErrors();

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) router.push("/dashboard");
      }
      setCheckingSession(false);
    };

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        const { data: profile } = await supabase
          .from("users")
          .select("*")
          .eq("id", session.user.id)
          .single();

        if (profile) router.push("/dashboard");
      }
    });

    return () => subscription.unsubscribe();
  }, [router, searchParams]);

  const handleTravellerChange = (field) => (e) => {
    setTravellerFields((prev) => ({
      ...prev,
      [field]: e.target.value,
    }));
  };

  const handleTravellerSignup = async (e) => {
    e.preventDefault();
    setLoading(true);
    const { firstName, lastName, email } = travellerFields;
    if (!firstName.trim() || !lastName.trim() || !email.trim()) {
      setLoading(false);
      alert("Please fill in all fields before submitting.");
      return;
    }
    const redirectUrl = `${
      process.env.NEXT_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '')
    }/dashboard?role=${role}&firstName=${encodeURIComponent(
      firstName
    )}&lastName=${encodeURIComponent(lastName)}&email=${encodeURIComponent(
      email
    )}`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: redirectUrl,
      },
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      setTimeout(() => {
        setMessage("");
      }, 2000);
    } else {
      setLoading(false);
      setMessage("Check your email for the login link!");
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${process.env.NEXT_PUBLIC_URL || (typeof window !== 'undefined' ? window.location.origin : '')}/dashboard?role=${role}`,
      },
    });

    if (error) {
      setMessage(error.message);
    } else {
      setMessage("Check your email for the login link!");
    }
    setLoading(false);
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1d9fd8] mx-auto"></div>
          <p className="mt-4 text-gray-600">Checking authentication...</p>
        </div>
      </div>
    );
  }

  const headingText =
    type === "signup" ? "Create Your Account" : "Welcome Back";
  const subText =
    type === "signup"
      ? "Sign up to get started with your journey!"
      : "Please login to continue.";

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 ">
      {type && type === "signup" && role && role === "traveller" ? (
        <div className="flex items-center flex-col justify-center">
          <Heading
            title={"Traveller Sign Up"}
            className="text-4xl font-extrabold text-slate-900"
          />
          <Card className="w-full overflow-hidden !max-w-3xl">
            <div className="grid md:grid-cols-2 gap-3">
              <div>
                <InputField
                  id="firstName"
                  label="First Name"
                  name="firstName"
                  value={travellerFields.firstName}
                  onChange={handleTravellerChange("firstName")}
                  placeholder="Jane"
                  required={true}
                  className="col-span-2"
                />
              </div>

              <div>
                <InputField
                  id="lastName"
                  label="Last Name"
                  name="lastName"
                  value={travellerFields.lastName}
                  onChange={handleTravellerChange("lastName")}
                  placeholder="Doe"
                  required={true}
                  className="col-span-2"
                />
              </div>

              <div>
                <InputField
                  id="email"
                  label="Email"
                  name="email"
                  value={travellerFields.email}
                  onChange={handleTravellerChange("email")}
                  placeholder="example@email.com"
                  required={true}
                  className="col-span-2"
                />
              </div>

              {message && (
                <div className="col-span-2 text-center mt-2">
                  <p
                    className={`text-sm ${
                      message.includes("Check your email")
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {message}
                  </p>
                </div>
              )}

              <div className="flex justify-end items-center col-span-2">
                <Button
                  onClick={handleTravellerSignup}
                  type="button"
                  disabled={loading}
                  className="w-[50%] !bg-[#ff7a00] text-white"
                >
                  {loading ? "Submitting..." : "Submit"}
                </Button>
              </div>
            </div>
          </Card>
        </div>
      ) : (
        <Card className="!max-w-3xl w-full overflow-hidden">
          <div className="bg-[#1d9fd8] px-6 py-8 rounded-[14.1px]">
            <h1 className="text-3xl font-bold text-white text-center">
              {headingText}
            </h1>
            <p className="text-blue-100 text-center mt-2">{subText}</p>
          </div>

          <div className="mt-8">
            <form onSubmit={handleLogin} className="space-y-6">
              <div>
                <label
                  htmlFor="email"
                  className="block text-sm font-medium text-gray-700 mb-2"
                >
                  Email Address
                </label>
                <input
                  id="email"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#1d9fd8] focus:border-transparent transition duration-200"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1d9fd8] hover:bg-[#1d9fd8] text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-[#1d9fd8] focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? (
                  <div className="flex items-center justify-center">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                    Sending...
                  </div>
                ) : (
                  "Send Magic Link"
                )}
              </button>
            </form>

            {message && (
              <div
                className={`mt-6 p-4 rounded-lg text-center ${
                  message.includes("Check your email")
                    ? "bg-green-50 border border-green-200 text-green-700"
                    : message.includes("expired")
                    ? "bg-yellow-50 border border-yellow-200 text-yellow-700"
                    : "bg-red-50 border border-red-200 text-red-700"
                }`}
              >
                <p className="text-sm font-medium">{message}</p>
                {message.includes("expired") && (
                  <p className="text-xs mt-1 opacity-75">
                    Please enter your email above to get a new magic link
                  </p>
                )}
              </div>
            )}

            <div className="mt-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start">
                <div className="flex-shrink-0">
                  <svg
                    className="w-5 h-5 text-[#1d9fd8]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    ></path>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-[#1d9fd8]">
                    We'll send you a magic link to sign in. No password needed!
                  </p>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

export default function Login() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#1d9fd8] mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
