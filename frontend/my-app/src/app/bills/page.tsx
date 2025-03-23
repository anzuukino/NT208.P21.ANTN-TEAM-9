"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { checkLogin } from "../hooks/helper";

interface Bill {
  uid: number;
  amount: string;
  transaction_type: string;
  billID: string;
  created_at: string;
  reason: string;
  money_after: string;
  fundID: string;
}

const BillsPage = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchBills = async () => {
      try {
        await checkLogin();
      } catch (e: any) {
        console.log(e.message);
        router.push("/");
        return;
      }

      try {
        const response = await fetch("/api/bills");

        if (!response.ok) {
          throw new Error("Failed to fetch bills");
        }

        const data: Bill[] = await response.json();
        setBills(data);
      } catch (error) {
        console.error("Error fetching bills:", error);
        setError("Failed to fetch bills. Please try again later.");
      } finally {
        setLoading(false);
      }
    };

    fetchBills();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-[50%] p-8 bg-white rounded-xl shadow-md">
        <h2 className="text-4xl font-bold mb-6 text-gray-900">Bills</h2>

        {loading ? (
          <p className="text-gray-500">Loading...</p>
        ) : error ? (
          <p className="text-red-500">{error}</p>
        ) : bills.length === 0 ? (
          <p className="text-gray-500">No bills found.</p>
        ) : (
          <ul className="space-y-4">
            <AnimatePresence>
              {bills.map((bill: Bill) => (
                <motion.li
                  key={bill.billID}
                  initial={{ opacity: 0, x: -50 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 50 }}
                  transition={{ duration: 0.2 }}
                  className="p-4 border rounded-lg shadow-sm bg-gray-50"
                >
                  <p className="text-xl font-bold text-gray-800">
                    {bill.transaction_type.toUpperCase()}
                  </p>
                  <p className="text-sm text-gray-700">Bill ID: {bill.billID}</p>
                  <p className="text-sm text-gray-700">Amount: {bill.amount} VND</p>
                  <p className="text-sm text-gray-700">Reason: {bill.reason}</p>
                  <p className="text-sm text-gray-700">
                    Remaining Balance: {bill.money_after} VND
                  </p>
                  <p className="text-xs text-gray-500">
                    Created: {new Date(bill.created_at).toLocaleString()}
                  </p>

                  {bill.fundID && (
                    <Link
                      href={`/fund/${bill.fundID}`}
                      className="text-blue-600 hover:underline"
                    >
                      View Fund
                    </Link>
                  )}
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}

        {/* Back to Main Page Button */}
        <button
          onClick={() => router.push("/")}
          className="mt-6 w-full px-5 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
        >
          Back to Main Page
        </button>
      </div>
    </div>
  );
};

export default BillsPage;
