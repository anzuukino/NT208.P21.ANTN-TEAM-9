"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Router } from "next/router";
import { checkLogin } from "@/app/hooks/helper";
import ProfileImageUploader  from "@/components/ImageProfileUploadForm";

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    identify_no: "",
    postal_code: "",
    createdAt: "",
    balance: "",
    profile_pic: "",
  });
  const router = useRouter();
  const [originalProfile, setOriginalProfile] = useState(profile);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [isModified, setIsModified] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {

    const fetchUserProfile = async () => {
      try {
        const datares = await checkLogin();
        const response = await fetch(`/api/user/auth/${datares.uid}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        const loadedProfile = {
          fullName: `${data.firstname} ${data.lastname}`,
          email: data.email,
          phone: data.phone_no || "N/A",
          identify_no: data.identify_no || "N/A",
          postal_code: data.postal_code || "N/A",
          createdAt: new Date(data.created_at).toLocaleDateString("en-GB"),
          balance: `${parseFloat(data.cash).toFixed(2)}VND`,
          profile_pic: data.ProfileImage?.path || "",
        }
        setProfile(loadedProfile);
        setOriginalProfile(loadedProfile);
      } catch (e: any) {
        setError(e.message);
        router.push("/");
      }finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);

  const handleInputChange = (field: keyof typeof profile, value: string) => {
    setProfile((prev) => {
      const updated = { ...prev, [field]: value };
      setIsModified(JSON.stringify(updated) !== JSON.stringify(originalProfile));
      return updated;
    });
  };

  const handleGoHome = () => {
    router.push("/");
  };

  const handleSave = async () => {
    try {
      const res = await fetch("/api/edit-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone_no: profile.phone,
          identify_no: profile.identify_no,
          postal_code: profile.postal_code,
        }),
      });
      if (!res.ok) throw new Error("Failed to update profile");

      const updated = await res.json();
      const updatedProfile = {
        ...profile,
        phone: updated.user.phone_no || "N/A",
        identify_no: updated.user.identify_no || "N/A",
        postal_code: updated.user.postal_code || "N/A",
      };
      setProfile(updatedProfile);
      setOriginalProfile(updatedProfile);
      setIsModified(false);
    } catch (err: any) {
      alert("Error saving changes: " + err.message);
    }
  };

  const handleShowHistory = () => {
    router.push("/bills");
  };

  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (loading) return <p className="text-center">Loading...</p>;
  return (
    <div className="min-h-screen bg-beige-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-6 border border-green-300 gap-6 flex flex-col">
        <h2 className="text-2xl font-bold text-green-800 mb-6">Your Profile</h2>
        <button
          onClick={handleGoHome}
          className="flex items-center gap-2 text-gray-600 hover:text-green-700 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-md transition-colors"
        >
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
          </svg>
          Back to Home
        </button>
        {/* Profile Picture Section */}
          <div className="flex items-center gap-4">
            {profile.profile_pic ? (
            <img 
              src={`/${profile.profile_pic}`} 
              alt="Profile" 
              className="w-20 h-20 object-cover rounded-full"
            />
          ) : (
            <div className="w-20 h-20 bg-green-200 text-green-800 flex items-center justify-center text-3xl font-bold rounded-full">
              {profile.fullName.charAt(0)}
            </div>
          )}
          <ProfileImageUploader 
          onUploadSuccess={(profileImage) => {
            setProfile(prev => ({...prev, profile_pic: profileImage.path}));
          }} 
        />
        </div>

        {/* Profile Details */}
        <div className="mt-6 space-y-4 flex flex-col gap-2 text-gray-900">
          {/* Full Name is read-only */}
          <ReadOnlyField label="Full Name" value={profile.fullName} />
          {/* Editable fields */}
          <EditableField label="Phone Number" value={profile.phone} onChange={(val) => handleInputChange("phone", val)} />
          <EditableField label="Identity Number" value={profile.identify_no} onChange={(val) => handleInputChange("identify_no", val)} />
          <EditableField label="Postal Code" value={profile.postal_code} onChange={(val) => handleInputChange("postal_code", val)} />

          {/* Read-only fields */}
          <ReadOnlyField label="Email" value={profile.email} />
          <ReadOnlyField label="Account Created At" value={profile.createdAt} />
          <div className="bg-green-100 p-3 rounded-md font-bold text-lg text-gray-900">
            <p>Current Balance: {profile.balance}</p>
          </div>

          {/* Show Save Changes button only if something has changed */}
          <div className="flex flex-wrap gap-4 mt-4">
            {isModified && (
              <button onClick={handleSave} className="bg-green-500 hover:bg-green-600 text-white font-semibold px-6 py-2 rounded-md">
                Save Changes
              </button>
            )}

            <button
              type="button"
              onClick={handleShowHistory}
              className="text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 font-medium rounded-lg text-sm px-5 py-2.5 text-center"
            >
              Show history transactions
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const EditableField = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
}) => (
  <div className="bg-gray-100 p-3 rounded-md">
    <label className="block text-sm text-gray-600">{label}</label>
    <input
      type="text"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className="w-full bg-white border border-gray-300 rounded-md p-2 mt-1 text-gray-900"
    />
  </div>
);

const ReadOnlyField = ({ label, value }: { label: string; value: string }) => (
  <div className="bg-gray-100 p-3 rounded-md">
    <p className="text-sm text-gray-600">{label}</p>
    <p className="font-medium">{value}</p>
  </div>
);

const Wrapper = () => {
  return (
    <Suspense>
      <ProfilePage></ProfilePage>
    </Suspense>
  );
}

export default Wrapper;
