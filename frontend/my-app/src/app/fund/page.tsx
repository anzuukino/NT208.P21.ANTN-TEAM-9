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
        router.push("/");
      } finally {
        setLoading(false);
      }
    };

    fetchFund();
  }, [params.fund, router]);

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
                ${fund.current_money.toLocaleString()} of ${fund.target_money.toLocaleString()} goal
            </p>
            <div className="w-full bg-gray-300 h-2 rounded mt-2">
            <div
                className="bg-green-500 h-2 rounded"
                style={{ width: `${(fund.current_money / fund.target_money) * 100}%` }}
            ></div>
            </div>
            <button className="w-full bg-orange-500 text-white py-2 mt-4 rounded-lg">
            Donate Now
            </button>
            <p className="text-gray-600 text-sm mt-4">
            Created {new Date(fund.created_at).toLocaleDateString()}
            </p>
            <p className="text-gray-800 mt-2 font-medium">{fund.organizer.name}</p>
        </div>
        </div>
    </div>
  );
};

const Wrapper = () => {
  return (
    <Suspense>
      <FundPage />
    </Suspense>
  );
};

export default Wrapper;
