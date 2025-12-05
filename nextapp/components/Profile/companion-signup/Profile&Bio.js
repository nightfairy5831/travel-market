import { Field } from "./Field";
import CertificateUpload from "./CertificateUpload"; // Import the certificate upload component

export const ProfileBioForm = ({ form, update, errors }) => (
  <div className="space-y-6">
    {/* Short Bio */}
    <Field
      id="shortBio"
      label="Short Bio"
      type="textarea"
      value={form.shortBio}
      onChange={(v) => update("shortBio", v)}
      placeholder="Tell us about yourself, your experience, and what makes you a great companion..."
      required
      rows={4}
    />
    {errors?.shortBio && (
      <p className="text-rose-600 text-sm mt-1">{errors.shortBio}</p>
    )}

    {/* Certificate Upload Section */}
    <div className="space-y-4">
      <label className="block text-sm font-medium text-slate-700">
        Upload Certificates & Documents <span className="text-slate-400">(Optional)</span>
      </label>
      
      <CertificateUpload
        value={form.skillCertificates || []}
        onChange={(certificates) => update("skillCertificates", certificates)}
      />
      
      {errors?.skillCertificates && (
        <p className="text-rose-600 text-sm mt-1">{errors.skillCertificates}</p>
      )}
      
      <p className="text-sm text-slate-500">
        Upload PDF, Word documents, or images of your certificates, training documents, or qualifications.
      </p>
    </div>
  </div>
);

export default ProfileBioForm;