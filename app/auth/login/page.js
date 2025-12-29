"use client";
import { useState, useEffect } from "react";
import { supabase } from "@/libs/supabaseClient";
import { useRouter, useSearchParams } from "next/navigation";
import Card from "@/components/common/Card";
import InputField from "@/components/common/InputField";
import Heading from "@/components/common/Heading";
import Button from "@/components/common/Button";
import { useError } from "@/context/ErrorContext";

export default function Login() {
  const { showError, showSuccess } = useError();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isAdminLogin, setIsAdminLogin] = useState(false);
  const [role, setRole] = useState("traveller");
  const [type, setType] = useState("login"); // ✅ new state for type
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  // For Traveller Login
  const [travellerFields, setTravellerFields] = useState({
    firstName: "",
    lastName: "",
    email: "",
  });

  useEffect(() => {
    // ✅ Get role and type from query params
    const roleFromParams = searchParams.get("role");
    const typeFromParams = searchParams.get("type");

    if (roleFromParams) setRole(roleFromParams);
    if (typeFromParams) setType(typeFromParams);

    // ✅ Check for auth errors in URL parameters first
    const checkAuthErrors = () => {
      const error = searchParams.get("error");
      const errorCode = searchParams.get("error_code");
      const errorDescription = searchParams.get("error_description");

      const hasQueryError =
        error === "access_denied" ||
        errorCode === "otp_expired" ||
        errorDescription?.includes("expired") ||
        errorDescription?.includes("invalid");

      // ✅ Check hash fragments (client-side only)
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
        showError("Your magic link has expired. Please request a new one.");
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

  // For Traveller Login
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
      showError("Please fill all fields before submitting.");
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email.trim())) {
      setLoading(false);
      showError("Please enter a valid email address.");
      return;
    }
    const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:8080";

    // Build dynamic redirect URL
    const redirectUrl = `${BASE_URL}/dashboard?role=${role}&firstName=${encodeURIComponent(
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
      showError(error.message);
      setTimeout(() => {
        showError("");
      }, 2000);
    } else {
      setLoading(false);
      showSuccess("Check your email for the login link!");
    }
  };

  // For Admin Password Login
  const handleAdminLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      showError(error.message);
      return;
    }

    // Check if user is admin
    const { data: profile } = await supabase
      .from("users")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setLoading(false);
      showError("This login is for admin users only.");
      return;
    }

    setLoading(false);
    showSuccess("Admin login successful!");
    router.push("/admin");
  };

  // For Companion Login
  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    const BASE_URL = process.env.NEXTAUTH_URL || "http://localhost:8080";
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${BASE_URL}/dashboard?role=${role}`,
      },
    });

    if (error) {
      setLoading(false);
      showError(error.message);
    } else {
      setLoading(false);
      showSuccess("Check your email for the login link!");
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

  // ✅ Dynamic heading/subheading based on type
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
                  type="email"
                  value={travellerFields.email}
                  onChange={handleTravellerChange("email")}
                  placeholder="example@email.com"
                  required={true}
                  className="col-span-2"
                />
              </div>

              {/* ✅ Show message here */}
              {/* {message && (
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
              )} */}

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
        <>
          <Card className="!max-w-3xl w-full overflow-hidden">
            <div className={`${isAdminLogin ? 'bg-gray-800' : 'bg-[#1d9fd8]'} px-6 py-8 rounded-[14.1px]`}>
              <h1 className="text-3xl font-bold text-white text-center">
                {isAdminLogin ? "Admin Login" : headingText}
              </h1>
              <p className="text-blue-100 text-center mt-2">
                {isAdminLogin ? "Enter your admin credentials" : subText}
              </p>
            </div>

            <div className="mt-8">
              {isAdminLogin ? (
                // Admin Password Login Form
                <form onSubmit={handleAdminLogin} className="space-y-6">
                  <div>
                    <label
                      htmlFor="admin-email"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Admin Email
                    </label>
                    <input
                      id="admin-email"
                      type="email"
                      placeholder="admin@aidhandy.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition duration-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="admin-password"
                      className="block text-sm font-medium text-gray-700 mb-2"
                    >
                      Password
                    </label>
                    <input
                      id="admin-password"
                      type="password"
                      placeholder="Enter your password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-800 focus:border-transparent transition duration-200"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-gray-800 hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-lg transition duration-200 focus:outline-none focus:ring-2 focus:ring-gray-800 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {loading ? (
                      <div className="flex items-center justify-center">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        Signing in...
                      </div>
                    ) : (
                      "Sign In as Admin"
                    )}
                  </button>
                </form>
              ) : (
                // Magic Link Login Form
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
              )}

              {!isAdminLogin && (
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
                        We'll send you a magic link to sign in. No password
                        needed!
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Toggle Admin Login */}
              <div className="mt-6 text-center">
                <button
                  type="button"
                  onClick={() => {
                    setIsAdminLogin(!isAdminLogin);
                    setEmail("");
                    setPassword("");
                  }}
                  className="text-sm text-gray-500 hover:text-gray-700 underline"
                >
                  {isAdminLogin ? "Back to Magic Link Login" : "Admin Login"}
                </button>
              </div>
            </div>
          </Card>
        </>
      )}
    </div>
  );
}
