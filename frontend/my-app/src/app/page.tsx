import Image from "next/image";
import { MyNavBar } from "@/components/MyNavBar";
import LoginForm from "@/components/LoginForm";
import React from "react"
import Link from "next/link";
import Footer from "@/components/Footer";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-100">
    {/* Navbar */}
    <nav className="sticky top-0 bg-white shadow-lg py-3 pl-10 pr-10 w-full">
      <div className="container mx-auto flex justify-between items-center">
        {/* Left Side */}
        <div className="flex items-center space-x-6">
          <Link href="/about" className="text-gray-700 flex items-center space-x-1 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg">
            About
          </Link>

          <Link href="/donate" className="text-gray-700 flex items-center space-x-1 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg">
            Donate
          </Link>

          <Link href="/create-fund" className="text-gray-700 flex items-center space-x-1 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg">
            Fundraise
          </Link>
        </div>
        {/* Logo */}
        <Image src="/file.svg" width={25} height={25} alt="logo">
        </Image>
        {/* Right Side */}
        <div className="flex items-center space-x-6">
        <Link href="/profile" className="text-gray-700 flex items-center space-x-1 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg">
            Profile
          </Link>

          <Link href="/login" className="text-gray-700 flex items-center space-x-1 hover:bg-green-700 hover:text-white px-3 py-1 rounded-lg">
            Login
          </Link>

          <Link href="/register" className="text-white bg-green-600 border-round flex items-center space-x-1 hover:bg-green-800 px-3 py-1 rounded-lg">
            Start your FundMe
          </Link>
        </div>
      </div>
    </nav>
    {/* Footer */}
    <Footer />
    
    </div>
  );
}
