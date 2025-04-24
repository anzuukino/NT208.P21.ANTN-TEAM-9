"use client"; // Required in Next.js App Router

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Correct import
import { motion, AnimatePresence } from "framer-motion";
import { Inter, Nunito } from "next/font/google";
import Script from "next/script";
import { useRegister } from "@/app/hooks/buttonhelper";
import { checkLogin } from "@/app/hooks/helper";

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

const RegistrationForm = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const stepParam = parseInt(searchParams.get("step") || "1", 10);
  const [isVisible, setShowHide] = useState(false);
  const [step, setStep] = useState(1);
  const [step1Completed, setStep1Completed] = useState(false);
  const { register, loading, error, success } = useRegister();
  const [emailError, setEmailError] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState<
    "weak" | "normal" | "strong" | ""
  >("");
  const [firstError, setFirstError] = useState("");

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
    const isValidEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email);
    setEmailError(formData.email.length > 0 && !isValidEmail);
    setPasswordStrength(getPasswordStrength(formData.password));
  };

  const getPasswordStrength = (
    password: string
  ): "weak" | "normal" | "strong" | "" => {
    if (password.length === 0 || password == null) return "";
    if (password.length < 8) return "weak";

    const hasLetters = /[a-zA-Z]/.test(password);
    const hasNumbers = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (hasLetters && hasNumbers && hasSpecial) return "strong";
    if (hasLetters && hasNumbers) return "normal";

    return "weak";
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
    if (formData.password !== formData.conf_password) {
      setFirstError("Password does not match.");
      console.log("error")
      return;
    }
    if(formData.password.length < 8){
      setFirstError("\nPassword must be at lease 8 characters.")
      return;
    }
    if(/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email) == false){
      setFirstError("\nEmail is invalid.")
      return;
    }
    if(formData.firstname == "" || formData.lastname == ""  ){
      setFirstError("First name and last name are required.");
      return;
    }
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
      setFirstError("Password does not match.");
      router.push("?step=1");
      console.log("error")
    }
    register(formData);
  };

  // Animation variants
  const variants = {
    initial: { opacity: 0, x: 50 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: -50 },
  };

  function toogleShowPassword() {
    let input = document.getElementById("password");
    let conf_input = document.getElementById("conf-password");
    let button = document.getElementById("show-password");
    if (isVisible === false) {
      setShowHide(true);
      button ? (button.textContent = "HIDE") : {};
      console.log("Button SHOW");
    } else {
      setShowHide(false);
      button ? (button.textContent = "SHOW") : {};
      console.log("Button HIDE");
    }
  }

  useEffect(() => {
    const checkUserLogin = async () => {
      const uid = await checkLogin();
      if (uid) {
        router.push("/");
      }
    };

    checkUserLogin();
  }, [router]);
  return (
    <div className="min-h-screen flex items-center justify-left bg-[url(../../assets/register-bg.jpg)] bg-cover font-[nunito]">
      <div className="min-h-screen w-[100%] bg-[#FAF9F8] rounded-xl shadow-md sm:w-[50%] sm:p-24">
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
                      <label className="block text-md font-bold text-gray-900">
                        First Name
                      </label>
                      <input
                        type="text"
                        name="firstname"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-green-600 focus:ring-green-700 text-gray-900"
                        placeholder="John"
                        onChange={handleChange}
                        value={formData.firstname}
                      />
                    </div>
                    <div>
                      <label className="block text-md font-bold text-gray-900">
                        Last Name
                      </label>
                      <input
                        type="text"
                        name="lastname"
                        className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-green-600 focus:ring-green-700 text-gray-900"
                        placeholder="Doe"
                        onChange={handleChange}
                        value={formData.lastname}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-md font-bold text-gray-900">
                      Email address
                    </label>
                    <input
                      type="text"
                      name="email"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-green-600 focus:ring-green-700 text-gray-900"
                      placeholder="example@abc.com"
                      onChange={handleChange}
                      value={formData.email}
                    />
                    {emailError && (
                      <div className="text-red-600 text-sm font-medium mb-1">
                        Please enter a valid email address
                      </div>
                    )}
                  </div>

                  <div className="relative">
                    <label className="block text-md font-bold text-gray-900">
                      Password
                    </label>
                    <input
                      id="password"
                      name="password"
                      type={isVisible ? "text" : "password"}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-green-600 focus:ring-green-700 text-gray-900"
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
                    {getPasswordStrength(formData.password) !== "" && (
                      <div
                        className={`mt-1 text-sm font-semibold ${
                          getPasswordStrength(formData.password) === "weak"
                            ? "text-red-600"
                            : getPasswordStrength(formData.password) ===
                              "normal"
                            ? "text-yellow-500"
                            : "text-green-600"
                        }`}
                      >
                        {getPasswordStrength(formData.password)
                          .charAt(0)
                          .toUpperCase() +
                          getPasswordStrength(formData.password).slice(1)}{" "}
                        password
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-md font-bold text-gray-900 relative">
                      Confirm password
                    </label>
                    <input
                      id="conf-password"
                      name="conf_password"
                      type={isVisible ? "text" : "password"}
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-xl focus:border-green-600 focus:ring-green-700 text-gray-900s"
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
                {firstError !== "" && (
                  <div
                    id="toast-danger"
                    className="fixed bottom-5 left-5 flex items-center w-full max-w-xs p-4 mb-4 text-gray-500 bg-white rounded-lg shadow-sm dark:text-gray-400 dark:bg-gray-800"
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
                    <div className="ms-3 text-sm font-normal">
                      {firstError.toString()}
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
                          stroke-linecap="round"
                          stroke-linejoin="round"
                          stroke-width="2"
                          d="m1 1 6 6m0 0 6 6M7 7l6-6M7 7l-6 6"
                        />
                      </svg>
                    </button>
                  </div>
                )}
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
                <h2 className="text-4xl font-medium text-left mb-4 mt-8 text-[#362727] font-[Inter]">
                  Additional information
                </h2>
                <form className="mt-20 flex-col flex gap-12">
                  <div className="mt-2">
                    <label className="block text-md font-bold text-gray-900">
                      Postal Code
                    </label>
                    <input
                      type="text"
                      name="postalcode"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      onChange={handleChange}
                      value={formData.postalcode}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-md font-bold text-gray-900">
                      Phone number
                    </label>
                    <input
                      type="text"
                      name="phone_no"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
                      onChange={handleChange}
                      value={formData.phone_no}
                    />
                  </div>
                  <div className="mt-2">
                    <label className="block text-md font-bold text-gray-900">
                      ID no.
                    </label>
                    <input
                      type="text"
                      name="identify_no"
                      className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-gray-900"
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
                  {success && (
                    <p className="text-green-500 text-center">
                      Register successful!{" "}
                      <a
                        href="/login"
                        className="text-blue-600 underline hover:text-blue-800"
                      >
                        Click here to login
                      </a>
                    </p>
                  )}
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
