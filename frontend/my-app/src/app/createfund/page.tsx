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
      alert("Please upload at least one image");
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
    <div>
      <MyNavBar></MyNavBar>
      <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('/bgtree2.jpg')" }}>
      <div className="min-h-full bg-gradient-to-br from-[#f5f2e9] to-[#F9FAFB] flex items-center justify-center p-4 font-[nunito]">
        <div className="bg-gradient-to-br from-[#f0f2e9] to-[#f1f4ea] rounded-2xl p-6 w-screen h-screen space-y-6 container">
          <StepIndicator
            steps={[
              "Write your story",
              "Give us your plan",
              "Additional information",
            ]}
            currentStep={step}
          ></StepIndicator>
          <AnimatePresence mode="wait">
            {step === 0 && (
              <motion.div
                key="step0"
                initial={{ opacity: 0, x: 50 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -50 }}
              >
                <div className="bg-white rounded-2xl shadow-md p-6 w-[80vw] h-[100vh] space-y-6 container">
                  <h1 className="text-3xl font-semibold text-green-700 text-center">
                    Tell us your story
                  </h1>
                  <div className="border border-green-300 rounded-md w-[100%] min-h-[3rem] overflow-auto p-2 text-gray-900">
                    <HeadingEditor
                      value={formData.title}
                      onChange={handleChange}
                      name="title"
                    />
                  </div>
                  <div className="border border-green-300 rounded-md w-[100%] min-h-[32rem] max-h-[8rem] overflow-auto p-2 text-gray-900">
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
                <div className="h-80vh w-80vw bg-white rounded-lg shadow-lg p-8 flex flex-col">
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
                        Amount ($)
                      </label>
                      <input
                        type="number"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        min="1"
                        placeholder="Enter donation amount"
                        className="text-gray-900 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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

                  <div className="flex-1 overflow-auto">
                    <h2 className="text-lg font-semibold mb-3 text-gray-900">
                      Selected Dates & Amounts
                    </h2>
                    {selectedDates.length === 0 ? (
                      <p className="text-gray-500 italic">
                        No dates selected yet
                      </p>
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
                                ${item.amount.toFixed(2)}
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
                        ${totalAmount.toFixed(2)}
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
                      min={new Date().toISOString().split('T')[0]}
                      className="text-gray-900 w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                <div className="h-80vh w-full sm:w-80vw bg-white rounded-lg shadow-lg p-8 flex flex-col">
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
                        className="text-l bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5"
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
                      onChange={(e) => {
                        if (e.target.files) {
                          handleFileChange(Array.from(e.target.files))
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

                  <div className="mt-auto">
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
                  {error && <p className="text-red-500 text-center">{error}</p>}
                  {loading && (
                    <p className="text-gray-500 text-center">Loading...</p>
                  )}
                  {success && (
                    <p className="text-green-500 text-center">
                      Fund created successfully!
                    </p>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Footer></Footer>
      </div>
    </div>
  </div>
  );
}

const Wrapper = () => {
  return (
    <Suspense>
      <PostWriter></PostWriter>
    </Suspense>
  );
};

export default Wrapper;