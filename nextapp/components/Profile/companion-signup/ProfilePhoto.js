import { Icon } from "@iconify/react";

const ProfilePhoto = ({ value, onChange }) => {
  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    
    onChange({ 
      file, 
      url,
      name: file.name 
    });
  };

  return (
    <div className="flex items-center flex-col gap-6">
      <div className="relative w-28 h-28 flex items-center justify-center">
        {value?.url ? (
          <img
            src={value.url}
            alt="profile photo preview"
            className="w-full h-full object-cover ring-blue-200 rounded-full ring-2 shadow-sm"
          />
        ) : (
          <Icon
            icon="iconamoon:profile-fill"
            className="w-full h-full object-cover ring-blue-200 rounded-full ring-2 shadow-sm"
          />
        )}

        <label className="absolute bottom-0 right-0 bg-[#ff7a00] rounded-full p-2 cursor-pointer hover:brightness-95 transition">
          <input
            onChange={handleFile}
            type="file"
            accept="image/*"
            className="hidden"
          />
          <Icon
            icon={value?.url ? "mdi:camera-plus" : "mdi:upload"}
            className="w-4 h-4 text-white"
          />
        </label>
      </div>

      {value?.url && (
        <p className="text-sm text-gray-500 text-center">
          Uploaded
        </p>
      )}
    </div>
  );
};

export default ProfilePhoto;