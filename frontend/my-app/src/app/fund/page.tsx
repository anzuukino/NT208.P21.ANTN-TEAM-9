"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, Essentials, Paragraph, Bold, Italic } from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { useRouter, useSearchParams } from "next/navigation";
import StepIndicator from "@/components/StepIndicator";
import { useSubmitForm } from "@/app/hooks/buttonhelper";
import { checkLogin } from "@/app/hooks/helper";
import { Inter, Nunito } from "next/font/google";
import { CustomEditor } from "@/components/CustomEditor";
import { HeadingEditor } from "@/components/HeadingEditor";
import { motion, AnimatePresence } from "framer-motion";
import ImageUploader from "@/components/ImageUploader";
import Footer from "@/components/Footer";
import { MyNavBar } from "@/components/Header";
import { FaTimes } from "react-icons/fa";
import { MetaMaskInpageProvider } from "@metamask/providers";
import { ethers } from "ethers";
import Slider from "react-slick";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";
import FundManagerArtifact from '../artifacts/contracts/Fund.sol/FundManager.json' with {type: 'json'};
import FundProgressComponent from "@/components/FundProgress";

require('dotenv').config({ path: '../../../.env' });

const INFURA_API_KEY = process.env.NEXT_PUBLIC_INFURA_API_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const CONTRACT_ABI = FundManagerArtifact.abi;

const newFund = {
  fundID: "abc123",
  title: "Clean Water for All",
  category: "Environment, Health",
  target_money: 10000,
  current_money: 2500,
  created_at: "2025-05-09T10:00:00Z",
  deadline: "2025-06-15T23:59:59Z",
  done: false,
  organizer: { name: "Green Foundation" },
  description: "Lorem ipsum fdafaewfnoaesfnaenfo",
  FundAttachments: [
    { type: ".jpg", path: "https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D" },
  ],
};

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider;
  }
}

const categories = [
  "Campaigns",
  "Business",
  "Community",
  "Charity",
  "Personal fundraisers",
  "Sports",
  "Prize draws",
  "Community shares",
];

const inter = Inter({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-inter",
});
const nunito = Nunito({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-nunito",
});

interface FundData {
  fundID: string;
  title: string;
  category: string;
  target_money: number;
  current_money: number;
  created_at: string;
  deadline: string;
  done: boolean;
  organizer: { name: string };
  description: string;
  FundAttachments: { type: string; path: string }[];
}

