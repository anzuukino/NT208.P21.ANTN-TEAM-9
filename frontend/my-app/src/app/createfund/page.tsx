"use client";
import { useState, Suspense, useCallback } from "react";
import { useEffect } from "react";
import { CKEditor } from "@ckeditor/ckeditor5-react";
import { ClassicEditor, Essentials, Paragraph, Bold, Italic } from "ckeditor5";
import { CustomEditor } from "@/components/CustomEditor";
import { HeadingEditor } from "@/components/HeadingEditor";
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
import { ethers } from "ethers";
import dotenv from "dotenv";
import FundManagerArtifact from '../artifacts/contracts/Fund.sol/FundManager.json' with  {type: 'json'};
import { BigNumberish } from "ethers";

require('dotenv').config({ path: '../../.env' });

const INFURA_API_KEY = "ae28fe7ffab648c1a49c262c13a52dc8";
// const PRIVATE_KEY = process.env.PRIVATE_KEY;
const CONTRACT_ADDRESS = "0xd630d79883E81b5b6e210633a182566Cb02dd969";
const CONTRACT_ABI = FundManagerArtifact.abi;


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

interface DonationDate {
  date: string;
  amount: number;
}

interface FormData {
  title: string;
  description: string;
  category: string;
  goal: string;
  deadline: string;
  files?: File[];
  previewUrls: string[];
  donationPlan: DonationDate[];
}

