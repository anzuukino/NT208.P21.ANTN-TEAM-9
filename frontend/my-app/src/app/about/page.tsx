"use client";

import { useRouter } from "next/navigation";

const AboutPage = () => {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('/bgtree4.jpg')" }}>
        <div className="max-w-3xl bg-white p-8 rounded-lg shadow-md">
            <h2 className="text-4xl font-bold text-gray-900 mb-6">About Us</h2>
            <p className="text-gray-700 text-lg mb-4">
            Welcome to our platform! We aim to provide a seamless donation experience
            by connecting donors with meaningful causes. Our goal is to ensure transparency
            and efficiency in every transaction.
            </p>
            <p className="text-gray-700 text-lg mb-4">
            Every fund listed on our platform is verified, and we strive to make a
            positive impact by supporting those in need. Join us in making a difference.
            </p>
            <p className="text-gray-700 text-lg mb-6">
            Thank you for being a part of this journey!
            </p>
            <button
            onClick={() => router.push("/")}
            className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
            Back to Home
            </button>
        </div>
    </div>
  );
};

export default AboutPage;
