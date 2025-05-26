"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { checkLogin } from "@/app/hooks/helper";
import Footer from "@/components/Footer";
import Card from "@/components/Card";
import { MyNavBar } from "@/components/Header";
import Link from "next/link";

interface User {
  firstname: string;
  lastname: string;
}

interface Fund {
  fundID: number;
  title: string;
  categories: string;
  description: string;
  target_money: number;
  current_money: number;
  created_at: string;
  deadline: string;
  image: string;
}


export default function Home() {
  const [user, setUser] = useState<User | null>(null);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [userError, setUserError] = useState<string | null>(null);
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

      const checkUser = async () => {
        try {
          const { uid } = await checkLogin();
          if (!uid) return;

          const response = await fetch(`/api/check-information`);
          if (response.ok) return;
          const resData = await response.json();
          if (resData.error) {
            setError(resData.error);
          }

        } catch(error) {
          setError("");
          console.error("Error checking user login:", error);
        }
      };

    const fetchFunds = async () => {
      try {
        const response = await fetch("/api/funds/limited");
        if (!response.ok) {
          throw new Error("Failed to fetch funding data");
        }

        const res = await response.json();
        console.log(res.length);
        console.log(res);
        if (!res || res.length === 0) {
          setFunds([]);
          return;
        }
        const formattedFunds = res.map((fund: any) => ({
          ...fund,
          target_money: Number(fund.target_money),
          current_money: Number(fund.current_money),
          image: fund.FundAttachments?.[0]?.path || "/placeholder.jpg",
        }));
        console.log(formattedFunds);
        setFunds(formattedFunds);
      } catch (error) {
        console.error("Error fetching funding data:", error);
        setFunds([]);
        setError("Unable to load funding data. Please try again later.");
      }
    };
    checkUser();
    fetchUser();
    fetchFunds();
  }, []);

  return (
    <div className="min-h-screen min-w-screen bg-gray-100">
      <MyNavBar />

      {/* Hero Section */}
      <div className="min-h-[60vh] text-center bg-[url(../../assets/mainpage-banner.jpg)] bg-cover z-0">
        <div className="z-10 min-h-[60vh] flex flex-col items-center justify-center text-center bg-transparent backdrop-blur-[10px] backdrop-saturate-121 glass">
          
          {/* Notification Banner */}
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

      {/* Funding Section */}
      <div className="text-center bg-transparent text-4xl font-bold p-6 text-gray-900">
        <h2>Current Funding</h2>
      </div>
        <div className="flex justify-center bg-[#faf6f6]">
          <div className="flex flex-wrap max-w-screen w-[80vw] min-h-[60vh] justify-center gap-6">
            {Array.isArray(funds) ? (
              funds.map((fund) => {
                const progress = ((fund.current_money / fund.target_money) * 100).toFixed(2);
                const dueDays = Math.ceil(
                  (new Date(fund.deadline).getTime() - new Date(fund.created_at).getTime()) / (1000 * 60 * 60 * 24)
                );

                return (
                  <div key={fund.fundID}>
                    <Link href={`/fund?fund=${fund.fundID}`}>
                      <Card
                        title={fund.title}
                        text={fund.description}
                        img={fund.image}
                        progress={progress}
                        due={dueDays.toString()}
                      />
                    </Link>
                  </div>
                );
              })
            ) : (
              <p className="text-gray-700 text-lg">No funds available.</p>
            )}
          </div>
        </div>
      {
        error !== "" &&
        (<div id="toast-danger" className="fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800" role="alert">
          <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
            </svg>
            <span className="sr-only">Error icon</span>
          </div>
          <div id="danger-text" className="ms-3 text-sm font-normal"> {error?.toString()} </div>
          <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-danger" aria-label="Close">
            <span className="sr-only">Close</span>
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
          </button>
        </div>)
      }
      <Footer />
    </div>
  );
}
