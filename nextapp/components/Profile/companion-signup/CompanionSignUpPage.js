"use client";

import { useMemo, useState, useEffect } from "react";
import { PrimaryButton, Stepper } from "./Field";
import ProfilePhoto from "./ProfilePhoto";
import BasicsForm from "./BasicsForm";
import ServicesForm from "./ServicesForm";
import ProfileBioForm from "./Profile&Bio";
import VerificationSummary from "./VerificationSummary";
// import { saveCompanionData } from "@/app/actions/companion-actions";
// import { createStripeExpressAccount } from "@/app/actions/stripe-actions";
import Card from "@/components/common/Card";
import Heading from "@/components/common/Heading";
import { supabase } from "@/libs/supabaseClient";
// import { sendCompanionOnboardingEmail } from "@/app/actions/email-actions";
import YellowLoader from "@/components/common/Loader";

export default function CompanionSignUpPage({ email , profile }) {
  const STEPS = useMemo(
    () => ["Basics", "Services & Preferences", "Profile & Bio", "Verification"],
    []
  );

  const [activeStep, setActiveStep] = useState(0);
  const [profilePhoto, setProfilePhoto] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [stepLoading, setStepLoading] = useState(false);

  const [formData, setFormData] = useState({
    basics: {
      fullName: "",
      email: email || "",
      phone: "",
      dob: "",
      gender: "",
      phoneVerified: false,
      // emailVerified: false,
    },
    services: {
      serviceTypes: [],
      preferredAirports: [],
      languages: [],
    },
    bio: {
      shortBio: "",
      skillCertificates: [],
    },
  });

  useEffect(() => {
    if (email) {
      setFormData((prev) => ({
        ...prev,
        basics: {
          ...prev.basics,
          email: email,
        },
      }));
    }
  }, [email]);

  const [errors, setErrors] = useState({});

  const updateFormData = (step, field, value) => {
    if (field === "email") {
      return;
    }

    setFormData((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        [field]: value,
      },
    }));
  };

  const updateStepData = (step, data) => {
    const filteredData = { ...data };
    if (filteredData.email) {
      delete filteredData.email;
    }

    setFormData((prev) => ({
      ...prev,
      [step]: {
        ...prev[step],
        ...filteredData,
      },
    }));
  };

  const validateBasics = () => {
    const errs = {};
    const { basics } = formData;

    if (!profilePhoto) errs.profilePhoto = "Please Upload Profile Photo";
    if (!basics.fullName.trim()) errs.fullName = "Full name is required";
    if (!basics.dob.trim()) errs.dob = "DOB is required";
    if (!basics.gender.trim()) errs.gender = "Gender is required";

    if (!email || !email.match(/^\S+@\S+\.\S+$/))
      errs.email = "Valid email is required";

    if (!basics.phone.match(/^\+?[0-9\s-]{7,20}$/))
      errs.phone = "Please enter a valid phone number";

    // << ADD THIS >>
    if (!basics.phoneVerified) errs.phoneVerified = "Phone number not verified";
    //  if (!basics.emailVerified) errs.emailVerified = "Email not verified";

    return errs;
  };

  const validateStep = (step) => {
    const validators = {
      basics: () => {
        const errs = validateBasics();
        setErrors(errs);
        return Object.keys(errs).length === 0;
      },
      bio: () => {
        const { bio } = formData;
        const errs = {};

        if (!bio.shortBio?.trim()) errs.shortBio = "Short bio is required";
        setErrors(errs);
        return Object.keys(errs).length === 0;
      },
      services: () => {
        const { services } = formData;
        const errs = {};

        if (!services.serviceTypes.length)
          errs.serviceTypes = "Select at least one service";
        if (!services.preferredAirports.length)
          errs.preferredAirports = "Select at least one Airport";
        if (!services.languages.length)
          errs.languages = "Select at least one Language";
        setErrors(errs);
        return Object.keys(errs).length === 0;
      },
    };

    return validators[step] ? validators[step]() : true;
  };

  const uploadProfilePhoto = async () => {
    if (!profilePhoto?.file) {
      return profilePhoto?.url || null;
    }

    try {
      const file = profilePhoto.file;
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;

      if (!supabase) {
        throw new Error("Supabase client not initialized");
      }

      const { data: testData, error: testError } = await supabase.storage
        .from("companion-profile-photos")
        .list("", { limit: 1 });

      if (testError) {
        console.error("❌ Storage connection failed:", testError);
        throw new Error(`Storage connection failed: ${testError.message}`);
      }

      const { data, error } = await supabase.storage
        .from("companion-profile-photos")
        .upload(fileName, file);

      if (error) {
        console.error("❌ Upload error:", error);
        throw error;
      }

      const {
        data: { publicUrl },
      } = supabase.storage
        .from("companion-profile-photos")
        .getPublicUrl(data.path);

      return publicUrl;
    } catch (err) {
      console.error("💥 Complete upload process failed:", err);
      throw new Error(`Failed to upload profile photo: ${err.message}`);
    }
  };

  const handleStripeExpressOnboarding = async () => {
    setIsSubmitting(true);
    try {
      if (!validateStep("bio")) {
        setIsSubmitting(false);
        return;
      }

      // ! ✅ Send onboarding email to companion
      // const emailResult = await sendCompanionOnboardingEmail({
      //   to: formData.basics.email,
      //   name: formData.basics.fullName,
      //   // stripeOnboardingUrl: stripeResult.onboardingUrl,
      // });

      // if (!emailResult.success) {
      //   console.warn(
      //     "Email sending failed, but continuing with Stripe onboarding:",
      //     emailResult.error
      //   );
      //   // Don't throw error here - continue with Stripe onboarding even if email fails
      // } else {
      //   console.log("✅ Onboarding email sent successfully");
      // }
      // return;
      // ! Profile Photo Upload
      let finalProfilePhotoUrl = null;
      if (profilePhoto?.file) {
        finalProfilePhotoUrl = await uploadProfilePhoto();
      } else if (profilePhoto?.url) {
        finalProfilePhotoUrl = profilePhoto.url;
      }
      // ! Save Companion Data in Supabase still status is pending
      // const saveResult = await saveCompanionData({
      //   formData: formData,
      //   profilePhoto: finalProfilePhotoUrl,
      // });
      // if (!saveResult.success) {
      //   throw new Error(saveResult.error);
      // }

      // console.log(saveResult);
      // ! In your client component where you call saveCompanionData
      const {
        data: { session },
      } = await supabase.auth.getSession();
      const saveResult = await supabase.functions.invoke(
        "save-companion-data-on-signup",
        {
          body: {
            formData: formData,
            profilePhoto: finalProfilePhotoUrl,
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (saveResult.error) {
        throw new Error(
          saveResult.error.message || "Failed to save companion data"
        );
      }

      console.log(saveResult.data);

      const formattedPhone = formData.basics.phone.startsWith("+")
        ? formData.basics.phone
        : `+${formData.basics.phone}`;

      // ! Create Stripe Express Account for Companion
      // const stripeResult = await createStripeExpressAccount({
      //   id: saveResult.companionData.id,
      //   email: email, // ✅ Use email from props
      //   fullName: formData.basics.fullName,
      //   phone: formattedPhone,
      // });

      // if (!stripeResult.success) {
      //   throw new Error(stripeResult.error);
      // }
      // window.location.href = stripeResult.onboardingUrl;
      // ! In your client component
      const stripeResult = await supabase.functions.invoke(
        "create-stripe-express-account",
        {
          body: {
            companionData: {
             id: saveResult.data.companionData.id,
              email: email,
              fullName: formData.basics.fullName,
              phone: formattedPhone,
            },
          },
          headers: {
            Authorization: `Bearer ${session.access_token}`,
          },
        }
      );

      if (stripeResult.error) {
        throw new Error(
          stripeResult.error.message || "Failed to create Stripe account"
        );
      }

      console.log(stripeResult.data);
      window.location.href = stripeResult.data.onboardingUrl;
    } catch (error) {
      console.error("Stripe onboarding error:", error);
      alert("Failed to start Stripe onboarding. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const next = () => {
    const stepNames = {
      0: "basics",
      1: "services",
      2: "bio",
    };

    const currentStep = stepNames[activeStep];

    if (!validateStep(currentStep)) {
      return;
    }
    
    setStepLoading(true);
    setTimeout(() => {
      setActiveStep((s) => Math.min(s + 1, STEPS.length - 1));
      setStepLoading(false);
    }, 500);
  };

  const prev = () => {
    setStepLoading(true);
    setTimeout(() => {
      setActiveStep((s) => Math.max(0, s - 1));
      setStepLoading(false);
    }, 500);
  };

  const handleFinalSubmit = async () => {
    await handleStripeExpressOnboarding();
  };

  const getButtonText = () => {
    if (activeStep === STEPS.length - 1) {
      return isSubmitting
        ? "Setting up Stripe..."
        : "Continue to Verification with Stripe";
    }
    return "Continue";
  };

  const handleButtonClick = () => {
    if (activeStep === STEPS.length - 1) {
      handleFinalSubmit();
    } else {
      next();
    }
  };

  return (
    <div className="min-h-screen flex items-start justify-center mt-3">
      {/* Show loader when step is changing */}
      {stepLoading && <YellowLoader />}
      
      <Card className={"max-w-7xl "}>
        <form className="w-full relative">
          <header className="mb-6 text-center">
            <Heading
              title={" Companion Sign Up"}
              className="text-4xl font-extrabold text-slate-900"
            />
            {/* ✅ Show email from props */}
            {email && (
              <p className="text-slate-600 mt-2">
                Signed in as: <strong>{email}</strong>
              </p>
            )}
          </header>
          <p className="text-slate-700 mt-1 absolute left-5 top-5">
            Step {activeStep + 1} of {STEPS.length}
          </p>

          <div className="mb-6">
            <Stepper steps={STEPS} active={activeStep} />
          </div>

          <section
            className={`grid grid-cols-1 gap-6 items-start ${
              activeStep === 0 ? "md:grid-cols-4 " : ""
            }`}
          >
            {activeStep === 0 && (
              <div className="md:col-span-1 flex items-center justify-center gap-4 flex-wrap">
                <ProfilePhoto value={profilePhoto} onChange={setProfilePhoto} />
                <p className="text-center block text-red-500">
                  {errors && errors?.profilePhoto}
                </p>
              </div>
            )}
            <div className={` ${activeStep === 0 ? "md:col-span-3 " : ""} `}>
              {activeStep === 0 && (
                <BasicsForm
                profile={profile}
                  form={formData.basics}
                  update={(field, value) =>
                    updateFormData("basics", field, value)
                  }
                  errors={errors}
                  emailFromProps={email}
                />
              )}
              {activeStep === 1 && (
                <ServicesForm
                  form={formData.services}
                  update={(field, value) =>
                    updateFormData("services", field, value)
                  }
                  onUpdate={(data) => updateStepData("services", data)}
                  errors={errors}
                />
              )}
              {activeStep === 2 && (
                <ProfileBioForm
                  form={formData.bio}
                  update={(field, value) => updateFormData("bio", field, value)}
                  onUpdate={(data) => updateStepData("bio", data)}
                  errors={errors}
                />
              )}
              {activeStep === 3 && (
                <VerificationSummary
                  formData={formData}
                  profilePhoto={profilePhoto}
                  emailFromProps={email} // ✅ Pass email to VerificationSummary
                />
              )}

              <div
                className={`mt-8 flex items-center  ${
                  activeStep === 0 ? "justify-end" : "justify-between"
                } `}
              >
                {activeStep > 0 && (
                  <button
                    type="button"
                    onClick={prev}
                    disabled={stepLoading}
                    className="inline-flex items-center gap-2 px-4 py-2 rounded-md bg-[#ff7a00] text-white disabled:opacity-50"
                  >
                    ← Back
                  </button>
                )}

                <PrimaryButton
                  onClick={handleButtonClick}
                  disabled={isSubmitting || stepLoading}
                >
                  {getButtonText()}
                </PrimaryButton>
              </div>
            </div>
          </section>
        </form>
      </Card>
    </div>
  );
}