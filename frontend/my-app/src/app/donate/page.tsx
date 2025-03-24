"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";

interface Fund {
  fundID: string;
  uid: string;
  target_money: number;
  current_money: number;
  created_at: string;
  categories: string;
  title: string;
  done: boolean;
  deadline: string;
}

interface User {
  firstname: string;
  lastname: string;
}

const DonatePage = () => {
  const [funds, setFunds] = useState<Fund[]>([]);
  const [users, setUsers] = useState<Record<string, User>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFunds = async () => {
      try {
        const response = await fetch("/api/funds");
        if (!response.ok) throw new Error("Failed to fetch funds");

        const data: Fund[] = await response.json();
        setFunds(data);

        const uniqueUserIDs = [...new Set(data.map((fund) => fund.uid))];
        const userResponses = await Promise.all(
          uniqueUserIDs.map((uid) =>
            fetch(`/api/user/${uid}`).then((res) => res.json())
          )
        );

        const userMap: Record<string, User> = {};
        uniqueUserIDs.forEach((uid, index) => {
          userMap[uid] = userResponses[index];
        });

        setUsers(userMap);
      } catch (error) {
        console.error("Error fetching funds:", error);
        setError("Failed to fetch funds. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchFunds();
  }, []);

  return (
    <div className="min-h-screen bg-cover bg-center p-8" style={{ backgroundImage: "url('/bgtree3.jpg')" }}>
      <div className="text-center mb-6">
        <h2 className="text-4xl font-bold text-gray-900 bg-white/80 px-4 py-2 rounded-lg inline-block">
          Donate to a Fund
        </h2>
      </div>

      {loading ? (
        <p className="text-gray-500 text-center">Loading...</p>
      ) : error ? (
        <p className="text-red-500 text-center">{error}</p>
      ) : funds.length === 0 ? (
        <p className="text-gray-500 text-center">No funds available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-5xl mx-auto">
          {funds.map((fund) => {
            const user = users[fund.uid];
            const progress = Math.min((fund.current_money / fund.target_money) * 100, 100);

            return (
              <motion.div
                key={fund.fundID}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                whileHover={{ scale: 1.02 }}
                className="p-6 bg-white/90 rounded-lg shadow-md border border-gray-200"
              >
                <h3 className="text-2xl font-semibold text-green-800">{fund.title}</h3>
                <p className="text-gray-600 text-sm">
                  Created by: {user ? `${user.firstname} ${user.lastname}` : "Unknown"}
                </p>
                <p className="text-gray-600 text-sm">
                  Created: {new Date(fund.created_at).toLocaleDateString("en-GB")}
                </p>
                <p className="text-gray-600 text-sm">
                  Deadline: {new Date(fund.deadline).toLocaleDateString("en-GB")}
                </p>

                <div className="mt-4">
                  <p className="text-sm text-gray-700">
                    {fund.current_money} VND raised of {fund.target_money} VND
                  </p>
                  <div className="w-full bg-gray-300 rounded-full h-3 mt-2">
                    <div
                      className="bg-green-500 h-3 rounded-full"
                      style={{ width: `${progress}%` }}
                    ></div>
                  </div>
                </div>

                <button
                  onClick={() => router.push(`/fund?fund=${fund.fundID}`)}
                  className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700"
                >
                  View Fund
                </button>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="text-center mt-6">
        <button
          onClick={() => router.push("/")}
          className="px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Back to Main Page
        </button>
      </div>
    </div>
  );
};

export default DonatePage;
