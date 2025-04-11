"use client";

import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { Router } from "next/router";
import { checkLogin } from "@/app/hooks/helper";

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    fullName: "",
    email: "",
    phone: "",
    createdAt: "",
    balance: "",
  });
  const router = useRouter();

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {

    const fetchUserProfile = async () => {
      try {
        const datares = await checkLogin();
        const response = await fetch(`/api/user/auth/${datares.uid}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const data = await response.json();
        setProfile({
          fullName: `${data.firstname} ${data.lastname}`,
          email: data.email,
          phone: data.phone_no || "N/A",
          createdAt: new Date(data.created_at).toLocaleDateString("en-GB"),
          balance: `${parseFloat(data.cash).toFixed(2)}VND`,
        });
      } catch (e: any) {
        setError(e.message);
        router.push("/");
      }finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, []);
  const handleShowHistory = () => {
    router.push("/bills");
  };

  if (error) return <p className="text-center text-red-500">{error}</p>;
  if (loading) return <p className="text-center">Loading...</p>;
  return (
    <div className="min-h-screen bg-beige-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-6 border border-green-300 gap-6 flex flex-col justify-between">
        <h2 className="text-2xl font-bold text-green-800 mb-6">Your Profile</h2>

        {/* Profile Picture */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-green-200 text-green-800 flex items-center justify-center text-3xl font-bold rounded-full">
            {profile.fullName.charAt(0)}
          </div>
          <div>
            <p className="text-sm text-gray-600">Upload your profile picture</p>
            <button className="mt-2 px-4 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
              Upload Image
            </button>
          </div>
        </div>

        {/* User Details */}
        <div className="mt-6 space-y-4 flex flex-col gap-2 text-gray-900">
          <DetailItem label="Full Name" value={profile.fullName} />
          <DetailItem label="Email" value={profile.email} />
          <DetailItem label="Phone Number" value={profile.phone} />
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="text-sm text-gray-600">Account Created At</p>
            <p className="font-medium">{profile.createdAt}</p>
          </div>
          <div className="bg-green-100 p-3 rounded-md text-green-800 font-bold text-lg text-gray-900">
            <p>Current Balance: {profile.balance}</p>
          </div>
          <button
            type="button"
            onClick={handleShowHistory}
            className="max-w-64 mt-4 text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2"
          >
            Show history transactions
          </button>
        </div>
      </div>
    </div>
  );
};

// Reusable component for user details
const DetailItem = ({ label, value }: { label: string; value: string }) => (
  <div className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
    <div>
      <p className="text-sm text-gray-600">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
    <button className="px-4 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">
      Edit
    </button>
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
