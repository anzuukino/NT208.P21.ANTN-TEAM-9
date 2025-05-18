"use client";
import { useState, Suspense } from "react";
import { useEffect, useRef } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, Essentials, Paragraph, Bold, Italic } from "ckeditor5";
import "ckeditor5/ckeditor5.css";
import { useRouter, useSearchParams } from "next/navigation";
import StepIndicator from "@/components/StepIndicator";
import { useSubmitForm } from "@/app/hooks/buttonhelper";
import { checkLogin } from "@/app/hooks/helper";
import { Inter, Nunito } from "next/font/google";
import { motion, AnimatePresence } from "framer-motion";
import ImageUploader from "@/components/ImageUploader";
import Footer from "@/components/Footer";
import { MyNavBar } from "@/components/Header";
import { div, tr } from "framer-motion/client";
import { FaTimes } from "react-icons/fa";
import { MetaMaskInpageProvider } from "@metamask/providers";
import { ethers } from "ethers";
import dotenv from "dotenv";
import FundManagerArtifact from '../artifacts/contracts/Fund.sol/FundManager.json' with  {type: 'json'};

require('dotenv').config({ path: '../../.env' });

const INFURA_API_KEY = process.env.INFURA_API_KEY;
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
const CONTRACT_ABI = FundManagerArtifact.abi;

const newFund: FundData = {
  fundID: "abc123",
  title: "Clean Water for All",
  categories: "Environment, Health",
  target_money: 10000,
  current_money: 2500,
  created_at: "2025-05-09T10:00:00Z",
  deadline: "2025-06-15T23:59:59Z",
  done: false,
  organizer: { name: "Green Foundation" },
  description: "Lorem ipsum fdafaewfnoaesfnaenfo",
  image:
    "https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D",
};

