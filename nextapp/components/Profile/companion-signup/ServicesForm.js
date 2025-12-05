"use client";
import {
  airportOptions,
  languageOptions,
  serviceOptions,
} from "@/components/Content-Data";
import { Icon } from "@iconify/react";
import Select from "react-select";

export default function ServicesForm({ form, update, onUpdate, errors }) {
  // Directly update parent state
  const toggleService = (serviceId) => {
    const currentServices = form.serviceTypes || [];
    const newServices = currentServices.includes(serviceId)
      ? currentServices.filter((id) => id !== serviceId)
      : [...currentServices, serviceId];

    update("serviceTypes", newServices);
  };

  const handleAirportChange = (selectedOptions) => {
    update("preferredAirports", selectedOptions || []);
  };

  const handleLanguageChange = (selectedOptions) => {
    update("languages", selectedOptions || []);
  };

  const customSelectStyles = {
    control: (base, state) => ({
      ...base,
      border: `1px solid ${errors.preferredAirports ? "#ef4444" : "#e2e8f0"}`,
      borderRadius: "8px",
      boxShadow: "none",
      "&:hover": {
        borderColor: errors.preferredAirports ? "#ef4444" : "#cbd5e1",
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#1d9fd8",
      borderRadius: "6px",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "white",
      fontWeight: "500",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "white",
      "&:hover": {
        backgroundColor: "#1d9fd8",
        color: "white",
      },
    }),
  };

  const languageSelectStyles = {
    control: (base, state) => ({
      ...base,
      border: `1px solid ${errors.languages ? "#ef4444" : "#e2e8f0"}`,
      borderRadius: "8px",
      boxShadow: "none",
      "&:hover": {
        borderColor: errors.languages ? "#ef4444" : "#cbd5e1",
      },
    }),
    multiValue: (base) => ({
      ...base,
      backgroundColor: "#1d9fd8",
      borderRadius: "6px",
    }),
    multiValueLabel: (base) => ({
      ...base,
      color: "white",
      fontWeight: "500",
    }),
    multiValueRemove: (base) => ({
      ...base,
      color: "white",
      "&:hover": {
        backgroundColor: "#1d9fd8",
        color: "white",
      },
    }),
  };

  return (
    <div className="space-y-8">
      <div className="grid sm:grid-cols-2 grid-cols-1 gap-3">
        <div className="space-y-2">
          <label className="text-lg font-semibold text-slate-800">
            Preferred Airports
          </label>
          <Select
            isMulti
            options={airportOptions}
            value={form.preferredAirports || []}
            onChange={handleAirportChange}
            placeholder="Select preferred airports..."
            styles={customSelectStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
          {errors.preferredAirports && (
            <p className="text-red-500 text-sm">{errors.preferredAirports}</p>
          )}
        </div>
        <div className="space-y-2">
          <label className="text-lg font-semibold text-slate-800">
            Languages Spoken
          </label>
          <Select
            isMulti
            options={languageOptions}
            value={form.languages || []}
            onChange={handleLanguageChange}
            placeholder="Select languages you speak..."
            styles={languageSelectStyles}
            className="react-select-container"
            classNamePrefix="react-select"
          />
          {errors.languages && (
            <p className="text-red-500 text-sm">{errors.languages}</p>
          )}
        </div>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h4 className="text-lg font-semibold text-slate-800">
            Services Offered
          </h4>
          {errors.serviceTypes && (
            <span className="text-red-500 text-sm">{errors.serviceTypes}</span>
          )}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {serviceOptions.map((service) => (
            <div
              key={service.id}
              onClick={() => toggleService(service.id)}
              className={`p-4 rounded-lg border-2 cursor-pointer transition-all duration-200 ${
                (form.serviceTypes || []).includes(service.id)
                  ? "border-[#1d9fd8] bg-blue-50"
                  : errors.serviceTypes
                  ? "border-red-300 bg-red-50"
                  : "border-slate-200 bg-white hover:border-slate-300"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="text-2xl">
                  <Icon icon={service.icon} className="w-6 h-6" />
                </div>
                <div className="flex-1">
                  <h5 className="font-semibold text-slate-800">
                    {service.title}
                  </h5>
                  <p className="text-sm text-slate-600 mt-1">
                    {service.description}
                  </p>
                </div>
                <div
                  className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
                    (form.serviceTypes || []).includes(service.id)
                      ? "bg-[#1d9fd8] border-[#1d9fd8]"
                      : errors.serviceTypes
                      ? "border-red-300"
                      : "border-slate-300"
                  }`}
                >
                  {(form.serviceTypes || []).includes(service.id) && (
                    <svg
                      className="w-3 h-3 text-white"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={3}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Selected Items Display */}
      {((form.preferredAirports || []).length > 0 ||
        (form.languages || []).length > 0 ||
        (form.serviceTypes || []).length > 0) && (
        <div className="bg-slate-50 rounded-lg p-4 space-y-3">
          <h5 className="font-semibold text-slate-800">Your Selections:</h5>

          {(form.serviceTypes || []).length > 0 && (
            <div>
              <span className="text-sm font-medium text-slate-700">
                Services:{" "}
              </span>
              <div className="flex flex-wrap gap-2 mt-1">
                {(form.serviceTypes || []).map((serviceId) => {
                  const service = serviceOptions.find(
                    (s) => s.id === serviceId
                  );
                  return service ? (
                    <span
                      key={serviceId}
                      className="inline-flex items-center gap-1 bg-[#1d9fd8] text-white px-2 pr-3 py-1 rounded-full text-sm"
                    >
                      {service.title}
                      <button
                        onClick={() => toggleService(serviceId)}
                        className="!hover:text-[#d81d1d] !text-red-600 ml-3 text-lg cursor-pointer"
                      >
                       <Icon icon="mdi:close" />
                      </button>
                    </span>
                  ) : null;
                })}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
