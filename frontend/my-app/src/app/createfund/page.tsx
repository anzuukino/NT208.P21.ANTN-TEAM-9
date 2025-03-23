"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {useSubmitForm} from "@/app/hooks/buttonhelper";

const CreateFund = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = parseInt(searchParams.get("step") || "1", 10);
  const {submitForm, loading, error, success} = useSubmitForm();

  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    goal: "",
    deadline: "",
    file: null as File | null,
    previewUrl: "",
  });

  useEffect(() => {
    setStep(stepParam);
  }, [stepParam]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setFormData({
        ...formData,
        file: file,
        previewUrl: URL.createObjectURL(file),
      });
    }
  };

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`?step=${step + 1}`);
  };

  const prevStep = (e: React.FormEvent) => {
    e.preventDefault();
    router.push(`?step=${step - 1}`);
  };

  const handleSubmit = async  (e: React.FormEvent) => {
    e.preventDefault();
    const processedFormData: Record<string, string | File> = {
        title: formData.title,
        description: formData.description,
        goal: formData.goal,
        deadline: formData.deadline,
      };
    
      if (formData.file instanceof File) {
        processedFormData.file = formData.file;
      }
      const fundID = await submitForm(processedFormData);
      if (fundID) {
        router.push(`/fund?fund=${fundID}`);
      }
  };

  const stepDescriptions: Record<number, string> = {
    1: "Let's begin your fundraising journey. Provide a title and description for your fund.",
    2: "Set your financial goal and deadline.",
    3: "Upload an image to represent your fundraiser.",
  };

  return (
    <div className="min-h-screen bg-cover bg-center flex items-center justify-center" style={{ backgroundImage: "url('/bgtree2.jpg')" }}>
        <div className="w-full max-w-4xl bg-white p-8 rounded-lg shadow-lg flex">
            {/* Left Side - Step Description */}
            <div className="w-1/3 p-6 bg-gray-100 rounded-l-lg">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Step {step}</h2>
            <p className="text-gray-900">{stepDescriptions[step]}</p>
            </div>

            {/* Right Side - Form */}
            <div className="w-2/3 p-6">
            <AnimatePresence mode="wait">
                {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                    <form className="flex flex-col gap-4">
                    <div>
                        <label className="block text-gray-900 font-bold">Title</label>
                        <input
                        type="text"
                        name="title"
                        className="mt-1 w-full px-3 py-2 border border-gray-500 rounded-lg text-gray-900"
                        placeholder="Enter fund title"
                        onChange={handleChange}
                        value={formData.title}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-900 font-bold">Description</label>
                        <textarea
                        name="description"
                        className="mt-1 w-full px-3 py-2 border border-gray-500 rounded-lg text-gray-900"
                        placeholder="Enter fund description"
                        rows={4}
                        onChange={handleChange}
                        value={formData.description}
                        ></textarea>
                    </div>

                    <button onClick={nextStep} className="w-full bg-blue-700 text-white py-2 rounded-lg font-bold">
                        Next
                    </button>
                    </form>
                </motion.div>
                )}

                {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                    <form className="flex flex-col gap-4">
                    <div>
                        <label className="block text-gray-900 font-bold">Goal Amount</label>
                        <input
                        type="number"
                        name="goal"
                        className="mt-1 w-full px-3 py-2 border border-gray-500 rounded-lg text-gray-900"
                        placeholder="Enter target amount"
                        onChange={handleChange}
                        value={formData.goal}
                        />
                    </div>

                    <div>
                        <label className="block text-gray-900 font-bold">Deadline</label>
                        <input
                        type="date"
                        name="deadline"
                        className="mt-1 w-full px-3 py-2 border border-gray-500 rounded-lg text-gray-900"
                        onChange={handleChange}
                        value={formData.deadline}
                        />
                    </div>

                    <div className="flex justify-between">
                        <button onClick={prevStep} className="bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">Back</button>
                        <button onClick={nextStep} className="bg-blue-700 text-white py-2 px-4 rounded-lg font-bold">Next</button>
                    </div>
                    </form>
                </motion.div>
                )}

                {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }}>
                    <form className="flex flex-col gap-4">
                    <div>
                        <label className="block text-gray-900 font-bold">Upload Image</label>
                        <input type="file" accept="image/*" onChange={handleFileChange} className="mt-1 w-full text-gray-900" />
                        {formData.previewUrl && (
                        <img src={formData.previewUrl} alt="Preview" className="mt-2 w-full h-40 object-cover rounded-lg" />
                        )}
                    </div>

                    <div className="flex justify-between">
                        <button onClick={prevStep} className="bg-gray-600 text-white py-2 px-4 rounded-lg font-bold">Back</button>
                        <button onClick={handleSubmit} className="bg-green-700 text-white py-2 px-4 rounded-lg font-bold">Create Fund</button>
                    </div>
                    {error && <p className="text-red-500 text-center">{error}</p>}
                    {loading && <p className="text-gray-500 text-center">Loading...</p>}
                    {success && <p className="text-green-500 text-center">Fund created successfully!</p>}
                    </form>
                </motion.div>
                )}
            </AnimatePresence>
            </div>
        </div>
    </div>
  );
};

const Wrapper = () => {
  return (
    <Suspense>
      <CreateFund></CreateFund>
    </Suspense>
  );
}

export default Wrapper;