function PostWriter() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const stepParam = parseInt(searchParams.get("step") || "0", 10);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([false, false, false]);
  const [step, setStep] = useState(0);
  const { submitForm, loading, error, success } = useSubmitForm();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);

  const [selectedDates, setSelectedDates] = useState<DonationDate[]>([]);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [error_msg, setError] = useState<string | null>("");
  const [success_msg, setSuccess] = useState<string | null>("");

  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
    goal: "",
    deadline: "",
    files: undefined,
    previewUrls: [],
    donationPlan: [],
  });


    // ========================= MetaMask part ============================
  const [provider, setProvider] = useState<ethers.BrowserProvider | null>(null);
  const [signer, setSigner] = useState<ethers.JsonRpcSigner | null>(null);
  const [contract, setContract] = useState<ethers.Contract | null>(null);
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [networkName, setNetworkName] = useState<string>('');

  const totalAmount = selectedDates.reduce((sum, item) => sum + item.amount, 0);

  useEffect(() => {
    for (let i = 0; i < stepParam; i++) {
      if (completedSteps[i] === false) {
        router.replace("?step=0");
        return;
      }
    }
    setStep(stepParam);
  }, [stepParam, completedSteps, router]);

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
          const accounts: any = await windowWithEthereum.ethereum?.request({ method: 'eth_requestAccounts' });

          if (accounts.length < 0) {
            alert("No accounts found. Please connect your MetaMask wallet.");
            router.push("/")
          }
          const chainId = await windowWithEthereum.ethereum?.request({ method: 'eth_chainId' });

          if (chainId === "0xaa36a7") {
            const provider = new ethers.BrowserProvider(windowWithEthereum.ethereum!);
            setProvider(provider);

            const signer = await provider.getSigner();
            setSigner(signer);

            setAccount(accounts[0]);
            // console.log
            // Initialize contract
            // console.log("Address: " + CONTRACT_ADDRESS);
            // console.log("ENV: " + JSON.stringify(process.env, null, 2));
            initializeContract(signer);

            // Setup event listeners
          } else {
            showError("Please switch to Sepolia Testnet");
            await switchToSepoliaNetwork();
          }
          
        } catch (error : any) {
          console.error(error);
          showError("Error checking connection: " + error.message);
        }
      }
      else {
        alert("MetaMask is not installed. Please install MetaMask to use this dApp.");
        router.push("/");
      }
    };

    checkIfConnected();
    connectToMetaMask
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
      if (chainId !== '0xaa36a7') {
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
          showError("Failed to add Sepolia network: " + addError.message);
          return false;
        }
      } else {
        showError("Failed to switch to Sepolia network: " + error.message);
        return false;
      }
    }
  }

  // ========================= END of MetaMask part ============================

  useEffect(() => {
    const checkUserLogin = async () => {
      try {
        const uid = await checkLogin();
        if (!uid) {
          router.replace("/login");
        } else {
          setIsCheckingAuth(false);
        }
      } catch {
        router.replace("/login");
      }
    };

    checkUserLogin();
  }, [router]);

  const handleAddDate = () => {
    if (currentDate && amount) {
      const newDates = [
        ...selectedDates,
        { date: currentDate, amount: parseFloat(amount) },
      ];
      setSelectedDates(newDates);
      setFormData(prev => ({
        ...prev,
        donationPlan: newDates,
        goal: totalAmount.toString()
      }));
      setCurrentDate("");
      setAmount("");
    }
  };

  const handleRemoveDate = (index: number) => {
    const newDates = [...selectedDates];
    newDates.splice(index, 1);
    setSelectedDates(newDates);
    setFormData(prev => ({
      ...prev,
      donationPlan: newDates,
      goal: newDates.reduce((sum, item) => sum + item.amount, 0).toString()
    }));
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (files: File[]) => {
    setFormData(prev => ({
      ...prev,
      files: files,
      previewUrls: files.map(file => URL.createObjectURL(file))
    }));
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    const newStep = step + 1;
    router.push(`?step=${newStep}`);
    setCompletedSteps(prev => {
      const newCompleted = [...prev];
      newCompleted[step] = true;
      return newCompleted;
    });
  };

  const prevStep = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`?step=${step > 0 ? step - 1 : 0}`);
  };

  async function convertDonations(donations: DonationDate[]): Promise<{ dates: number[]; amounts: bigint[] }> {
    const dates: number[] = [];
    const amounts: bigint[] = [];

    for (const donation of donations) {
      dates.push(new Date(donation.date).getTime()); // convert to timestamp (ms)
      amounts.push( await convertVNDToETH(donation.amount));
    }

    return { dates, amounts };
  }

  function hashUUID(uuid: string): bigint{
    const hashed = ethers.keccak256(ethers.toUtf8Bytes(uuid));
    const bigNumber = BigInt(hashed.slice(0, 34));
    return bigNumber;
  }


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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validate required fields
    const requiredFields = ["title", "description", "category", "deadline"];
    const missingFields = requiredFields.filter(field => !formData[field as keyof FormData]);
    
    if (missingFields.length > 0) {
      alert(`Missing required fields: ${missingFields.join(", ")}`);
      return;
    }

    if (!formData.files || formData.files.length === 0) {
      alert("Please upload at least two images");
      return;
    }

    if (selectedDates.length === 0) {
      alert("Please add at least one donation plan entry");
      return;
    }

    // Create FormData object for the submission
    const formDataToSend = new FormData();
    
    // Append all text fields
    formDataToSend.append('title', formData.title);
    formDataToSend.append('description', formData.description);
    formDataToSend.append('category', formData.category);
    formDataToSend.append('goal', totalAmount.toString());
    formDataToSend.append('deadline', formData.deadline);
    formDataToSend.append('donationPlan', JSON.stringify(selectedDates));
    
    // Append all files
    formData.files?.forEach((file) => {
      formDataToSend.append('files', file);
    });

    try {
      const fundID = await submitForm(formDataToSend);
      if (fundID) {
        debugger;
        console.log("Fund ID:", fundID);
        const { dates, amounts } = await convertDonations(selectedDates);
        const transaction = await contract?.AddFund(hashUUID(fundID), dates, amounts);
        const receipt = await transaction?.wait();
        console.log("Transaction receipt:", receipt);
        if (receipt?.status !== 1) {
          // alert('error message: '+ receipt?.status.toString());
          return;
        }
        router.push(`/fund?fund=${fundID}`);
      }
    } catch (error) {
      console.error("Submission error:", error);
      alert("Failed to submit form. Please try again.");
    }
  };

  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Checking authentication...</p>
      </div>
    );
  }

  return (
  <div className="flex flex-col min-h-screen">
    {/* Navigation Bar */}
    <MyNavBar />

    {/* Main Content */}
    <div
      className="flex-grow bg-cover bg-center flex items-center justify-center"
      style={{ backgroundImage: "url('/bgtree2.jpg')" }}
    >
      <div className="w-full max-w-7xl bg-gradient-to-br from-[#f5f2e9] to-[#F9FAFB] flex items-center justify-center p-4 font-[nunito]">
        <div className="bg-gradient-to-br from-[#f0f2e9] to-[#f1f4ea] rounded-2xl p-6 w-full max-h-[80vh] overflow-y-auto space-y-6">
          <StepIndicator
            steps={["Write your story", "Give us your plan", "Additional information"]}
            currentStep={step}
          />
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="bg-white rounded-2xl shadow-md p-6 w-full max-w-4xl space-y-6">
                  <h1 className="text-3xl font-semibold text-green-700 text-center">
                    Tell us your story
                  </h1>
                  <div className="border border-green-300 rounded-md w-full min-h-[3rem] p-2 text-gray-900">
                    <HeadingEditor
                      value={formData.title}
                      onChange={handleChange}
                      name="title"
                    />
                  </div>
                  <div className="border border-green-300 rounded-md w-full min-h-[12rem] max-h-[20rem] overflow-y-auto p-2 text-gray-900">
                    <CustomEditor
                      value={formData.description}
                      onChange={handleChange}
                      name="description"
                    />
                  </div>
                  <button
                    onClick={nextStep}
                    disabled={!formData.title || !formData.description}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full w-full transition-colors disabled:bg-gray-400"
                  >
                    Continue
                  </button>
                </div>
              </motion.div>
            )}

            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl flex flex-col">
                  <h1 className="text-2xl font-bold text-center mb-6 text-gray-900">
                    Charity Fundraising Campaign
                  </h1>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Select Date
                      </label>
                      <input
                        type="date"
                        value={currentDate}
                        onChange={(e) => setCurrentDate(e.target.value)}
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Amount (VND)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="1"
                        placeholder="Enter donation amount"
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                      />
                    </div>
                  </div>
                  <button
                    onClick={handleAddDate}
                    disabled={!currentDate || !amount}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 mb-6"
                  >
                    Add to Campaign
                  </button>
                  <div className="flex-1 overflow-y-auto max-h-[20rem]">
                    <h2 className="text-lg font-semibold mb-3 text-gray-900">
                      Selected Dates & Amounts
                    </h2>
                    {selectedDates.length === 0 ? (
                      <p className="text-gray-500 italic">No dates selected yet</p>
                    ) : (
                      <div className="space-y-2">
                        {selectedDates.map((item, index) => (
                          <div
                            key={index}
                            className="flex justify-between items-center bg-gray-50 p-3 rounded-md"
                          >
                            <div>
                              <span className="font-medium">
                                {new Date(item.date).toLocaleDateString()}
                              </span>
                              <span className="ml-4 text-green-600">
                                VND{item.amount.toFixed(2)}
                              </span>
                            </div>
                            <button
                              onClick={() => handleRemoveDate(index)}
                              className="text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="mt-6 pt-4 border-t border-gray-200">
                    <div className="flex justify-between items-center">
                      <span className="text-lg font-bold text-gray-900">
                        Total Campaign Goal:
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        VND{totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Campaign Deadline
                    </label>
                    <input
                      type="date"
                      name="deadline"
                      value={formData.deadline}
                      onChange={handleChange}
                      min={new Date().toISOString().split("T")[0]}
                      className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900"
                    />
                  </div>
                  <div className="flex space-x-4 mt-6">
                    <button
                      onClick={prevStep}
                      className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
                    >
                      Back
                    </button>
                    <button
                      onClick={nextStep}
                      disabled={selectedDates.length === 0 || !formData.deadline}
                      className="bg-blue-600 flex-grow text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                    >
                      Continue
                    </button>
                  </div>
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-4xl flex flex-col">
                  <div className="m-8">
                    <form className="max-w-sm mx-auto">
                      <label
                        htmlFor="category"
                        className="block mb-2 text-xl font-medium text-gray-900"
                      >
                        Select category
                      </label>
                      <select
                        id="category"
                        name="category"
                        value={formData.category}
                        onChange={handleChange}
                        className="text-lg bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
                        required
                      >
                        <option value="" disabled>
                          Select a category
                        </option>
                        {categories.map((category) => (
                          <option key={category} value={category}>
                            {category}
                          </option>
                        ))}
                      </select>
                    </form>
                  </div>
                  <div className="mt-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Upload Cover Image
                    </label>
                    <input
                      type="file"
                      multiple
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileChange(Array.from(e.target.files));
                        }
                      }}
                      accept="image/*"
                      className="w-full p-2 border rounded text-gray-900"
                      required
                    />
                  </div>
                  {loading && (
                    <div className="text-center my-4">
                      <p>Submitting your campaign...</p>
                    </div>
                  )}
                  {error && (
                    <div className="text-red-500 text-center my-4">
                      <p>{error}</p>
                    </div>
                  )}
                  <div className="mt-6">
                    <div className="flex space-x-4">
                      <button
                        onClick={prevStep}
                        className="bg-gray-500 hover:bg-gray-600 text-white py-2 px-4 rounded-md"
                      >
                        Back
                      </button>
                      <button
                        onClick={handleSubmit}
                        disabled={!formData.category || !formData.files || loading}
                        className="bg-blue-600 flex-grow text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400"
                      >
                        {loading ? "Processing..." : "Confirm and create"}
                      </button>
                    </div>
                  </div>
                  {success && (
                    <p className="text-green-500 text-center mt-4">
                      Fund created successfully!
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>

    {/* Footer */}
    <Footer />

    {/* Toasts */}
    {error_msg !== "" && (
      <div
        id="toast-danger"
        className="fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800"
        role="alert"
      >
        <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-red-500 bg-red-100 rounded-lg dark:bg-red-800 dark:text-red-200">
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 11.793a1 1 0 1 1-1.414 1.414L10 11.414l-2.293 2.293a1 1 0 0 1-1.414-1.414L8.586 10 6.293 7.707a1 1 0 0 1 1.414-1.414L10 8.586l2.293-2.293a1 1 0 0 1 1.414 1.414L11.414 10l2.293 2.293Z" />
          </svg>
          <span className="sr-only">Error icon</span>
        </div>
        <div id="danger-text" className="ms-3 text-sm font-normal">
          {error_msg?.toString()}
        </div>
        <button
          type="button"
          className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
          data-dismiss-target="#toast-danger"
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <svg
            className="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
        </button>
      </div>
    )}

    {success_msg !== "" && (
      <div
        id="toast-success"
        className="fixed bottom-5 right-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800"
        role="alert"
      >
        <div className="inline-flex items-center justify-center shrink-0 w-8 h-8 text-green-500 bg-green-100 rounded-lg dark:bg-green-800 dark:text-green-200">
          <svg
            className="w-5 h-5"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path d="M10 .5a9.5 9.5 0 1 0 9.5 9.5A9.51 9.51 0 0 0 10 .5Zm3.707 8.207-4 4a1 1 0 0 1-1.414 0l-2-2a1 1 0 0 1 1.414-1.414L9 10.586l3.293-3.293a1 1 0 0 1 1.414 1.414Z" />
          </svg>
          <span className="sr-only">Check icon</span>
        </div>
        <div id="success-text" className="ms-3 text-sm font-normal">
          {success_msg?.toString()}
        </div>
        <button
          type="button"
          className="ms-auto -mx-1.5 -my-1.5 bg-white text-gray-400 hover:text-gray-900 rounded-lg focus:ring-2 focus:ring-gray-300 p-1.5 hover:bg-gray-100 inline-flex items-center justify-center h-8 w-8 dark:text-gray-500 dark:hover:text-white dark:bg-gray-800 dark:hover:bg-gray-700"
          data-dismiss-target="#toast-success"
          aria-label="Close"
        >
          <span className="sr-only">Close</span>
          <svg
            className="w-3 h-3"
            aria-hidden="true"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 14 14"
          >
            <path
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
            />
          </svg>
        </button>
      </div>
    )}
  </div>
);
};

const Wrapper = () => {
  return (
    <Suspense>
      <PostWriter></PostWriter>
    </Suspense>
  );
};

export default Wrapper;