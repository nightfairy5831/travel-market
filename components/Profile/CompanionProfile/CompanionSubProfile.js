import InputField from "@/components/common/InputField";
import EmailVerification from "../companion-signup/EmailOTP";
import PhoneInput2 from "../companion-signup/PhoneOTP";
import MultiSelectField from "@/components/common/MultiSelectField";

const CompanionSubProfile = ({
  form,
  update,
  errors,
  emailFromProps,
  profile,
}) => {
  const handleChange = (fieldName) => (e) => {
    update(fieldName, e.target.value);
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
        <InputField
          id="dob"
          label="Date of birth"
          name="dob"
          type="date"
          value={form.dob}
          onChange={handleChange("dob")}
          placeholder=""
          required={true}
        />
        {errors.dob && (
          <p className="text-rose-600 text-sm mt-1">{errors.dob}</p>
        )}
      </div>
      {/* <div>KYC Status {form.is_kyc_approved}</div> */}
      <div>
        <InputField
          id="shortbio"
          label="Short Bio"
          name="shortbio"
          value={form.short_bio}
          onChange={handleChange("short_bio")}
          placeholder=""
          required={true}
        />
        {errors.short_bio && (
          <p className="text-rose-600 text-sm mt-1">{errors.short_bio}</p>
        )}
      </div>
      <div>
        {" "}
        <label
          htmlFor="gender"
          className="block text-slate-800 font-semibold mb-2"
        >
          {" "}
          Gender <span className="text-rose-500">*</span>
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
          label={
            <>
              Languages <span className="text-rose-500">*</span>
            </>
          }
          options={[
            { value: "English", label: "English" },
            { value: "Spanish", label: "Spanish" },
          ]}
          value={
            Array.isArray(form.language)
              ? form.language.map(
                  (lang) =>
                    lang.charAt(0).toUpperCase() + lang.slice(1).toLowerCase()
                )
              : form.language
              ? [
                  form.language.charAt(0).toUpperCase() +
                    form.language.slice(1).toLowerCase(),
                ]
              : []
          }
          onChange={(vals) => update("language", vals)}
          error={errors.language}
        />
        <MultiSelectField
          id="language"
          label={
            <>
              Service Type <span className="text-rose-500">*</span>
            </>
          }
          options={[
            {
              value: "bording",
              label: "Boarding Help",
            },
            {
              value: "child",
              label: "Child Support",
            },
            {
              value: "aid",
              label: "Mobility Aid",
            },
            {
              value: "baggage",
              label: "Baggage Claim",
            },
            {
              value: "elderly",
              label: "Elderly Assistance",
            },
            {
              value: "anxious",
              label: "Anxious Traveler Support",
            },
          ]}
          value={
            Array.isArray(form.service_types)
              ? form.service_types
              : form.service_types
              ? [form.service_types]
              : []
          }
          onChange={(vals) => update("service_types", vals)}
          error={errors.service_types}
        />

        <MultiSelectField
          id="preferred_airports"
          label={
            <>
              Preferred Airports <span className="text-rose-500">*</span>
            </>
          }
          options={[
            { value: "jfk", label: "JFK - New York" },
            { value: "lax", label: "LAX - Los Angeles" },
            { value: "ord", label: "ORD - Chicago" },
            { value: "dfw", label: "DFW - Dallas" },
            { value: "sfo", label: "SFO - San Francisco" },
            { value: "mia", label: "MIA - Miami" },
            { value: "sea", label: "SEA - Seattle" },
            { value: "bos", label: "BOS - Boston" },
          ]}
          value={
            Array.isArray(form.preferred_airports)
              ? form.preferred_airports
              : form.preferred_airports
              ? [form.preferred_airports]
              : []
          }
          onChange={(vals) => update("preferred_airports", vals)}
          error={errors.preferred_airports}
        />
      </div>
    </div>
  );
};

export default CompanionSubProfile;
