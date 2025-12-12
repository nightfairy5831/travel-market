import { Icon } from "@iconify/react";

export const VerificationSummary = ({ formData, profilePhoto }) => {
  const { basics, services, bio } = formData;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">
          Review Your Information
        </h2>
        <p className="text-slate-600">
          Please review all your details
        </p>
      </div>

      {/* Profile Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:account" className="w-5 h-5" />
          Personal Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center gap-4">
            {profilePhoto?.url ? (
              <img
                src={profilePhoto.url}
                alt="Profile"
                className="w-16 h-16 rounded-full object-cover border-2 border-slate-200"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-slate-100 border-2 border-slate-200 flex items-center justify-center">
                <Icon icon="mdi:account" className="w-8 h-8 text-slate-400" />
              </div>
            )}
            <div>
              <p className="font-semibold text-slate-800">{basics.fullName}</p>
              <p className="text-sm text-slate-600">{basics.email}</p>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-slate-600">Phone:</span>
              <span className="font-medium">{basics.phone}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Date of Birth:</span>
              <span className="font-medium">{basics.dob}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Gender:</span>
              <span className="font-medium capitalize">{basics.gender}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Services Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:briefcase" className="w-5 h-5" />
          Services & Preferences
        </h3>

        <div className="space-y-4">
          {/* Services Offered */}
          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              Services Offered:
            </h4>
            <div className="flex flex-wrap gap-2">
              {services.serviceTypes.length > 0 ? (
                services.serviceTypes.map((serviceId) => {
                  const service = getServiceById(serviceId);
                  return service ? (
                    <span
                      key={serviceId}
                      className="inline-flex items-center gap-1 bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm"
                    >
                      <Icon icon={service.icon} className="w-4 h-4" />
                      {service.title}
                    </span>
                  ) : null;
                })
              ) : (
                <p className="text-slate-500 text-sm">No services selected</p>
              )}
            </div>
          </div>

          {/* Preferred Airports */}
          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              Preferred Airports:
            </h4>
            <div className="flex flex-wrap gap-2">
              {services.preferredAirports.length > 0 ? (
                services.preferredAirports.map((airport) => (
                  <span
                    key={airport.value}
                    className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm"
                  >
                    {airport.label}
                  </span>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No airports selected</p>
              )}
            </div>
          </div>

          {/* Languages */}
          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              Languages Spoken:
            </h4>
            <div className="flex flex-wrap gap-2">
              {services.languages.length > 0 ? (
                services.languages.map((language) => (
                  <span
                    key={language.value}
                    className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm"
                  >
                    {language.label}
                  </span>
                ))
              ) : (
                <p className="text-slate-500 text-sm">No languages selected</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Bio & Certificates Summary */}
      <div className="bg-white rounded-lg border border-slate-200 p-6">
        <h3 className="text-lg font-semibold text-slate-800 mb-4 flex items-center gap-2">
          <Icon icon="mdi:file-document" className="w-5 h-5" />
          Profile & Certifications
        </h3>

        <div className="space-y-4">
          {/* Short Bio */}
          <div>
            <h4 className="font-medium text-slate-700 mb-2">Short Bio:</h4>
            <p className="text-slate-800 bg-slate-50 p-3 rounded-lg border border-slate-200">
              {bio.shortBio || (
                <span className="text-slate-500">No bio provided</span>
              )}
            </p>
          </div>

          {/* Certificates */}
          <div>
            <h4 className="font-medium text-slate-700 mb-2">
              Uploaded Certificates:
            </h4>
            <div className="space-y-2">
              {bio.skillCertificates.length > 0 ? (
                bio.skillCertificates.map((certificate) => (
                  <div
                    key={certificate.id}
                    className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
                  >
                    <div className="flex items-center gap-3">
                      <Icon
                        icon={getFileIcon(certificate.name)}
                        className="w-5 h-5 text-blue-500"
                      />
                      <span className="text-sm font-medium text-slate-800">
                        {certificate.name}
                      </span>
                    </div>
                    <a
                      href={certificate.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-500 hover:text-blue-700"
                    >
                      <Icon icon="mdi:eye" className="w-5 h-5" />
                    </a>
                  </div>
                ))
              ) : (
                <p className="text-slate-500 text-sm">
                  No certificates uploaded
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-center pt-6 border-t border-slate-200">
        <p className="text-lg text-black font-semibold text-center">
          AidHandy partner's with Stripe to verify your identity and enable secure payouts
        </p>
      </div>
    </div>
  );
};
const getServiceById = (serviceId) => {
  const serviceOptions = [
    {
      id: "bording",
      title: "Boarding Help",
      icon: "mdi:airplane-takeoff",
    },
    {
      id: "child",
      title: "Child Support",
      icon: "mdi:account-child",
    },
    {
      id: "aid",
      title: "Mobility Aid",
      icon: "mdi:wheelchair-accessibility",
    },
    {
      id: "baggage",
      title: "Baggage Claim",
      icon: "mdi:bag-suitcase",
    },
    {
      id: "elderly",
      title: "Elderly Assistance",
      icon: "mdi:human-male-height",
    },
    {
      id: "anxious",
      title: "Anxious Traveler Support",
      icon: "mdi:emotion-sad",
    },
  ];
  return serviceOptions.find((service) => service.id === serviceId);
};

const getFileIcon = (fileName) => {
  if (fileName.includes(".pdf")) return "mdi:file-pdf-box";
  if (fileName.includes(".doc") || fileName.includes(".docx"))
    return "mdi:file-word-box";
  if (
    fileName.includes(".jpg") ||
    fileName.includes(".jpeg") ||
    fileName.includes(".png")
  )
    return "mdi:file-image-box";
  return "mdi:file-document-box";
};

export default VerificationSummary;
