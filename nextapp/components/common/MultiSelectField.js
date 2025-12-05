"use client";

import Select from "react-select";

export default function MultiSelectField({
  label,
  id,
  options,
  value = [],
  onChange,
  error,
  placeholder = "Select options...",
}) {
  // Convert value array (["English", "Spanish"]) to react-select format
  const selectedOptions = options.filter((opt) => value.includes(opt.value));

  const handleChange = (selected) => {
    // Convert back to simple array for your form state
    const values = selected ? selected.map((opt) => opt.value) : [];
    onChange(values);
  };

  return (
    <div className="mb-4">
      {label && (
        <label
          htmlFor={id}
          className="block text-slate-800 font-semibold mb-2"
        >
          {label}
        </label>
      )}

      <Select
        id={id}
        isMulti
        options={options}
        value={selectedOptions}
        onChange={handleChange}
        placeholder={placeholder}
        classNamePrefix="react-select"
        styles={{
          control: (base, state) => ({
            ...base,
            borderColor: state.isFocused ? "#3B82F6" : "#D1D5DB",
            boxShadow: state.isFocused ? "0 0 0 1px #3B82F6" : "none",
            "&:hover": { borderColor: "#3B82F6" },
          }),
        }}
      />

      {error && <p className="text-rose-600 text-sm mt-1">{error}</p>}
    </div>
  );
}
