"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkLogin } from "@/app/hooks/helper";
import Footer from "@/components/Footer";

interface User {
  firstname: string;
  lastname: string;
}

export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const { uid } = await checkLogin();
        if (!uid) return;

        const response = await fetch(`/api/user/${uid}`);
        if (!response.ok) throw new Error("Failed to fetch user data");

        const userData: User = await response.json();
        setUser(userData);
      } catch {
        setUser(null);
      }
    };

    fetchUser();
  }, []);

  const handleLogout = async () => {
    try {
      const response = await fetch("/api/logout", { method: "POST" });
      if (!response.ok) throw new Error("Logout failed");

      setUser(null);
      router.push("/"); // Redirect to home after logout
    } catch {
      alert("Failed to log out. Please try again.");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Navbar */}
      <nav className="sticky top-0 bg-white shadow-lg py-3 pl-10 pr-10 w-full">
        <div className="container mx-auto flex justify-between items-center">
          {/* Left Side */}
          <div className="flex items-center space-x-6">
            <Link href="/about" className="text-gray-700 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg">
              About
            </Link>
            <Link href="/donate" className="text-gray-700 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg">
              Donate
            </Link>
            <Link href="/createfund" className="text-gray-700 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg">
              Fundraise
            </Link>
          </div>

          {/* Logo */}
          <Image src="/file.svg" width={25} height={25} alt="logo" />

          {/* Right Side */}
          <div className="flex items-center space-x-6">
            {user ? (
              <>
                <Link href="/profile" className="text-gray-700 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg">
                  {user.firstname} {user.lastname}
                </Link>
                <button
                  onClick={handleLogout}
                  className="text-white bg-red-500 hover:bg-red-700 px-3 py-1 rounded-lg"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link href="/login" className="text-gray-700 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg">
                  Login
                </Link>
                <Link href="/register" className="text-white bg-green-600 hover:bg-green-800 px-3 py-1 rounded-lg">
                  Start your FundMe
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Footer */}
      <Footer />
    </div>
  );
}