declare global {
  interface Window {
    ethereum?: MetaMaskInpageProvider
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
  categories: string;
  target_money: number;
  current_money: number;
  created_at: string;
  deadline: string;
  done: boolean;
  organizer: { name: string };
  description: string;
  image: string;
}

const FundDetail = () => {
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
  /* [TODO] Verify owner ho t nha yuu*/
  const [isOwner, setIsOwner] = useState(false);
  const [fundID, setFundID] = useState("");
  const [success, setSuccess] = useState("");

  // ========================= MetaMask part ============================
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [networkName, setNetworkName] = useState<string>('');

  const formRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setIsOwner(true);
    setFund(newFund);
    setFundID(newFund.fundID);
  }, []);

  useEffect(() => {
    const fetchFund = async () => {
      try {
        const response = await fetch(`/api/fund/${params.fund}`);
        if (!response.ok) throw new Error("Failed to fetch fund");

        const data = await response.json();
        data.target_money = Number(data.target_money);
        data.current_money = Number(data.current_money);
        data.image = data.FundAttachments[0].path;
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
        // router.push("/login");
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

      const ethAmount = vndAmount / vndPerEth;
      return BigInt(ethAmount);
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
      showError("Failed to initialize contract: " + error.message);
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

            if (chainId === "0x7a69") {
              const provider = new ethers.BrowserProvider(windowWithEthereum.ethereum!);
              setProvider(provider);

              const signer = await provider.getSigner();
              setSigner(signer);

              setAccount(accounts[0]);
              // console.log
              // Initialize contract
              console.log("Address: " + CONTRACT_ADDRESS);
              console.log("ENV: " + JSON.stringify(process.env, null, 2));
              initializeContract(signer);

              // Setup event listeners
            } else {
              showError("Please switch to Sepolia Testnet");
            }
          }
        } catch (error) {
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
        // Set up value change
        const network_html: any = document.querySelector("#network");
        const contract_html = document.querySelector("#contract")
        const account_html = document.querySelector("#addr");

        network_html!.textContent = "Network name: " + networkName;
        console.log("Network name: " + networkName);
        // console.log("dirname: " + __dirname);
        contract_html!.textContent = "Contract number:" + await contract?.getAddress()!;
        account_html!.textContent = "Account: " + account;
      }
      // Put your post-update logic here
    }
    updateContractInfo();

  }, [networkName]);

  const isMetaMaskInstalled = () => {
    return Boolean(window.ethereum && window.ethereum.isMetaMask);
  };

  const connectToMetaMask = async () => {
    if (!isMetaMaskInstalled()) {
      showError("MetaMask is not installed. Please install MetaMask to use this dApp.");
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
      if (chainId !== '0x7a69') {
        showError("Please switch to Sepolia Testnet");
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
      showError("Error connecting to MetaMask: " + error.message);
    }
  };

  const showError = (msg: string) => {
    setError(msg);
    console.log(msg);

  }

  const showSuccess = (msg: string) => {
    setSuccess(msg);
  }

  async function switchToSepoliaNetwork() {
    try {
      await window.ethereum?.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x7a69' }], // Sepolia chainId
      });
      return true;
    } catch (error: any) {
      // This error code indicates that the chain has not been added to MetaMask
      if (error.code === 4902) {
        try {
          await window.ethereum?.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x7a69', //Sepolia: 0xaa36a7 Local: 1337
              chainName: 'Localhost 8545', // Sepolia Testnet
              nativeCurrency: {
                name: 'Sepolia ETH',
                symbol: 'ETH',
                decimals: 18
              },
              // Production url
              // rpcUrls: [`https://sepolia.infura.io/v3/${INFURA_API_KEY}`], // Replace with your Infura key

              // Development url
              rpcUrls: ["http://localhost:8545"],
              blockExplorerUrls: ['https://sepolia.etherscan.io']
            }]
          });


          return true;
        } catch (addError: any) {
          showError("Failed to add Sepolia network: " + addError.message);
          return false;
        }
      } else {
        showError("Failed to switch to Sepolia network: " + error.message);
        return false;
      }
    }
  }

  // IMPORTANT
  // amount must be in wei 
  // Must be convert from VND to wei
  const donateToChain = (amount: bigint) => {
    if (amount < BigInt(0)) {
      throw new Error("Negative amount");
    }
    return contract?.Donate(fundID, { value: amount })
  }

  // ================================HANDLE SUBMIT==============================
  const handleDonationSubmit = async () => {
    setDonationError(null);
    setDonationSuccess(null);

    const amount = parseFloat(donationAmount);
    if (isNaN(amount) || amount <= 0) {
      setDonationError("Please enter a valid donation amount.");
      return;
    }
    const transaction = await donateToChain(await convertVNDToETH(amount))

    try {
      const response = await fetch("/api/donate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fund_id: params.fund, amount }),
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          errorData.error || "Donation failed. Please try again."
        );
      }

      setDonationSuccess("Donation successful!");
      setShowForm(false);
      setDonationAmount("");
      setSuccess("Transaction success");
      // location.reload();
      const info = document.querySelector("#transaction-info");
      info?.classList.remove("hidden");
      const tx_val = document.querySelector("#transaction-status");
      tx_val!.textContent = "Transaction value: " + transaction?.hash.substring(0, 10) + "...";

      (tx_val as HTMLAnchorElement)!.href = `https://sepolia.etherscan.io/tx/${transaction.hash}`
    } catch (error: any) {
      setDonationError(error.message);
    }
  };

  const closeForm = () => {
    const obj = document.querySelector("#donate-fund");
    obj?.classList.add("hidden");
  };
  const openForm = () => {
    const obj = document.querySelector(".donate-fund");
    obj?.classList.remove("hidden");
    connectToMetaMask();
  };

  // if (loading) return <p className="text-center">Loading...</p>;
  // if (!fund) return <p className="text-center text-red-500">Fund not found.</p>;
  // if (error) return <p className="text-center text-red-500">{error}</p>;



  const dayLeft = (day: string | undefined) => {
    return Math.ceil(
      (new Date(day!).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
    );
  };
  // console.log(dayLeft(fund?.deadline));
  return (
    <div className="w-screen font-[nunito]">
      <MyNavBar></MyNavBar>
      <div className="flex flex-wrap justify-center">
        <div className="py-24 px-6 md:!pl-16 w-full sm:!w-[80%]">
          <div className="flex flex-wrap justify-start sm:space-x-4">
            <img
              src={fund?.image}
              alt={fund?.title}
              className="h-[30vh] sm:!h-[37vh] object-cover rounded-xl max-w-full sm:!max-w-[50vw]"
            />
            <div className="flex-1 py-4 text-2xl sm:!py-0">
              <h5> {fund?.title} </h5>
              <small>
                {" "}
                {`${dayLeft(fund?.deadline).toString()} days left `}{" "}
              </small>
            </div>
          </div>

          <div className="text-lg py-4 sm:text-2xl">
            <div>{`Project description:  ${fund?.description} `}</div>
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
          <div className="flex flex-wrap justify-start gap-4">
            <button
              type="button"
              className=" text-white bg-green-500 hover:bg-green-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xl px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 shadow-md"
              onClick={openForm}
            >
              Donate to this fund
            </button>
            {isOwner && (
              <div className="flex gap-4">
                <button
                  type="button"
                  className=" text-white bg-blue-500 hover:bg-blue-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xl px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 shadow-md"
                >
                  Edit
                </button>
                <button
                  type="button"
                  className=" text-white bg-red-400 hover:bg-red-800 focus:outline-none focus:ring-4 focus:ring-blue-300 font-medium rounded-full text-xl px-5 py-2.5 text-center me-2 mb-2 dark:bg-blue-600 dark:hover:bg-blue-700 dark:focus:ring-blue-800 shadow-md"
                >
                  Withdraw
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
                    <th scope="col" className="px-6 py-3">
                      Donor address
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <div className="flex items-center">
                        Donor name
                        <a href="#">
                          <svg
                            className="w-3 h-3 ms-1.5"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                          </svg>
                        </a>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <div className="flex items-center">
                        Amount
                        <a href="#">
                          <svg
                            className="w-3 h-3 ms-1.5"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path d="M8.574 11.024h6.852a2.075 2.075 0 0 0 1.847-1.086 1.9 1.9 0 0 0-.11-1.986L13.736 2.9a2.122 2.122 0 0 0-3.472 0L6.837 7.952a1.9 1.9 0 0 0-.11 1.986 2.074 2.074 0 0 0 1.847 1.086Zm6.852 1.952H8.574a2.072 2.072 0 0 0-1.847 1.087 1.9 1.9 0 0 0 .11 1.985l3.426 5.05a2.123 2.123 0 0 0 3.472 0l3.427-5.05a1.9 1.9 0 0 0 .11-1.985 2.074 2.074 0 0 0-1.846-1.087Z" />
                          </svg>
                        </a>
                      </div>
                    </th>
                    <th scope="col" className="px-6 py-3">
                      <div className="flex items-center">
                        Date
                        <a href="#">
                          <svg
                            className="w-3 h-3 ms-1.5"
                            aria-hidden="true"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="currentColor"
                            viewBox="0 0 24 24"
                          >
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
                  <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 border-gray-200">
                    <th
                      scope="row"
                      className="px-6 py-4 font-medium w-[30%] text-gray-900 whitespace-nowrap dark:text-white"
                    >
                      Apple MacBook Pro 17"
                    </th>
                    <td className="px-6 py-4">Silver</td>
                    <td className="px-6 py-4">Laptop</td>
                    <td className="px-6 py-4">$2999</td>
                    <td className="px-6 py-4 text-right">
                      <a
                        href="#"
                        className="font-medium text-blue-600 dark:text-blue-500 hover:underline"
                      >
                        See bills
                      </a>
                    </td>
                  </tr>
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
                  <svg
                    className="w-5 h-5"
                    aria-hidden="true"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 14 10"
                  >
                    <path
                      stroke="currentColor"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M1 5h12m0 0L9 1m4 4L9 9"
                    />
                  </svg>
                  <span className="sr-only">Icon description</span>
                </button>
              </div>

              <div className="flex justify-center items-center mt-5">
                <div className="rounded-xl overflow-hidden h-20 w-20">
                  <img
                    src={
                      fund?.image ||
                      "https://images.unsplash.com/photo-1574482620811-1aa16ffe3c82?q=80&w=1740&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
                    }
                    alt="project title"
                    className="h-full w-full object-cover cursor-pointer"
                  />
                </div>
              </div>

              {/* Transaction info */}
              <div className="font-semibold text-gray-900 text-md">
                Transaction information
              </div>
              <ul className="max-w-xl space-y-1 text-gray-500 list-disc list-inside dark:text-gray-400">
                <li id="network">Network: </li>
                <li id="contract">Contract number: </li>
                <li id="addr">Account: </li>
              </ul>


              <label htmlFor="amount" className="font-[nunito] text-md mt-4">
                Enter the amount of money you want to donate in VND.
              </label>
              <div
                className="flex justify-between items-center
          bg-gray-300 rounded-xl mt-5 p-1"
              >
                <input
                  className="block w-full bg-transparent
            border-0 text-lg text-slate-500 focus:outline-none
            focus:ring-0"
                  type="number"
                  name="amount"
                  value={donationAmount}
                  onChange={(e) => setDonationAmount(e.target.value)}
                  required
                />
              </div>
              <button
                className="inline-block px-6 py-2.5 bg-green-600
            text-white font-medium text-lg leading-tight
            rounded-full shadow-md hover:bg-green-700 mt-5"
                onClick={connectToMetaMask}
              >
                CONNECT TO METAMASK
              </button>
              {/* Transaction info */}
              <div className="hidden info-cont">
                <div className="font-semibold text-gray-900 text-md">
                  Transaction info
                </div>
                <div className="max-w-xl my-4 bg-blue-400/50 rounded-xs shadow-lg">
                  <a id="transaction-status"></a>
                </div>
              </div>
              <button
                className="inline-block px-6 py-2.5 bg-green-600
            text-white font-medium text-lg leading-tight
            rounded-full shadow-md hover:bg-green-700 mt-5"
                onClick={handleDonationSubmit}
              >
                DONATE
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* ==============================HIDDEN TOAST================================ */}
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

      {
        success !== "" &&
        (<div id="toast-success" className=" fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800" role="alert">
          <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
            <svg className="w-5 h-5" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 20 20">
              <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
            </svg>
            <span className="sr-only">Check icon</span>
          </div>
          <div id="success-text" className="ms-3 text-sm font-normal">{success?.toString()}</div>
          <button type="button" className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700" data-dismiss-target="#toast-success" aria-label="Close">
            <span className="sr-only">Close</span>
            <svg className="w-3 h-3" aria-hidden="true" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 14 14">
              <path stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6" />
            </svg>
          </button>
        </div>
        )
      }

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
