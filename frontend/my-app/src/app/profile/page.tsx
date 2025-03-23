"use client";

import { useState } from "react";

const ProfilePage = () => {
  const [profile, setProfile] = useState({
    fullName: "John Doe",
    email: "john.doe@example.com",
    phone: "+123 456 7890",
    createdAt: "21/03/2025 - 14:35:12",
    balance: "$1,250.00",
  });

  return (
    <div className="min-h-screen bg-beige-100 flex items-center justify-center p-6">
      <div className="w-full max-w-3xl bg-white shadow-lg rounded-xl p-6 border border-green-300 gap-6 flex flex-col justify-between">
        {/* Profile Header */}
        <h2 className="text-2xl font-bold text-green-800 mb-6">Your Profile</h2>

        {/* Profile Picture */}
        <div className="flex items-center gap-4">
          <div className="w-20 h-20 bg-green-200 text-green-800 flex items-center justify-center text-3xl font-bold rounded-full">
            J
          </div>
          <div>
            <p className="text-sm text-gray-600">Upload your profile picture</p>
            <button className="mt-2 px-4 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700">
              Upload Image
            </button>
          </div>
        </div>

        {/* User Details */}
        <div className="mt-6 space-y-4 flex flex-col gap-2">
          {/* Full Name */}
          <div className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
            <div>
              <p className="text-sm text-gray-600">Full Name</p>
              <p className="font-medium">{profile.fullName}</p>
            </div>
            <button className="px-4 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">
              Edit
            </button>
          </div>

          {/* Email */}
          <div className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
            <div>
              <p className="text-sm text-gray-600">Email</p>
              <p className="font-medium">{profile.email}</p>
            </div>
            <button className="px-4 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">
              Edit
            </button>
          </div>

          {/* Phone Number */}
          <div className="flex justify-between items-center bg-gray-100 p-3 rounded-md">
            <div>
              <p className="text-sm text-gray-600">Phone Number</p>
              <p className="font-medium">{profile.phone}</p>
            </div>
            <button className="px-4 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600">
              Edit
            </button>
          </div>

          {/* Account Created At */}
          <div className="bg-gray-100 p-3 rounded-md">
            <p className="text-sm text-gray-600">Account Created At</p>
            <p className="font-medium">{profile.createdAt}</p>
          </div>

          {/* Current Balance */}
          <div className="bg-green-100 p-3 rounded-md text-green-800 font-bold text-lg">
            <p>Current Balance: {profile.balance}</p>
          </div>
          <button type="button" className="max-w-64 mt-4 text-white bg-gradient-to-br from-green-400 to-blue-600 hover:bg-gradient-to-bl focus:ring-4 focus:outline-none focus:ring-green-200 dark:focus:ring-green-800 font-medium rounded-lg text-sm px-5 py-2.5 text-center me-2 mb-2">Show history transactions</button>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;
