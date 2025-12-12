import { Icon } from "@iconify/react";
import { supabase } from "@/libs/supabaseClient";
import { useState } from "react";

export const CertificateUpload = ({ value = [], onChange }) => {
  const [uploading, setUploading] = useState(false);

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Check file type (PDF, images, documents)
    const allowedTypes = [
      'application/pdf', 
      'image/jpeg', 
      'image/png', 
      'image/jpg',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ];
    
    if (!allowedTypes.includes(file.type)) {
      alert("Please upload PDF, Word, or image files only.");
      return;
    }

    // Check file size (5MB max)
    if (file.size > 5 * 1024 * 1024) {
      alert("File size must be less than 5MB.");
      return;
    }

    try {
      setUploading(true);
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random()}.${fileExt}`;
      
      // Upload file to Supabase
      const { data, error } = await supabase.storage
        .from("companion-certificates") // Create this bucket in Supabase
        .upload(fileName, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from("companion-certificates")
        .getPublicUrl(data.path);

      // Add new certificate to array
      const newCertificate = {
        id: Math.random().toString(36).substr(2, 9),
        name: file.name,
        url: publicUrl,
        file: file,
        uploadedAt: new Date().toISOString()
      };

      onChange([...value, newCertificate]);
      
    } catch (err) {
      console.error("Error uploading certificate:", err.message);
      alert("Failed to upload certificate.");
    } finally {
      setUploading(false);
    }
  };

  const removeCertificate = (certificateId) => {
    const updatedCertificates = value.filter(cert => cert.id !== certificateId);
    onChange(updatedCertificates);
  };

  const getFileIcon = (fileName) => {
    if (fileName.includes('.pdf')) return 'mdi:file-pdf-box';
    if (fileName.includes('.doc') || fileName.includes('.docx')) return 'mdi:file-word-box';
    if (fileName.includes('.jpg') || fileName.includes('.jpeg') || fileName.includes('.png')) return 'mdi:file-image-box';
    return 'mdi:file-document-box';
  };

  return (
    <div className="space-y-4">
      {/* Upload Button */}
      <div className="flex items-center justify-center">
        <label className="flex items-center gap-2 px-4 py-3 bg-[#ff7a00] text-white rounded-lg cursor-pointer transition-colors">
          <input
            onChange={handleFile}
            type="file"
            accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
            className="hidden"
            disabled={uploading}
          />
          <Icon icon="mdi:upload" className="w-5 h-5" />
          <span >{uploading ? "Uploading..." : "Upload Certificate"}</span>
        </label>
      </div>

      {/* Uploaded Certificates List */}
      {value.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-slate-700">Uploaded Certificates:</h4>
          {value.map((certificate) => (
            <div
              key={certificate.id}
              className="flex items-center justify-between p-3 bg-slate-50 rounded-lg border border-slate-200"
            >
              <div className="flex items-center gap-3">
                <Icon 
                  icon={getFileIcon(certificate.name)} 
                  className="w-6 h-6 text-blue-500" 
                />
                <div>
                  <p className="text-sm font-medium text-slate-800">
                    {certificate.name}
                  </p>
                  <p className="text-xs text-slate-500">
                    Uploaded {new Date(certificate.uploadedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => removeCertificate(certificate.id)}
                className="text-red-500 hover:text-red-700 p-1"
              >
                <Icon icon="mdi:trash-can-outline" className="w-5 h-5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Help Text */}
      <p className="text-sm text-slate-500">
        Upload PDF, Word documents, or images of your certificates. Maximum file size: 5MB
      </p>
    </div>
  );
};

export default CertificateUpload;