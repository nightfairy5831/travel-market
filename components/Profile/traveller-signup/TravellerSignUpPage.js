"use client";

import Card from "@/components/common/Card";
import Heading from "@/components/common/Heading";
import { useEffect, useState } from "react";
import { PrimaryButton } from "../companion-signup/Field";
import ProfilePhoto from "../companion-signup/ProfilePhoto";
import TravellerSignup from "./TravellerSignup";
import { supabase } from "@/libs/supabaseClient";
import { useRouter } from "next/navigation";
import Loader from "@/components/common/Loader";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { setErrorsWithAutoDismiss } from "@/utils/dismiss-errors";
import { useError } from "@/context/ErrorContext";

export default function TravellerSignUpPage({ email, user, profile }) {
  const { showError, showSuccess } = useError();
  const queryClient = useQueryClient();
  const [isLoading, setIsLoading] = useState(false);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { data: existingTraveller, isLoading: isLoadingTraveller } = useQuery({
    queryKey: ["traveller", user?.id],
    queryFn: async () => {
      if (!user?.id) {
        console.warn("⚠️ No user.id, skipping traveller query.");
        return null;
      }

      // Validate Supabase instance
      if (!supabase || !supabase.from) {
        console.error("❌ Supabase client not initialized properly:", supabase);
        throw new Error("Supabase client not initialized");
      }
      try {
        const { data, error } = await supabase
          .from("travellers")
          .select("*")
          .eq("user_id", user?.id)
          .maybeSingle();

        console.log("Traveller query result:", data, error);

        if (error && error.code !== "PGRST116") {
          throw error;
        }

        return data || null;
      } catch (err) {
        console.error("💥 Error in traveller query:", err);
        throw err;
      }
    },
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const [formData, setFormData] = useState({
    basics: {
      firstName: "",
      lastName: "",
      email: email || "",
      phone: "",
      specialNeeds: [],
      language: [],
      gender: "",
      phoneVerified: false,
      emailVerified: false,
    },
  });

  useEffect(() => {
    if (existingTraveller) {
      console.log("✅ Existing traveller found:", existingTraveller);
      setFormData((prev) => ({
        ...prev,
        basics: {
          firstName: existingTraveller.first_name || "",
          lastName: existingTraveller.last_name || "",
          email: existingTraveller.email || email || "",
          phone: existingTraveller.phone || "",
          language: existingTraveller.language || "",
          gender: existingTraveller.gender || "",
          specialNeeds: existingTraveller.special_needs || "",
          phoneVerified: existingTraveller.is_phone_verified || false,
          emailVerified: existingTraveller.is_email_verified || false,
        },
      }));

      if (existingTraveller.profile_photo_url) {
        setProfilePhoto({ url: existingTraveller.profile_photo_url });
      }
    } else if (email) {
      console.log("ℹ️ No existing traveller, setting email only");
      setFormData((prev) => ({
        ...prev,
        basics: {
          ...prev.basics,
          email: email,
        },
      }));
    }
  }, [existingTraveller, email]);

  const [errors, setErrors] = useState({});

  const updateFormData = (step, field, value) => {
    if (field === "email") return;

    setFormData((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        [field]: value,
      },
    }));
  };

  const validateBasics = () => {
    const errs = {};
    const { basics } = formData;

    if (!basics.firstName?.trim()) errs.firstName = "First name is required";
    if (!basics.lastName?.trim()) errs.lastName = "Last name is required";
    if (!basics.phone?.match(/^\+?[0-9\s-]{7,20}$/))
      errs.phone = "Please enter a valid phone number";
    if (!basics.language) errs.language = "Language is required";
    if (!basics.gender) errs.gender = "Gender is required";
    if (!basics.phoneVerified) errs.phoneVerified = "Phone number not verified";

    return errs;
  };

  const validateStep = (step) => {
    const validators = {
      basics: () => {
        const errs = validateBasics();
        setErrorsWithAutoDismiss(errs, setErrors);

        return Object.keys(errs).length === 0;
      },
    };
    return validators[step] ? validators[step]() : true;
  };

  const uploadProfilePhoto = async () => {
    if (!profilePhoto?.file) return profilePhoto?.url || null;

    try {
      const file = profilePhoto.file;
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;

      console.log("📤 Uploading photo:", fileName);

      const { data: testData, error: testError } = await supabase.storage
        .from("traveller-profile-photos")
        .list("", { limit: 1 });

      if (testError)
        throw new Error(`Storage test failed: ${testError.message}`);

      const { data, error } = await supabase.storage
        .from("traveller-profile-photos")
        .upload(fileName, file);

      if (error) throw error;

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("traveller-profile-photos")
        .getPublicUrl(data.path);

      console.log("✅ Uploaded photo URL:", publicUrl);

      return publicUrl;
    } catch (err) {
      console.error("💥 Upload error:", err);
      throw new Error(`Failed to upload profile photo: ${err.message}`);
    }
  };
  const saveTravellerMutation = useMutation({
    mutationFn: async (finalProfilePhotoUrl) => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      setIsLoading(true);
      const saveResult = await supabase.functions.invoke(
        "save-traveller-data-on-signup",
        {
          body: {
            formData: formData,
            profilePhoto: finalProfilePhotoUrl,
          },
          headers: {
            Authorization: `Bearer ${session?.access_token}`,
          },
        }
      );

      if (saveResult.error) {
        setIsLoading(false);
        showError(saveResult.error.message || "Function error");
      }

      if (!saveResult.data?.success) {
        setIsLoading(false);
        showError(saveResult.data?.error || "Function unsuccessful");
      }

      return saveResult.data;
    },
    onSuccess: (data) => {
      setIsLoading(false);
      queryClient.invalidateQueries(["traveller", user?.id]);
      showSuccess("Profile updated successfully");
      setTimeout(() => {
        window.location.href = "/dashboard/profile?refresh=" + Date.now();
      }, 500);
    },
    onError: (error) => {
      console.error("❌ Failed to save traveller data:", error);
      showError(`Failed update profile: ${error.message}`);
    },
  });

  const handleButtonClick = async () => {
    if (!validateStep("basics")) return;

    setIsSubmitting(true);
    try {
      let finalProfilePhotoUrl = null;
      if (profilePhoto?.file) finalProfilePhotoUrl = await uploadProfilePhoto();
      else if (profilePhoto?.url) finalProfilePhotoUrl = profilePhoto.url;

      await saveTravellerMutation.mutateAsync(finalProfilePhotoUrl);
    } catch (error) {
      console.error("Failed to complete signup", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingTraveller) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader />
        <p className="ml-4 text-slate-600">Loading your profile...</p>
      </div>
    );
  }

  const isEditing = !!existingTraveller;

  return (
    <>
      {isLoading && <Loader />}
      <div className="min-h-screen flex items-start justify-center mt-3">
        <Card className={"max-w-7xl "}>
          <form className="w-full relative">
            <header className="mb-6 text-center">
              <Heading
                title={
                  isEditing ? "Update Traveller Profile" : "Traveller Sign Up"
                }
                className="text-4xl font-extrabold text-slate-900"
              />
              {email && (
                <p className="text-slate-600 mt-2">
                  Signed in as: <strong>{email}</strong>
                </p>
              )}
            </header>

            <section className="grid grid-cols-1 gap-6 items-start">
              <div className="md:col-span-1 flex items-center justify-center gap-4 flex-wrap">
                <ProfilePhoto value={profilePhoto} onChange={setProfilePhoto} />
                <p className="text-center block text-red-500">
                  {errors && errors?.profilePhoto}
                </p>
              </div>

              <TravellerSignup
                profile={profile}
                form={formData.basics}
                update={(field, value) =>
                  updateFormData("basics", field, value)
                }
                errors={errors}
                emailFromProps={email}
              />

              <div className={`mt-8 flex items-center justify-end w-full`}>
                <PrimaryButton
                  onClick={handleButtonClick}
                  disabled={isSubmitting || saveTravellerMutation.isLoading}
                >
                  {saveTravellerMutation.isLoading ? (
                    <span className="flex items-center">
                      <Loader size="sm" />
                      <span className="ml-2">
                        {isEditing ? "Updating..." : "Saving..."}
                      </span>
                    </span>
                  ) : isEditing ? (
                    "Update Profile"
                  ) : (
                    "Save Profile"
                  )}
                </PrimaryButton>
              </div>
            </section>
          </form>
        </Card>
      </div>
    </>
  );
}
