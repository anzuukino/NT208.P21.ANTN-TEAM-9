"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";

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

const defaultBills: Bill[] = [
  {
    uid: 1,
    amount: "999",
    transaction_type: "donation",
    billID: "default-1",
    created_at: new Date().toISOString(),
    reason: "Default Donation",
    money_after: "9999001",
    fundID: "99999999999999999999999999999",
  },
];

const BillsPage = () => {
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBills = async () => {
      try {
        const response = await fetch("/api/bills");
        const data: Bill[] = await response.json();
        setBills(data);
      } catch (error) {
        console.error("Error fetching bills:", error);
        setBills(defaultBills);
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
                    Remaining Balance: ${bill.money_after}
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
      </div>
    </div>
  );
};

export default BillsPage;
