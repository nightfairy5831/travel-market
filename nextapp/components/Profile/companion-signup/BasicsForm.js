import EmailVerification from "./EmailOTP";
import { Field } from "./Field";
import PhoneOtpInput from "./PhoneOTP";

const BasicsForm = ({ form, update, errors, emailFromProps, profile }) => (
  <div className="space-y-6">
    <Field
      id="fullName"
      label="Full Name"
      value={form.fullName}
      onChange={(v) => update("fullName", v)}
      placeholder="Jane Doe"
    />
    {errors.fullName && (
      <p className="text-rose-600 text-sm mt-1">{errors.fullName}</p>
    )}

    {/* ✅ Email Verification Component */}
    {/* <EmailVerification
      profile={profile}
      email={emailFromProps || form.email}
      error={errors.emailVerified}
      onVerified={(flag) => update("emailVerified", flag)}
    /> */}

    {/* ✅ Phone OTP Input */}
    <PhoneOtpInput
      profile={profile}
      value={form.phone}
      onChange={(v) => update("phone", v)}
      error={errors.phone || errors.phoneVerified}
      onVerified={(flag) => update("phoneVerified", flag)}
    />

    <div>
      <label htmlFor="dob" className="block text-sm font-medium text-slate-700">
        Date of Birth
      </label>
      <input
        id="dob"
        type="date"
        value={form.dob || ""}
        onChange={(e) => update("dob", e.target.value)}
        className="mt-2 w-full px-4 py-3 rounded-md ring-1 ring-slate-200 focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white text-slate-900"
      />
      {errors.dob && <p className="text-rose-600 text-sm mt-1">{errors.dob}</p>}
    </div>

    {/* ✅ Gender Dropdown */}
    <div>
      <label
        htmlFor="gender"
        className="block text-sm font-medium text-slate-700"
      >
        Gender
      </label>
      <select
        id="gender"
        value={form.gender || ""}
        onChange={(e) => update("gender", e.target.value)}
        className="mt-2 w-full px-4 py-3 rounded-md ring-1 ring-slate-200 focus:ring-2 focus:ring-yellow-400 focus:outline-none bg-white text-slate-900"
      >
        <option value="">Select gender</option>
        <option value="male">Male</option>
        <option value="female">Female</option>
        <option value="female">Non-Binary</option>
        <option value="female">Prefer not to say</option>
      </select>
      {errors.gender && (
        <p className="text-rose-600 text-sm mt-1">{errors.gender}</p>
      )}
    </div>
  </div>
);

export default BasicsForm;
