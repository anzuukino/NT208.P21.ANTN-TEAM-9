"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";

interface FundData {
  fundID: string;
  title: string;
  categories: string;
  target_money: number;
  current_money: number;
  created_at: string;
  deadline: string;
  done: boolean;
  organizer: { name: string };
  image: string;
}

const FundPage = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());

  const [fund, setFund] = useState<FundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [donationError, setDonationError] = useState<string | null>(null);
  const [donationSuccess, setDonationSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchFund = async () => {
      try {
        const response = await fetch(`/api/fund/${params.fund}`);
        if (!response.ok) throw new Error("Failed to fetch fund");

        const data = await response.json();
        data.target_money = Number(data.target_money);
        data.current_money = Number(data.current_money);
        data.image = data.FundAttachments[0].path;

        if (data.uid) {
          const responseUser = await fetch(`/api/user/${data.uid}`);
          if (!responseUser.ok) throw new Error("Failed to fetch user data");
          const dataUser = await responseUser.json();
          data.organizer = { name: `${dataUser.firstname} ${dataUser.lastname}` };
        } else {
          throw new Error("User not found");
        }

        setFund(data);
      } catch (e: any) {
        setError(e.message);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };

    fetchFund();
  }, [params.fund, router]);

  const handleDonateClick = () => {
    setShowForm(true);
    setDonationSuccess(null);
    setDonationError(null);
  };

  const handleDonationSubmit = async () => {
    setDonationError(null);
    setDonationSuccess(null);

    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      setDonationError("Please enter a valid donation amount.");
      return;
    }

    try {
      const response = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fund_id: params.fund, amount }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Donation failed. Please try again.");
      }

      setDonationSuccess("Donation successful!");
      setShowForm(false);
      setDonationAmount("");
      location.reload();
    } catch (error: any) {
      setDonationError(error.message);
    }
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (!fund) return <p className="text-center text-red-500">Fund not found.</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('/bgtree.png')" }}>
      <div className="max-w-4xl mx-auto p-6 flex flex-col md:flex-row gap-6">
        {/* Left Side: Image & Description */}
        <div className="md:w-2/3">
          <img src={fund.image} alt={fund.title} className="w-full rounded-lg" />
          <h1 className="text-3xl font-bold mt-4">{fund.title}</h1>
          <p className="text-gray-700 mt-2">{fund.categories}</p>
        </div>

        {/* Right Side: Progress & Actions */}
        <div className="md:w-1/3 p-6 bg-gray-100 rounded-lg">
          <p className="text-2xl font-extrabold text-gray-900">
            {fund.current_money.toLocaleString()} VND of {fund.target_money.toLocaleString()} VND goal
          </p>
          <div className="w-full bg-gray-300 h-2 rounded mt-2">
            <div className="bg-green-500 h-2 rounded" style={{ width: `${fund.current_money / fund.target_money < 1 ? (fund.current_money / fund.target_money) * 100 : 100}%` }}></div>
          </div>

          {!showForm ? (
            <button onClick={handleDonateClick} className="w-full bg-orange-500 text-white py-2 mt-4 rounded-lg">
              Donate Now
            </button>
          ) : (
            <div className="mt-4">
              <input
                type="number"
                placeholder="Enter amount"
                value={donationAmount}
                onChange={(e) => setDonationAmount(e.target.value)}
                className="w-full px-3 py-2 border rounded-lg"
              />
              {donationError && <p className="text-red-500 text-sm mt-1">{donationError}</p>}
              {donationSuccess && <p className="text-green-500 text-sm mt-1">{donationSuccess}</p>}
              <button onClick={handleDonationSubmit} className="w-full bg-green-500 text-white py-2 mt-2 rounded-lg">
                Confirm Donation
              </button>
              <button onClick={() => setShowForm(false)} className="w-full bg-gray-400 text-white py-2 mt-2 rounded-lg">
                Cancel
              </button>
            </div>
          )}

          <p className="text-gray-600 text-sm mt-4">
            Created {new Date(fund.created_at).toLocaleDateString()}
          </p>
          <p className="text-gray-800 mt-2 font-medium">{fund.organizer.name}</p>

          {/* Back to Home Button */}
          <button onClick={() => router.push("/")} className="w-full bg-blue-500 text-white py-2 mt-4 rounded-lg">
            Back to Home
          </button>
        </div>
      </div>
    </div>
  );
};

const Wrapper = () => {
  return (
    <Suspense>
      <FundPage/>
    </Suspense>
  );
};

export default Wrapper;
