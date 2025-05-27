import { ethers } from 'ethers';
import React, { useState, useEffect } from 'react';
import FundManagerArtifact from '../app/artifacts/contracts/Fund.sol/FundManager.json' with  {type: 'json'};
// Currency conversion function
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

// Helper function to format VND currency
const formatVND = (amount: number): string => {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(amount);
};

// Define types
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

interface FundProgressProps {
  fundId: bigint;
}

const FundProgressComponent: React.FC<FundProgressProps> = ({ 
  fundId,
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
      
      // Connect to provider
      const provider = new ethers.JsonRpcProvider("http://localhost:8545"); // Replace with your provider URL
      
      // Create contract instance
      const contract = new ethers.Contract("0x5fbdb2315678afecb367f032d93f642f64180aa3", FundManagerArtifact.abi, provider);
      
      // Fetch fund data (adjust function name based on your contract)
      const fundData = await contract.GetFund(fundId);
      
      // Parse the fund data from the struct
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

      // Calculate current money raised and target for current phase
      const currentPhase = parsedFund.current_phase;
      const current_money = parseFloat(parsedFund.current_value[currentPhase] || "0");
      const target_money = parseFloat(parsedFund.phase_goal[currentPhase] || "0");

      // Convert to VND
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

  if (loading) {
    return <div>Loading fund progress...</div>;
  }

  if (error) {
    return <div>Error: {error}</div>;
  }

  if (!fund) {
    return <div>No fund data available</div>;
  }

  return (
    <div>
      <div className="mb-4">
        <p>Fund ID: {fund.fID}</p>
        <p>Current Phase: {fund.current_phase + 1} of {fund.no_phase}</p>
        <p>Raised: {formatVND(fund.current_money_vnd)} ({fund.current_money} ETH)</p>
        <p>Target: {formatVND(fund.target_money_vnd)} ({fund.target_money} ETH)</p>
      </div>
      
      <div className="w-full bg-gray-300 h-2 rounded mt-2 my-6">
        <div
          className="bg-green-500 h-2 rounded"
          style={{
            width: `${fund?.current_money! / fund?.target_money! < 1
                ? (fund?.current_money! / fund?.target_money!) * 100
                : 100
              }%`,
          }}
        ></div>
      </div>
      
      <div className="text-sm text-gray-600">
        <div>Progress: {((fund.current_money / fund.target_money) * 100).toFixed(1)}%</div>
        <div className="mt-1">
          {formatVND(fund.current_money_vnd)} / {formatVND(fund.target_money_vnd)}
        </div>
      </div>
    </div>
  );
};

// Alternative standalone function for just fetching data
export const fetchFundData = async (
  fundId: number, 
  contractAddress: string, 
  contractABI: any[], 
  providerUrl: string
): Promise<Omit<FundData, 'current_money' | 'target_money' | 'current_money_vnd' | 'target_money_vnd'>> => {
  try {
    const provider = new ethers.JsonRpcProvider(providerUrl);
    const contract = new ethers.Contract(contractAddress, contractABI, provider);
    
    const fundData = await contract.GetFund(fundId);
    
    return {
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
  } catch (error: any) {
    throw new Error(`Failed to fetch fund data: ${error.message}`);
  }
};

export default FundProgressComponent;
export { convertETHToVND, formatVND };