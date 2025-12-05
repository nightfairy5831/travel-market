import InputField from "@/components/common/InputField";
import EmailVerification from "../companion-signup/EmailOTP";
import PhoneInput2 from "../companion-signup/PhoneOTP";
import MultiSelectField from "@/components/common/MultiSelectField";

const TravellerSignup = ({ form, update, errors, emailFromProps, profile }) => {
  // Handle change for single-value fields
  const handleChange = (fieldName) => (e) => {
    update(fieldName, e.target.value);
  };

  // ✅ Handle multiple selection for arrays
  const handleMultiSelectChange = (fieldName) => (e) => {
    const selected = Array.from(
      e.target.selectedOptions,
      (option) => option.value
    );
    update(fieldName, selected);
  };

  return (
    <div className="space-y-6">
      {/* ✅ Name Fields */}
      <div className="grid md:grid-cols-2 gap-3">
        <div>
          <InputField
            id="firstName"
            label="First Name"
            name="firstName"
            value={form.firstName}
            onChange={handleChange("firstName")}
            placeholder="Jane"
            required={true}
          />
          {errors.firstName && (
            <p className="text-rose-600 text-sm mt-1">{errors.firstName}</p>
          )}
        </div>

        <div>
          <InputField
            id="lastName"
            label="Last Name"
            name="lastName"
            value={form.lastName}
            onChange={handleChange("lastName")}
            placeholder="Doe"
            required={true}
          />
          {errors.lastName && (
            <p className="text-rose-600 text-sm mt-1">{errors.lastName}</p>
          )}
        </div>
      </div>

      {/* ✅ Email Verification (Mandatory) */}
      <div>
        <EmailVerification
          profile={profile}
          email={emailFromProps || form.email}
          error={errors.emailVerified}
          onVerified={(flag) => update("emailVerified", flag)}
        />
        {errors.emailVerified && (
          <p className="text-rose-600 text-sm mt-1">{errors.emailVerified}</p>
        )}
      </div>

      {/* ✅ Phone OTP Input (Mandatory) */}
      <div>
        <PhoneInput2
          profile={profile}
          value={form.phone}
          checkVerify={form?.phoneVerified}
          onChange={(v) => update("phone", v)}
          error={errors.phone || errors.phoneVerified}
          onVerified={(flag) => update("phoneVerified", flag)}
        />
      </div>
      <div>
        {" "}
        <label
          htmlFor="gender"
          className="block text-slate-800 font-semibold mb-2"
        >
          {" "}
          Gender{" "}
        </label>{" "}
        <select
          id="gender"
          value={form.gender || ""}
          onChange={handleChange("gender")}
          className="border border-gray-300 rounded-md w-full p-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          {" "}
          <option value="">Select gender</option>{" "}
          <option value="male">Male</option>{" "}
          <option value="female">Female</option>{" "}
          <option value="Non-binary">Non-binary</option>{" "}
          <option value="Prefer not to say">Prefer not to say</option>{" "}
        </select>{" "}
        {errors.gender && (
          <p className="text-rose-600 text-sm mt-1">{errors.gender}</p>
        )}{" "}
      </div>

      <div className="grid md:grid-cols-2 gap-3">
        <MultiSelectField
          id="language"
          label="Languages"
          options={[
            { value: "English", label: "English" },
            { value: "Spanish", label: "Spanish" },
            // { value: "Urdu", label: "Urdu" },
            // { value: "Arabic", label: "Arabic" },
            // { value: "French", label: "French" },
          ]}
          value={form.language}
          onChange={(vals) => update("language", vals)}
          error={errors.language}
        />

        <MultiSelectField
          id="specialNeeds"
          label="Special Assistance"
          options={[
            { value: "Wheelchair Access", label: "Mobility" },
            {
              value: "Hearing Assistance",
              label: "Visual (low vision or blind)",
            },
            {
              value: "Visual Assistance",
              label: "Hearing (deaf or hard of hearing)",
            },
            { value: "Medical Support", label: "Elderly Support" },
            {
              value: "Travelling with children",
              label: "Travelling with children",
            },
            { value: "Medical condition", label: "Medical condition" },
            {
              value: "Cognitive / development support",
              label: "Cognitive / development support",
            },
            { value: "Language assistance", label: "Language assistance" },
            {
              value: "Heavy luggage / transfer",
              label: "Heavy luggage / transfer",
            },
            { value: "Other", label: "Other" },
          ]}
          value={form.specialNeeds}
          onChange={(vals) => update("specialNeeds", vals)}
          error={errors.specialNeeds}
        />
      </div>
    </div>
  );
};

export default TravellerSignup;
