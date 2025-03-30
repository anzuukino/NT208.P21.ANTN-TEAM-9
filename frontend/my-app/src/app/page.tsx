"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkLogin } from "@/app/hooks/helper";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import { MyNavBar } from "@/components/MyNavBar";
import { Inter, Nunito } from "next/font/google";

// import placeholderimg  from '../../assets/money.jpg'
// import placeholderimg  from '../../assets/moneys.jpg'


const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], display: "swap", variable: "--font-nunito" });


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
    <div className="min-h-screen min-w-screen bg-gray-100 mb-110">
      {/* Navbar */}
      <MyNavBar></MyNavBar>
      <div className="min-h-[60vh] text-center bg-[url(../../assets/mainpage-banner.jpg)] bg-cover z-0">
        {/* Notification Banner */}
        <div className="z-10 min-h-[60vh] flex flex-col items-center justify-center text-center bg-transparent backdrop-blur-[10px] backdrop-saturate-121 glass">
        <div className="bg-yellow-200 text-yellow-800 px-4 py-2 rounded-full text-sm font-semibold mb-4 shadow-md">
          🎉 £10 just pledged to Save The Melsonby Hoard - Yorkshire Museum
        </div>

        {/* Hero Text */}
        <h3 className="text-lg text-white font-medium">
          Online crowdfunding, fundraising and grant funding
        </h3>
        <h1 className="text-5xl font-bold text-white leading-tight mt-2">
          Your home for everything <br /> you care about
        </h1>

        {/* Call to Action */}
        <button className="bg-pink-500 text-white px-6 py-3 rounded-lg mt-6 text-lg font-semibold shadow-lg">
          Get started →
        </button>
        {/* Categories */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-10">
          {[
            { text: "Campaigns", icon: "✊" },
            { text: "Business", icon: "💡" },
            { text: "Community", icon: "🫖" },
            { text: "Charity", icon: "💚" },
            { text: "Personal fundraisers", icon: "🌱" },
            { text: "Sports", icon: "⚽" },
            { text: "Prize draws", icon: "🎟️" },
            { text: "Community shares", icon: "⏳" },
          ].map((item, index) => (
            <div key={index} className="flex items-center space-x-2">
              <div className="bg-green-500 text-white text-2xl w-10 h-10 flex items-center justify-center rounded-full">
                {item.icon}
              </div>
              <span className="text-white font-medium">{item.text}</span>
            </div>
          ))}
        </div>
        </div>
      </div>
      <div className="text-center bg-transparent text-4xl font-bold font-[Nunito] p-6">
          <h2>Current funding</h2>
      </div>
      <div className="flex justify-center bg-[#faf6f6]">
        <div className="flex flex-wrap max-w-screen w-[80vw] h-screen justify-center gap-6">
          {/* 9 Card here */}
          <Card
            title="Lorem ipsum"
            text="Lorem ipsum aaaaaaaaaaa bbbb cccccc dddddd ddd ccccccc ccccsss sss ssss ss sssssssssssss"
            img="../../assets/money.jpg"
            progress="50"
            due="38"
          ></Card>
          <Card
            title="Lorem ipsum"
            text="Lorem ipsum aaaaaaaaaaa bbbb cccccc"
            img="../../assets/money.jpg"
            progress="50"
            due="38"
          ></Card>
          <Card
            title="Lorem ipsum"
            text="Lorem ipsum aaaaaaaaaaa bbbb cccccc"
            img="../../assets/money.jpg"
            progress="50"
            due="38"
          ></Card>
          <Card
            title="Lorem ipsum"
            text="Lorem ipsum aaaaaaaaaaa bbbb cccccc"
            img="../../assets/money.jpg"
            progress="50"
            due="38"
          ></Card>
          <Card
            title="Lorem ipsum"
            text="Lorem ipsum aaaaaaaaaaa bbbb cccccc"
            img="../../assets/money.jpg"
            progress="50"
            due="38"
          ></Card>
          <Card
            title="Lorem ipsum"
            text="Lorem ipsum aaaaaaaaaaa bbbb cccccc"
            img="../../assets/money.jpg"
            progress="50"
            due="38"
          ></Card>
          <Card
            title="Lorem ipsum"
            text="Lorem ipsum aaaaaaaaaaa bbbb cccccc"
            img="../../assets/money.jpg"
            progress="50"
            due="38"
          ></Card>
          <Card
            title="Lorem ipsum"
            text="Lorem ipsum aaaaaaaaaaa bbbb cccccc"
            img="../../assets/money.jpg"
            progress="50"
            due="38"
          ></Card>
          <Card
            title="Lorem ipsum"
            text="Lorem ipsum aaaaaaaaaaa bbbb cccccc"
            img="../../assets/money.jpg"
            progress="50"
            due="38"
          ></Card>
        </div>

      </div>
      {/* Footer */}
      <Footer />
    </div>
  );
}

