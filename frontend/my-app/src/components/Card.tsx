"use client";

import Image from "next/image";
import { Progress } from "flowbite-react";
import { useState, useEffect } from "react";
import { ethers } from "ethers";
import FundManagerArtifact from '../app/artifacts/contracts/Fund.sol/FundManager.json' with  {type: 'json'};


interface FundData {
  fID: number;
  owner: string;
  date_created: number;
  end_of_phase: number[];
  phase_goal: string[];
  no_phase: number;
  status: number;
  current_value: string[];
  current_phase: number;
  extended: boolean;
  deadline_poc: number;
  banned: boolean;
  current_money: number;
  target_money: number;
  current_money_vnd: number;
  target_money_vnd: number;
}

// interface CardProps {
//   fundId: bigint;
//   title: string;
//   text: string;
//   image: string;
// }

  async function convertETHToVND(ethAmount: bigint): Promise<number> {
    const url = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eth.json';

    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);

      const data = await res.json();
      const vndPerEth = data.eth.vnd as number;

      if (!vndPerEth) throw new Error("VND rate not found in response");

      // Convert `wei` to `ETH` using fixed-point division
      const vndAmount = (ethAmount * BigInt(Math.floor(vndPerEth * 10**5))) / BigInt(1e18 * 10**5);

      return Number(vndAmount); // Convert back to JS number
    } catch (error) {
      console.error("Currency conversion error:", error);
      throw error;
    }
  }

const Card = ({
  fundId,
  title,
  text,
  img,
  progress,
  due
}: {
  fundId: bigint;
  title: string;
  text: string;
  img: string;
  progress: string;
  due: string;
}) => {
  const [fund, setFund] = useState<FundData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchFundProgress();
  }, [fundId]);

  const fetchFundProgress = async (): Promise<void> => {
    try {
      setLoading(true);
      
      const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/ae28fe7ffab648c1a49c262c13a52dc8"); // Replace with your provider URL
      const contract = new ethers.Contract(
        "0xd630d79883E81b5b6e210633a182566Cb02dd969",
        FundManagerArtifact.abi,
        provider
      );
      
      const fundData = await contract.GetFund(fundId);
      
      const parsedFund: Omit<FundData, 'current_money' | 'target_money' | 'current_money_vnd' | 'target_money_vnd'> = {
        fID: Number(fundData.fID),
        owner: fundData.owner,
        date_created: Number(fundData.date_created),
        end_of_phase: fundData.end_of_phase.map((phase: any) => Number(phase)),
        phase_goal: fundData.phase_goal.map((goal: any) => ethers.formatEther(goal)),
        no_phase: Number(fundData.no_phase),
        status: fundData.status,
        current_value: fundData.current_value.map((value: any) => ethers.formatEther(value)),
        current_phase: Number(fundData.current_phase),
        extended: fundData.extended,
        deadline_poc: Number(fundData.deadline_poc),
        banned: fundData.banned
      };

      const currentPhase = parsedFund.current_phase;
      const current_money = parseFloat(parsedFund.current_value[currentPhase] || "0");
      const target_money = parseFloat(parsedFund.phase_goal[currentPhase] || "0");

      // Note: convertETHToVND function is not provided, assuming it's available elsewhere
      const currentValueWei = ethers.parseEther(current_money.toString());
      const targetValueWei = ethers.parseEther(target_money.toString());
      
      const current_money_vnd = await convertETHToVND(currentValueWei);
      const target_money_vnd = await convertETHToVND(targetValueWei);

      setFund({
        ...parsedFund,
        current_money,
        target_money,
        current_money_vnd,
        target_money_vnd
      });
      
    } catch (err: any) {
      console.error("Error fetching fund progress:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Calculate progress percentage
  const progressPercentage = fund && fund.target_money > 0 
    ? Math.min((fund.current_money / fund.target_money) * 100, 100)
    : 0;

  // Calculate days left
  const daysLeft = fund && fund.end_of_phase[fund.current_phase]
    ? Math.max(
        Math.floor(
          (fund.end_of_phase[fund.current_phase] * 1000 - Date.now()) / (1000 * 60 * 60 * 24)
        ),
        0
      )
    : 0;

  return (
    <div className="max-w-xs w-[35vw] rounded-xl overflow-hidden shadow-lg bg-white border h-[44vh] relative">
      {/* Image */}
      <div 
        className="h-[45%] bg-cover bg-center"
        style={{ backgroundImage: `url('${img}')` }}
      >
      </div>

      {/* Content */}
      <div className="p-4">
        {/* Badge */}
        <span className="bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-md">
          Funding
        </span>

        {/* Title */}
        <h3 className="text-lg font-bold mt-2 text-gray-900">{title}</h3>

        {/* text */}
        <p className="text-sm text-gray-600 mt-1">
          {text.length < 30 ? text : text.slice(0, 80) + "..."}
        </p>
      </div>

      {/* Progress Bar */}
      <div className="p-4 pt-0 absolute bottom-1 inset-x-0">
        <div className="flex justify-between text-sm text-gray-500">
          <span>{loading ? "Loading..." : error ? "Error" : `${Math.round(progressPercentage)}% raised`}</span>
          <span>{loading ? "..." : error ? "..." : `${due} days left`}</span>
        </div>
        <Progress 
          progress={loading || error ? 0 : progressPercentage} 
          size="sm" 
          className="mt-2" 
          color="blue" 
        />
      </div>
    </div>
  );
};

export default Card;
