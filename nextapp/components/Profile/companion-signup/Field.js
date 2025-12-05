import { Icon } from "@iconify/react";

export const Stepper = ({ steps = [], active = 0 }) => (
  <nav aria-label="Progress" className="w-full">
    <ol className="flex rounded-md overflow-hidden text-sm">
      {steps.map((s, i) => {
        const isCompleted = i < active;
        const isActive = i === active;

        return (
          <li
            key={s}
            className={`flex-1 flex items-center justify-center gap-2 py-3 text-base font-semibold border-b-4 transition-all
              ${
                isCompleted
                  ? "border-green-500 text-green-600 bg-green-50"
                  : isActive
                  ? "border-[#1d9fd8] text-[#1d9fd8] bg-blue-50"
                  : "border-gray-300 text-black bg-gray-100"
              }`}
          >
            {isCompleted ? (
              <Icon
                icon="mdi:check-circle"
                className="w-4 h-4 text-green-600"
              />
            ) : (
              <span>{i + 1}</span>
            )}
            <span>{s}</span>
          </li>
        );
      })}
    </ol>
  </nav>
);

export const AvatarUpload = ({ value, onChange }) => {
  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    onChange({ file, url });
  };

  return (
    <div className="flex items-center gap-6">
      <div className="w-28 h-28 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden ring-2 ring-orange-200">
        {value?.url ? (
          <img
            src={value.url}
            alt="avatar preview"
            className="w-full h-full object-cover"
          />
        ) : (
          <svg
            className="w-16 h-16 text-slate-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 12a4 4 0 100-8 4 4 0 000 8z"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M3 21a9 9 0 0118 0"
              stroke="currentColor"
              strokeWidth="1.5"
            />
          </svg>
        )}
      </div>
      <label className="inline-flex items-center px-4 py-3 bg-yellow-400 rounded-md cursor-pointer hover:brightness-95">
        <input
          onChange={handleFile}
          type="file"
          accept="image/*"
          className="hidden"
        />
        <span className="font-semibold text-slate-800">Upload Photo</span>
      </label>
    </div>
  );
};
export const Field = ({
  label,
  id,
  value,
  onChange,
  placeholder = "",
  type = "text",
}) => (
  <div className="w-full">
    <label htmlFor={id} className="block text-slate-800 font-semibold mb-2">
      {label}
    </label>
    <input
      id={id}
      name={id}
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
    />
  </div>
);

export const PrimaryButton = ({
  children,
  onClick,
  type = "button",
  disabled,
}) => (
  <button
    type={type}
    onClick={onClick}
    disabled={disabled}
    className={`inline-block rounded-lg px-4 py-2 text-white font-semibold shadow-md transition ${
      disabled
        ? "opacity-60 pointer-events-none bg-[#ff7a00]"
        : "bg-[#ff7a00] hover:brightness-110"
    }`}
  >
    {children}
  </button>
);
