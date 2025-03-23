"use client"; // Required in Next.js App Router

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Correct import
import { motion, AnimatePresence } from "framer-motion";
import { Inter, Nunito } from "next/font/google";
import Script from "next/script";
import  { useRegister }  from "@/app/hooks/buttonhelper";

const inter = Inter({ subsets: ["latin"], display: "swap", variable: "--font-inter" });
const nunito = Nunito({ subsets: ["latin"], display: "swap", variable: "--font-nunito" });

const RegistrationForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = parseInt(searchParams.get("step") || "1", 10);
  const [isVisible, setShowHide] = useState(false);
  const [step, setStep] = useState(1);
  const [step1Completed, setStep1Completed] = useState(false);
  const { register, loading, error, success } = useRegister();
  
  const [formData, setFormData] = useState({
    firstname: "",
    lastname: "",
    postalcode: "",
    email: "",
    password: "",
    phone_no: "",
    identify_no: "",
    conf_password: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };


  // Redirect to Step 1 if Step 2 is accessed without completion
  useEffect(() => {
    if (stepParam === 2 && !step1Completed) {
      router.replace("?step=1");
    } else {
      setStep(stepParam);
    }
  }, [stepParam, step1Completed]);

  const nextStep = (e: React.FormEvent) => {
    e.preventDefault();
    setStep1Completed(true);
    localStorage.setItem("step1", "completed");
    router.push("?step=2");
  };

  const prevStep = (e: React.FormEvent) => {
    e.preventDefault();
    router.push("?step=1");
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.password !== formData.conf_password) {
      alert("Passwords do not match");
      return;
    }

    register(formData);
  };

  // Animation variants
  const variants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  function toogleShowPassword(){
    let input = document.getElementById("password");
    let conf_input = document.getElementById("conf-password");
    let button = document.getElementById("show-password")
    if(isVisible === false){
      setShowHide(true);
      button ? button.textContent = "HIDE" : {};
      console.log("Button SHOW");
    }
    else{
      setShowHide(false);
      button ? button.textContent = "SHOW" : {};
      console.log("Button HIDE");
    }
  }
  return (
    <div className="min-h-screen flex items-center justify-left bg-[url(../../assets/register-bg.jpg)] bg-cover font-[nunito]">
      <div className="min-h-screen w-[50%] p-24 bg-[#FAF9F8] rounded-xl shadow-md">
        <div className="w-full max-w-xl bg-transparent p-12 mt-[-43px]">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-4xl font-medium text-left mb-4 mt-8 text-[#362727] font-[Inter]">
                  Start creating your fund
                </h2>
                <form className="mt-20 flex-col flex gap-12">
                  <div className="grid grid-cols-2 gap-12">
                    <div>
                      <label className="block text-md font-bold text-gray-700">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstname"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-green-600 focus:ring-green-700"
                        placeholder="John"
                        onChange={handleChange}
                        value = {formData.firstname}
                      />
                    </div>
                    <div>
                      <label className="block text-md font-bold text-gray-700">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastname"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-green-600 focus:ring-green-700"
                        placeholder="Doe"
                        onChange={handleChange}
                        value = {formData.lastname}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-md font-bold text-gray-700">
                      Email address
                    </label>
                    <input
                      type="text"
                      name="email"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-green-600 focus:ring-green-700"
                      placeholder="example@abc.com"
                      onChange={handleChange}
                      value={formData.email}
                    />
                  </div>
                  <div className="relative">
                    <label className="block text-md font-bold text-gray-700">
                      Password
                    </label>
                    <input
                      id = "password"
                      name = "password"
                      type={isVisible ? "text" : "password"}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-green-600 focus:ring-green-700"
                      placeholder="Use a secure password"
                      onChange={handleChange}
                      value={formData.password}
                    />
                    <div
                      id="show-password"
                      onClick={toogleShowPassword}
                      className="select-none absolute top-10 right-3 flex items-center cursor-pointer text-blue-500 text-sm font-semibold"
                    >
                      SHOW
                    </div>
                  </div>
                  <div>
                    <label className="block text-md font-bold text-gray-700 relative">
                      Confirm password
                    </label>
                    <input
                      id = "conf-password"
                      name = "conf_password"
                      type={isVisible ? "text" : "password"}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-green-600 focus:ring-green-700s"
                      placeholder="Confirm password"
                      onChange={handleChange}
                      value={formData.conf_password}
                    />
                  </div>
                  <button
                    onClick={nextStep}
                    className="px-4 py-2 bg-green-700 text-white rounded-md hover:bg-green-800 font-bold text-lg"
                  >
                    Next
                  </button>
                </form>
              </motion.div>
            )}
            {step === 2 && (
              <motion.div
                key="step2"
                initial="initial"
                animate="animate"
                exit="exit"
                variants={variants}
                transition={{ duration: 0.2 }}
              >
                <h2 className="text-4xl font-medium text-left mb-4 mt-8 text-[#362727] font-[Inter]">Additional information</h2>
                <form className="mt-20 flex-col flex gap-12">
                  <div className="mt-2">
                    <label className="block text-md font-bold text-gray-700">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalcode"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                      onChange={handleChange}
                      value={formData.postalcode}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-md font-bold text-gray-700">
                      Phone number
                    </label>
                    <input
                      type="text"
                      name="phone_no"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                      onChange={handleChange}
                      value={formData.phone_no}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-md font-bold text-gray-700">
                      ID no.
                    </label>
                    <input
                      type="text"
                      name="identify_no"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md"
                      onChange={handleChange}
                      value={formData.identify_no}
                    />
                  </div>
                  <div className="mt-6 flex justify-between">
                    <button
                      onClick={prevStep}
                      className="px-4 py-2 bg-gray-400 text-white rounded-md hover:bg-gray-500"
                    >
                      Back
                    </button>
                    <button
                      onClick={handleSubmit}
                      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                      disabled={loading}
                    >
                      {loading ? "Register..." : "Register"}
                    </button>
                    
                  </div>
                  {error && <p className="text-red-500 text-center">{error}</p>}
                  {success && <p className="text-green-500 text-center">Register successful!</p>}
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      <Script>
        {`
          (function toogleShowPassword(){
            let password = document.get
          })()
        `}
      </Script>
    </div>
  );
};

// export default RegistrationForm;

const Wrapper = () => {
  return (
    <Suspense>
      <RegistrationForm></RegistrationForm>
    </Suspense>
  );
};

export default Wrapper;