const FundDetail = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const params = Object.fromEntries(searchParams.entries());

  const [fund, setFund] = useState<FundData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isErrorVisible, setIsErrorVisible] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [donationAmount, setDonationAmount] = useState("");
  const [donationError, setDonationError] = useState<string | null>(null);
  const [donationSuccess, setDonationSuccess] = useState<string | null>(null);
  const [isOwner, setIsOwner] = useState(false);
  const [fundID, setFundID] = useState("");
  const [success, setSuccess] = useState("");
  const [showEditForm, setShowEditForm] = useState(false);
  const [editFormData, setEditFormData] = useState({
    title: "",
    category: "",
    description: "",
  });

  // ========================= MetaMask part ============================
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [networkName, setNetworkName] = useState<string>('');

  // ========================= DONORS ============================
  const [donors, setDonors] = useState([]);
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');
  const formRef = useRef<HTMLDivElement>(null);

  interface DonorEntry {
    donor: string;
    amount: string | number;
    phase: string | number;
    timestamp: string | number;
  }

  interface FormattedDonor {
    id: number;
    address: string;
    name: string;
    amount: string | number;
    date: string;
    timestamp: string | number;
  }

  interface Contract {
    GetDonor: (fid: string | number) => Promise<DonorEntry[]>;
    GetHash?: (fundID: string | number) => Promise<string | number>;
  }

  interface DonorTableProps {
    contract: Contract | null;
    fundID: string | number;
  }
  
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const openEditForm = () => {
    if (!fund) return;
    setEditFormData({
      title: fund.title,
      category: fund.category,
      description: fund.description
    });
    setShowEditForm(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/update-fund`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fundID: fundID,
          ...editFormData
        }),
        credentials: "include"
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to update fund");
      }

      setFund(prev => prev ? {
        ...prev,
        title: editFormData.title,
        category: editFormData.category,
        description: editFormData.description
      } : null);

      setShowEditForm(false);
      setSuccess("Fund updated successfully!");
    } catch (error: any) {
      setError(error.message);
    }
  };

  useEffect(() => {
    if (error) {
      setIsErrorVisible(true);
      const timer = setTimeout(() => {
        setIsErrorVisible(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleClose = () => setIsErrorVisible(false);

  useEffect(() => {
    const checkOwner = async () => {
      try {
        const dataRes = await checkLogin();
        const data = await fetch(`/api/fund/${params.fund}`);
        const fundRes = await data.json();
        if (dataRes.uid === fundRes.uid) {
          setIsOwner(true);
        }
      } catch (e: any) {
        setError(e.message);
        router.push("/login");
      } finally {
        setLoading(false);
      }
    };
    checkOwner();
  }, []);

  useEffect(() => {
    const fetchFund = async () => {
      try {
        const response = await fetch(`/api/fund/${params.fund}`);
        if (!response.ok) throw new Error("Failed to fetch fund");

        const data = await response.json();
        data.target_money = Number(data.target_money);
        data.current_money = Number(data.current_money);
        setFundID(data.fundID);
        if (data.uid) {
          const responseUser = await fetch(`/api/user/${data.uid}`);
          if (!responseUser.ok) throw new Error("Failed to fetch user data");
          const dataUser = await responseUser.json();
          data.organizer = {
            name: `${dataUser.firstname} ${dataUser.lastname}`,
          };
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

    // ======================= CURRENCY CONVERTER ==================

  async function convertVNDToETH(vndAmount: number): Promise<bigint> {
    const url = 'https://cdn.jsdelivr.net/npm/@fawazahmed0/currency-api@latest/v1/currencies/eth.json';
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`Failed to fetch: ${res.statusText}`);
      const data = await res.json();
      const vndPerEth = data.eth.vnd as number;
      if (!vndPerEth) throw new Error("VND rate not found in response");

      const ethAmount =   BigInt(vndAmount) * BigInt(1e18 * 10**5) / BigInt(Math.floor(vndPerEth * 10**5));
      return BigInt(ethAmount) ;
    } catch (error) {
      console.error("Currency conversion error:", error);
      throw error;
    }
  }

  // =======================MetaMask part===========================

  const initializeContract = (signer: ethers.JsonRpcSigner) => {
    try {
      const newContract = new ethers.Contract(CONTRACT_ADDRESS!, CONTRACT_ABI, signer);
      setContract(newContract);
      return newContract;
    } catch (error: any) {
      console.error("Contract initialization error:", error);
      setError("Failed to initialize contract: " + error.message);
      return null;
    }
  };

  useEffect(() => {
    const checkIfConnected = async () => {
      if (isMetaMaskInstalled()) {
        try {
          const windowWithEthereum = window;
          const accounts: any = await windowWithEthereum.ethereum?.request({ method: 'eth_accounts' });

          if (accounts.length > 0) {
            const chainId = await windowWithEthereum.ethereum?.request({ method: 'eth_chainId' });

            if (chainId === "0xaa36a7") {
              const provider = new ethers.BrowserProvider(windowWithEthereum.ethereum!);
              setProvider(provider);

              const signer = await provider.getSigner();
              setSigner(signer);

              setAccount(accounts[0]);
              // console.log
              // Initialize contract
              console.log("Address: " + CONTRACT_ADDRESS);
              console.log("ENV: " + JSON.stringify(process.env));

              initializeContract(signer);

              // Setup event listeners
            } else {
              setError("Please switch to Sepolia Testnet");
            }
          }
        } catch (error: any) {
          setError(error.message);
          console.error(error);
        }
      }
    };

    checkIfConnected();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  // ✅ This runs every time `networkName` changes
  useEffect(() => {
    const updateContractInfo = async () => {
      if (networkName !== "") {
        const network_html: any = document.querySelector("#network");
        const contract_html = document.querySelector("#contract");
        const account_html = document.querySelector("#addr");
        console.log("Network name: " + networkName);
        // console.log("dirname: " + __dirname);
        contract_html!.textContent = "Contract number:" + await contract?.getAddress()!;
        account_html!.textContent = "Account: " + account;
      }
    };
    updateContractInfo();
  }, [networkName]);

  const isMetaMaskInstalled = () => {
    return Boolean(window.ethereum && window.ethereum.isMetaMask);
  };

  const connectToMetaMask = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    e?.preventDefault();
    if (!isMetaMaskInstalled()) {
      setError("MetaMask is not installed. Please install MetaMask to use this dApp.");
      return;
    }

    try {

      const windowWithEthereum = window;

      // Request account access
      const accounts: any = await windowWithEthereum.ethereum?.request({ method: 'eth_requestAccounts' });
      const account = accounts[0];
      setAccount(account);

      // Initialize provider and signer
      const provider = new ethers.BrowserProvider(windowWithEthereum.ethereum!);
      setProvider(provider);

      const signer = await provider.getSigner();
      setSigner(signer);

      // Check if we're on Sepolia (chainId 11155111 or 0xaa36a7)
      const chainId = await windowWithEthereum.ethereum?.request({ method: 'eth_chainId' });
      if (chainId !== '0xaa36a7') {
        setError("Please switch to Sepolia Testnet");
        await switchToSepoliaNetwork();
        return;
      }
      setNetworkName( chainId.toString());
      setIsConnected(true);

      // Initialize contract
      const newContract = initializeContract(signer);

      setContract(newContract);

    } catch (error: any) {
      console.error(error);
      setError("Error connecting to MetaMask: " + error.message);
    }
  };

    async function switchToSepoliaNetwork() {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0xaa36a7' }], // Sepolia chainId
      });
      return true;
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0xaa36a7', //Sepolia: 0xaa36a7 Local: 1337
              chainName: 'Sepolia Testnet', // Sepolia Testnet
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18
              },
              // Production url
              // rpcUrls: [`https://sepolia.infura.io/v3/${INFURA_API_KEY}`], // Replace with your Infura key

              // Development url
              rpcUrls: [`https://sepolia.infura.io/v3/${INFURA_API_KEY}`],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });


          return true;
        } catch (addError: any) {
          setError("Failed to add Sepolia network: " + addError.message);
          return false;
        }
      } else {
        setError("Failed to switch to Sepolia network: " + error.message);
        return false;
      }
    }
  }

  const onWithdrawClick = async () => {
    // Get phase value from the input field
    const phaseInput = document.getElementById('phase-input') as HTMLInputElement | null;
    const phase = parseInt(phaseInput?.value || '0');
    
    // Get fundID from your component state/props
    
    // Validate phase input
    if (isNaN(phase) || phase < 0) {
      alert('Please enter a valid phase number (0 or greater)');
      return;
    }
    
    try {
      await handleWithdraw(fundID, phase);
    } catch (error) {
      // Error handling is done in handleWithdraw
    }
  };

  async function handleWithdraw(fundID: string, phase: number) {
    try {
      // Validate inputs
      if (!fundID || phase === undefined || phase === null) {
        throw new Error('Fund ID and phase are required');
      }

      // Convert fundID to fid using hashUUID function
      const fid = hashUUID(fundID);
    

      // Estimate gas for the transaction
    const provider = new ethers.BrowserProvider(window.ethereum!);
    const signer = await provider.getSigner();
    const accounts = await provider.listAccounts();
    
    if (accounts.length === 0) {
      throw new Error('No wallet connected. Please connect your wallet first.');
    }

    // Estimate gas for the transaction
    const gasEstimate = await contract?.Withdraw.estimateGas(fid, phase);

    // Call the Withdraw function
    const transaction = await contract?.Withdraw(fid, phase, {
      gasLimit: Math.floor(Number(gasEstimate) * 1.2), // Add 20% buffer for gas
    });

      console.log('Withdrawal successful:', transaction);
      
      // Show success message
      alert(`Withdrawal successful! Transaction hash: ${transaction.transactionHash}`);
      
      return transaction;

    } catch (error : any) {
      console.error('Withdrawal failed:', error);
      
      // Handle specific contract error cases
      let errorMessage = 'Withdrawal failed: ';
      
      if (error.message.includes('Fund does not exist')) {
        errorMessage += 'Fund does not exist';
      } else if (error.message.includes('Invalid phase')) {
        errorMessage += 'Invalid phase number';
      } else if (error.message.includes('The phase is not finished')) {
        errorMessage += 'The phase is not finished yet';
      } else if (error.message.includes('The fund is stopped and no longer working')) {
        errorMessage += 'The fund is stopped and no longer working';
      } else if (error.message.includes('Transfer failed')) {
        errorMessage += 'Transfer failed';
      } else if (error.message.includes('User denied transaction signature')) {
        errorMessage += 'Transaction was cancelled by user';
      } else {
        errorMessage += error.message;
      }
      
      alert(errorMessage);
      throw error;
    }
  }

    // IMPORTANT
  // amount must be in wei 
  // Must be convert from VND to wei

  const donateToChain = async (amount: bigint) => {
    if (amount <= BigInt(0)) {
      throw new Error("Negative or zero amount");
    }
    return contract?.Donate(hashUUID(fundID), { value: amount })
  };
   // ================================HANDLE SUBMIT==============================
  function hashUUID(uuid: string): bigint{
    const hashed = ethers.keccak256(ethers.toUtf8Bytes(uuid));
    const bigNumber = BigInt(hashed.slice(0, 34));
    return bigNumber;
  }


   const handleDonationSubmit = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    setDonationError(null);
    setDonationSuccess(null);

    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      setDonationError("Please enter a valid donation amount.");
      return;
    }

    try {
      const transaction = await donateToChain(await convertVNDToETH(amount))

      // const response = await fetch("/api/donate", {
      //   method: "POST",
      //   headers: { "Content-Type": "application/json" },
      //   body: JSON.stringify({ fund_id: params.fund, amount }),
      //   credentials: "include",
      // });

      // if (!response.ok) {
      //   const errorData = await response.json();
      //   throw new Error(
      //     errorData.error || "Donation failed. Please try again."
      //   );
      // }


      // location.reload();
      const info = document.querySelector(".info-cont");
      info?.classList.remove("hidden");
      const tx_val = document.querySelector("#transaction-status");
      tx_val!.textContent = "Transaction value: " + transaction?.hash.substring(0, 32) + "...";

      (tx_val as HTMLAnchorElement)!.href = `https://sepolia.etherscan.io/tx/${transaction.hash}`
      setDonationSuccess("Donation successful!");
      setShowForm(false);
      setDonationAmount("");
      setSuccess("Transaction success");
      closeForm();
    } catch (error: any) {
      console.error("Donation error:", error.message);
      setError(error.message);
    }
  };

  // =========================== GET DATA FROM CHAIN ======================

    const formatAmount = (amount: string | number): string => {
    try {
      const eth = Number(amount) / Math.pow(10, 18);
      return `${eth.toFixed(6)} ETH`;
    } catch {
      return amount.toString();
    }
  };

  useEffect(() => {
    fetchDonors();
  }, [contract, fundID]);

  const truncateAddress = (address: string): string => {
    if (!address) return '';
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };



  interface donor_t{
    id: number;
    donor: string;
    name: string;
    amount: string | number;
    date: string;
    timestamp: string | number;
  }

  const fetchDonors = async () => {
    if (!contract || !fundID) return;
    
    setError('');
    
    try {
      console.log(fundID);
      const fid = await hashUUID(fundID);
      console.log(fid);
      const donorList = await contract.GetDonor(fid);
      
      // Transform the data to a more usable format
      const formattedDonors = donorList.map((donor: donor_t, index: number) => ({
        id: index,
        address: donor.donor,
        amount: donor.amount,
        timestamp: donor.timestamp,
        date: new Date(Number(donor.timestamp) * 1000).toLocaleDateString()
      }));
      formattedDonors.map((donor: donor_t) => {console.log(`Donor: ${donor.donor}`, donor)}); 
      setDonors(formattedDonors);
    } catch (err : any) {
      console.error('Error fetching donors:', err);
      setError('Failed to fetch donors: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  const closeForm = () => {
    const obj = document.querySelector("#donate-fund");
    obj?.classList.add("hidden");
  };

  const openForm = () => {
    const obj = document.querySelector("#donate-fund");
    obj?.classList.remove("hidden");
    connectToMetaMask();
  };

  if (loading) return <p className="text-center">Loading...</p>;
  if (!fund) return <p className="text-center text-red-500">Fund not found.</p>;
  if (error) return <p className="text-center text-red-500">{error}</p>;



  const dayLeft = (day: string | undefined) => {
    return Math.ceil(
      (new Date(day!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  };

  // Slider settings for react-slick
  const sliderSettings = {
    dots: true,
    infinite: true,
    speed: 500,
    slidesToShow: 1,
    slidesToScroll: 1,
    arrows: true,
    draggable: true,
    swipe: true,
    nextArrow: (
      <div>
        <button className="slick-arrow slick-next bg-green-500 text-white p-2 rounded-full">Next</button>
      </div>
    ),
    prevArrow: (
      <div>
        <button className="slick-arrow slick-prev bg-green-500 text-white p-2 rounded-full">Prev</button>
      </div>
    ),
  };

  return (
    <div className="w-screen font-[nunito]">
      <MyNavBar />
      <div className="flex flex-wrap justify-center">
        <div className="py-24 px-6 md:!pl-16 w-full sm:!w-[80%]">
          <div className="flex flex-wrap justify-start sm:space-x-4">
            <div className="w-full sm:!max-w-[50vw]">
              {fund?.FundAttachments && fund.FundAttachments.length > 0 ? (
                <Slider {...sliderSettings}>
                  {fund.FundAttachments.map((attachment, index) => (
                    <div key={index}>
                      <img
                        src={attachment.path}
                        alt={`${fund.title} image ${index + 1}`}
                        className="h-[30vh] sm:!h-[37vh] object-cover rounded-xl w-full"
                      />
                    </div>
                  ))}
                </Slider>
              ) : (
                <img
                  src="https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                  alt="Default"
                  className="h-[30vh] sm:!h-[37vh] object-cover rounded-xl max-w-full sm:!max-w-[50vw]"
                />
              )}
            </div>
            <div className="flex-1 py-4 text-2xl sm:!py-0">
              <h5>{fund?.title}</h5>
              <small>{`${dayLeft(fund?.deadline).toString()} days left`}</small>
            </div>
          </div>

          <div className="text-lg py-4 sm:text-2xl">
            <div>{`Project description: ${fund?.description}`}</div>
          </div>
          <div className="w-full rounded mt-2 my-6">
            <FundProgressComponent fundId={hashUUID(fundID)}></FundProgressComponent>
          </div>
          <div className="flex flex-wrap justify-start gap-4">
            <button
              type="button"
              className="text-white bg-green-500 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xl px-5 py-2.5 text-center me-2 mb-2 shadow-md"
              onClick={openForm}
            >
              Donate to this fund
            </button>
            {isOwner && (
              <div className="flex gap-4">
              <label htmlFor="phase-input" className="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
                Phase Number
              </label>
              <input 
                type="number" 
                id="phase-input" 
                aria-describedby="helper-text-explanation" 
                className="bg-gray-50 border border-gray-300 text-gray-900 text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500" 
                placeholder="0" 
                min="0"
                required 
              />
                <button
                  type="button"
                  className=" text-white bg-red-400 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xl px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 shadow-md"
                  onClick={onWithdrawClick}
                >
                  Withdraw
                </button>
                <button
                  type="button"
                  className="text-white bg-blue-500 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xl px-5 py-2.5 text-center me-2 mb-2 shadow-md"
                  onClick={openEditForm}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
          <div className="my-4 flex justify-center">
            <h3 className="text-3xl font-semibold">Donations</h3>
          </div>
          {/* ======================================= Table ============================ */}
          <div className="my-4">
            <div className="relative overflow-x-auto shadow-md sm:rounded-lg">
              <table className="w-full text-lg text-left rtl:text-right text-gray-500 dark:text-gray-400">
                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                  <tr>
                    <th scope="col" className="px-6 py-3">Donor address</th>
                    <th scope="col" className="px-6 py-3">
                      <div className="flex items-center">
                        Donor name
                        <a href="#">
                          <svg className="w-3 h-3 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                          </svg>
                        </a>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <div className="flex items-center">
                        Amount
                        <a href="#">
                          <svg className="w-3 h-3 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                          </svg>
                        </a>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <div className="flex items-center">
                        Date
                        <a href="#">
                          <svg className="w-3 h-3 ms-1.5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24">
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                          </svg>
                        </a>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <span className="sr-only">Edit</span>
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                      <td colSpan={5} className="px-6 py-4 text-center">
                        Loading donors...
                      </td>
                    </tr>
                  ) : donors.length === 0 ? (
                    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                      <td colSpan={5} className="px-6 py-4 text-center">
                        No donors found for this fund.
                      </td>
                    </tr>
                  ) : (
                    donors.map((donor : FormattedDonor) => (
                      <tr key={donor.id} className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                        <th
                          scope="row"
                          className="px-6 py-4 font-medium w-[30%] text-gray-900 whitespace-nowrap dark:text-white"
                          title={donor.address}
                        >
                          {truncateAddress(donor.address)}
                        </th>
                        <td className="px-6 py-4">{donor.name}</td>
                        <td className="px-6 py-4">{formatAmount(donor.amount)}</td>
                        <td className="px-6 py-4">{donor.date}</td>
                        <td className="px-6 py-4 text-right">
                          <a
                            href="#"
                            onClick={(e) => {
                              e.preventDefault();
                              navigator.clipboard.writeText(donor.address);
                            }}
                            className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                          >
                            Copy Address
                          </a>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
        {/* ============================ MODAL============================= */}
      <div className="donate-fund hidden" id="donate-fund">
        <div
          className={`fixed top-0 left-0 w-screen h-screen flex
    items-center justify-center bg-black/50 backdrop-blur-sm
    transform transition-transform duration-300 `}
        >
          <div
            className="bg-white shadow-xl shadow-black
        rounded-xl w-11/12 md:w-2/5  p-6"
          >
            <form className="flex flex-col gap-2">
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-2xl">Donate</h3>
                <button
                  type="button"
                  className="text-white bg-blue-700 hover:bg-blue-800 focus:ring-4 focus:outline-none focus:ring-blue-300 font-medium rounded-lg text-sm p-2.5 text-center inline-flex items-center me-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800"
                  onClick={closeForm}
                >
                  <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 10">
                    <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M1 5h12m0 0L9 1m4 4L9 9" />
                  </svg>
                  <span className="sr-only">Icon description</span>
                </button>
              </div>
              <div className="flex justify-center items-center mt-5">
                <div className="rounded-xl overflow-hidden h-20 w-20">
                  <img
                    src={fund?.FundAttachments[0]?.path || "https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"}
                    alt="project title"
                    className="h-full w-full object-cover cursor-pointer"
                  />
                </div>
              </div>
              <div className="font-semibold text-gray-900 text-md">Transaction information</div>
              <ul className="max-w-xl space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400">
                <li id="network">Network: </li>
                <li id="contract">Contract number: </li>
                <li id="addr">Account: </li>
              </ul>
              <label htmlFor="amount" className="font-[nunito] text-md mt-4">
                Enter the amount of money you want to donate in VND.
              </label>
              <div className="flex justify-between items-center bg-gray-300 rounded-xl mt-5 p-1">
                <input
                  className="block w-full bg-transparent border-0 text-lg text-slate-500 focus:outline-none focus:ring-0"
                  type="number"
                  name="amount"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  required
                />
              </div>
              <button
                className="inline-block px-6 py-2.5 bg-green-600 text-white font-medium text-lg leading-tight rounded-full shadow-md hover:bg-green-700 mt-5"
                onClick={connectToMetaMask}
                disabled={isConnected}
              >
                {isConnected ? "CONNECTED" : "CONNECT TO METAMASK"}
              </button>
              {/* Transaction info */}
              <div className="hidden info-cont" id="transaction-info">
                <div className="font-semibold text-gray-900 text-md">Transaction info</div>
                <div className="max-w-xl my-4 bg-blue-400/50 rounded-xs shadow-lg">
                  <a id="transaction-status"></a>
                </div>
              </div>
              <button
                className="inline-block px-6 py-2.5 bg-green-600
            text-white font-medium text-lg leading-tight
            rounded-full shadow-md hover:bg-green-700 mt-5"
                onClick={handleDonationSubmit}
                disabled={!isConnected || !donationAmount || isNaN(Number(donationAmount))}
              >
                DONATE
              </button>
            </form>
          </div>
        </div>
      </div>

        {/* ==============================HIDDEN TOAST================================ */}
      {error && isErrorVisible && (
        <div id="toast-danger" className="fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800" role="alert">
          <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
            </svg>
            <span className="sr-only">Error icon</span>
          </div>
          <div id="danger-text" className="ms-3 text-sm font-normal">{error}</div>
          <button onClick={handleClose} type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-danger" aria-label="Close">
            <span className="sr-only">Close</span>
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
          </button>
        </div>
      )}

      {
        success && (
          <div id="toast-success" className="fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800" role="alert">
            <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
              <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
              </svg>
              <span className="sr-only">Check icon</span>
            </div>
            <div id="success-text" className="ms-3 text-sm font-normal">{success}</div>
            <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-success" aria-label="Close">
              <span className="sr-only">Close</span>
              <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
                <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
              </svg>
            </button>
          </div>
        )
      }
      {success && (
        <div id="toast-success" className="fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800" role="alert">
          <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
            </svg>
            <span className="sr-only">Check icon</span>
          </div>
          <div id="success-text" className="ms-3 text-sm font-normal">{success}</div>
          <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-success" aria-label="Close">
            <span className="sr-only">Close</span>
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
          </button>
        </div>
      )}
      {/* ==============================Edit form================================ */}
      {showEditForm && (
        <div className="fixed top-0 left-0 w-screen h-screen flex items-center justify-center bg-black/50 backdrop-blur-sm z-50">
          <div className="bg-white shadow-xl shadow-black rounded-xl w-11/12 md:w-2/5 p-6 max-h-[90vh] overflow-y-auto">
            <form className="flex flex-col gap-4" onSubmit={handleEditSubmit}>
              <div className="flex justify-between items-center">
                <h3 className="font-semibold text-2xl">Edit Fund</h3>
                <button
                  type="button"
                  className="text-gray-400 hover:text-gray-500"
                  onClick={() => setShowEditForm(false)}
                >
                  <FaTimes size={24} />
                </button>
              </div>
              <div className="border border-green-300 rounded-md w-[100%] min-h-[3rem] overflow-auto p-2 text-gray-900">
                <HeadingEditor
                  value={fund?.title}
                  onChange={handleChange}
                  name="title"
                />
              </div>
              <div className="border border-green-300 rounded-md w-[100%] min-h-[32rem] max-h-[8rem] overflow-auto p-2 text-gray-900">
                <CustomEditor
                  value={fund?.description}
                  onChange={handleChange}
                  name="description"
                />
              </div>
              <div className="m-8">
                <label
                  htmlFor="category"
                  className="block mb-2 text-xl font-medium text-gray-900"
                >
                  Select category
                </label>
                <select
                  id="category"
                  name="category"
                  value={editFormData?.category}
                  onChange={handleChange}
                  className="text-l bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                  required
                >
                  <option value="" disabled>Select a category</option>
                  {categories.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </div>
              <div className="flex justify-end gap-4 mt-4">
                <button
                  type="button"
                  onClick={() => setShowEditForm(false)}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

function Wrapper() {
  return (
    <Suspense>
      <FundDetail />
    </Suspense>
  );
}

export default Wrapper;