import PhoneInput from 'react-phone-input-2';
import 'react-phone-input-2/lib/style.css';

// PhoneInput component
const PhoneInputComponent = ({ value, onChange, error, onCountryChange }) => {
  const handleChange = (val, countryData) => {
    if (onChange) onChange(val);
    if (onCountryChange) onCountryChange(countryData.countryCode);
  };

  return (
    <div className="w-full">
      {/* <label className="block text-sm font-medium text-slate-700 mb-2">
        Phone Number
      </label> */}

      <div className={``}>
        <PhoneInput
          country={'pk'}
          value={value || ''}
          onChange={handleChange}
          inputClass={`!w-full !h-12 !text-slate-900 !text-base !pl-12 !border-none !bg-transparent !focus:ring-0 !rounded-md rounded-md !ring-1 !ring-slate-200 !focus-within:ring-2 !focus-within:ring-yellow-400 !transition bg-white ${error ? '!ring-rose-500' : ''} `}
          buttonClass="!border-none !bg-transparent"
          dropdownClass="!bg-white !text-slate-900"
          placeholder="+92 123 4567890"
        />
      </div>
      {error && (
        <p className="text-rose-600 text-sm mt-1">{error}</p>
      )}
    </div>
  );
};

export default PhoneInputComponent