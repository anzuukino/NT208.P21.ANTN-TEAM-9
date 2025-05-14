import { useState } from "react";

interface ProfileImage {
  type: string;
  path: string;
}

interface ProfileImageUploaderProps {
  onUploadSuccess: (profileImage: ProfileImage) => void;
}

const ProfileImageUploader = ({ onUploadSuccess }: ProfileImageUploaderProps) => {
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpload = async () => {
    if (!selectedImage) {
      setMessage("Please select an image first.");
      return;
    }

    const formData = new FormData();
    formData.append("file", selectedImage);

    try {
      setUploading(true);
      const res = await fetch("/api/upload-profile-image", {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Upload failed");

      setMessage("Image uploaded successfully!");
      onUploadSuccess(data.profileImage);
    } catch (err: any) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div>
      <p className="text-sm text-gray-600">Upload your profile picture</p>
      <input
        type="file"
        accept="image/*"
        onChange={(e) => setSelectedImage(e.target.files?.[0] || null)}
        className="mt-2 text-sm"
      />
      <button
        disabled={uploading}
        onClick={handleUpload}
        className="mt-2 px-4 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 disabled:opacity-50"
      >
        {uploading ? "Uploading..." : "Upload Image"}
      </button>
      {message && <p className="text-xs mt-2 text-gray-600">{message}</p>}
    </div>
  );
};

export default ProfileImageUploader;