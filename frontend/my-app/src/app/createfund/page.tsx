"use client";
import { useState, Suspense } from "react";
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
import { div } from "framer-motion/client";

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

function PostWriter() {
  const searchParams = useSearchParams();

  const [title, setTitle] = useState<string>("");
  const [content, setContent] = useState<string>("");
  const stepParam = parseInt(searchParams.get("step") || "0", 10);
  const [isVisible, setShowHide] = useState(false);
  const [completedSteps, setCompletedSteps] = useState<boolean[]>([
    false,
    false,
    false,
  ]);
  const [step, setStep] = useState(0);
  const { submitForm, loading, error, success } = useSubmitForm();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  let router = useRouter();

  interface DonationDate {
    date: string;
    amount: number;
  }

  const [selectedDates, setSelectedDates] = useState<DonationDate[]>([]);
  const [currentDate, setCurrentDate] = useState<string>("");
  const [amount, setAmount] = useState<string>("");

  const handleAddDate = () => {
    if (currentDate && amount) {
      setSelectedDates([
        ...selectedDates,
        { date: currentDate, amount: parseFloat(amount) },
      ]);
      setCurrentDate("");
      setAmount("");
    }
  };

  const handleRemoveDate = (index: number) => {
    const newDates = [...selectedDates];
    newDates.splice(index, 1);
    setSelectedDates(newDates);
  };

  const totalAmount = selectedDates.reduce((sum, item) => sum + item.amount, 0);

  const [formData, setFormData] = useState<{
    title: "";
    description: "";
    category: "";
    goal: "";
    deadline: "";
    file?: File;
    previewUrl: string[];
  }>({
    title: "",
    description: "",
    category: "",
    goal: "",
    deadline: "",
    file: undefined,
    previewUrl: [],
  });

  useEffect(() => {
    for (let i = 0; i < stepParam; i++) {
      if (completedSteps[i] === false) {
        router.replace("?step=0");
        return;
      }
    }
    setStep(stepParam);
  }, [stepParam, completedSteps]);

  useEffect(() => {
    const checkUserLogin = async () => {
      try {
        const uid = await checkLogin();
        if (!uid) {
          router.replace("/login"); // Ensure the redirect happens smoothly
        } else {
          setIsCheckingAuth(false);
        }
      } catch {
        router.replace("/login");
      }
    };

    checkUserLogin();
  }, [router]);
  if (isCheckingAuth) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-700">Checking authentication...</p>
      </div>
    );
  }

  const handleChange = (
    e:
      | React.ChangeEvent<
          HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
        >
      | { target: { name: string; value: string } }
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    console.log(formData.description);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = e.target.files;
      let previewUrl_ = [];
      for (let i = 0; i < files.length; i++) {
        let file = files[i];
        previewUrl_.push(URL.createObjectURL(file));
      }
      setFormData({
        ...formData,
        file: files[0],
        previewUrl: previewUrl_,
      });
    }
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`?step=${step + 1}`);
    setCompletedSteps((prev) => {
      prev[step] = true;
      return prev;
    });
  };

  const prevStep = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`?step=${step > 0 ? step - 1 : 0}`);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const processedFormData: Record<string, string | File> = {
      title: formData.title,
      category: formData.category,
      description: formData.description,
      goal: formData.goal,
      deadline: formData.deadline,
    };
    console.log("HEHE: handleSubmit");

    if (formData.file instanceof File) {
      processedFormData.file = formData.file;
    }
    const fundID = await submitForm(processedFormData);
    if (fundID) {
      router.push(`/fund?fund=${fundID}`);
    }
  };

  // Animation variants
  const variants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  return (
    <div>
      <MyNavBar></MyNavBar>

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
                {/* Step 0 here */}
                <div className="bg-white rounded-2xl shadow-md p-6 w-[80vw] h-[100vh] space-y-6 container">
                  <h1 className="text-3xl font-semibold text-green-700 text-center">
                    Tell us your story
                  </h1>
                  <div className="border border-green-300 rounded-md w-[100%] min-h-[3rem] overflow-auto p-2">
                    <HeadingEditor
                      value={formData.title}
                      onChange={handleChange}
                      name="title"
                    />
                  </div>
                  <div className="border border-green-300 rounded-md w-[100%] min-h-[32rem] max-h-[8rem] overflow-auto p-2">
                    <CustomEditor
                      value={formData.description}
                      onChange={handleChange}
                      name="description"
                    />
                  </div>
                  <button
                    onClick={nextStep}
                    className="bg-green-500 hover:bg-green-600 text-white px-6 py-2 rounded-full w-full transition-colors"
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
                {/* Step 1 here */}
                <div className="h-80vh w-80vw bg-white rounded-lg shadow-lg p-8 flex flex-col">
                  <h1 className="text-2xl font-bold text-center mb-6">
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                        className="w-full p-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                    <h2 className="text-lg font-semibold mb-3">
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
                      <span className="text-lg font-bold">
                        Total Campaign Goal:
                      </span>
                      <span className="text-xl font-bold text-green-600">
                        VND{totalAmount.toFixed(2)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={nextStep}
                    disabled={selectedDates.length == 0 || !totalAmount}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 mb-6 mt-6"
                  >
                    Continue
                  </button>
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
                {/* Step 2 here */}
                <div className="h-80vh w-full sm:w-80vw bg-white rounded-lg shadow-lg p-8 flex flex-col">
                  <div className="m-8">
                    <form className="max-w-sm mx-auto">
                      <label
                        htmlFor="countries"
                        className="block mb-2 text-xl font-medium text-gray-900 dark:text-white"
                      >
                        Select category
                      </label>
                      <select
                        id="countries"
                        className="text-l bg-gray-50 border border-gray-300 text-gray-900 rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 dark:bg-gray-700 dark:border-gray-600 dark:placeholder-gray-400 dark:text-white dark:focus:ring-blue-500 dark:focus:border-blue-500"
                      >
                        <option value="" disabled selected>
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
                  <ImageUploader></ImageUploader>
                  <div>
                  <button
                    onClick={handleSubmit}
                    className="bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:bg-gray-400 mb-6"
                  >
                    Confirm and create
                  </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
        <Footer></Footer>
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
}

export default Wrapper;